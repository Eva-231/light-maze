import {MUTATORS,ROUTES,BOONS,EVENT_TYPES} from './abyss-rules.js';
import {canEnterAbyss,offerBoons,ABYSS_TEST_MODE,ABYSS_TEST_FLOOR,ABYSS_TEST_GEAR} from './abyss-run.js';
const $=id=>document.getElementById(id);
const testFloors=[1,10,20,25,40,50,60,70,75,80,90,98,99];
const testGears=[['legend','LEGEND中心','後半ではかなり厳しい基準装備'],['abyss3','深淵 Grade III','中盤〜後半向けの標準深淵装備'],['abyss5','深淵 Grade V','90F以降を想定した上位深淵装備'],['mythic','MYTHICあり','終盤最上位ビルドの確認用']];
function testPanel(){return `<div class="test-floor-links" style="display:grid;gap:12px"><div><strong>TEST PLAY · 開始階層</strong><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${testFloors.map(f=>`<button type="button" data-test-floor="${f}" class="${f===ABYSS_TEST_FLOOR?'selected':''}">${f}F</button>`).join('')}</div></div><div><strong>装備プリセット</strong><div style="display:grid;gap:6px;margin-top:8px">${testGears.map(([id,name,text])=>`<button type="button" data-test-gear="${id}" class="${id===ABYSS_TEST_GEAR?'selected':''}"><strong>${name}</strong><small>${text}</small></button>`).join('')}</div></div><p style="margin:0">おすすめ：<b>90F × 深淵 Grade V</b>、<b>98F × MYTHICあり</b>。テスト結果は通常進行・戦利品・ランキングへ反映しません。</p></div>`;}
function testUrl(floor=90,gear='abyss5'){const u=new URL(location.href);u.searchParams.set('test','abyss');u.searchParams.set('floor',String(floor));u.searchParams.set('gear',gear);u.searchParams.set('v','abyss-test-4');return u.toString();}
function replaceTestQuery(key,value){const u=new URL(location.href);u.searchParams.set('test','abyss');u.searchParams.set(key,String(value));u.searchParams.set('v','abyss-test-4');location.href=u.toString();}
function installTestLauncher(){
 if(ABYSS_TEST_MODE)return;
 let existing=null;try{existing=document.getElementById('abyss-test-open');}catch{}
 if(existing)return;
 const abyss=$('abyss-open');if(!abyss?.parentElement)return;
 const b=document.createElement('button');b.id='abyss-test-open';b.type='button';b.textContent='🧪 深淵テストプレイ';b.setAttribute('aria-label','深淵テストプレイを開く');
 b.addEventListener('click',()=>{location.href=testUrl(90,'abyss5');});
 abyss.parentElement.insertBefore(b,abyss.nextSibling);
}
export function createAbyssUI({getProgress,getRun,openDialog,onBegin,onGate,onBoon,onEvent}){
 installTestLauncher();
 $('abyss-open').addEventListener('click',()=>{const p=getProgress();$('abyss-description').textContent=ABYSS_TEST_MODE?'TEST MODE · 階層と装備を選んで即プレイできます。通常進行の報酬・ランキングには反映しません。':canEnterAbyss(p)?'3封印を解き、ゲートから次へ・中断・帰還。探索中の戦利品は死亡すると全ロスト。最高 '+(p.abyss?.bestFloor||0)+'F':'第18面をクリアすると解放。全99Fの探索に挑めます。';$('abyss-begin').disabled=!canEnterAbyss(p);$('abyss-begin').textContent=ABYSS_TEST_MODE?`${ABYSS_TEST_FLOOR}Fを ${testGears.find(g=>g[0]===ABYSS_TEST_GEAR)?.[1]||'深淵 Grade III'} で開始`:'1Fから深淵へ';$('abyss-resume').hidden=ABYSS_TEST_MODE||!p.abyss?.checkpoint;$('abyss-modifiers').innerHTML=ABYSS_TEST_MODE?testPanel():p.abyss?.cleared99?MUTATORS.map(m=>`<label><input type="checkbox" data-mutator="${m.id}" ${(p.abyss.mutators||[]).includes(m.id)?'checked':''}> ${m.name}</label>`).join(''):'';openDialog('abyss-dialog');});
 $('abyss-modifiers').addEventListener('click',e=>{const floor=e.target.closest('[data-test-floor]'),gear=e.target.closest('[data-test-gear]');if(floor)replaceTestQuery('floor',floor.dataset.testFloor);if(gear)replaceTestQuery('gear',gear.dataset.testGear);});
 $('abyss-begin').addEventListener('click',()=>onBegin(false,[...document.querySelectorAll('[data-mutator]:checked')].map(x=>x.dataset.mutator)));
 $('abyss-resume').addEventListener('click',()=>onBegin(true,[]));
 $('abyss-gate-options').addEventListener('click',e=>{const b=e.target.closest('[data-gate]');if(b)onGate(b.dataset.gate,b.dataset.route||'normal');});
 $('abyss-boons').addEventListener('click',e=>{const b=e.target.closest('[data-boon]');if(b)onBoon(b.dataset.boon);});
 $('abyss-event-accept').addEventListener('click',()=>onEvent(true));$('abyss-event-leave').addEventListener('click',()=>onEvent(false));
 for(const id of ['abyss-boon-dialog','abyss-event-dialog'])$(id).addEventListener('cancel',e=>e.preventDefault());
 if(ABYSS_TEST_MODE){const launch=()=>{if($('start')?.disabled)return setTimeout(launch,200);$('abyss-open').click();};setTimeout(launch,250);}
 return{
 gate(){const r=getRun();$('abyss-gate-title').textContent=(r.testMode?'TEST · ':'')+'深淵 '+r.floor+'F · 3封印解除';$('abyss-gate-status').textContent=(r.testMode?'テストプレイ / ':'')+'戦利品 '+r.caches.length+'個 / ¥'+Math.floor(r.bag).toLocaleString()+(r.testMode?' · 結果は保存されません':' · 帰還すると確定');const routes=r.floor%3===0?ROUTES:ROUTES.slice(0,1);$('abyss-gate-options').innerHTML=(r.floor<99?routes.map(a=>`<button data-gate="next" data-route="${a.id}"><strong>${a.name} → ${r.floor+1}F</strong><small>${a.text||'次の迷宮へ進む'}</small></button>`).join(''):'<p>99F踏破。テスト結果は通常進行へ反映しません。</p>')+(r.testMode?'':'<button data-gate="suspend">中断セーブしてホームへ</button>')+'<button data-gate="return">'+(r.testMode?'テストを終了':'帰還して戦利品を確保')+'</button>';$('abyss-gate-close').hidden=false;openDialog('abyss-gate-dialog');},
 boon(){const r=getRun();$('abyss-boons').innerHTML=offerBoons(r).map(b=>{const key=b.id;return`<button data-boon="${key}"><strong>${b.name}</strong><small>${b.text}</small></button>`;}).join('');openDialog('abyss-boon-dialog');},
 event(room){const def=EVENT_TYPES.find(e=>e.id===room.id);$('abyss-event-title').textContent=def.name;$('abyss-event-description').textContent=def.text;openDialog('abyss-event-dialog');}
 };
}
