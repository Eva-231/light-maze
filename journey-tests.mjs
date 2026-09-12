import assert from 'node:assert/strict';
import * as c from './public/core.js';
import {ENEMY_TYPES,enemyPlan,sealUnlocked,updateEnemies,castSpell,hurtEnemy,warpDestination,enemyDrops} from './public/enemies.js';
import {CHAPTERS,advanceJourney,skillRating,betterDaily} from './public/journey.js';
import {loadoutStats,rollRelic,appraisal,claimMilestoneGifts,INVENTORY_LIMIT} from './public/relics.js';
import {newProgress} from './public/save.js';
import {validProgress} from './src/worker.js';
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS',name);};
const stats=loadoutStats(newProgress());
function arena(kind){c.generateStage(1729,7);const e=enemyPlan().find(e=>e.guardSeal===0),r=c.rooms[e.homeRoom];Object.assign(e,{kind,x:r.x*c.S,z:r.z*c.S,hp:300,maxHp:300});return{e,p:{x:e.x,z:e.z+3,yaw:Math.PI,pitch:0,light:100,hp:100,mp:60,seals:0,count:0,runMode:'daily',explored:new Set(c.cells)}};}
const aim=(p,e)=>p.yaw=Math.atan2(-(e.x-p.x),-(e.z-p.z));
test('Seven chapters introduce mechanics gradually; every combat seal requires its own living guardian to be defeated',()=>{
 for(let floor=1;floor<=8;floor++){c.generateStage(1349,floor);const enemies=enemyPlan(),config=c.stageInfo.config;assert.equal(c.rooms.length,config.cols*config.rows+1);assert.equal(c.orbPlan().length,floor<=2?3:5);
  for(const seal of c.stageInfo.relics){if(floor===1){assert(sealUnlocked(seal,enemies));continue;}assert(!sealUnlocked(seal,enemies));const guard=enemies.find(e=>e.id===seal.guardId);assert(guard);guard.escaped=true;assert(!sealUnlocked(seal,enemies));guard.escaped=false;hurtEnemy(guard,99999);assert(sealUnlocked(seal,enemies));}
  assert.equal(config.spells.includes(0),floor>=2);assert.equal(config.spells.includes(2),floor>=3);assert.equal(config.spells.includes(1),floor>=4);assert.equal(config.traps,floor>=5);assert.equal(config.collapse,floor>=6);
 }c.generateStage(13,1);assert(!castSpell(0,[],{mp:60},stats).ok);assert.equal(enemyPlan().length,0);assert(c.treasurePlan().every(t=>t.tier===0));
});
test('A wolf telegraphs a fixed charge line; sidestepping avoids damage and exposes a recovery window',()=>{
 const {e,p}=arena(1);p.z=e.z+4;let events=updateEnemies([e],p,.02).events;assert(events.some(a=>a.type==='windup'));const direction=e.attackYaw;p.x+=3;events=[];
 for(let i=0;i<60;i++){events.push(...updateEnemies([e],p,.035).events);assert(c.canStand(e.x,e.z));if(e.charge>0)assert.equal(e.attackYaw,direction);}
 assert(!events.some(a=>a.type==='hit'));assert(events.some(a=>a.type==='dodged'));assert(e.recovery>0);
});
test('Brutes deal heavier area damage and properly timed shots penetrate their armor',()=>{
 const {e,p}=arena(2);p.z=e.z+1;const wind=updateEnemies([e],p,.02).events;assert(wind.some(a=>a.type==='windup'));const impact=updateEnemies([e],p,1.15).events;assert(impact.some(a=>a.type==='hit'&&a.damage>=30));aim(p,e);const weak=castSpell(0,[e],p,stats,()=>1);assert(weak.events[0].weak);e.stun=0;e.recovery=0;e.windup=0;const armored=castSpell(0,[e],p,stats,()=>1);assert(weak.events[0].damage>armored.events[0].damage*2);
});
test('Warp spells have three counters: aimed interruption, cover, and anchor armor; destinations stay in visited walkable cells',()=>{
 let {e,p}=arena(3);updateEnemies([e],p,.02);assert(e.windup>0);aim(p,e);const interrupted=castSpell(0,[e],p,stats,()=>1);assert(interrupted.events[0].interrupted);assert.equal(e.windup,0);assert(e.stun>0);
 ({e,p}=arena(3));updateEnemies([e],p,.02);const hidden=c.cells.find(i=>!c.lineOfSight(e.x,e.z,i%c.W*c.S,Math.floor(i/c.W)*c.S));assert(hidden!==undefined);p.x=hidden%c.W*c.S;p.z=Math.floor(hidden/c.W)*c.S;assert(updateEnemies([e],p,.05).events.some(a=>a.type==='dodged'&&a.cover));assert.equal(e.windup,0);
 ({e,p}=arena(3));p.warpImmune=true;updateEnemies([e],p,.02);let result=updateEnemies([e],p,1.7);assert(result.events.some(a=>a.type==='warpBlocked'));assert(!result.events.some(a=>a.type==='warp'));
 ({e,p}=arena(3));const d=warpDestination(e,p);assert(d);assert(c.canStand(d.x,d.z));assert(p.explored.has(c.indexAt(d.x,d.z)));const steps=c.shortestPath(c.indexAt(p.x,p.z),c.indexAt(d.x,d.z)).length-1;assert(steps>=4&&steps<=7);p.explored=new Set([c.indexAt(p.x,p.z)]);assert.equal(warpDestination(e,p),null);p.explored=new Set(c.cells);p.canOccupy=()=>false;assert.equal(warpDestination(e,p),null);
});
test('Silver enemies flee on connected paths, freezing stops their escape timer, and an escaped enemy cannot be killed',()=>{
 const {e,p}=arena(4);assert(updateEnemies([e],p,.02).events.some(a=>a.type==='silver'));assert(e.fleeTime>11);aim(p,e);const freeze=castSpell(1,[e],p,stats,()=>1);assert(freeze.ok&&freeze.events[0].affinity&&freeze.events[0].damage>=38&&e.stun>4);const timer=e.fleeTime;updateEnemies([e],p,.5);assert.equal(e.fleeTime,timer);e.stun=0;p.yaw=Math.PI;
 for(let i=0;i<500&&!e.escaped;i++){updateEnemies([e],p,.04);assert(c.canStand(e.x,e.z));}assert(e.escaped);assert.equal(hurtEnemy(e,999).type,'ignored');
});
test('Enemy loot has a measured 5% rare rate; silver loot is guaranteed, visible, and preserves its equipment through appraisal',()=>{
 const {e}=arena(3);e.dead=true;let rares=0;for(let seed=0;seed<10000;seed++){const drops=enemyDrops(e,seed);assert(drops[0].light===12&&drops[0].mp===10);for(const d of drops){assert(!d.collected);assert.equal(d.age,0);assert(c.canStand(d.x,d.z));}const rare=drops.find(d=>d.rare);if(rare){rares++;assert.equal(rare.forcedType,13);assert.equal(rare.minTier,2);}}
 assert(Math.abs(rares/10000-.05)<.008,rares+' / 10000');e.kind=4;for(let seed=0;seed<100;seed++){const rare=enemyDrops(e,seed).find(d=>d.rare);assert(rare);const p=newProgress();p.floor=8;p.caches.push({seed:rare.seed,quality:rare.quality,forcedType:rare.forcedType,minTier:rare.minTier});const item=appraisal(p,0,{cache:true}).item;assert.equal(item.type,16);assert(item.tier>=2);assert(validProgress(p));}
});
test('Armor changes movement, displacement immunity, or slam resistance without carrying those advantages into daily runs',()=>{
 for(const [type,key,value]of [[12,'moveSpeed',1.1],[13,'warpImmune',true],[14,'slamResist',.35],[15,'weakBonus',1.2],[16,'boltCooldown',.85],[17,'lightRecovery',1.25]]){const p=newProgress();p.floor=8;const item=rollRelic(321,0,0,{forcedType:type});p.inventory.push(item);p.equipped[type===15||type===16?0:type===17?2:1]=item.id;assert.equal(loadoutStats(p)[key],value);assert.deepEqual(loadoutStats(p,true),stats);assert(validProgress(p));}
 assert.equal(c.SPEED,4.2);
});
test('Chapter stars, deferred one-time gifts, and trial advancement survive replays and inventory pressure',()=>{
 const p=newProgress(),run={floor:1,runMode:'normal',elapsed:40,parTime:60,damageTaken:0};assert(!advanceJourney(p,run,false).first);assert.equal(p.floor,1);assert(advanceJourney(p,run,true).first);assert.equal(p.floor,2);assert.equal(p.chapterStars['1'],3);assert.equal(claimMilestoneGifts(p).length,1);assert.equal(claimMilestoneGifts(p).length,0);assert(!advanceJourney(p,run,true).first);
 p.inventory=Array.from({length:INVENTORY_LIMIT},(_,i)=>rollRelic(i+100));p.equipped=['','',''];advanceJourney(p,{...run,floor:2},true);assert.equal(claimMilestoneGifts(p).length,0);p.inventory.pop();assert.equal(claimMilestoneGifts(p)[0].type,12);assert(p.claimedGifts.includes(2));assert(validProgress(p));
 p.floor=8;advanceJourney(p,{...run,floor:8,trialLevel:5},true);assert.equal(p.bestTrial,5);assert.equal(p.trialLevel,6);const snapshot=structuredClone(p);advanceJourney(p,{...run,floor:8,trialLevel:6,runMode:'daily'},true);assert.deepEqual(p,snapshot);assert(validProgress(p));
});
test('Daily ranking favors successful faster extraction; skill score excludes random treasure and rewards aim, dodges, and interruption',()=>{
 const run={elapsed:100,parTime:120,damageTaken:0,shots:10,hits:8,dodges:3,interrupts:2,weakHits:4,bag:500};const score=skillRating(run,true);assert.equal(score.score,Object.values(score.parts).reduce((a,b)=>a+b,0));assert.deepEqual(skillRating({...run,bag:999999,caches:Array(50)},true),score);assert(skillRating({...run,hits:10},true).score>score.score);assert(score.score>skillRating({...run,damageTaken:40,dodges:0,interrupts:0},true).score);
 const best={rules:8,cleared:true,time:100,score:9000};assert(!betterDaily({...best,time:101,score:99999},best));assert(betterDaily({...best,time:99,score:1},best));assert(!betterDaily({...best,cleared:false,time:1,score:99999},best));
});
console.log(`${passed} chapter, enemy counterplay, armor, drop, and challenge checks passed.`);
