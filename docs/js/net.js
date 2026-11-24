// Online connection, room list, player positions and voice chat (WebRTC)
const NET = {s:null, id:null, code:null, players:[], pcs:{}, stream:null, mic:false};
function connect(){
  if (NET.s) return NET.s;
  if (typeof io === 'undefined') return null;
  const s = NET.s = io(SERVER_URL, {transports:['websocket','polling']});
  s.on('connect', () => NET.id = s.id);
  s.on('players', pl => { NET.players = pl; linkVoice(); if (typeof onRoster === 'function') onRoster(); });
  s.on('start', d => startOnline(d));
  s.on('pos', d => { S.others[d.id] = Object.assign(S.others[d.id] || {}, d); });
  s.on('shot', d => S.bl.push({x:d.x,y:d.y,vx:d.vx,vy:d.vy,dmg:d.dmg,rk:d.rk,via:d.via,life:d.life,team:d.team,owner:d.id,melee:d.melee,w:d.w,h:d.h,sid:d.sid}));
  s.on('fx', d => boomAt(d.x, d.y, d.team, d.id, false, d.via, d.sid));
  s.on('score', d => { S.sc = d.scores; S.feed.unshift([d.feed[0] + ' > ' + d.feed[1], '#b8f53a']); S.feed = S.feed.slice(0,4); });
  s.on('left', id => { delete S.others[id]; });
  s.on('pickup:spawn', d => { if (!S.pk.some(p => p.id === d.id)) S.pk.push(d); });
  s.on('pickup:collected', d => { const p=S.pk.find(x=>x.id===d.id); if(p && d.by===NET.id) pickUp(p.k); S.pk=S.pk.filter(x=>x.id!==d.id); });
  s.on('killed', d => TASK.onKill(d.via));
  s.on('signal', d => voiceSignal(d.from, d.data));
  return s;
}
function createRoom(name, cb){ const s = connect(); if (!s) return cb({ok:false, err:'Server library not loaded'}); s.emit('create', {name}, r => { if (r.ok) NET.code = r.code; cb(r); }); }
function joinRoom(code, name, cb){ const s = connect(); if (!s) return cb({ok:false, err:'Server library not loaded'}); s.emit('join', {code, name}, r => { if (r.ok) NET.code = r.code; cb(r); }); }
function startRoom(mode, map){ if (NET.s) NET.s.emit('start', {mode, map}); }
// Leave the server room and close voice links; called from the room screen and when leaving an online match.
function leaveRoom(){
  if (NET.s && NET.code) NET.s.emit('leave');
  for (const id in NET.pcs) NET.pcs[id].pc.close();
  NET.pcs = {};
  if (NET.stream) { NET.stream.getTracks().forEach(t => t.stop()); NET.stream = null; }
  NET.mic = false; NET.code = null; NET.players = [];
}
function setChar(i){ if (NET.s) NET.s.emit('char', {char:i}); }

// ---- Voice: one connection per other player, mic on/off button ----
function linkVoice(){
  const me = NET.id;
  for (const p of NET.players) if (p.id !== me && !NET.pcs[p.id]) makePc(p.id, me < p.id);
  for (const id in NET.pcs) if (!NET.players.find(p => p.id === id)) { NET.pcs[id].pc.close(); delete NET.pcs[id]; }
}
function makePc(id, init){
  const pc = new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  const tr = pc.addTransceiver('audio', {direction:'sendrecv'});
  NET.pcs[id] = {pc, tr};
  pc.onicecandidate = e => e.candidate && NET.s.emit('signal', {to:id, data:{ice:e.candidate}});
  pc.ontrack = e => { const a = new Audio(); a.srcObject = e.streams[0]; a.play().catch(()=>{}); };
  if (NET.mic && NET.stream) tr.sender.replaceTrack(NET.stream.getAudioTracks()[0]);
  if (init) pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => NET.s.emit('signal', {to:id, data:{sdp:pc.localDescription}}));
  return pc;
}
async function voiceSignal(from, d){
  const pc = (NET.pcs[from] || {pc: makePc(from, false)}).pc;
  if (d.sdp) {
    await pc.setRemoteDescription(d.sdp);
    if (d.sdp.type === 'offer') { await pc.setLocalDescription(await pc.createAnswer()); NET.s.emit('signal', {to:from, data:{sdp:pc.localDescription}}); }
  } else if (d.ice) pc.addIceCandidate(d.ice).catch(()=>{});
}
async function toggleMic(){
  if (!NET.stream) {
    try { NET.stream = await navigator.mediaDevices.getUserMedia({audio:true}); }
    catch(e) { alert('Microphone is not allowed on this device.'); return NET.mic; }
  }
  NET.mic = !NET.mic;
  const t = NET.stream.getAudioTracks()[0]; t.enabled = NET.mic;
  for (const id in NET.pcs) NET.pcs[id].tr.sender.replaceTrack(NET.mic ? t : null);
  if (NET.s) NET.s.emit('mic', NET.mic);
  return NET.mic;
}
