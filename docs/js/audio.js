const AUDIO = {sfx:true, mus:true};
const SFX = {}, MUS = {};
['pistol','shotgun','sniper','rocket','saw','throw','boom','hit','die','med','reload','jet','click'].forEach(n => SFX[n] = new Audio('sounds/' + n + '.wav'));
['menu','battle'].forEach(n => { MUS[n] = new Audio('music/' + n + '.wav'); MUS[n].loop = true; MUS[n].volume = .35; });
function play(n){ if(!AUDIO.sfx || !SFX[n]) return; const a = SFX[n].cloneNode(); a.volume = .6; a.play().catch(()=>{}); }
function music(n){
  for (const k in MUS) if (k !== n) MUS[k].pause();
  if (!AUDIO.mus || !MUS[n]) return;
  MUS[n].play().catch(()=>{});
}
