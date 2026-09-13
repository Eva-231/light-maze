import assert from 'node:assert/strict';
import * as core from './public/core.js';
import {enemyPlan,updateEnemies,castSpell,flashEnemies,hurtEnemy,spellCost,SPELLS} from './public/enemies.js';
import {expeditionPlan,advanceTraps} from './public/expedition.js';
import {rollRelic,rarityOdds,loadoutStats,appraisal,affixValue,dailyChallenge,calculateScore,DRAW_COST,INVENTORY_LIMIT,toggleFavorite,sellRelic,salvageValue} from './public/relics.js';
import {newProgress,migrateProgress,balance} from './public/save.js';
import {validProgress} from './src/worker.js';
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS',name);};
test('Magic kills permanently, rewards are emitted once, and aimed shots and missed shots both spend MP',()=>{
 core.generateStage(17,4);const stats=loadoutStats(newProgress()),e={...enemyPlan()[0],kind:0,hp:44,maxHp:44},p={x:e.x,z:e.z+2,yaw:0,pitch:0,light:100,count:0,seals:0,hp:45,mp:60};
 const first=castSpell(0,[e],p,stats,()=>1);assert(first.ok);assert.equal(e.hp,e.maxHp-28);assert.equal(p.mp,54);e.stun=1;
 const second=castSpell(0,[e],p,stats,()=>1);assert.equal(second.events[0].type,'killed');assert.equal(e.hp,0);assert(e.dead);
 assert.equal(updateEnemies([e],p,1).events.length,0);assert.equal(flashEnemies([e],p),0);assert.equal(hurtEnemy(e,999).type,'ignored');const shot=castSpell(0,[e],p,stats);assert(shot.ok&&shot.miss);const before=p.mp;
 assert(castSpell(2,[],p,stats).ok);assert.equal(p.hp,75);assert.equal(p.mp,before-20);p.mp=0;assert(!castSpell(2,[],p,stats).ok);assert.equal(p.hp,75);assert.equal(SPELLS[1].cooldown,0);assert.equal(SPELLS[2].cooldown,0);
});
test('Wall occlusion, frost nova crowd control, weak-point timing and recovery produce distinct tactical choices',()=>{
 core.generateStage(17,4);const stats=loadoutStats(newProgress()),e={...enemyPlan()[0],kind:0,hp:44,maxHp:44},p={x:e.x,z:e.z+3,yaw:0,pitch:0,light:100,count:0,seals:0,hp:95,mp:60};
 e.hp=e.maxHp=200;e.windup=.5;let r=castSpell(0,[e],p,stats,()=>1);assert.equal(r.events[0].damage,42);e.stun=0;e.windup=0;
 const nearby={...e,id:999,x:p.x+2,z:p.z,hp:200,maxHp:200,stun:0,windup:0,recovery:0,dead:false,escaped:false};r=castSpell(1,[e,nearby],p,stats,()=>1);assert.equal(r.events.length,2);assert.equal(r.events[0].damage,26);assert.equal(e.stun,3.2);assert.equal(nearby.stun,3.2);assert.equal(r.area,14);
 let occluded=null;outer:for(const j of core.cells){p.x=j%core.W*core.S;p.z=Math.floor(j/core.W)*core.S;for(const i of core.cells){const x=i%core.W*core.S,z=Math.floor(i/core.W)*core.S;if(Math.hypot(x-p.x,z-p.z)<11&&!core.lineOfSight(x,z,p.x,p.z)){occluded={...e,x,z};break outer;}}}assert(occluded);const before=p.mp;assert(castSpell(0,[occluded],p,stats).miss);assert.equal(p.mp,before-6);
 p.mp=60;r=castSpell(2,[],p,stats);assert.equal(r.heal,5);assert.equal(p.hp,100);const m=p.mp;assert(!castSpell(2,[],p,stats).ok);assert.equal(p.mp,m);
});
test('Veins, omens, supplies and traps are deterministic and reachable across 80 maps',()=>{
 const omens=new Set();for(let seed=1;seed<=80;seed++){core.generateStage(seed*7193,1+seed%8);const exp=expeditionPlan();assert.deepEqual(exp,expeditionPlan());omens.add(exp.omen.name);assert(core.stageInfo.config.mine?exp.veins.length<=2:exp.veins.length===0);assert(core.stageInfo.config.traps?exp.traps.length>0:exp.traps.length===0);if(!core.stageInfo.config.omens)assert.equal(exp.omen.name,'静かな迷宮');
  for(const v of exp.veins){const x=v.x-v.dx*1.4,z=v.z-v.dz*1.4;assert(core.canStand(x,z));assert(core.lineOfSight(x,z,v.x,v.z));assert(core.distances[core.indexAt(x,z)]>10);assert(v.rewards.at(-1).cache);assert(v.quality<=2);}
  for(const a of exp.supplies)assert(core.canStand(a.x,a.z));for(const t of exp.traps)assert(core.distances[core.indexAt(t.x,t.z)]>15);
 }assert.equal(omens.size,5);
});
test('Trap windup can be evaded and a triggered trap cannot damage repeatedly',()=>{
 const t={x:0,z:0,timer:-1,spent:false},p={x:0,z:0};let r=advanceTraps([t],p,.1);assert.equal(r[0].type,'armed');assert.equal(t.timer,.9);p.x=3;r=advanceTraps([t],p,1);assert.equal(r[0].type,'burst');assert.equal(r[0].hit,false);assert.equal(advanceTraps([t],{x:0,z:0},1).length,0);
});
test('Relic rates match the visible odds and the tenth-draw guarantee excludes low tiers',()=>{
 const counts=[0,0,0,0];for(let seed=0;seed<20000;seed++){const a=rollRelic(seed,0,0);counts[a.tier]++;assert.deepEqual(a,rollRelic(seed,0,0));assert(a.a!==a.b);assert(a.rollA>=1&&a.rollA<=100);assert(a.rollB>=1&&a.rollB<=100);assert(affixValue(a)>0);assert(rollRelic(seed,0,9).tier>=2);}
 counts.forEach((n,i)=>assert(Math.abs(n/20000-rarityOdds()[i])<.012));
 const p=newProgress();p.floor=4;p.totalBank=20000;for(let i=0;i<10;i++){const before=balance(p),previousPity=p.pity,r=appraisal(p,i);assert(r.item);assert.equal(balance(p),before-DRAW_COST);assert.equal(p.pity,r.item.tier>=2?0:previousPity+1);assert(validProgress(p));}
 const before=balance(p);p.caches.push({seed:9828,quality:2});const r=appraisal(p,47,{cache:true});assert.deepEqual(r.item,rollRelic(9828,2,0,{unlocked:4}));assert.equal(balance(p),before);assert.equal(p.caches.length,0);assert(validProgress(p));
});
test('Recovered caches may overflow storage temporarily while paid draws still require room',()=>{
 const p=newProgress();const original=structuredClone(p);assert(appraisal(p,1).error);assert.deepEqual(p,original);p.floor=4;p.totalBank=1000000;p.inventory=Array.from({length:INVENTORY_LIMIT},(_,i)=>rollRelic(i));p.caches=[{seed:4,quality:2}];const result=appraisal(p,8,{cache:true});assert(result.item);assert.equal(p.inventory.length,INVENTORY_LIMIT+1);assert.equal(p.caches.length,0);assert(appraisal(p,9).error);assert(validProgress(p));
});
test('A one-tap favorite is persisted and blocks selling until explicitly removed',()=>{
 const p=newProgress(),item=rollRelic(918);p.inventory.push(item);const bank=p.totalBank;assert(toggleFavorite(item));assert.equal(sellRelic(p,item.id).error,'お気に入りの装備は売却できません。★を外してください。');assert.equal(p.inventory.length,1);assert.equal(p.totalBank,bank);assert(!toggleFavorite(item));const sold=sellRelic(p,item.id);assert.equal(sold.value,salvageValue(item));assert.equal(p.inventory.length,0);assert.equal(p.totalBank,bank+sold.value);
});
test('Loadouts are bounded; daily challenges ignore all equipment and upgrades',()=>{
 const p=newProgress();p.totalBank=100000;p.level=9;p.inventory=[{...rollRelic(1),type:0,a:0,b:1,rollA:100,rollB:100,tier:3},{...rollRelic(2),type:4,a:0,b:1,rollA:100,rollB:100,tier:3},{...rollRelic(3),type:8,a:0,b:1,rollA:100,rollB:100,tier:3}];p.equipped=p.inventory.map(i=>i.id);const s=loadoutStats(p);assert(s.maxHp<=240&&s.maxMp<=160&&s.power<=70&&s.armor<=22&&s.economy<=.32);assert(s.power>0);assert.deepEqual(loadoutStats(p,true),loadoutStats(newProgress()));assert(validProgress(p));
 const before=dailyChallenge(new Date('2026-09-11T14:59:59Z')),after=dailyChallenge(new Date('2026-09-11T15:00:00Z'));assert.equal(before.day,'2026-09-11');assert.equal(after.day,'2026-09-12');assert.notEqual(before.seed,after.seed);assert.equal(before.seed,dailyChallenge(new Date('2026-09-11T01:00:00Z')).seed);
});
test('Scores show actual achievements and failure cannot bank a successful-run score',()=>{
 const run={bag:4200,kills:4,caches:[{},{}],floor:2,elapsed:230,hp:18,light:4};const success=calculateScore(run,45,true,true),lost=calculateScore(run,45,false,false);assert.equal(success.score,Object.values(success.parts).reduce((a,b)=>a+b));assert.equal(lost.score,Math.floor(Object.values(lost.parts).reduce((a,b)=>a+b)*.25));assert(success.score>lost.score);assert(success.parts.突破>0);assert.equal(lost.parts.突破,0);
});
test('New save schema retains old earnings and rejects malformed equipment, overspending and bad history',()=>{
 const old={...newProgress(),format:2,totalBank:5000,level:2};delete old.inventory;const p=migrateProgress(old);assert(validProgress(p));assert.equal(balance(p),2250);assert.equal(validProgress({...p,forgeSpent:2251}),false);assert.equal(validProgress({...p,inventory:[{...rollRelic(1),type:100}]}),false);assert.equal(validProgress({...p,equipped:['missing','','']}),false);assert.equal(validProgress({...p,history:[{score:100}]}),false);assert.equal(validProgress({...p,pity:10}),false);
});
console.log(`${passed} combat, loot, and progression checks passed.`);
