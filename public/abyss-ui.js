import {MUTATORS,ROUTES,BOONS,EVENT_TYPES} from './abyss-rules.js';
import {canEnterAbyss,offerBoons,ABYSS_TEST_MODE,ABYSS_TEST_FLOOR} from './abyss-run.js';
const $=id=>document.getElementById(id);
const testFloors=[1,10,25,50,75,80,90,98,99];
export function createAbyssUI({getProgress,getRun,openDialog,onBegin,onGate,onBoon,onEvent}){
 $('abyss-open').addEventListener('click',()=>{const p=getProgress();$('abyss-description').textContent=ABYSS_TEST_MODE?'TEST MODE · '+ABYSS_TEST_FLOOR+'Fから開始。通常進行の報酬・ランキングには反映しません。':canEnterAbyss(p)?'3封印を解き、ゲートから次へ・中断・帰還。探索中の戦利品は死亡すると全ロスト。最高 '+(p.abyss?.bestFloor||0)+'F':'第18面をクリアすると解放。全99Fの探索に挑めます。';$('abyss-begin').disabled=!canEnterAbyss(p);$('abyss-resume').hidden=ABYSS_TEST_MODE||!p.abyss?.checkpoint;$('abyss-modifiers').innerHTML=ABYSS_TEST_MODE?'<div class="test-floor-links"><strong>深淵テスト階層</strong><div>'+testFloors.map(f=>`<a href="?test=abyss&floor=${f}&v=test">${f}F</a>`).join('')+'</div><small>後半確認は 80F / 90F / 98F / 99F 推奨</small></div>':p.abyss?.cleared99?MUTATORS.map(m=>`<label><input type="checkbox" data-mutator="${m.id}" ${(p.abyss.mutators||[]).includes(m.id)?'checked':''}> ${m.name}</label>`).join(''):'';openDialog('abyss-dialog');});
 $('abyss-begin').addEventListener('click',()=>onBegin(false,[...document.querySelectorAll('[data-mutator]:checked')].map(x=>x.dataset.mutator)));
 $('abyss-resume').addEventListener('click',()=>onBegin(true,[]));
 $('abyss-gate-options').addEventListener('click',e=>{const b=e.target.closest('[data-gate]');if(b)onGate(b.dataset.gate,b.dataset.route||'normal');});
 $('abyss-boons').addEventListener('click',e=>{const b=e.target.closest('[data-boon]');if(b)onBoon(b.dataset.boon);});
 $('abyss-event-accept').addEventListener('click',()=>onEvent(true));$('abyss-event-leave').addEventListener('click',()=>onEvent(false));
 for(const id of ['abyss-boon-dialog','abyss-event-dialog'])$(id).addEventListener('cancel',e=>e.preventDefault());
 if(ABYSS_TEST_MODE){const launch=()=>{if($('start')?.disabled)return setTimeout(launch,200);$('abyss-open').click();setTimeout(()=>$('abyss-begin').click(),80);};setTimeout(launch,250);}
 return{
 gate(){const r=getRun();$('abyss-gate-title').textContent='深淵 '+r.floor+'F · 3封印解除';$('abyss-gate-status').textContent='戦利品 '+r.caches.length+'個 / ¥'+Math.floor(r.bag).toLocaleString()+' · 帰還すると確定';const routes=r.floor%3===0?ROUTES:ROUTES.slice(0,1);$('abyss-gate-options').innerHTML=(r.floor<99?routes.map(a=>`<button data-gate="next" data-route="${a.id}"><strong>${a.name} → ${r.floor+1}F</strong><small>${a.text||'次の迷宮へ進む'}</small></button>`).join(''):'<p>99F踏破！ 帰還して専用報酬と変異モードを確定。</p>')+(r.testMode?'':'<button data-gate="suspend">中断セーブしてホームへ</button>')+'<button data-gate="return">帰還して戦利品を確保</button>';$('abyss-gate-close').hidden=false;openDialog('abyss-gate-dialog');},
 boon(){const r=getRun();$('abyss-boons').innerHTML=offerBoons(r).map(b=>{const key=b.id;return`<button data-boon="${key}"><strong>${b.name}</strong><small>${b.text}</small></button>`;}).join('');openDialog('abyss-boon-dialog');},
 event(room){const def=EVENT_TYPES.find(e=>e.id===room.id);$('abyss-event-title').textContent=def.name;$('abyss-event-description').textContent=def.text;openDialog('abyss-event-dialog');}
 };
}
