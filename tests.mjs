import assert from 'node:assert/strict';
import * as c from './public/core.js';
import {enemyPlan,updateEnemies,flashEnemies,facing} from './public/enemies.js';
import {newProgress,migrateProgress,balance} from './public/save.js';
import worker,{validProgress} from './src/worker.js';
let passed=0;const test=async(name,fn)=>{await fn();passed++;console.log('PASS',name);};
await test('120 generated stages are distinct, connected and have reachable seals and loot',()=>{
 const layouts=new Set();for(let seed=1;seed<=120;seed++){c.generateStage(seed*7919,1+seed%8);layouts.add(Array.from(c.grid).join(','));assert(c.rooms.length>=5&&c.rooms.length<=17);assert.equal(c.stageInfo.relics.length,c.stageInfo.config.seals);assert.equal(new Set(c.stageInfo.relics.map(r=>r.room)).size,c.stageInfo.config.seals);for(const i of c.cells){assert(c.distances[i]>=0);if(i!==c.homeIndex)assert.equal(c.distances[c.nextHome[i]],c.distances[i]-1);}for(const item of [...c.treasurePlan(),...c.orbPlan(),...c.stageInfo.relics])assert(c.canStand(item.x,item.z));assert(c.stageInfo.optimalSteps>15);}
 assert.equal(layouts.size,120);c.generateStage(8921,1);const same=Array.from(c.grid);c.generateStage(8921,1);assert.deepEqual(Array.from(c.grid),same);
});
await test('Every corridor supports the player radius and the exit is reachable',()=>{
 for(let seed=1;seed<=24;seed++){c.generateStage(seed,1+seed%8);for(const i of c.cells){if(i===c.homeIndex)continue;const n=c.nextHome[i],x=i%c.W*c.S,z=Math.floor(i/c.W)*c.S,tx=n%c.W*c.S,tz=Math.floor(n/c.W)*c.S;for(let j=0;j<=8;j++)assert(c.canStand(x+(tx-x)*j/8,z+(tz-z)*j/8));}assert.equal(c.homeDistance(c.START.x,c.START.z),0);}
});
await test('Reveal respects walls; it resets for a new run and never counts as a stage clear',()=>{
 c.generateStage(17,5);const r=new c.Reveal();r.stamp(c.START.x,c.START.z,6);assert(r.percent>0);assert.equal(new c.Reveal().percent,0);for(const room of c.rooms)r.fillRoom(room.id);assert.equal(r.percent,100);assert.equal(c.stageCleared(true,2,99,80),false);assert.equal(c.stageCleared(true,3,0,80),false);assert.equal(c.stageCleared(true,3,99,0),false);assert.equal(c.stageCleared(false,3,99,80),false);assert.equal(c.stageCleared(true,3,20,.1),true);
 let found=false;for(const i of c.cells){const x=i%c.W*c.S,z=Math.floor(i/c.W)*c.S;for(const j of c.cells){const tx=j%c.W*c.S,tz=Math.floor(j/c.W)*c.S;if(Math.hypot(tx-x,tz-z)<18&&!c.lineOfSight(x,z,tx,tz)){const fog=new c.Reveal();fog.stamp(x,z,18);assert.equal(fog.sample(tx,tz),0);found=true;break;}}if(found)break;}assert(found);
});
await test('Seals, loot and lingering increase drain; introductory routes are generous and late routes need supply',()=>{
 for(let seed=1;seed<=60;seed++){c.generateStage(seed*4729,1+seed%8);assert(c.drainRate(1)>c.drainRate(0));assert(c.drainRate(0,1)>c.drainRate(0,0));assert(c.drainRate(0,0,240)>c.drainRate(0,0,0));const route=c.optimalSealRoute();let current=c.homeIndex,light=100,time=0,seals=0;
  for(const target of [...route.order.map(i=>c.indexAt(c.stageInfo.relics[i].x,c.stageInfo.relics[i].z)),c.homeIndex]){const duration=(c.shortestPath(current,target).length-1)*c.S/c.SPEED;for(let elapsed=0;elapsed<duration;elapsed+=.1){const dt=Math.min(.1,duration-elapsed);light-=c.drainRate(2,seals,time)*dt;time+=dt;}current=target;if(target!==c.homeIndex){for(let i=0;i<18;i++){light-=c.drainRate(2,seals,time)*.1;time+=.1;}seals++;assert(c.collapseTime(c.distances[target]*c.S)>c.distances[target]*c.S/c.SPEED);}}
  assert(light>0,`required route needs more baseline supply for seed ${seed}: ${light}`);assert(light<95);assert.equal(c.orbPlan().length,c.stageInfo.floor<=2?3:5);assert(c.orbPlan().every(o=>o.amount>=16));if(c.stageInfo.floor===1)assert(light>60);
 }
 assert.equal(c.maxLight(9),118);assert.equal(c.maxLight(0),100);
});
await test('Enemies stay inside corridors, announce attacks, and can be repelled with aim or flash',()=>{
 c.generateStage(17,2);const guards=enemyPlan(),player={...c.START,yaw:0,pitch:0,light:100,count:0,seals:0};let moved=false;const initial=guards.map(e=>({x:e.x,z:e.z}));for(let frame=0;frame<1800;frame++){updateEnemies(guards,player,1/30);for(const e of guards){assert(c.canStand(e.x,e.z));assert(Math.hypot(e.x-c.START.x,e.z-c.START.z)>8);}}moved=guards.some((e,i)=>Math.hypot(e.x-initial[i].x,e.z-initial[i].z)>1);assert(moved);
 const e=enemyPlan()[0];const target={x:e.x,z:e.z+.8,yaw:0,pitch:0,light:100,count:0,seals:0};let hit=false,windup=false;target.yaw=Math.PI;for(let frame=0;frame<40;frame++){for(const a of updateEnemies([e],target,1/30).events){if(a.type==='windup')windup=true;if(a.type==='hit'){assert(windup);hit=true;}}}assert(hit);
 const e2=enemyPlan()[0],p2={x:e2.x,z:e2.z+4,yaw:0,pitch:0,light:100,count:0,seals:0};assert(c.canStand(p2.x,p2.z));assert(facing(p2,e2.x,e2.z));let repelled=false;for(let frame=0;frame<200;frame++){p2.yaw=Math.atan2(-(e2.x-p2.x),-(e2.z-p2.z));if(updateEnemies([e2],p2,1/30).events.some(a=>a.type==='repelled')){repelled=true;break;}}assert(repelled);assert.equal(flashEnemies([e2],p2),1);assert.equal(e2.stun,4.4);
});
await test('Progress migration retains bank and upgrades but cannot carry a seal between runs',()=>{
 const old={format:1,mask:'legacy-map',completed:[0,1],totalBank:7500,level:2,runs:6,best:3500,deepest:140,escapes:4,busts:2};const p=migrateProgress(old);assert.equal(p.format,8);assert.equal(p.totalBank,7500);assert.equal(balance(p),4750);assert.equal(p.level,2);assert.equal(p.floor,1);assert.equal(p.mask,'');assert.deepEqual(p.completed,[]);assert(validProgress(p));assert.equal(validProgress({...p,mask:'legacy-map'}),false);
});
class Bucket{constructor(){this.data=new Map();this.counter=0;}async get(key){const d=this.data.get(key);return d?{body:d.body,etag:d.etag,text:async()=>d.body}:null;}async put(key,body,{onlyIf}={}){const old=this.data.get(key);if(onlyIf?.etagDoesNotMatch==='*'&&old)return null;if(onlyIf?.etagMatches&&old?.etag!==onlyIf.etagMatches)return null;const d={body,etag:'revision-'+(++this.counter)};this.data.set(key,d);return d;}}
await test('Cloud saves migrate without losing the original map and reject cross-user or stale writes',async()=>{
 const env={BUCKET:new Bucket(),ASSETS:{fetch:()=>new Response('asset')}},url='https://example.test/api/progress',headers={'oai-authenticated-user-id':'player-a','Content-Type':'application/json'};
 let r=await worker.fetch(new Request(url),env);assert.equal(r.status,401);r=await worker.fetch(new Request(url,{headers}),env);assert.equal(r.headers.get('x-save-revision'),'new');
 c.generateStage(17);const fog=new c.Reveal();fog.stamp(c.START.x,c.START.z,6);const old={...newProgress(),format:1,mask:fog.encode(),totalBank:7500,level:2};delete old.floor;delete old.clears;delete old.bestCoverage;delete old.bestClearTime;
 r=await worker.fetch(new Request(url,{method:'PUT',headers:{...headers,'x-save-revision':'new'},body:JSON.stringify(old)}),env);assert.equal(r.status,200);let revision=r.headers.get('x-save-revision');const fresh=migrateProgress(old);fresh.floor=2;fresh.clears=1;
 r=await worker.fetch(new Request(url,{method:'PUT',headers:{...headers,'x-save-revision':revision},body:JSON.stringify(fresh)}),env);assert.equal(r.status,200);assert.equal(env.BUCKET.data.size,3);assert.equal(JSON.parse(env.BUCKET.data.get('light-maze/v1/player-a.json.original-maze').body).mask,old.mask);
 r=await worker.fetch(new Request(url,{headers}),env);assert.deepEqual(await r.json(),fresh);
 r=await worker.fetch(new Request(url,{method:'PUT',headers:{...headers,'x-save-revision':revision},body:JSON.stringify(fresh)}),env);assert.equal(r.status,409);
 r=await worker.fetch(new Request(url,{headers:{...headers,'oai-authenticated-user-id':'player-b'}}),env);assert.deepEqual(await r.json(),{});
 r=await worker.fetch(new Request(url,{method:'PUT',headers:{...headers,'origin':'https://attacker.test'},body:'{}'}),env);assert.equal(r.status,403);
});
console.log(`${passed} behavioral checks passed.`);
