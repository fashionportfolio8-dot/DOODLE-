// Doodle Outpost multiplayer server: rooms, invite codes, positions, shots, scores, voice signalling.
const http = require('http');
const {Server} = require('socket.io');

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 6;
const START_DELAY_MS = 2000;
const MODES = new Set(['ffa', 'tdm', '1v1', '2v2', '3v3']); // Zombie Survival is currently offline-only.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I, easier to read aloud

const srv = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/health/') {
    res.writeHead(200, {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store'
    });
    return res.end(JSON.stringify({ok: true, service: 'doodle-outpost'}));
  }
  res.writeHead(200, {'content-type': 'text/plain'});
  res.end('Doodle Outpost server is running');
});
const io = new Server(srv, {cors: {origin: '*'}, maxHttpBufferSize: 1e5});
const rooms = new Map();

const newCode = () => {
  let code;
  do {
    code = Array.from({length: 4}, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
};
const cleanName = (n) => String(n ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 16) || 'Soldier';
const clampNum = (v, lo, hi, fallback = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback;
};
const ack = (cb, body) => { if (typeof cb === 'function') cb(body); };

io.on('connection', (s) => {
  let room = null;

  // Any exception inside one handler is logged instead of crashing the whole server.
  const bind = (ev, fn) => s.on(ev, (...args) => {
    try { fn(...args); } catch (err) { console.error(`[${ev}]`, err && err.message); }
  });

  const list = (r) => [...r.players.values()].map(p => ({id: p.id, name: p.name, team: p.team, char: p.char, mic: p.mic, host: p.id === r.host}));
  const emitRoom = (r) => io.to(r.code).emit('players', list(r));

  const leave = () => {
    if (!room) return;
    const r = room;
    room = null;
    s.leave(r.code);
    r.players.delete(s.id);
    if (!r.players.size) { rooms.delete(r.code); return; }
    if (r.host === s.id) r.host = [...r.players.keys()][0];
    emitRoom(r);
    io.to(r.code).emit('left', s.id);
  };

  const join = (r, name) => {
    room = r;
    s.join(r.code);
    r.players.set(s.id, {id: s.id, name: cleanName(name), team: 0, char: 0, mic: false});
    emitRoom(r);
  };

  bind('create', (d, cb) => {
    leave();
    const code = newCode();
    const r = {code, host: s.id, players: new Map(), scores: {}, pickups: new Map()};
    rooms.set(code, r);
    join(r, d && d.name);
    ack(cb, {ok: true, code});
  });

  bind('join', (d, cb) => {
    const code = String((d && d.code) || '').toUpperCase().slice(0, 4);
    const r = rooms.get(code);
    if (!r) return ack(cb, {ok: false, err: 'Room not found'});
    if (r.players.size >= MAX_PLAYERS && !r.players.has(s.id)) return ack(cb, {ok: false, err: 'Room is full'});
    if (room !== r) leave();
    join(r, d && d.name);
    ack(cb, {ok: true, code});
  });

  bind('leave', () => leave());

  bind('char', (d) => {
    const p = room && room.players.get(s.id);
    if (p) { p.char = clampNum(d && d.char, 0, 8); emitRoom(room); }
  });

  bind('mic', (on) => {
    const p = room && room.players.get(s.id);
    if (p) { p.mic = !!on; emitRoom(room); }
  });

  bind('start', (d, cb) => {
    if (!room || room.host !== s.id) return ack(cb, {ok:false, err:'Only the room leader can start the match.'});
    const mode = String((d && d.mode) || '');
    if (!MODES.has(mode)) return ack(cb, {ok:false, err:'This game mode is not available on the server yet.'});
    const count = room.players.size;
    const required = mode === '1v1' ? 2 : mode === '2v2' ? 4 : mode === '3v3' ? 6 : 0;
    if (required && count !== required) {
      const label = mode === '1v1' ? '1 vs 1 needs exactly 2 players.' : mode === '2v2' ? '2 vs 2 needs exactly 4 players.' : '3 vs 3 needs exactly 6 players.';
      return ack(cb, {ok:false, err:label});
    }
    const map = clampNum(d && d.map, 0, 9, 0);
    let i = 0;
    for (const p of room.players.values()) p.team = i++ % 2;
    room.scores = {};
    room.pickups = new Map();
    // Clients start the match after this delay on their own clock, so device clock differences do not matter.
    io.to(room.code).emit('start', {mode, map, delay: START_DELAY_MS, players: list(room)});
    ack(cb, {ok:true});
  });

  // Position, shot and effect packets are relayed to the other players in the room.
  ['pos', 'shot', 'fx'].forEach((ev) => bind(ev, (d) => {
    if (room && d && typeof d === 'object') s.to(room.code).emit(ev, {...d, id: s.id});
  }));

  bind('died', (d) => {
    if (!room || !d) return;
    const victim = room.players.get(s.id);
    if (!victim) return;
    const killer = room.players.get(d.killer); // only players in this room can receive credit
    const sc = room.scores;
    sc[s.id] = sc[s.id] || {k: 0, d: 0};
    sc[s.id].d++;
    if (killer && killer.id !== s.id) {
      sc[killer.id] = sc[killer.id] || {k: 0, d: 0};
      sc[killer.id].k++;
      io.to(killer.id).emit('killed', {via: String(d.via || '').slice(0, 20)});
    }
    io.to(room.code).emit('score', {scores: sc, feed: [killer ? killer.name : 'World', victim.name]});
  });

  bind('pickup:spawn', (d) => {
    if (!room || !room.players.has(s.id) || !d || typeof d.id !== 'string' || d.id.length > 80) return;
    if (room.pickups.size >= 60) return;
    const p = {id: d.id, x: clampNum(d.x, 0, 960), y: clampNum(d.y, 0, 540), k: String(d.k || '').slice(0, 10)};
    room.pickups.set(p.id, p);
    io.to(room.code).emit('pickup:spawn', p);
  });

  bind('pickup:collect', (d) => {
    if (!room || !room.players.has(s.id) || !d || !room.pickups.has(d.id)) return;
    room.pickups.delete(d.id);
    io.to(room.code).emit('pickup:collected', {id: d.id, by: s.id});
  });

  // Voice signalling only reaches players in the same room.
  bind('signal', (d) => {
    if (!room || !d || !room.players.has(d.to)) return;
    io.to(d.to).emit('signal', {from: s.id, data: d.data});
  });

  s.on('disconnect', () => {
    try { leave(); } catch (err) { console.error('[disconnect]', err && err.message); }
  });
});

srv.listen(PORT, () => console.log('Doodle Outpost server on port ' + PORT));
