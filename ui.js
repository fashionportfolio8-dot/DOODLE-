// Screens, selection, rooms, results
const $ = i => document.getElementById(i);
const SEL = {mode:0, map:0, char:0, wi:0};
function go(id){
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on')); $(id).classList.add('on');
  if (id !== 'game' && id !== 'settings') { S.on = false; }
  if (id === 'settings') $('pauseov').style.display = 'none';
  if (id !== 'game') music('menu');
  $('mic').style.display = (id === 'game' && !S.offline) ? 'block' : 'none';
  $('pauseBtn').style.display = id === 'game' ? 'block' : 'none';
  $('sideBtns').style.display = id === 'game' ? 'flex' : 'none';
  render();
}
function tSnd(){ AUDIO.sfx = !AUDIO.sfx; $('snd').textContent = 'SOUND: ' + (AUDIO.sfx ? 'ON' : 'OFF'); }
function tMus(){ AUDIO.mus = !AUDIO.mus; $('mus').textContent = 'MUSIC: ' + (AUDIO.mus ? 'ON' : 'OFF'); if (!AUDIO.mus) music(null); else music('menu'); }
function render(){
  $('hImg').src = 'assets/characters/ch' + (SEL.char+1) + '.png';
  $('mg').innerHTML = DATA.modes.map((m, i) => `<div class="card${i === SEL.mode ? ' sel' : ''}${m.ok ? '' : ' off'}" onclick="pickMode(${i})"><img src="${modeIcon(i)}"><b>${m.n}</b><small class="mu">${m.s}${m.ok ? '' : ' · soon'}</small></div>`).join('');
  $('mpg').innerHTML = DATA.maps.map((m, i) => `<div class="card${i === SEL.map ? ' sel' : ''}" onclick="SEL.map=${i};render()"><img class="mimg" src="assets/maps/map${i+1}.jpg"><small>${m}</small></div>`).join('');
  $('mt').textContent = 'SELECT ARENA · ' + DATA.modes[SEL.mode].n.toUpperCase();
  $('cg').innerHTML = DATA.chars.map((c, i) => `<div class="card${i === SEL.char ? ' sel' : ''}" onclick="SEL.char=${i};setChar(${i});render()"><img src="assets/characters/ch${i+1}.png" style="height:80px"><small>${c[0]}</small></div>`).join('');
  $('lImg').src = 'assets/characters/ch' + (SEL.char+1) + '.png'; $('lName').textContent = DATA.chars[SEL.char][0]; $('lAb').textContent = DATA.chars[SEL.char][1];
  $('wg').innerHTML = DATA.weapons.map((w, i) => `<div class="card${i === SEL.wi ? ' sel' : ''}${TASK.unlocked(w.img) ? '' : ' off'}" onclick="pickWeapon(${i})"><img src="assets/weapons/${w.img}.png" style="height:56px"><small>${w.n}${TASK.unlocked(w.img) ? '' : ' · LV ' + WEAPON_LEVEL[w.img]}</small></div>`).join('');
  renderRoom();
}
function modeIcon(i){ const f = ['assets/weapons/pistol.png','assets/weapons/shotgun.png','assets/weapons/sniper.png','assets/weapons/rocket.png','assets/weapons/chainsaw.png','assets/weapons/grenade.png','assets/items/shield.png','assets/items/crate.png','assets/items/ammo.png','assets/items/medkit.png','assets/weapons/smoke_grey.png']; return f[i] || f[0]; }
function pickWeapon(i){ if (TASK.unlocked(DATA.weapons[i].img)) SEL.wi = i; render(); }
function pickMode(i){ const m = DATA.modes[i]; if (!m.ok) return; SEL.mode = i; render(); }
function renderRoom(){
  const pl = NET.players || [];
  $('rcode').textContent = NET.code || '----';
  $('slots').innerHTML = pl.map(p => `<div class="slot"><span style="display:flex;gap:8px;align-items:center"><img class="avatar" src="assets/characters/ch${(p.char|0)+1}.png">${p.host ? '[LEADER] ' : ''}${p.name}${p.id === NET.id ? ' (you)' : ''}</span><span>${p.mic ? '🎙 ' : ''}<b style="color:${p.host ? 'var(--amb)' : 'var(--lime)'}">${p.host ? 'OWNER' : 'READY'}</b></span></div>`).join('') +
    Array.from({length: Math.max(0, 6 - pl.length)}, () => '<div class="slot" style="opacity:.5"><span>Empty slot</span><span class="mu">Invite friends</span></div>').join('');
  $('pc').textContent = 'PLAYERS ' + pl.length + '/6';
  const isHost = pl.find(p => p.id === NET.id)?.host;
  $('startBtn').disabled = !isHost;
  $('micBtn').textContent = 'MIC: ' + (NET.mic ? 'ON' : 'OFF');
}
function onRoster(){ if ($('room').classList.contains('on')) renderRoom(); }
function openCreate(){
  const name = ($('pname').value || 'Commander').trim();
  if (!connect()) return alert('Online server is not set up yet. Online rooms need the Render server (see README). You can still play offline vs bots.');
  let done = false;
  const t = setTimeout(() => { if (!done) alert('Server not reachable. Check SERVER_URL in data.js and that the Render server is running.'); }, 5000);
  createRoom(name, r => { done = true; clearTimeout(t); if (!r.ok) return alert('Could not create room'); go('room'); });
}
function openJoin(){ const name = ($('pname').value || 'Commander').trim(); const code = $('jcode').value.trim();
  if (code.length < 4) return alert('Enter the 4-letter room code');
  joinRoom(code, name, r => { if (!r.ok) return alert(r.err || 'Could not join'); go('room'); }); }
