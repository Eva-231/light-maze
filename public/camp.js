import {DIFFICULTIES} from './journey.js';
import {RevealSequence} from './reveal-sequence.js';
import {AvatarPreview} from './avatar.js';
import {RELICS,RARITIES,SLOTS,AFFIXES,DRAW_COST,INVENTORY_LIMIT,affixValue,relicQuality,relicPower,salvageValue,loadoutStats,appraisal,appraisalBatch,dailyChallenge,relicDescription,CATALOG_SIZE,toggleFavorite,sellRelic} from './relics.js';
import {balance} from './save.js';
const money=n=>'¥'+Math.floor(n).toLocaleString('ja-JP');
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const progressLabel=(p,daily,best)=>p.floor<8?'7面クリアで日替わり討伐が解放。共通能力で最速タイムを競います。':daily.day+' · 本日最速 '+(best?.cleared?best.time.toFixed(2)+'秒':'未討伐');
const stat=(i,second=false)=>{const a=AFFIXES[second?i.b:i.a];return a.name+' +'+affixValue(i,second)+(['crit','economy'].includes(a.key)?'%':'');};
const card=i=>`<div class="relic-card" style="--relic:${RARITIES[i.tier].color}"><div class="relic-grade">${RARITIES[i.tier].name} · ${SLOTS[RELICS[i.type].slot]}</div><h3>${RELICS[i.type].name}</h3><div class="relic-quality"><strong>${relicPower(i)}</strong><span>装備評価<br>個体品質 ${relicQuality(i)} / 100</span></div><p>${relicDescription(i)}</p>${RELICS[i.type].exclusive?'<span class="exclusive-tag">深淵突破限定</span>':''}<div class="affixes"><span>${stat(i)}</span><span>${stat(i,true)}</span></div></div>`;
export function createCamp({getProgress,changed,sound,openDialog,rankings,canChange=()=>true}){
 const $=id=>document.getElementById(id);let tab='forge',slot=0,page=0,favoritesOnly=false,busy=false,last=null,sequence=null,results=[],saveMessage='';const avatar=new AvatarPreview($('avatar-canvas')),pageSize=24;
 function summary(){const p=getProgress();$('camp-bank').textContent=money(balance(p));$('camp-count').textContent=p.inventory.length+' / '+INVENTORY_LIMIT+' 装備';}
 function render(){summary();const unlocked=getProgress().floor>=4;document.querySelectorAll('[data-camp-tab]').forEach(b=>{if(b.dataset.campTab==='forge')b.hidden=!unlocked;});for(const b of document.querySelectorAll('[data-camp-tab]'))b.setAttribute('aria-selected',String(b.dataset.campTab===tab));
  const p=getProgress();avatar.set(p,tab==='loadout');$('camp-forge').hidden=tab!=='forge';$('camp-loadout').hidden=tab!=='loadout';$('camp-records').hidden=tab!=='records';$('camp-ranking').hidden=tab!=='ranking';
  if(tab==='forge'){
   $('appraise-cache').disabled=busy||!canChange()||!p.caches.length||p.inventory.length>=INVENTORY_LIMIT;$('appraise-cache').textContent='持ち帰った遺物を鑑定 · '+p.caches.length+'個';
   $('buy-relic').disabled=busy||!canChange()||balance(p)<DRAW_COST||p.inventory.length>=INVENTORY_LIMIT;$('buy-relic').textContent=money(DRAW_COST)+' で遺物くじを引く';
   $('buy-ten').disabled=busy||!canChange()||balance(p)<DRAW_COST*10||p.inventory.length+10>INVENTORY_LIMIT;$('buy-ten').textContent='10連 · '+money(DRAW_COST*10);
   $('pity-info').textContent='特級以上が出るまで、あと最大 '+(10-p.pity)+'回';
   $('odds-info').textContent=p.pity>=9?'今回の排出率：特級90%・伝説10%':'通常60%・希少28%・特級10%・伝説2%';
   $('cache-info').textContent=p.caches.length?'次の遺物：'+(p.caches[0].minTier?(p.caches[0].forcedType!==undefined?RELICS[p.caches[0].forcedType].name:'突破・撃破報酬')+' / '+RARITIES[p.caches[0].minTier].ja+(p.caches[0].minTier===3?'確定':'以上確定'):['通常鉱脈（伝説2%）','希少鉱脈（伝説4%）','深層鉱脈（伝説10%）'][p.caches[0].quality]):'壁の鉱脈・高位の宝・敵の撃破から発見できます。生還して持ち帰りましょう。';
  }
  if(tab==='loadout'){
   const bestTier=Math.max(0,...p.equipped.map(id=>p.inventory.find(i=>i.id===id)?.tier??0));$('avatar-rarity').textContent=RARITIES[bestTier].name;$('avatar-rarity').style.color=RARITIES[bestTier].color;const stats=loadoutStats(p);$('loadout-stats').textContent='HP '+stats.maxHp+' · MP '+stats.maxMp+' · 魔法 ×'+stats.spellMultiplier+' / 魔力 +'+stats.power+' · 防御 '+stats.armor+' · 移動 ×'+stats.moveSpeed+(stats.warpImmune?' · 転位無効':'');
   $('equipped-slots').innerHTML=SLOTS.map((s,index)=>{const i=p.inventory.find(v=>v.id===p.equipped[index]);return`<button data-slot="${index}" class="slot-button ${slot===index?'selected':''}"><span>${s}</span><strong>${i?RELICS[i.type].name:'未装備'}</strong></button>`;}).join('');
   const all=p.inventory.filter(i=>RELICS[i.type].slot===slot).sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)||relicPower(b)-relicPower(a)),items=favoritesOnly?all.filter(i=>i.favorite):all,current=p.inventory.find(i=>i.id===p.equipped[slot]),pages=Math.max(1,Math.ceil(items.length/pageSize));page=Math.min(page,pages-1);const visible=items.slice(page*pageSize,(page+1)*pageSize);
   $('favorite-filter').textContent=favoritesOnly?'★ お気に入りのみ':'☆ お気に入りで絞る';$('favorite-filter').setAttribute('aria-pressed',String(favoritesOnly));$('inventory-page').innerHTML=`<button data-page="prev" ${page===0?'disabled':''}>‹</button><span>${page+1} / ${pages} · ${items.length}点</span><button data-page="next" ${page>=pages-1?'disabled':''}>›</button>`;
   $('inventory-message').textContent=favoritesOnly&&!items.length?'この枠にお気に入りはありません。':'★を付けた装備は、売却ボタンがロックされます。';
   $('inventory-list').innerHTML=visible.length?visible.map(i=>`<article class="inventory-item ${i.favorite?'favorite':''}"><button class="favorite-button" data-favorite="${safe(i.id)}" aria-label="${i.favorite?'お気に入りから外す':'お気に入りにして売却を防ぐ'}" aria-pressed="${!!i.favorite}">${i.favorite?'★':'☆'}</button>${card(i)}<div class="item-actions"><button data-equip="${safe(i.id)}" ${current===i?'disabled':''}>${current===i?'装備中':current?'装備する · 評価 '+(relicPower(i)-relicPower(current)>=0?'+':'')+(relicPower(i)-relicPower(current)):'装備する'}</button><button data-sell="${safe(i.id)}" ${current===i||i.favorite?'disabled':''}>${i.favorite?'★ 保護中':'売却 '+money(salvageValue(i))}</button></div></article>`).join(''):'<p class="empty-note">この条件の装備はまだありません。</p>';
   $('catalog-count').textContent='発見図鑑 '+p.catalog.length+' / '+CATALOG_SIZE;$('catalog-list').innerHTML=RELICS.map((r,i)=>`<div><span>${r.name}</span><span>${RARITIES.filter((_,n)=>!r.exclusive||n===3).map(t=>{const n=RARITIES.indexOf(t);return `<b style="color:${p.catalog.includes(i*4+n)?t.color:'#405353'}" title="${t.ja}">${p.catalog.includes(i*4+n)?'◆':'◇'}</b>`;}).join(' ')}</span></div>`).join('');
  }
  if(tab==='records'){
   const daily=dailyChallenge(),best=p.dailyBests.find(b=>b.day===daily.day&&b.rules===8);
   $('record-summary').innerHTML=`<div><span>最高試練</span><strong>Lv ${p.bestTrial}</strong></div><div><span>技量評価</span><strong>${p.bestSkill.toLocaleString()}</strong></div><div><span>累計撃破</span><strong>${p.totalKills}</strong></div><div><span>生還率</span><strong>${p.escapes+p.busts?Math.round(p.escapes/(p.escapes+p.busts)*100):0}%</strong></div>`;
   $('difficulty-records').innerHTML='<p class="subtle">設計上の目標と、あなたの実測クリア率。今回の更新以降の挑戦を集計します。途中帰還や中断も挑戦に含まれます。</p>'+DIFFICULTIES.map(d=>{const m=p.difficultyStats?.[d.key];return '<div class="difficulty-row"><span class="difficulty-chip '+d.key+'">'+d.name+'</span><span>目標 '+d.target+'</span><strong>'+(m?.attempts?Math.round(m.clears/m.attempts*100)+'%':'—')+'</strong><small>'+(m?.clears||0)+' / '+(m?.attempts||0)+' 突破</small></div>';}).join('');
   $('daily-record').textContent=progressLabel(p,daily,best);
   $('history-list').innerHTML=p.history.length?p.history.map(h=>`<div class="history-row"><div><strong>${h.score.toLocaleString()}<small>点</small></strong><span>${h.mode==='daily'?'日替わり':h.floor===8?'試練Lv'+(h.trialLevel||1):h.floor+'面'} · ${h.cleared?'突破':h.success?'途中帰還':'LOST'}</span></div><div><strong>${h.kills} 撃破</strong><span>${h.time.toFixed(2)}秒 · ${h.rules===8?'連戦'+(h.maxHuntChain||0)+' / 反撃'+(h.counterHits||0):'旧方式'}</span></div></div>`).join(''):'<p class="empty-note">最初の探索が、あなたの記録になります。</p>';
  }
 }
 function open(next='forge'){tab=next==='forge'&&getProgress().floor<4?'loadout':next;render();openDialog('camp-dialog');if(tab==='ranking')rankings?.show();}
 function detail(){if(!last)return;$('draw-detail').innerHTML=card(last)+'<button class="secondary" id="equip-new">この装備を使う</button>';}
 function drawGrid(opened=results.length){return '<div class="draw-grid">'+results.map((r,i)=>i<opened?`<button class="draw-card grade-${r.item.tier}" data-preview="${safe(r.item.id)}" style="--relic:${RARITIES[r.item.tier].color};--i:0"><span>${RARITIES[r.item.tier].name}${r.isNew?' · NEW':''}</span><b>◇</b><strong>${RELICS[r.item.type].name}</strong><small>装備評価 ${relicPower(r.item)}</small></button>`:`<div class="draw-card sealed-card"><span>${String(i+1).padStart(2,'0')}</span><b>◇</b><small>未開封</small></div>`).join('')+'</div>';}
 function finishReveal(silent=false){if(!busy)return;if(sequence&&!sequence.done){sequence.finish(silent);return;}busy=false;
  $('camp-dialog').classList.remove('drawing');$('appraisal-result').innerHTML=(results.length===10?'<div class="draw-summary">10 RELICS REVEALED <span>特級以上 '+results.filter(r=>r.item.tier>=2).length+'個</span></div>'+drawGrid():results[0].isNew?'<p class="new-discovery">NEW DISCOVERY · 図鑑に追加</p>':'')+'<div id="draw-detail"></div>';
  last=results.slice().sort((a,b)=>b.item.tier-a.item.tier||relicPower(b.item)-relicPower(a.item))[0].item;detail();$('appraise-save').textContent=saveMessage;render();
 }
 function showReveal(e){
  if(e.phase==='complete'){finishReveal(e.silent);return;}const total=results.length;
  if(e.phase==='gather'||e.phase==='sealed'){
   $('appraisal-result').innerHTML=`<div id="ritual-stage" class="ritual ritual-v7" data-phase="${e.phase}"><div class="ceremony-sky"><i></i><i></i><i></i></div><div class="ceremony-gate"><span></span><b>◇</b><span></span></div><div class="ritual-fragments">${Array.from({length:24},(_,i)=>`<i style="--n:${i}"></i>`).join('')}</div><span class="ritual-kicker">${e.phase==='gather'?'RELIC SIGNAL DETECTED':String(e.index+1).padStart(2,'0')+' / '+String(total).padStart(2,'0')}</span><strong id="ritual-promise">${e.phase==='gather'?'光脈を接続する。':'封印を、ひとつずつ解く。'}</strong><div id="rarity-curtain" aria-live="assertive"></div><div id="ritual-item"></div><button id="skip-reveal" class="text-button">演出をスキップして全結果へ</button></div>`+(total===10?drawGrid(Math.max(0,e.index)):'');
   if(e.phase==='gather')sound.note(98,.8,.10);else sound.note(146.83,.45,.06);return;
  }
  const stage=$('ritual-stage');stage.dataset.phase=e.phase;
  if(e.phase==='charge'){sound.prelude?.(2);$('ritual-promise').textContent='色が変わった。封印が軋む。';}
  if(e.phase==='silence'){sound.duckUntil=(sound.context?.currentTime||0)+3.2;$('ritual-promise').textContent='……';}
  if(e.phase==='promise'){stage.style.setProperty('--relic',RARITIES[e.tier].color);stage.classList.add('grade-'+e.tier);$('ritual-promise').textContent=e.tier===3?'金の扉が開く。':'紫の星が満ちる。';$('rarity-curtain').innerHTML='<span>RARITY CONFIRMED</span><b>'+(e.tier===3?'伝 説':'特 級 以 上')+'</b><small>'+RARITIES[e.tier].name+'</small>';sound.note(e.tier===3?55:110,1.1,.16);sound.haptic(2);}
  if(e.phase==='burst'){stage.style.setProperty('--relic',RARITIES[e.tier].color);stage.classList.add('grade-'+e.tier);$('ritual-promise').textContent=RARITIES[e.tier].name;$('rarity-curtain').innerHTML='';$('ritual-item').innerHTML='<span class="reveal-rarity">'+RARITIES[e.tier].ja+' · '+RARITIES[e.tier].name+'</span><span class="reveal-item-name">'+RELICS[e.result.item.type].name+'</span><strong>'+relicPower(e.result.item)+'</strong><small>装備評価 · 個体品質 '+relicQuality(e.result.item)+(e.result.isNew?' · NEW DISCOVERY':'')+'</small>';if(e.tier===3)sound.legendary();else sound.chime(e.tier);sound.haptic(e.tier>=2?3:1);}
 }
 function roll(cache,count=1){if(busy||!canChange())return;const p=getProgress(),seeds=Array.from(crypto.getRandomValues(new Uint32Array(count))),result=count===10?appraisalBatch(p,seeds):appraisal(p,seeds[0],{cache});if(result.error){$('appraisal-result').textContent=result.error;return;}
  results=result.results||[result];last=results[0].item;busy=true;saveMessage='結果を保存しています…';$('appraise-save').textContent=saveMessage;$('camp-dialog').classList.add('drawing');
  Promise.resolve(changed()).then(ok=>{saveMessage=ok===false?'保存待ち · 結果を保持して再送します':'抽選結果を保存しました';$('appraise-save').textContent=saveMessage;}).catch(()=>{$('appraise-save').textContent='保存待ち · 結果を保持しています';});
  sound.start();sequence=new RevealSequence(results,showReveal);render();sequence.start();$('appraisal-result').scrollIntoView?.({block:'start',behavior:'auto'});
 }
 document.querySelectorAll('[data-camp-tab]').forEach(b=>b.addEventListener('click',()=>{if(busy)return;tab=b.dataset.campTab;render();if(tab==='ranking')rankings?.show();}));
 $('appraise-cache').addEventListener('click',()=>roll(true));$('buy-relic').addEventListener('click',()=>roll(false));$('buy-ten').addEventListener('click',()=>roll(false,10));$('camp-dialog').addEventListener('close',()=>{finishReveal(true);avatar.close();});
 $('camp-dialog').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const p=getProgress();if(b.id==='skip-reveal'){finishReveal();return;}if(b.dataset.preview){last=p.inventory.find(i=>i.id===b.dataset.preview);detail();return;}if(!canChange())return;
  if(b.dataset.slot!==undefined){slot=Number(b.dataset.slot);page=0;render();}
  if(b.id==='favorite-filter'){favoritesOnly=!favoritesOnly;page=0;render();}
  if(b.dataset.page){page=Math.max(0,page+(b.dataset.page==='next'?1:-1));render();}
  if(b.dataset.favorite){const i=p.inventory.find(i=>i.id===b.dataset.favorite);if(!i)return;toggleFavorite(i);changed();sound.chime(i.favorite?1:0);render();}
  if(b.dataset.equip||b.id==='equip-new'){const i=p.inventory.find(i=>i.id===(b.dataset.equip||last?.id));if(!i)return;p.equipped[RELICS[i.type].slot]=i.id;changed();sound.chime(0);if(b.id==='equip-new')tab='loadout';render();if(b.id==='equip-new'){b.textContent='装備しました';b.disabled=true;}}
  if(b.dataset.sell){const result=sellRelic(p,b.dataset.sell);if(result.error){$('inventory-message').textContent=result.error;return;}changed();render();}
 });
 return{open,render};
}
