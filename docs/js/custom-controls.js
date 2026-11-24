/* Doodle Outpost v1.0.7 - movable touch-control layout editor */
(function(){
  const KEY='doo_custom_controls_v1';
  const layer=document.getElementById('touchHud');
  const game=document.getElementById('game');
  if(!layer||!game)return;
  let overlay,toolbar,originParent,originNext,editing=false,drag=null;
  const originalInline=new Map();
  let working={},savedAtOpen={};
  const controls=()=>[
    ['moveStick',document.getElementById('moveStick')],
    ['aimFirePad',document.getElementById('aimFirePad')],
    ...Array.from(layer.querySelectorAll('[data-action]')).map(el=>['action-'+el.dataset.action,el]),
    ...Array.from(layer.querySelectorAll('[data-hold]')).map(el=>['hold-'+el.dataset.hold,el])
  ].filter(x=>x[1]);
  const readSaved=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){return {}}};
  const captureDefaults=()=>controls().forEach(([key,el])=>{if(!originalInline.has(key))originalInline.set(key,el.getAttribute('style'));});
  function restoreElement(key,el){const old=originalInline.get(key);if(old===null||old===undefined)el.removeAttribute('style');else el.setAttribute('style',old);}
  function applyPositions(map){
    controls().forEach(([key,el])=>{
      const p=map[key];
      if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){
        el.style.position='fixed';el.style.left=(p.x*100)+'vw';el.style.top=(p.y*100)+'vh';el.style.right='auto';el.style.bottom='auto';
      }else restoreElement(key,el);
    });
  }
  function restoreDefaults(){controls().forEach(([key,el])=>restoreElement(key,el));}
  function ensureUI(){
    if(overlay)return;
    overlay=document.createElement('div');overlay.id='customControlsOverlay';
    toolbar=document.createElement('div');toolbar.className='custom-controls-toolbar';
    toolbar.innerHTML='<strong>🎮 CUSTOM CONTROL LAYOUT</strong><small>Drag each control to your preferred position. Move the buttons away from the game edges if needed.</small><button class="btn" id="customReset">RESET</button><button class="btn" id="customCancel">CANCEL</button><button class="btn lime" id="customSave">SAVE LAYOUT</button>';
    overlay.appendChild(toolbar);document.body.appendChild(overlay);
    toolbar.querySelector('#customReset').addEventListener('click',()=>{working={};restoreDefaults();});
    toolbar.querySelector('#customCancel').addEventListener('click',closeEditor);
    toolbar.querySelector('#customSave').addEventListener('click',()=>{
      if(Object.keys(working).length)localStorage.setItem(KEY,JSON.stringify(working));else localStorage.removeItem(KEY);
      closeEditor();
    });
  }
  function startEditor(){
    if(editing)return;
    captureDefaults();ensureUI();editing=true;savedAtOpen=readSaved();working=JSON.parse(JSON.stringify(savedAtOpen));
    originParent=layer.parentNode;originNext=layer.nextSibling;
    document.body.appendChild(layer);layer.classList.add('custom-editing');
    layer.style.display='block';overlay.classList.add('open');
    applyPositions(working);
    controls().forEach(([key,el])=>{
      el.dataset.customKey=key;
      el.addEventListener('pointerdown',beginDrag,true);
      el.addEventListener('pointermove',moveDrag,true);
      el.addEventListener('pointerup',endDrag,true);
      el.addEventListener('pointercancel',endDrag,true);
    });
  }
  function beginDrag(e){
    if(!editing)return;
    const el=e.currentTarget,key=el.dataset.customKey;
    if(!key)return;
    e.preventDefault();e.stopImmediatePropagation();
    const r=el.getBoundingClientRect();
    if(!working[key])working[key]={x:r.left/innerWidth,y:r.top/innerHeight};
    drag={el,key,pointerId:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
    try{el.setPointerCapture(e.pointerId)}catch(_){}
  }
  function moveDrag(e){
    if(!editing||!drag||drag.pointerId!==e.pointerId)return;
    e.preventDefault();e.stopImmediatePropagation();
    const r=drag.el.getBoundingClientRect();
    const x=Math.max(0,Math.min(1-r.width/innerWidth,(e.clientX-drag.dx)/innerWidth));
    const y=Math.max(0,Math.min(1-r.height/innerHeight,(e.clientY-drag.dy)/innerHeight));
    working[drag.key]={x,y};
    drag.el.style.position='fixed';drag.el.style.left=(x*100)+'vw';drag.el.style.top=(y*100)+'vh';drag.el.style.right='auto';drag.el.style.bottom='auto';
  }
  function endDrag(e){if(!editing||!drag||drag.pointerId!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();drag=null;}
  function closeEditor(){
    if(!editing)return;editing=false;drag=null;
    controls().forEach(([,el])=>{
      el.removeEventListener('pointerdown',beginDrag,true);el.removeEventListener('pointermove',moveDrag,true);
      el.removeEventListener('pointerup',endDrag,true);el.removeEventListener('pointercancel',endDrag,true);
      delete el.dataset.customKey;
    });
    layer.classList.remove('custom-editing');layer.style.display='';
    if(originParent)originParent.insertBefore(layer,originNext&&originNext.parentNode===originParent?originNext:null);
    overlay.classList.remove('open');
    applyPositions(readSaved());
  }
  window.openCustomControls=startEditor;
  captureDefaults();applyPositions(readSaved());
})();
