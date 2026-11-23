// Doodle Outpost multiplayer server: rooms, invite codes, positions, shots, scores, voice signalling
const http = require('http');
const {Server} = require('socket.io');
const PORT = process.env.PORT || 3000;
const srv = http.createServer((q, r) => { r.writeHead(200, {'content-type':'text/plain'}); r.end('Doodle Outpost server is running'); });
const io = new Server(srv, {cors:{origin:'*'}});
const rooms = {};
const newCode = () => { let c; do { c = Math.random().toString(36).slice(2,6).toUpperCase(); } while (rooms[c]); return c; };
io.on('connection', s => {
  let room = null;
  const list = r => [...r.players.values()].map(p => ({id:p.id, name:p.name, team:p.team, char:p.char, mic:p.mic, host:p.id === r.host}));
  const emitRoom = r => io.to(r.code).emit('players', list(r));
  const join = (r, name) => {
    room = r; s.join(r.code);
    r.players.set(s.id, {id:s.id, name:(name || 'Soldier').slice(0,16), team:0, char:0, mic:false});
    emitRoom(r);
  };
  s.on('create', (d, cb) => { const c = newCode(); const r = {code:c, host:s.id, players:new Map(), scores:{}, pickups:new Map()}; rooms[c] = r; join(r, d.name); cb({ok:true, code:c}); });
  s.on('join', (d, cb) => {
    const r = rooms[(d.code || '').toUpperCase()];
    if (!r) return cb({ok:false, err:'Room not found'});
    if (r.players.size >= 6) return cb({ok:false, err:'Room is full'});
    join(r, d.name); cb({ok:true, code:r.code});
  });
  s.on('char', d => { const p = room && room.players.get(s.id); if (p) { p.char = d.char | 0; emitRoom(room); } });
  s.on('mic', on => { const p = room && room.players.get(s.id); if (p) { p.mic = !!on; emitRoom(room); } });
  s.on('start', d => {
    if (!room || room.host !== s.id) return;
    let i = 0; for (const p of room.players.values()) p.team = i++ % 2;
    room.scores = {}; room.pickups = new Map();
    io.to(room.code).emit('start', {mode:d.mode, map:d.map, at:Date.now() + 2000, players:list(room)});
  });
  ['pos', 'shot', 'fx'].forEach(ev => s.on(ev, d => { if (room) s.to(room.code).emit(ev, {...d, id:s.id}); }));
  s.on('died', d => {
    if (!room) return;
    const sc = room.scores; const v = room.players.get(s.id); const k = room.players.get(d.killer);
    sc[s.id] = sc[s.id] || {k:0, d:0}; sc[s.id].d++;
    if (k && d.killer !== s.id) io.to(d.killer).emit('killed', {via: d.via});
    if (k && d.killer !== s.id) { sc[d.killer] = sc[d.killer] || {k:0, d:0}; sc[d.killer].k++; }
    io.to(room.code).emit('score', {scores:sc, feed:[k ? k.name : 'World', v ? v.name : '?']});
  });
  s.on('pickup:spawn', d => {
    if (!room || room.host !== s.id || !d || !d.id) return;
    room.pickups.set(d.id, d);
    io.to(room.code).emit('pickup:spawn', d);
  });
  s.on('pickup:collect', d => {
    if (!room || !d || !room.pickups.has(d.id)) return;
    room.pickups.delete(d.id);
    io.to(room.code).emit('pickup:collected', {id:d.id, by:s.id});
  });
  s.on('signal', d => io.to(d.to).emit('signal', {from:s.id, data:d.data}));
  s.on('disconnect', () => {
    if (!room) return;
    room.players.delete(s.id);
    if (!room.players.size) { delete rooms[room.code]; return; }
    if (room.host === s.id) room.host = [...room.players.keys()][0];
    emitRoom(room); io.to(room.code).emit('left', s.id);
  });
});
srv.listen(PORT, () => console.log('Doodle Outpost server on port ' + PORT));
