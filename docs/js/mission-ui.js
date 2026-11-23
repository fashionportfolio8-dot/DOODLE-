/* Doodle Outpost mission briefing and task drawer */
(()=>{
 const $=id=>document.getElementById(id);
 const style=document.createElement('style');
 style.textContent='.do-tools{position:fixed;top:max(10px,env(safe-area-inset-top));right:10px;z-index:18;display:none;gap:6px;align-items:center}.do-tools .btn{padding:8px 11px;font-size:12px;background:#101c2def;border:2px solid #52677d;box-shadow:0 4px 18px #0008}.do-tools #doTaskBtn{color:#ffd16b;border-color:#e7a52b}.do-tools #taskBadge{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:4px;border-radius:50%;background:#f5a623;color:#201302;font-size:10px}.do-overlay{position:fixed;inset:0;z-index:45;background:linear-gradient(120deg,#050b13ed,#101b2bee);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}.do-card{width:min(620px,100%);padding:clamp(18px,4vw,34px);border:1px solid #64748b;border-radius:18px;background:linear-gradient(145deg,#1c2a3bf5,#0a1421f8);box-shadow:0 24px 80px #000b;position:relative;color:#f8fafc}.do-card:before{content:"";position:absolute;left:0;top:18px;bottom:18px;width:4px;background:#f5a623;border-radius:0 5px 5px 0}.do-eyebrow{color:#f5a623;font-size:11px;font-weight:900;letter-spacing:2px}.do-card h1{margin:10px 0;color:#fff;font-size:clamp(25px,5vw,38px)}.do-card p{color:#c3cfdd;line-height:1.5;margin:0 0 20px}.do-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}.do-stats div{padding:12px;background:#07111f;border:1px solid #33465d;border-radius:10px;display:flex;flex-direction:column;gap:5px;min-width:0}.do-stats small{color:#91a4b9;font-size:10px;letter-spacing:1px}.do-stats b{font-size:12px;overflow-wrap:anywhere}.do-objectives{padding:14px;background:#07111f;border:1px solid #33465d;border-radius:10px}.do-objectives>div{display:grid;gap:8px;margin-top:10px;color:#cbd5e1;font-size:13px}.do-objectives .do-objective:before{content:"◆";color:#b8f53a;margin-right:9px}.do-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.do-actions .do-start{background:#b8f53a;color:#11200a;border-color:#b8f53a}.do-hint{text-align:right;color:#93a4b7;font-size:10px;margin-top:12px}.do-task-panel{position:fixed;z-index:42;top:58px;right:10px;width:min(360px,calc(100vw - 20px));max-height:calc(100dvh - 76px);overflow:auto;padding:16px;border:1px solid #61758c;border-radius:14px;background:linear-gradient(150deg,#172638f5,#081321f7);box-shadow:0 18px 55px #000b;color:#f8fafc}.do-task-head{display:flex;align-items:center;justify-content:space-between}.do-task-head small{color:#f5a623;font-size:11px;font-weight:900;letter-spacing:2px}.do-task-head h2{color:#fff;font-size:18px;margin:3px 0 0}.do-task-panel button{padding:5px 10px}.do-level{display:flex;justify-content:space-between;margin:18px 0 7px;font-size:12px;font-weight:800;color:#cbd5e1}.do-xp{height:7px;border-radius:9px;background:#020812;overflow:hidden}.do-xp i{display:block;height:100%;width:0;background:linear-gradient(90deg,#b8f53a,#f5a623)}.do-task-list{display:grid;gap:10px;margin-top:16px}.do-task{padding:12px;border:1px solid #34495f;border-radius:10px;background:#0a1725}.do-task strong{font-size:12px;line-height:1.4;display:block}.do-task-meta{display:flex;justify-content:space-between;color:#9fb0c3;font-size:10px;margin-top:8px}.do-progress{height:5px;background:#020812;border-radius:8px;margin-top:8px;overflow:hidden}.do-progress i{display:block;height:100%;background:#b8f53a}.do-foot{font-size:10px;color:#8da0b5;margin-top:16px;text-align:center}@media(max-width:600px){.do-tools{top:6px;right:6px;gap:4px}.do-tools .btn{font-size:10px;padding:7px 8px}.do-actions .btn{padding:10px 16px;font-size:13px}.do-task-panel{top:48px;right:6px}.do-stats div{padding:9px}.do-hint{text-align:center}}';
 document.head.appendChild(style);
 const refStyle=document.createElement('style');
 refStyle.textContent=`
 /* Screenshot-matched battlefield HUD */
 .do-tools{top:14px;right:14px;gap:10px;z-index:48}
 .do-tools .btn{border:2px solid #8797ae;border-radius:12px;background:linear-gradient(180deg,#28364b,#101827);color:#f5f7fb;font-size:17px;padding:11px 16px;box-shadow:0 3px 0 #080e18,0 0 12px #0009}
 .do-tools #doTaskBtn{border:3px solid #ffcf39;background:linear-gradient(#ffdf57,#e79a00);color:#201707;box-shadow:0 0 13px #ffbd22, inset 0 1px #fff6}
 .do-tools #taskBadge{position:relative;top:-10px;margin-right:-8px;background:#e92e35;color:white;border:2px solid #8d1118;font-weight:900}
 .do-overlay{background:transparent;backdrop-filter:none;pointer-events:none;padding:12px;z-index:40}
 .do-card{pointer-events:auto;width:min(670px,calc(100vw - 390px));padding:24px 28px 20px;border:4px solid #111827;border-radius:24px;background:linear-gradient(145deg,#202b40f5,#111827f7);box-shadow:0 0 0 2px #8391a7,0 12px 35px #000b;color:#fff}
 .do-card:before{display:none}
 .do-eyebrow{display:block;text-align:center;font-size:clamp(18px,2vw,27px);letter-spacing:1px;color:#ffd52d;text-shadow:2px 3px #422600;margin:-10px 0 16px;padding:7px;border:3px solid #69788e;border-radius:14px;background:linear-gradient(#35445e,#111827)}
 .do-card h1{font-size:clamp(22px,2.2vw,30px);color:#ffcf27;margin:0 0 8px}
 .do-card p{font-size:clamp(13px,1.2vw,17px);font-weight:700;color:#fff;margin:0 0 12px}
 .do-stats{display:none}
 .do-objectives{padding:12px 14px;border:2px solid #42516a;border-radius:12px;background:#0b1322}
 .do-objectives>b{font-size:17px;color:#ffcf27}
 .do-objectives>div{font-size:15px;font-weight:800}
 .do-objectives .do-objective:before{content:"★";font-size:18px}
 .do-actions{justify-content:space-between;margin-top:18px}
 .do-actions .btn{min-width:31%;border:3px solid #9ba8bc;border-radius:15px;background:linear-gradient(#59657b,#242d42);color:#fff;font-size:clamp(16px,2vw,25px);padding:12px 18px;box-shadow:0 4px 0 #070d18}
 .do-actions .do-start{min-width:42%;border:3px solid #ffef83;background:linear-gradient(#ffe35b,#f5a900);color:#1d1605;font-size:clamp(20px,2.4vw,31px);box-shadow:0 0 17px #ffb900,0 5px 0 #6b3900}
 .do-hint{display:none}
 .do-task-panel{z-index:46;top:12%;right:14px;width:min(360px,24vw);max-height:76vh;padding:14px;border:4px solid #111827;border-radius:20px;background:linear-gradient(150deg,#202b40f7,#101827f7);box-shadow:0 0 0 2px #718096,0 12px 32px #000b}
 .do-task-head{padding-bottom:9px;border-bottom:2px solid #526078}
 .do-task-head small{font-size:14px;color:#ffcf27}
 .do-task-head h2{font-size:23px;color:#ffcf27}
 .do-task-head button{border:0!important;background:transparent!important;color:#fff;font-size:25px}
 .do-task{border:2px solid #39475d;border-radius:13px;background:#0b1322;padding:12px}
 .do-task strong{font-size:14px;color:#ffd34a}
 .do-task-meta{font-size:12px;color:#fff}
 .do-progress{height:8px}
 .do-progress i{background:linear-gradient(90deg,#f4a900,#b8f53a)}
 .do-foot{color:#aab9ce}
 @media(max-width:900px){
   .do-tools{top:7px;right:7px;gap:5px}
   .do-tools .btn{font-size:12px;padding:7px 9px}
   .do-card{width:calc(100vw - 300px);padding:14px}
   .do-task-panel{right:7px;top:13%;width:285px;max-width:34vw;padding:10px}
   .do-task-head h2{font-size:17px}
   .do-task{padding:8px}
   .do-task strong{font-size:11px}
 }
 @media(max-width:620px){
   .do-overlay{align-items:flex-start;padding-top:62px}
   .do-card{width:calc(100vw - 20px);max-height:72vh;overflow:auto;margin:auto}
   .do-eyebrow{font-size:17px}
   .do-task-panel{top:55px;right:6px;width:min(300px,80vw);max-width:none;max-height:70vh}
   .do-tools .btn{font-size:10px;padding:6px 7px}
   .do-task-panel{box-shadow:0 0 0 100vmax #0007,0 12px 32px #000b}
 }
 `;
 document.head.appendChild(refStyle);

 const tools=document.createElement('div');tools.className='do-tools';tools.id='doTools';tools.innerHTML='<button class="btn" id="doTaskBtn">▤ TASKS <span id="taskBadge">3</span></button><button class="btn" id="doSettingsBtn">⚙ SETTINGS</button>';
 const pause=$('pauseBtn');if(pause){pause.style.cssText='';pause.textContent='Ⅱ PAUSE';tools.appendChild(pause)}document.body.appendChild(tools);
 const brief=document.createElement('div');brief.id='missionBrief';brief.className='do-overlay';brief.style.display='none';
 brief.innerHTML='<div class="do-card"><div class="do-eyebrow">DOODLE OUTPOST · MISSION BRIEFING</div><h1 id="doMissionTitle">MISSION READY</h1><p id="doMissionDesc">Prepare your loadout and complete your objectives.</p><div class="do-stats"><div><small>MODE</small><b id="doMode"></b></div><div><small>ARENA</small><b id="doMap"></b></div><div><small>TIME</small><b>05:00</b></div></div><div class="do-objectives"><b>MISSION OBJECTIVES</b><div id="doObjectives"></div></div><div class="do-actions"><button class="btn" id="doSkip">SKIP</button><button class="btn do-start" id="doStart">START MISSION</button></div><div class="do-hint">The match timer starts when you press START or SKIP</div></div>';document.body.appendChild(brief);
 const panel=document.createElement('div');panel.id='doTaskPanel';panel.className='do-task-panel';panel.style.display='none';
 panel.innerHTML='<div class="do-task-head"><div><small>MISSION CONTROL</small><h2>ACTIVE TASKS</h2></div><button class="btn" id="doTaskClose">✕</button></div><div class="do-level"><span id="doLevel">LEVEL 1</span><span id="doXp">0 XP</span></div><div class="do-xp"><i id="doXpFill"></i></div><div id="doTaskList" class="do-task-list"></div><div class="do-foot">Complete objectives to earn XP and unlock weapons</div>';document.body.appendChild(panel);
 const originalStart=window.startMatch;
 window.startMatch=function(...a){originalStart.apply(this,a);S.on=false;S.paused=false;S.briefing=true;S.start=0;S.end=0;S.taskOpen=false;$('pauseov').style.display='none';$('doMissionTitle').textContent=S.mode.id==='zom'?'SURVIVE THE OUTPOST':'MISSION READY';$('doMissionDesc').textContent=S.mode.id==='zom'?'Hold the outpost, survive 10 waves and defeat the final boss.':'Eliminate opponents, complete your active tasks and secure the outpost.';$('doMode').textContent=S.mode.n.toUpperCase();$('doMap').textContent=(DATA.maps[S.map]||DATA.maps[0]).toUpperCase();$('doObjectives').innerHTML=TASK.active.map(t=>'<div class="do-objective">'+t.t+'</div>').join('')||'<div class="do-objective">Play the match and complete the mission</div>';brief.style.display='flex';panel.style.display='block';tools.style.display='flex';S.taskOpen=false;music('menu')};
 function refreshTasks(){const p=TASK.prog(),n=p.level>=MAX_LEVEL?0:xpNeed(p.level);$('doLevel').textContent='LEVEL '+p.level;$('doXp').textContent=n?p.xp+' / '+n+' XP':'MAX LEVEL';$('doXpFill').style.width=(n?Math.min(100,p.xp/n*100):100)+'%';$('taskBadge').textContent=TASK.active.length;$('doTaskList').innerHTML=TASK.active.map(t=>'<div class="do-task"><strong>'+t.t+'</strong><div class="do-progress"><i style="width:'+Math.min(100,t.p/t.n*100)+'%"></i></div><div class="do-task-meta"><span>IN PROGRESS</span><b>'+t.p+' / '+t.n+'</b></div></div>').join('')||'<div class="do-task"><strong>All active tasks completed!</strong><div class="do-task-meta">New tasks will appear here</div></div>'}
 function begin(){if(!S.briefing)return;S.briefing=false;S.on=true;S.paused=false;S.start=Date.now();S.end=S.start+300000;S.prevJ=false;brief.style.display='none';tools.style.display='flex';music('battle');refreshTasks()}
 $('doStart').onclick=begin;$('doSkip').onclick=begin;
 const oldToggle=window.togglePause;
 function closeTasks(){if(panel.style.display==='none')return;panel.style.display='none';S.taskOpen=false;if(S.on&&S.paused&&!S.briefing)resumeGame()}
 window.togglePause=function(){if(S.briefing)return;if(S.taskOpen){closeTasks();return}return oldToggle.apply(this,arguments)};
 $('doTaskBtn').onclick=()=>{if(S.briefing){panel.style.display=panel.style.display==='none'?'block':'none';return}if(!S.on)return;if(S.taskOpen){closeTasks();return}if(!S.paused)oldToggle();S.taskOpen=true;refreshTasks();panel.style.display='block';$('pauseov').style.display='none'};
 $('doTaskClose').onclick=closeTasks;
 $('doSettingsBtn').onclick=()=>{if(S.briefing)return;if(S.on&&!S.paused)oldToggle();panel.style.display='none';S.taskOpen=false;go('settings')};
 const oldLeave=window.leaveGame;window.leaveGame=function(){brief.style.display='none';panel.style.display='none';tools.style.display='none';S.briefing=false;S.taskOpen=false;return oldLeave.apply(this,arguments)};
 const oldDone=TASK.done.bind(TASK);TASK.done=function(t){const r=oldDone(t);refreshTasks();return r};
 const oldBack=window.backFromSettings;window.backFromSettings=function(){oldBack.apply(this,arguments);if(S.on){tools.style.display=S.briefing?'none':'flex';$('pauseov').style.display=S.paused?'flex':'none'}};
 const oldGo=window.go;window.go=function(id){oldGo.apply(this,arguments);tools.style.display=id==='game'&&S.on&&!S.briefing?'flex':'none'};
 window.addEventListener('keydown',e=>{if(e.code==='Escape'&&S.taskOpen){e.stopImmediatePropagation();closeTasks()}},true);
})();