// Zombie Survival: 10 waves, boss on wave 10. Win after wave 10. Defeat when the survivor dies.
// Solo offline version. Friendly fire is OFF in co-op (planned for online co-op).
const ZT = [
  {img:'z1', hp:40, spd:1.1, dmg:10, w:34, h:58},
  {img:'z2', hp:60, spd:1.8, dmg:12, w:34, h:58},
  {img:'z3', hp:30, spd:0.9, dmg:7,  w:44, h:26, crawl:1},
  {img:'z4', hp:80, spd:1.5, dmg:14, w:34, h:58}
];
const ZOM = {wave:0, state:'wait', t:240, zs:[], kills:0, lostT:0, endT:0};
function zStart(){ S.zom = true; S.bot = null; Object.assign(ZOM, {wave:0, state:'wait', t:240, zs:[], kills:0, lostT:0, endT:0}); }
function zSpawn(wave){
  const count = 4 + wave * 2;
  for (let i = 0; i < count; i++) {
    const boss = wave === 10 && i === 0;
    const tp = boss ? ZT[3] : ZT[wave < 3 ? [0, 1, 3][i % 3] : Math.floor(Math.random() * 4)];
    const p = rnd(PL.slice(1));
    const z = {img:tp.img, hp:boss ? 600 : tp.hp + wave * 4, spd:boss ? 1.2 : tp.spd, dmg:boss ? 25 : tp.dmg, w:boss ? 68 : tp.w, h:boss ? 116 : tp.h, boss, crawl:tp.crawl, x:0, y:0, vx:0, vy:0, face:-1, ground:false, dead:0, gone:0, cd:0};
    z.x = p.x + 10 + Math.random() * Math.max(10, p.w - 40); z.y = p.y - z.h;
    ZOM.zs.push(z);
  }
}
function zStep(z){
  if (z.dead) { z.dead--; if (z.dead <= 0) z.gone = 1; return; }
  const p = S.me, dx = p.x - z.x;
  z.vx = Math.abs(dx) > 6 ? Math.sign(dx) * z.spd : 0; z.face = dx >= 0 ? 1 : -1;
  if (z.ground && p.y < z.y - 50 && Math.random() < .03) z.vy = -10;
  moveX(z); moveY(z);
  if (!p.dead && Math.abs(p.x - z.x) < z.w + 10 && Math.abs(p.y - z.y) < 50) {
    if (z.cd > 0) z.cd--; else { hurt(p, z.dmg, 'zombie', 'zombie'); z.cd = 45; }
  }
}
function zHit(z, d, via){
  if (z.dead) return;
  z.hp -= d; play('hit');
  for (let i = 0; i < 6; i++) S.pt.push({x:z.x+z.w/2, y:z.y+z.h/3, vx:(Math.random()*2-1)*4, vy:(Math.random()*2-1)*4-1, life:40, c:'#b91c1c', s:3+Math.random()*2});
  if (z.hp <= 0) { z.dead = 30; ZOM.kills++; play('die'); TASK.onKill(via || 'any'); }
}
function zBoom(x, y){ for (const z of ZOM.zs) { if (z.dead) continue; const d = Math.hypot(z.x+z.w/2-x, z.y+z.h/2-y); if (d < 130) zHit(z, Math.round(70*(1-d/130)), 'grenade'); } }
function zomStep(){
  const Z = ZOM, p = S.me;
  if (Z.state === 'lost') { if (--Z.lostT <= 0) endGame(); return; }
  if (Z.state === 'won') { if (--Z.endT <= 0) endGame(); return; }
  if (p.dead) { Z.state = 'lost'; Z.lostT = 80; return; }
  Z.zs.forEach(zStep); Z.zs = Z.zs.filter(z => !z.gone);
  if (Z.state === 'wait') { if (--Z.t <= 0) { Z.wave++; zSpawn(Z.wave); Z.state = 'fight'; } }
  else if (Z.zs.length === 0) {
    if (Z.wave >= 10) { Z.state = 'won'; Z.endT = 180; }
    else { Z.state = 'wait'; Z.t = 240; }
  }
}
function zomDraw(g){
  for (const z of ZOM.zs) {
    const ii = im('assets/zombies/' + z.img + '.png'); if (!ii.width) continue;
    const hh = z.boss ? z.h * 0.95 : z.h * 1.2, ww = ii.width / ii.height * hh;
    g.save(); if (z.dead) g.globalAlpha = Math.max(0, z.dead / 30);
    g.translate(z.x + z.w/2, z.y + z.h); g.scale(z.face < 0 ? -1 : 1, 1);
    g.drawImage(ii, -ww/2, -hh + 4, ww, hh); g.restore();
  }
}
function zomHud(g){
  const Z = ZOM;
  g.textAlign = 'center';
  g.fillStyle = '#0b1420dd'; g.fillRect(W/2-120, 70, 240, 28);
  g.fillStyle = '#eaf2ff'; g.font = 'bold 15px system-ui';
  g.fillText('WAVE ' + String(Math.max(1, Z.wave)).padStart(2,'0') + ' / 10 · KILLS ' + Z.kills, W/2, 90);
  const boss = Z.zs.find(z => z.boss && !z.dead);
  if (boss) { g.fillStyle = '#0009'; g.fillRect(W/2-150, 102, 300, 10); g.fillStyle = '#e0453a'; g.fillRect(W/2-150, 102, 300 * Math.max(0, boss.hp) / 600, 10); }
  g.fillStyle = '#0b1420dd'; g.fillRect(W-214, 110, 202, 150);
  g.textAlign = 'left'; g.fillStyle = '#b8f53a'; g.font = 'bold 14px system-ui'; g.fillText('GAME RULES', W-202, 132);
  g.fillStyle = '#eaf2ff'; g.font = '12px system-ui';
  ['10 waves to survive', 'Survive all 10 to win', 'Co-op: friendly fire OFF', 'Wave 10 has a boss zombie', 'Survivor down = defeat'].forEach((t, i) => g.fillText('• ' + t, W-202, 154 + i*20));
  g.textAlign = 'center';
  for (let i = 1; i <= 10; i++) {
    const x = 300 + (i-1) * 44, done = i < Z.wave || (i === Z.wave && Z.state !== 'fight');
    g.beginPath(); g.arc(x, H-100, 13, 0, 7); g.fillStyle = i <= Z.wave ? '#b8f53a' : '#2b3324'; g.fill(); g.strokeStyle = '#6b7a4a'; g.lineWidth = 2; g.stroke();
    g.fillStyle = i <= Z.wave ? '#11200a' : '#eaf2ff'; g.font = 'bold 11px system-ui'; g.fillText(i === 10 ? '☠' : String(i), x, H-96);
  }
  if (Z.state === 'won') banner(g, 'WIN', 'Survive 10 Waves!', '#b8f53a');
  if (Z.state === 'lost') banner(g, 'DEFEAT', 'You were overwhelmed!', '#e0453a');
  g.textAlign = 'left';
}
function banner(g, title, sub, col){
  g.fillStyle = '#0b1420ee'; g.fillRect(W/2-190, H/2-60, 380, 110);
  g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(W/2-190, H/2-60, 380, 110);
  g.textAlign = 'center'; g.fillStyle = col; g.font = 'bold 34px system-ui'; g.fillText(title, W/2, H/2-14);
  g.fillStyle = '#eaf2ff'; g.font = '15px system-ui'; g.fillText(sub, W/2, H/2+18);
}
function zBoomSafe(){}
