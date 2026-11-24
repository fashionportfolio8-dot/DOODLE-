// Tasks and levels: the game gives each player 3 tasks in a match. Finishing a task gives XP.
// Levels 1-10. Level unlocks weapons; every level after 1 adds +5 HP. Progress is saved on this device.
const TASK_KEY = 'doodle_outpost_progress';
const TASK_POOL = [
  {id:'pistol3', t:'Get 3 kills with the Pistol', k:'kill', via:'pistol', n:3},
  {id:'shot2', t:'Get 2 kills with the Shotgun', k:'kill', via:'shotgun', n:2},
  {id:'sniper1', t:'Get 1 kill with the Sniper', k:'kill', via:'sniper', n:1},
  {id:'rocket1', t:'Get 1 kill with the Rocket', k:'kill', via:'rocket', n:1},
  {id:'saw2', t:'Get 2 kills with the Chainsaw', k:'kill', via:'chainsaw', n:2},
  {id:'nade1', t:'Get 1 kill with a Grenade', k:'kill', via:'grenade', n:1},
  {id:'med2', t:'Use 2 medkits', k:'med', n:2},
  {id:'jet5', t:'Use the jetpack for 5 seconds', k:'jet', n:300},
  {id:'streak2', t:'Get 2 kills in a row without dying', k:'streak', n:2},
  {id:'kills5', t:'Get 5 kills in one match', k:'kill', via:'any', n:5}
];
const UNLOCKS = {2:'Shotgun', 3:'Sniper', 4:'Rocket', 5:'Chainsaw'};
const WEAPON_LEVEL = {shotgun:2, sniper:3, rocket:4, chainsaw:5};
const MAX_LEVEL = 10, TASK_XP = 100;
const xpNeed = l => 100 * l;
const TASK = {
  pr: null, active: [], completed: [], streak: 0, gainXp: 0, levelsGained: 0, toast: '', toastT: 0,
  prog() { if (!this.pr) { try { this.pr = JSON.parse(localStorage.getItem(TASK_KEY)); } catch (e) {} } if (!this.pr || !this.pr.level) this.pr = {level:1, xp:0, tasks:0}; return this.pr; },
  save() {
    const progress = this.prog();
    try { localStorage.setItem(TASK_KEY, JSON.stringify(progress)); } catch (e) {}
    const fb = window.DO_FIREBASE;
    if (fb && fb.db && fb.user) {
      fb.db.collection('players').doc(fb.user.uid).set({
        level: progress.level, xp: progress.xp, tasks: progress.tasks || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge:true}).catch(err => console.warn('Firebase progress save failed:', err));
    }
  },
  unlocked(img) { const need = WEAPON_LEVEL[img]; return !need || this.prog().level >= need; },
  maxHp() { return 100 + (this.prog().level - 1) * 5; },
  fill() { const have = this.active.map(t => t.id); const pool = TASK_POOL.filter(t => !have.includes(t.id) && !this.completed.includes(t.id)); while (this.active.length < 3 && pool.length) { const i = Math.floor(Math.random() * pool.length); this.active.push({...pool.splice(i, 1)[0], p: 0}); } },
  start() { this.prog(); this.active = []; this.completed = []; this.streak = 0; this.gainXp = 0; this.levelsGained = 0; this.fill(); },
  event(kind, via, amt = 1) {
    for (const t of [...this.active]) {
      if (t.k === 'streak') { if (kind === 'streak') { t.p = Math.max(t.p, amt); if (t.p >= t.n) this.done(t); } continue; }
      const hit = t.k === 'kill' ? (kind === 'kill' && (t.via === 'any' || t.via === via)) : t.k === kind;
      if (hit) { t.p = Math.min(t.n, t.p + amt); if (t.p >= t.n) this.done(t); }
    }
  },
  done(t) { this.active = this.active.filter(x => x !== t); this.completed.push(t.id); const p = this.prog(); p.tasks++; p.xp += TASK_XP; this.gainXp += TASK_XP; this.say('TASK DONE: ' + t.t + ' · +' + TASK_XP + ' XP'); this.levels(); this.save(); this.fill(); },
  levels() { const p = this.prog(); while (p.level < MAX_LEVEL && p.xp >= xpNeed(p.level)) { p.xp -= xpNeed(p.level); p.level++; this.levelsGained++; this.say('LEVEL UP! Level ' + p.level + (UNLOCKS[p.level] ? ' · Unlocked ' + UNLOCKS[p.level] : ' · +5 HP')); } },
  say(m) { this.toast = m; this.toastT = 200; },
  onKill(via) { this.event('kill', via); this.streak++; this.event('streak', '', this.streak); },
  onDeath() { this.streak = 0; },
  onMed() { this.event('med'); },
  onJet() { this.event('jet'); },
  finish() { this.save(); },
  draw(g) {
    const p = this.prog(), x = 12, y = 134, w = 260;
    g.fillStyle = '#0b1420dd'; g.fillRect(x, y, w, 40 + this.active.length * 44);
    g.textAlign = 'left'; g.fillStyle = '#b8f53a'; g.font = 'bold 12px system-ui';
    g.fillText('TASKS · LEVEL ' + p.level, x + 10, y + 18);
    const frac = p.level >= MAX_LEVEL ? 1 : p.xp / xpNeed(p.level);
    g.fillStyle = '#0009'; g.fillRect(x + 10, y + 26, w - 20, 6); g.fillStyle = '#f5a623'; g.fillRect(x + 10, y + 26, (w - 20) * frac, 6);
    this.active.forEach((t, i) => {
      const yy = y + 44 + i * 44;
      g.fillStyle = '#eaf2ff'; g.font = '12px system-ui'; g.fillText(t.t, x + 10, yy + 12);
      g.fillStyle = '#0009'; g.fillRect(x + 10, yy + 18, w - 20, 8);
      g.fillStyle = '#b8f53a'; g.fillRect(x + 10, yy + 18, (w - 20) * t.p / t.n, 8);
      g.fillStyle = '#eaf2ff'; g.textAlign = 'right'; g.fillText(t.p + '/' + t.n, x + w - 10, yy + 12); g.textAlign = 'left';
    });
    if (this.toastT > 0) {
      this.toastT--; g.textAlign = 'center'; g.font = 'bold 18px system-ui';
      const tw = Math.min(W - 40, g.measureText(this.toast).width + 40);
      g.fillStyle = '#0b1420ee'; g.fillRect(W / 2 - tw / 2, 92, tw, 34);
      g.fillStyle = '#b8f53a'; g.fillText(this.toast, W / 2, 115); g.textAlign = 'left';
    }
  }
};

