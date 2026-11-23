// Game: movement, weapons, hits, modes, drawing. Online shots are shared; each player checks hits on their own character.
const cv = document.getElementById('c'), g = cv.getContext('2d'), W = 960, H = 540;
const IM = {}; const im = p => IM[p] || (IM[p] = Object.assign(new Image(), {src:p}));
const PL = [{x:0,y:500,w:960,h:40},{x:120,y:390,w:200,h:18},{x:560,y:390,w:240,h:18},{x:330,y:270,w:220,h:18},{x:40,y:250,w:90,h:18},{x:830,y:260,w:100,h:18}];
const SP = [[80,300],[840,200],[480,120],[200,120]];
const BTN = {jump:{x:900,y:470,r:36}, jet:{x:820,y:400,r:30}, grn:{x:760,y:480,r:28}, med:{x:700,y:470,r:26}};
const K = {}, PT = {}, MO = {x:W/2, y:H/2, d:false};
const S = {on:false, mode:null, map:0, me:null, bot:null, others:{}, roster:[], bl:[], nd:[], pt:[], fx:[], sc:{}, feed:[], start:0, end:0, prevJ:false, la:{x:1,y:0}, offline:true, shake:0, sending:0};
const rnd = a => a[Math.floor(Math.random() * a.length)];
const mk = (id, name, team, char) => ({id, name, team, char, x:0, y:0, w:26, h:38, vx:0, vy:0, face:1, ground:false, hp:100, sh:100, fuel:100, dead:0, wi:0, mag:DATA.weapons.map(w => w.am), rl:0, cool:0, nades:2, meds:1, smk:2, ax:1, ay:0});
function spawn(p){ const s = rnd(SP); Object.assign(p, {x:s[0], y:s[1], vx:0, vy:0, hp:(p === S.me ? TASK.maxHp() : 100), sh:100, fuel:100, dead:0, mag:DATA.weapons.map(w => w.am), rl:0, cool:0, nades:2, meds:1, smk:2}); }
function isEnemy(team, id){ if (!S.mode || !S.mode.team) return id !== S.me.id; return team !== S.me.team; }
function overlap(b, p){ return b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y; }
function moveX(e){ e.x += e.vx; for (const s of PL) if (e.x < s.x+s.w && e.x+e.w > s.x && e.y < s.y+s.h && e.y+e.h > s.y) { if (e.vx > 0) e.x = s.x - e.w; else if (e.vx < 0) e.x = s.x + s.w; } e.x = Math.max(0, Math.min(W - e.w, e.x)); }
function moveY(e){ e.vy += .55; e.y += e.vy; e.ground = false; for (const s of PL) if (e.x < s.x+s.w && e.x+e.w > s.x && e.y < s.y+s.h && e.y+e.h > s.y) { if (e.vy >= 0) { e.y = s.y - e.h; e.ground = true; } else e.y = s.y + s.h; e.vy = 0; } if (e.y > H) { e.y = 0; e.vy = 0; } }