function startOnlineMatch(){ const m = DATA.modes[SEL.mode]; startRoom(m.id, SEL.map); }
function startOffline(){ const m = DATA.modes[SEL.mode]; if (!m.ok) return;
  if (m.id === 'zom' && SEL.char !== 5 && SEL.char !== 7) return alert('Zombie Survival: choose Night Ops or Commando Red in the Armory first.');
  S.wi0 = SEL.wi;
  startMatch(m, SEL.map, true, [{id:'me', name:($('pname').value || 'Commander'), team:0, char:SEL.char}], Date.now() + 1500);
}
function showResults(){
  const rows = S.roster.map(p => ({n:p.name, k:(S.sc[p.id]||{k:0}).k, d:(S.sc[p.id]||{d:0}).d, t:p.team})).sort((a, b) => b.k - a.k);
  const mine = rows.find(r => r.n === (S.me && S.me.name)) || rows[0] || {k:0,d:0};
  $('rk').textContent = mine.k; $('rd').textContent = mine.d; $('xp').textContent = 'XP +' + TASK.gainXp + ' · LEVEL ' + TASK.prog().level + (TASK.levelsGained ? ' (LEVEL UP x' + TASK.levelsGained + ')' : ''); updLevel();
  $('rh').textContent = rows[0] && rows[0].n === mine.n ? 'VICTORY' : 'MATCH OVER';
  $('lb').innerHTML = '<b>MATCH LEADERBOARD</b>' + rows.map((r, i) => `<div class="slot" style="margin-top:8px"><span>${i+1}. ${r.n}</span><span>Kills ${r.k} · Deaths ${r.d}</span></div>`).join('');
  go('res');
}
function toggleMicUI(){ toggleMic().then(() => { renderRoom(); $('mic').textContent = 'MIC: ' + (NET.mic ? 'ON' : 'OFF'); }); }
function init(){
  $('snd').onclick = tSnd; $('mus').onclick = tMus;
  $('micBtn').onclick = toggleMicUI; $('mic').onclick = toggleMicUI;
  render(); go('home'); updLevel(); dailyReward(); if (!localStorage.getItem('doo_tut')) $('tut').style.display = 'flex';
}
init();

function dailyReward(){
  const today = new Date().toDateString();
  if (localStorage.getItem('doo_daily') === today) return;
  localStorage.setItem('doo_daily', today);
  const p = TASK.prog(); p.xp += 200; TASK.levels(); TASK.save();
  $('daily').textContent = 'DAILY REWARD +200 XP'; updLevel();
}
function closeTut(){ localStorage.setItem('doo_tut', '1'); $('tut').style.display = 'none'; }
function backFromSettings(){ if (S.on) { go('game'); $('pauseov').style.display = S.paused ? 'flex' : 'none'; } else go('home'); }

function openLoadout(){
  if (S.on && !S.paused) togglePause();
  $('pauseov').style.display = 'none';
  $('loadlist').innerHTML = DATA.weapons.map((w, i) => { const lk = !TASK.unlocked(w.img); return `<div class="card${i === S.me.wi ? ' sel' : ''}${lk ? ' off' : ''}" onclick="equipWeapon(${i})" style="min-width:150px"><img src="assets/weapons/${w.img}.png" style="height:56px"><small>${w.n}${lk ? ' · LV ' + WEAPON_LEVEL[w.img] : ''}</small></div>`; }).join('');
  $('loadov').style.display = 'flex';
}
function equipWeapon(i){ if (TASK.unlocked(DATA.weapons[i].img)) S.me.wi = i; closeLoadout(); }
function closeLoadout(){ $('loadov').style.display = 'none'; if (S.on && S.paused) resumeGame(); }
function shopSoon(){ alert('Shop: coins and diamonds are not added yet. Coming soon.'); }