/* Load cloud progress before the lobby is initialized. Local progress is retained
   when it is ahead of the cloud copy, so an existing player does not lose progress. */
window.TASK_CLOUD_READY = (async () => {
  try {
    const user = await window.DO_FIREBASE_READY;
    if (!user || !window.DO_FIREBASE || !window.DO_FIREBASE.db) return false;
    const ref = window.DO_FIREBASE.db.collection('players').doc(user.uid);
    const snap = await ref.get();
    const local = TASK.prog();
    if (snap.exists) {
      const remote = snap.data() || {};
      const safeRemote = {
        level: Math.max(1, Math.min(MAX_LEVEL, Number(remote.level) || 1)),
        xp: Math.max(0, Number(remote.xp) || 0),
        tasks: Math.max(0, Number(remote.tasks) || 0)
      };
      const total = p => (p.level - 1) * p.level * 50 + p.xp;
      if (total(safeRemote) > total(local)) {
        TASK.pr = safeRemote;
        try { localStorage.setItem(TASK_KEY, JSON.stringify(safeRemote)); } catch (e) {}
      } else {
        TASK.save();
      }
    } else {
      TASK.save();
    }
    return true;
  } catch (err) {
    console.warn('Firebase cloud progress unavailable; using this device:', err);
    return false;
  }
})();

function updLevel(){
  const p=TASK.prog(), need=p.level>=MAX_LEVEL?0:xpNeed(p.level), el=document.getElementById('lvl');
  if(el)el.textContent='LEVEL '+p.level+' · +'+((p.level-1)*5)+' BONUS HP';
  const xp=document.getElementById('levelXp');if(xp)xp.textContent=need?p.xp+' / '+need+' XP':'MAX LEVEL';
  const bar=document.getElementById('levelProgress');if(bar)bar.style.width=(need?Math.min(100,p.xp/need*100):100)+'%';
  const count=document.getElementById('activeTaskCount');if(count)count.textContent=(TASK.active.length||3)+' ACTIVE TASKS';
  const unlock=document.getElementById('nextUnlock');if(unlock){const next=Object.keys(UNLOCKS).map(Number).filter(l=>l>p.level).sort((a,b)=>a-b)[0];unlock.textContent=next?'Next unlock: '+UNLOCKS[next]+' · Level '+next:'All weapons unlocked';}
}