function inp(){
  const me = S.me; let mx = (K.KeyD||K.ArrowRight?1:0) - (K.KeyA||K.ArrowLeft?1:0), jp = !!(K.Space||K.KeyW||K.ArrowUp), jt = !!(K.ShiftLeft||K.ShiftRight), fi = MO.d, ax = MO.x - (me.x+me.w/2), ay = MO.y - (me.y+me.h/2);
  for (const id in PT){ const q = PT[id];
    if (q.t === 'stick') mx = Math.max(-1, Math.min(1, (q.x - q.ox) / 45));
    else if (q.t === 'aim') { ax = q.x - (me.x+me.w/2); ay = q.y - (me.y+me.h/2); fi = true; }
    else if (q.t === 'jet') jt = true; else if (q.t === 'jump') jp = true; }
  if (Math.hypot(ax, ay) > 10) S.la = {x:ax, y:ay};
  return {mx, jp, jt, fi, ax, ay};
}
function sendShot(b){ if (!S.offline && NET.s) NET.s.emit('shot', {x:b.x,y:b.y,vx:b.vx,vy:b.vy,dmg:b.dmg,rk:b.rk,via:b.via,life:b.life,team:b.team,melee:b.melee,w:b.w,h:b.h}); }
function addShot(b){ S.bl.push(b); sendShot(b); }
function fire(ax, ay){
  const me = S.me, w = DATA.weapons[me.wi];
  if (w.grn) return grenade(); if (!TASK.unlocked(w.img)) return;
  if (me.rl > 0 || me.cool > 0) return;
  if (me.mag[me.wi] <= 0) return reload();
  const a0 = Math.atan2(ay, ax); me.cool = w.cd; me.mag[me.wi]--; me.face = Math.cos(a0) >= 0 ? 1 : -1;
  if (w.melee) { play('saw'); addShot({x:me.x+me.w/2+me.face*34-30, y:me.y+me.h/2-30, w:60, h:60, melee:1, dmg:w.dmg*3, life:2, team:me.team, owner:me.id, via:'chainsaw'}); return; }
  play(w.snd);
  for (let i = 0; i < w.pel; i++) { const a = a0 + (w.pel > 1 ? (i/(w.pel-1) - .5) * w.sp : 0);
    addShot({x:me.x+me.w/2+Math.cos(a)*22, y:me.y+me.h/2+Math.sin(a)*22, vx:Math.cos(a)*w.spd, vy:Math.sin(a)*w.spd, dmg:w.dmg, rk:w.boom, life:90, team:me.team, owner:me.id, via:w.img}); }
  fxAdd('spark', me.x+me.w/2+Math.cos(a0)*30, me.y+me.h/2+Math.sin(a0)*30, 8);
}
function reload(){ const me = S.me, w = DATA.weapons[me.wi]; if (me.rl > 0 || me.dead || w.melee || w.grn || me.mag[me.wi] >= w.am) return; me.rl = 60; play('reload'); }
function grenade(){ const me = S.me; if (me.dead || me.nades <= 0) return; me.nades--; const L = Math.hypot(S.la.x, S.la.y) || 1; S.nd.push({x:me.x+me.w/2, y:me.y+me.h/2, vx:S.la.x/L*9, vy:S.la.y/L*9-3, t:110}); play('throw'); }
function useMed(){ const me = S.me; if (me.dead || me.meds <= 0 || me.hp >= 100) return; me.meds--; me.hp = Math.min(100, me.hp + 50); play('med'); TASK.onMed(); for (let i = 0; i < 12; i++) S.pt.push(part(me.x+me.w/2, me.y+me.h/2, '#22c55e')); }
function part(x, y, c){ return {x, y, vx:(Math.random()*2-1)*5, vy:(Math.random()*2-1)*5-1, life:40, c, s:2+Math.random()*3}; }
function fxAdd(im_, x, y, t){ S.fx.push({im:im_, x, y, t}); }
function hurt(t, d, owner, via){
  if (t.dead) return; const a = Math.min(t.sh, d); t.sh -= a; t.hp -= d - a; play('hit');
  for (let i = 0; i < 8; i++) S.pt.push({x:t.x+t.w/2, y:t.y+t.h/3, vx:(Math.random()*2-1)*4, vy:(Math.random()*2-1)*4-1, life:40, c:'#b91c1c', s:3+Math.random()*2});
  if (t.hp <= 0) {
    t.dead = 90; play('die'); t.lb = owner; if (t === S.me) { S.pk.push({x:t.x+t.w/2, y:t.y+t.h-24, k:'body'}); TASK.onDeath(); } if (owner === S.me.id && t !== S.me) TASK.onKill(via);
    if (t === S.me && !S.offline && NET.s) NET.s.emit('died', {killer:owner, via:via});
    if (S.offline) { S.sc[owner] = S.sc[owner] || {k:0,d:0}; if (owner !== t.id) S.sc[owner].k++; S.sc[t.id] = S.sc[t.id] || {k:0,d:0}; S.sc[t.id].d++; S.feed.unshift([(owner === 'bot' ? '[BOT]' : S.me.name) + ' > ' + (t === S.me ? S.me.name : '[BOT]'), 'var(--lime)']); S.feed = S.feed.slice(0,4); }
  }
}
function boomAt(x, y, team, owner, send, via){
  if (S.zom) zBoom(x, y);
  play('boom'); S.shake = 14; fxAdd('explosion', x, y, 26);
  for (let i = 0; i < 24; i++) S.pt.push({x, y, vx:(Math.random()*2-1)*6, vy:(Math.random()*2-1)*6-2, life:40, c:'#fb923c', s:2+Math.random()*3});
  if (send && !S.offline && owner === S.me.id && NET.s) NET.s.emit('fx', {type:'boom', x, y, team, via});
  for (const t of [S.me, S.bot]) { if (!t || t.dead) continue; if (!isEnemy(team, owner) && t !== S.me) continue; if (t.id === owner) continue; const d = Math.hypot(t.x+t.w/2-x, t.y+t.h/2-y); if (d < 130 && isEnemy(team, owner)) hurt(t, Math.round(70*(1-d/130)), owner, via); }
}
function botStep(){
  const b = S.bot, me = S.me; if (b.dead) { b.dead--; if (b.dead <= 0) spawn(b); return; }
  const dx = me.x - b.x, dy = me.y - b.y; b.face = dx >= 0 ? 1 : -1;
  b.vx = Math.abs(dx) > 200 ? Math.sign(dx) * 1.8 : (Math.abs(dx) > 110 ? Math.sign(dx) : 0);
  if (b.ground && dy < -90 && Math.random() < .02) b.vy = -11;
  if (b.cool > 0) b.cool--;
  if (!me.dead && b.cool <= 0 && Math.random() < .04) { const ax = me.x+me.w/2-(b.x+b.w/2), ay = me.y+me.h/2-(b.y+b.h/2)+(Math.random()*40-20), L = Math.hypot(ax, ay) || 1; S.bl.push({x:b.x+b.w/2, y:b.y+b.h/2, vx:ax/L*12, vy:ay/L*12, dmg:10, life:100, team:1, owner:'bot', via:'pistol'}); b.cool = 60; play('pistol'); }
  moveX(b); moveY(b);
}
function step(){
  if (!S.on || S.paused) return; const me = S.me, now = Date.now();
  if (now >= S.end) return endGame();
  if (now < S.start) return;
  if (!me.dead) {
    const I = inp(); me.vx = I.mx * 4.2; if (I.mx) me.face = I.mx;
    const jp = I.jp && !S.prevJ; S.prevJ = I.jp;
    if (jp && me.ground) me.vy = -11;
    if (I.jt && me.fuel > 0) { me.vy = Math.max(me.vy - .9, -5); me.fuel -= 1.1; TASK.onJet(); } else me.fuel = Math.min(100, me.fuel + (me.ground ? 1.2 : .4));
    moveX(me); moveY(me); if (me.cool > 0) me.cool--;
    if (me.rl > 0) { me.rl--; if (me.rl === 0) me.mag[me.wi] = DATA.weapons[me.wi].am; }
    if (I.fi) fire(I.ax, I.ay);
    if (!S.offline && NET.s && now - S.sending > 50) { S.sending = now; NET.s.emit('pos', {x:me.x, y:me.y, face:me.face, ax:S.la.x, ay:S.la.y, hp:me.hp, sh:me.sh, dead:me.dead, wi:me.wi, char:me.char, team:me.team, name:me.name}); }
  } else { me.dead--; if (me.dead <= 0) spawn(me); }
  if (S.bot) botStep();
  if (S.zom) zomStep();
  const targets = [me, S.bot].filter(Boolean);
  S.bl = S.bl.filter(b => {
    if (b.melee) { if (S.zom) for (const z of ZOM.zs) if (!b.done && !z.dead && overlap(b, z)) { b.done = 1; zHit(z, b.dmg, 'chainsaw'); } for (const t of targets) if (!b.done && !t.dead && overlap(b, t) && isEnemy(b.team, b.owner) && t.id !== b.owner) { b.done = 1; hurt(t, b.dmg, b.owner, b.via); } b.life--; return b.life > 0; }
    b.x += b.vx; b.y += b.vy; b.life--; if (S.smk.some(c => Math.hypot(b.x - c.x, b.y - c.y) < 70)) return false;
    if (S.zom) { for (const z of ZOM.zs) if (!z.dead && b.x > z.x && b.x < z.x + z.w && b.y > z.y && b.y < z.y + z.h) { zHit(z, b.dmg, b.via); return false; } }
    if (b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H || PL.some(s => b.x > s.x && b.x < s.x+s.w && b.y > s.y && b.y < s.y+s.h)) { if (b.rk && b.owner === me.id) boomAt(b.x, b.y, b.team, b.owner, true, 'rocket'); return false; }
    for (const t of targets) if (!t.dead && t.id !== b.owner && b.x > t.x && b.x < t.x+t.w && b.y > t.y && b.y < t.y+t.h) { if (b.rk) { if (b.owner === me.id) boomAt(b.x, b.y, b.team, b.owner, true, 'rocket'); } else hurt(t, b.dmg, b.owner, b.via); return false; }
    return true;
  });
  S.nd = S.nd.filter(n => {
    n.vy += .35; n.x += n.vx; n.y += n.vy; n.vx *= .99; n.t--;
    for (const s of PL) if (n.x > s.x && n.x < s.x+s.w && n.y > s.y-6 && n.y < s.y+s.h) { n.y = s.y-6; if (n.vy > 0) n.vy *= -.45; n.vx *= .7; break; }
    if (n.x < 6 || n.x > W-6) { n.vx *= -.5; n.x = Math.max(6, Math.min(W-6, n.x)); }
    if (n.t <= 0) { if (n.smoke) S.smk.push({x:n.x, y:n.y, t:300}); else boomAt(n.x, n.y, me.team, me.id, true, 'grenade'); return false; } return true;
  });
  S.smk = S.smk.filter(c => (c.t -= 1) > 0);
  if (!me.dead) S.pk = S.pk.filter(k => { if (Math.hypot(k.x - (me.x + me.w/2), k.y - (me.y + me.h/2)) < 34) { pickUp(k.k); return false; } return true; });
  S.pkT = (S.pkT || 0) + 1;
  if (S.pkT > 900 && S.pk.length < 3) { S.pkT = 0; const p = rnd(PL.slice(1)); S.pk.push({x:p.x + 30 + Math.random() * (p.w - 60), y:p.y - 22, k:rnd(['ammo', 'shield', 'med'])}); }
  S.pt = S.pt.filter(q => { q.x += q.vx; q.y += q.vy; q.vy += .2; q.life--; return q.life > 0; });
  S.fx = S.fx.filter(f => { f.t--; return f.t > 0; });
  if (S.sc && S.mode && S.mode.kills) {
    const ks = Object.values(S.sc).map(x => x.k);
    if (ks.length && Math.max(...ks) >= S.mode.kills) endGame();
  }
}
function remoteShotFx(){ /* kept for compatibility */ }
function drawSprite(e, img, face){ if (!img.width) return; const hgt = 66, wid = img.width/img.height*hgt; g.save(); g.translate(e.x+e.w/2, e.y+e.h); g.scale(face < 0 ? -1 : 1, 1); g.drawImage(img, -wid/2, -hgt+6, wid, hgt); g.restore(); }
function drawGun(e, ax, ay, img){ if (!img.width) return; const L = Math.hypot(ax, ay) || 1, a = Math.atan2(ay/L, ax/L), flip = Math.cos(a) < 0; g.save(); g.translate(e.x+e.w/2, e.y+e.h/2-6); g.rotate(flip ? a + Math.PI : a); g.scale(1, flip ? -1 : 1); const gw = 44, gh = gw*img.height/img.width; g.drawImage(img, -8, -gh/2, gw, gh); g.restore(); }
function bar(x, y, w, v, max, c){ g.fillStyle = '#0009'; g.fillRect(x, y, w, 11); g.fillStyle = c; g.fillRect(x, y, w*Math.max(0, v)/max, 11); }
function drawPlayer(p, isMe){
  drawSprite(p, im('assets/characters/ch' + ((p.char | 0) + 1) + '.png'), p.face || 1);
  if (!p.dead) drawGun(p, isMe ? S.la.x : (p.ax || 1), isMe ? S.la.y : (p.ay || 0), im('assets/weapons/' + DATA.weapons[isMe ? p.wi : (p.wi || 0)].img + '.png'));
  g.fillStyle = '#eaf2ff'; g.font = 'bold 11px system-ui'; g.textAlign = 'center'; g.fillText(p.name || '', p.x+p.w/2, p.y-6); g.textAlign = 'left';
}
function drawHud(){
  const me = S.me, w = DATA.weapons[me.wi];
  g.fillStyle = '#0b1420dd'; g.fillRect(12, 12, 230, 96);
  const pi = im('assets/characters/ch' + (me.char+1) + '.png'); if (pi.width) { const hh = 72, ww = pi.width/pi.height*hh; g.fillStyle = '#132033'; g.fillRect(20, 18, 60, 60); g.drawImage(pi, 50-ww/2, 18+60-hh+4, ww, hh); }
  g.font = 'bold 12px system-ui'; g.fillStyle = '#eaf2ff';
  g.fillText('HP', 90, 32); bar(112, 22, 120, me.hp, 100, '#e0453a');
  g.fillText('SHIELD', 90, 52); bar(112, 42, 120, me.sh, 100, '#38bdf8');
  g.fillText('FUEL', 90, 72); bar(112, 62, 120, me.fuel, 100, '#f5a623');
  g.fillText(me.name.toUpperCase(), 20, 96);
  g.fillStyle = '#0b1420dd'; g.fillRect(W/2-120, 8, 240, 58);
  g.textAlign = 'center'; g.fillStyle = '#b8f53a'; g.font = 'bold 11px system-ui'; g.fillText(S.mode.n.toUpperCase() + ' · ' + DATA.maps[S.map].toUpperCase(), W/2, 24);
  const left = Math.max(0, S.end - Date.now()), mm = Math.floor(left/60000), ss = Math.floor(left/1000)%60;
  g.fillStyle = '#fff'; g.font = 'bold 22px system-ui'; g.fillText(String(mm).padStart(2,'0') + ':' + String(ss).padStart(2,'0'), W/2, 50);
  const sc = (id) => (S.sc[id] || {k:0}).k; const mine = S.me.team;
  const score = S.mode.team ? [0,1].map(t => S.roster.filter(p => p.team === t).reduce((a, p) => a + sc(p.id), 0)) : [sc(me.id), Math.max(0, ...S.roster.filter(p => p.id !== me.id).map(p => sc(p.id)))];
  g.fillText(score[0] + ' - ' + score[1], W/2 + 170, 30);
  g.textAlign = 'right'; g.font = 'bold 12px system-ui'; g.fillStyle = '#eaf2ff'; g.fillText('KILL FEED', W-14, 22);
  S.feed.forEach((f, i) => { g.fillStyle = f[1]; g.fillText(f[0], W-14, 40+i*16); });
  g.textAlign = 'left';
  g.fillStyle = '#0b1420dd'; g.fillRect(W/2-190, H-70, 380, 62);
  DATA.weapons.forEach((x, i) => { const bx = W/2-190+i*64+2; g.fillStyle = i === me.wi ? '#2c4a2a' : '#1b2d45'; g.fillRect(bx, H-66, 60, 54); g.strokeStyle = i === me.wi ? '#b8f53a' : '#2c4666'; g.lineWidth = 2; g.strokeRect(bx, H-66, 60, 54); const ii = im('assets/weapons/' + x.img + '.png'); if (ii.width) { const h = 34, ww = ii.width/ii.height*h; g.drawImage(ii, bx+30-ww/2, H-60, ww, h); } });
  g.fillStyle = '#eaf2ff'; g.font = 'bold 12px system-ui';
  g.fillText(w.n.toUpperCase() + '  ' + (w.grn ? 'GRN ' + me.nades : (w.melee ? 'MELEE' : (me.rl > 0 ? 'RELOADING' : me.mag[me.wi] + '/' + w.am))), 20, H-20);
  g.fillText('MED ' + me.meds, 250, H-20);
  if (S.zom) zomHud(g);
  TASK.draw(g); if (me.dead) centerText('YOU DIED - RESPAWNING');
  if (S.now_ < S.start) centerText('GET READY');
  if (TOUCH) drawTouch();
}
function centerText(t){ g.textAlign = 'center'; g.font = 'bold 28px system-ui'; g.fillStyle = '#fff'; g.fillText(t, W/2, H/2); g.textAlign = 'left'; }
function drawTouch(){
  g.font = 'bold 11px system-ui'; g.textAlign = 'center';
  for (const n in BTN) { const b = BTN[n]; g.globalAlpha = .6; g.fillStyle = '#1f2937'; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); g.globalAlpha = 1;
    const ii = n === 'grn' ? im('assets/weapons/grenade.png') : n === 'med' ? im('assets/items/medkit.png') : null;
    if (ii && ii.width) { const h = b.r*1.2, ww = ii.width/ii.height*h; g.drawImage(ii, b.x-ww/2, b.y-h/2, ww, h); } else { g.fillStyle = '#fff'; g.fillText(n === 'jump' ? 'JUMP' : 'JET', b.x, b.y+4); } }
  g.textAlign = 'left';
  for (const id in PT) { const q = PT[id]; if (q.t === 'stick') { g.globalAlpha = .4; g.fillStyle = '#fff'; g.beginPath(); g.arc(q.ox, q.oy, 40, 0, 7); g.fill(); g.beginPath(); g.arc(q.ox+Math.max(-40, Math.min(40, q.x-q.ox)), q.oy+Math.max(-40, Math.min(40, q.y-q.oy)), 18, 0, 7); g.fill(); g.globalAlpha = 1; } }
}
function draw(){
  g.save(); if (S.shake > 0) { g.translate((Math.random()-.5)*S.shake, (Math.random()-.5)*S.shake); S.shake *= .85; }
  g.drawImage(im('assets/maps/map' + (S.map+1) + '.jpg'), 0, 0, W, H);
  g.fillStyle = 'rgba(20,12,4,.25)'; g.fillRect(0, 0, W, H);
  for (const s of PL) { g.fillStyle = '#3b2a1acc'; g.fillRect(s.x, s.y, s.w, s.h); g.fillStyle = '#c2a06a'; g.fillRect(s.x, s.y, s.w, 4); }
  if (S.zom) zomDraw(g);
  for (const id in S.others) drawPlayer(S.others[id], false);
  if (S.bot && !S.bot.dead) drawPlayer(S.bot, false);
  drawPlayer(S.me, true);
  g.strokeStyle = '#fde047'; g.lineWidth = 2; for (const b of S.bl) { if (b.melee) continue; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x-b.vx*.8, b.y-b.vy*.8); g.stroke(); }
  for (const n of S.nd) { const gi = im('assets/weapons/grenade.png'); if (gi.width) g.drawImage(gi, n.x-12, n.y-12, 24, 24); }
  for (const f of S.fx) { const ii = im('assets/effects/' + f.im + '.png'); if (!ii.width) continue; const s = f.im === 'explosion' ? (60 + (26-f.t)*4) : 44; g.globalAlpha = Math.min(1, f.t/10); g.drawImage(ii, f.x-s/2, f.y-s/2, s, s*ii.height/ii.width); g.globalAlpha = 1; }
  for (const k of S.pk) { const ii = im('assets/items/' + ({ammo:'ammo', shield:'shield', med:'medkit', body:'crate'})[k.k] + '.png'); if (ii.width) g.drawImage(ii, k.x-22, k.y-22, 44, 44*ii.height/ii.width); }
  for (const c of S.smk) { const sm = im('assets/effects/smoke_white.png'); if (sm.width) { g.globalAlpha = .85; g.drawImage(sm, c.x-70, c.y-50, 140, 100); g.globalAlpha = 1; } }
  for (const q of S.pt) { g.globalAlpha = Math.max(0, q.life/50); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.s, 0, 7); g.fill(); }
  g.globalAlpha = 1; drawHud(); g.restore();
}
function loop(){ S.now_ = Date.now(); step(); if (S.on) draw(); requestAnimationFrame(loop); }
const TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return; K[e.code] = true; if (!S.on) return;
  if (e.code === 'KeyG') grenade(); if (e.code === 'KeyQ') throwSmoke(); if (e.code === 'KeyE') useMed(); if (e.code === 'KeyR') reload();
  const n = parseInt(e.key); if (n >= 1 && n <= DATA.weapons.length) if (TASK.unlocked(DATA.weapons[n-1].img)) S.me.wi = n-1;
  if (e.code === 'Escape') togglePause();
});
addEventListener('keyup', e => K[e.code] = false);
function toG(e){ const r = cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*W/r.width, y:(e.clientY-r.top)*H/r.height}; }
cv.addEventListener('pointerdown', e => { if (!S.on) return; const q = toG(e);
  if (e.pointerType === 'mouse') { MO.d = true; MO.x = q.x; MO.y = q.y; return; }
  if (q.y > H-70 && q.x > W/2-190 && q.x < W/2+190) { const wi = Math.floor((q.x-(W/2-190))/64); if (TASK.unlocked(DATA.weapons[wi].img)) S.me.wi = wi; return; }
  cv.setPointerCapture(e.pointerId); let t = q.x < W*.45 ? 'stick' : 'aim';
  for (const n in BTN) { const b = BTN[n]; if (Math.hypot(q.x-b.x, q.y-b.y) < b.r+6) { t = n; if (n === 'grn') grenade(); if (n === 'med') useMed(); } }
  PT[e.pointerId] = {t, ox:q.x, oy:q.y, x:q.x, y:q.y}; });
