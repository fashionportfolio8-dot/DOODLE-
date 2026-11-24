// Adaptive touch controls. Existing gameplay functions handle all actions.
(function(){
const layer=document.getElementById('touchHud'),canvas=document.getElementById('c');if(!layer||!canvas)return;
drawTouch=function(){};
const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*960/r.width,y:(e.clientY-r.top)*540/r.height};};
const sticks={move:document.getElementById('moveStick'),aim:document.getElementById('aimStick')};
function moveKnob(el,e){const r=el.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.28,len=Math.hypot(dx,dy)||1,k=Math.min(1,max/len);el.querySelector('.stick-knob').style.transform='translate('+dx*k+'px,'+dy*k+'px)';}
for(const [name,el] of Object.entries(sticks)){
el.addEventListener('pointerdown',e=>{if(!S.on||S.paused)return;e.preventDefault();el.setPointerCapture(e.pointerId);const r=el.getBoundingClientRect(),p=point({clientX:r.left+r.width/2,clientY:r.top+r.height/2}),q=point(e);PT[e.pointerId]={t:name==='move'?'stick':'aim',ox:p.x,oy:p.y,x:q.x,y:q.y};moveKnob(el,e);});
el.addEventListener('pointermove',e=>{if(PT[e.pointerId]){const q=point(e);PT[e.pointerId].x=q.x;PT[e.pointerId].y=q.y;moveKnob(el,e);}});
const end=e=>{delete PT[e.pointerId];el.querySelector('.stick-knob').style.transform='translate(0,0)';};
el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
}
layer.querySelectorAll('[data-hold]').forEach(btn=>{const action=btn.dataset.hold;btn.addEventListener('pointerdown',e=>{if(!S.on||S.paused)return;e.preventDefault();btn.setPointerCapture(e.pointerId);PT[e.pointerId]={t:action,ox:0,oy:0,x:0,y:0};});const end=e=>delete PT[e.pointerId];btn.addEventListener('pointerup',end);btn.addEventListener('pointercancel',end);btn.addEventListener('lostpointercapture',end);});
layer.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('pointerdown',e=>{if(!S.on||S.paused)return;e.preventDefault();const a=btn.dataset.action;if(a==='grenade')grenade();else if(a==='med')useMed();else if(a==='smoke')throwSmoke();else if(a==='reload')reload();}));
window.addEventListener('blur',()=>{for(const id in PT)delete PT[id];});
})();