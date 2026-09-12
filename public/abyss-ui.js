import {MUTATORS,ROUTES,BOONS,EVENT_TYPES} from './abyss-rules.js';
import {canEnterAbyss,offerBoons} from './abyss-run.js';
const $=id=>document.getElementById(id);
export function createAbyssUI({getProgress,getRun,openDialog,onBegin,onGate,onBoon,onEvent}){
 $('abyss-open').addEventListener('click',()=>{const p=getProgress();$('abyss-description').textContent=canEnterAbyss(p)?'3封印を解き、ゲートから次へ・中断・帰還。探索中の戦利品は死亡すると全ロスト。最高 '+(p.abyss?.bestFloor||0)+'F':'第18面をクリアすると解放。全99Fの探索に挑めます。';$('abyss-begin').disabled=!canEnterAbyss(p);$('abyss-resume').hidden=!p.abyss?.checkpoint;$('abyss-modifiers').innerHTML=p.abyss?.cleared99?MUTATORS.map(m=>`<label><input type="checkbox" data-mutator="${m.id}" ${(p.abyss.mutators||[]).includes(m.id)?'checked':''}> ${m.name} · ${m.name}</label>`).join(''):'';openDialog('abyss-dialog');});
 $('abyss-begin').addEventListener('click',()=>onBegin(false,[...document.querySelectorAll('[data-mutator]:checked')].map(x=>x.dataset.mutator)));
 $('abyss-resume').addEventListener('click',()=>onBegin(true,[]));
 $('abyss-gate-options').addEventListener('click',e=>{const b=e.target.closest('[data-gate]');if(b)onGate(b.dataset.gate,b.dataset.route||'normal');});
 $('abyss-boons').addEventListener('click',e=>{const b=e.target.closest('[data-boon]');if(b)onBoon(b.dataset.boon);});
 $('abyss-event-accept').addEventListener('click',()=>onEvent(true));$('abyss-event-leave').addEventListener('click',()=>onEvent(false));
 for(const id of ['abyss-boon-dialog','abyss-event-dialog'])$(id).addEventListener('cancel',e=>e.preventDefault());
 return{
 gate(){const r=getRun();$('abyss-gate-title').textContent='深淵 '+r.floor+'F · 3封印解除';$('abyss-gate-status').textContent='戦利品 '+r.caches.length+'個 / ¥'+Math.floor(r.bag).toLocaleString()+' · 帰還すると確定';const routes=r.floor%3===0?ROUTES:ROUTES.slice(0,1);$('abyss-gate-options').innerHTML=(r.floor<99?routes.map(a=>`<button data-gate="next" data-route="${a.id}"><strong>${a.name} → ${r.floor+1}F</strong><small>${a.text||'次の迷宮へ進む'}</small></button>`).join(''):'<p>99F踏破！ 帰還して専用報酬と変異モードを確定。</p>')+'<button data-gate="suspend">中断セーブしてホームへ</button><button data-gate="return">帰還して戦利品を確保</button>';$('abyss-gate-close').hidden=false;openDialog('abyss-gate-dialog');},
 boon(){const r=getRun();$('abyss-boons').innerHTML=offerBoons(r).map(b=>{const key=b.id;return`<button data-boon="${key}"><strong>${b.name}</strong><small>${b.text}</small></button>`;}).join('');openDialog('abyss-boon-dialog');},
 event(room){const def=EVENT_TYPES.find(e=>e.key===room.id);$('abyss-event-title').textContent=def.name;$('abyss-event-description').textContent=def.text;openDialog('abyss-event-dialog');}
 };
}