cv.addEventListener('pointermove', e => { const q = toG(e); if (e.pointerType === 'mouse') { MO.x = q.x; MO.y = q.y; return; } const o = PT[e.pointerId]; if (o) { o.x = q.x; o.y = q.y; } });
const pup = e => { if (e.pointerType === 'mouse') MO.d = false; delete PT[e.pointerId]; };
cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup);
function startMatch(mode, map, offline, roster, at){
  S.mode = mode; S.map = map; S.offline = offline; S.bl = []; S.nd = []; S.pt = []; S.fx = []; S.smk = []; S.pk = []; S.pkT = 0; S.paused = false; S.zom = false; S.sc = {}; S.feed = []; S.others = {};
  const me = roster.find(p => p.id === (NET.id || 'me')) || {id:'me', name:'Commander', team:0, char:0};
  S.me = mk(me.id, me.name, me.team, me.char); spawn(S.me); S.me.wi = (typeof SEL !== 'undefined' && SEL.wi) || 0;
  S.roster = roster; S.bot = null;
  if (offline) { S.bot = mk('bot', 'BOT', 1, 6); spawn(S.bot); S.roster = [S.me, S.bot]; }
  S.start = at || Date.now(); S.end = S.start + 5*60*1000; S.on = true; S.prevJ = false;
  TASK.start(); if (mode.id === 'zom') zStart(); go('game'); music('battle');
  try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(()=>{}); } catch(e) {}
}
function startOnline(d){ startMatch(DATA.modes.find(m => m.id === d.mode), d.map, false, d.players, d.at); }
function endGame(){ TASK.finish(); S.on = false; music('menu'); if (typeof showResults === 'function') showResults(); }
cv.width = W; cv.height = H;
loop();

