import {RELICS,RARITIES,relicDescription} from './relics.js';
import {POWERS,SYNERGIES,composePowers,awakened} from './abyss-gear.js';
import {ENEMY_TYPES} from './enemies.js';
import {MUTATIONS} from './abyss-rules.js';
import {TRAP_TYPES} from './expedition.js';
export const CODEX_CATEGORIES={equipment:'装備',effects:'特殊効果',synergies:'シナジー',enemies:'敵',mutations:'敵変異',traps:'罠',excavations:'発掘物'};
export function discover(progress,category,id){progress.codex??={};progress.codex[category]??=[];if(progress.codex[category].includes(id))return false;progress.codex[category].push(id);return true;}
export function discoverLoadout(progress){const fresh=[];for(const item of progress.inventory||[]){discover(progress,'equipment',item.type);const d=RELICS[item.type];for(const k of [...(d.powers||[]),...(item.extraPowers||[])])discover(progress,'effects',k);if(item.evolved)discover(progress,'evolutions',d.key);}
 const items=(progress.equipped||[]).map(id=>progress.inventory.find(i=>i.id===id)).filter(Boolean),powers=composePowers(items,RELICS).powers;
 for(const s of awakened(powers))if(discover(progress,'synergies',s.key))fresh.push(s);return fresh;
}
export function synergyStatus(progress){const items=(progress.equipped||[]).map(id=>progress.inventory.find(i=>i.id===id)).filter(Boolean),powers=composePowers(items,RELICS).powers;return SYNERGIES.map(s=>({...s,count:s.requires.filter(k=>powers.includes(k)).length,known:!s.hidden||progress.codex?.synergies?.includes(s.key),parts:s.requires.map(k=>({key:k,name:POWERS.find(p=>p.key===k)?.name||k,equipped:powers.includes(k)}))}));}
export function codexEntries(progress,category){const seen=progress.codex?.[category]||[];
 if(category==='synergies')return synergyStatus(progress).map(s=>({id:s.key,name:s.known?s.name:'未知の共鳴',found:s.known||s.count>0,effect:s.count+'/3 · '+(s.known?s.parts.map(p=>p.name+(p.equipped?' ✓':' ×')).join(' / '):'初めて覚醒すると条件を公開'),detail:s.known?s.effect:'???'}));
 let rows=[];if(category==='equipment')rows=RELICS.map((r,i)=>({id:i,name:r.name,effect:r.effect,min:r.minFloor?('深淵 '+r.minFloor+'F〜'):r.exclusive?'本編7面以降':'本編・通常鑑定',detail:r.mythic?'MYTHIC · 付加性能最大100・強化+5':r.abyss?'深度補正 最大20・付加性能100・強化+5':'LEGEND · 付加性能最大100・強化+5',tier:r.mythic?5:r.abyss?4:3}));
 if(category==='effects')rows=POWERS.map(p=>({...p,id:p.key,min:'深淵 '+p.minFloor+'F〜'}));if(category==='enemies')rows=ENEMY_TYPES.map((e,i)=>({id:i,name:e.name,effect:e.hint,min:'本編 / 深淵',detail:'Lv1〜10 · Lv3/5/7/10で強化'}));
 if(category==='mutations')rows=MUTATIONS.map(m=>({...m,min:'敵Lv'+m.min+'以上'}));if(category==='traps')rows=TRAP_TYPES.map(t=>({...t,id:t.key,effect:t.hint,min:'本編5面以降 / 深淵'}));
 if(category==='excavations')rows=[{id:0,name:'微かな鉱脈',effect:'持ち帰って鑑定する遺物。通常の伝説率1%'},{id:1,name:'紫の鉱脈',effect:'希少・特級を探す。伝説率1%'},{id:2,name:'深層の金脈',effect:'深淵10/30/50/70/90Fで品質が段階的に上昇'}];
 return rows.map(r=>({...r,found:seen.includes(r.id)}));
}
export function createCodex({getProgress,openDialog}){const $=id=>document.getElementById(id);let tab='equipment';function render(){const p=getProgress();discoverLoadout(p);$('codex-summary').textContent=Object.entries(CODEX_CATEGORIES).map(([k,name])=>{const entries=codexEntries(p,k);return name+' '+entries.filter(e=>e.found).length+'/'+entries.length;}).join(' · ')+' · MYTHIC '+RELICS.filter((r,i)=>r.mythic&&p.codex.equipment.includes(i)).length+'/'+RELICS.filter(r=>r.mythic).length;
 $('codex-tabs').innerHTML=Object.entries(CODEX_CATEGORIES).map(([id,name])=>`<button data-codex-tab="${id}" aria-pressed="${tab===id}">${name}</button>`).join('');$('codex-list').innerHTML=codexEntries(p,tab).map(e=>`<article class="codex-entry ${e.found?'':'unknown'}"><h3><span class="codex-glyph" style="--gear-color:${RARITIES[e.tier||0]?.color}">${e.found?'✧':'◆'}</span>${e.found?e.name:'???'}</h3><p>${e.found?e.effect||'':''}</p><p>${e.found?[e.min,e.detail].filter(Boolean).join(' / '):'未発見'}</p></article>`).join('');}
 $('codex-open').addEventListener('click',()=>{render();openDialog('codex-dialog');});$('codex-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-codex-tab]');if(b){tab=b.dataset.codexTab;render();}});return{render};}