// ---- Smoke grenade (Q), pickups, pause ----
function throwSmoke(){ const me = S.me; if (me.dead || me.smk <= 0) return; me.smk--; const L = Math.hypot(S.la.x, S.la.y) || 1; S.nd.push({x:me.x+me.w/2, y:me.y+me.h/2, vx:S.la.x/L*8, vy:S.la.y/L*8-3, t:90, smoke:1}); play('throw'); }
function pickUp(k){
  const me = S.me;
  if (k === 'ammo') { me.mag = DATA.weapons.map(w => w.am); me.nades += 1; }
  else if (k === 'shield') me.sh = Math.min(100, me.sh + 50);
  else if (k === 'med') me.meds += 1;
  else if (k === 'body') { me.nades += 2; me.meds += 1; }
  play('med');
}
function togglePause(){ if (!S.on) return; if (!S.paused) { S.paused = true; S.pauseAt = Date.now(); $('pauseov').style.display = 'flex'; $('pmic').textContent = 'MIC: ' + (NET.mic ? 'ON' : 'OFF'); } else resumeGame(); }
function resumeGame(){ if (!S.paused) return; S.paused = false; const d = Date.now() - S.pauseAt; S.end += d; S.start += d; $('pauseov').style.display = 'none'; }
function leaveGame(){ S.paused = false; S.on = false; $('pauseov').style.display = 'none'; go('home'); music('menu'); }
