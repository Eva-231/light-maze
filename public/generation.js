import {chapterConfig,abyssConfig,DIFFICULTIES} from './journey.js';
export const S=3.4,SPEED=4.2,MASK=256,FLASH_COST=8,FLASH_COOLDOWN=6;
export let SEALS_REQUIRED=3;
export let W=35,H=40,grid=new Int16Array(),cells=[],rooms=[],distances=new Int16Array(),nextHome=new Int16Array(),homeIndex=0;
export const START={x:17*S,z:37*S};
export const stageInfo={seed:1,floor:1,difficulty:0,baseDrain:.4,relics:[],jackpotRoom:0,optimalSteps:0,enemyCount:4};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rng(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export const walkable=(x,z)=>x>=0&&x<W&&z>=0&&z<H&&grid[z*W+x]!==-1;
export const indexAt=(x,z)=>clamp(Math.round(z/S),0,H-1)*W+clamp(Math.round(x/S),0,W-1);
export const neighbors=i=>{const x=i%W,z=Math.floor(i/W);return [[x+1,z],[x-1,z],[x,z+1],[x,z-1]].filter(([a,b])=>walkable(a,b)).map(([a,b])=>b*W+a);};
export function shortestPath(from,to){if(from===to)return[from];const parent=new Int16Array(W*H).fill(-1),queue=[from];parent[from]=from;for(let j=0;j<queue.length;j++)for(const n of neighbors(queue[j]))if(parent[n]<0){parent[n]=queue[j];if(n===to){const result=[n];while(result[result.length-1]!==from)result.push(parent[result[result.length-1]]);return result.reverse();}queue.push(n);}return[];}
export function distanceField(target){const result=new Int16Array(W*H).fill(-1),queue=[target];result[target]=0;for(let j=0;j<queue.length;j++)for(const n of neighbors(queue[j]))if(result[n]<0){result[n]=result[queue[j]]+1;queue.push(n);}return result;}
export function optimalSealRoute(relics=stageInfo.relics){const targets=relics.map(r=>indexAt(r.x,r.z)),permutations=a=>a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(t=>[v,...t])):[[]],orders=permutations(targets.map((_,i)=>i));let best={steps:Infinity,order:[]};const fields=[distanceField(homeIndex),...targets.map(distanceField)];for(const order of orders){const points=[0,...order.map(i=>i+1),0],indices=[homeIndex,...targets];let steps=0;for(let i=1;i<points.length;i++)steps+=fields[points[i-1]][indices[points[i]]];if(steps<best.steps)best={steps,order};}return best;}
export function generateStage(seed=1,floor=1,trialLevel=1,daily=false,options={}){
 const config={...(options.abyssFloor?abyssConfig(options.abyssFloor,options):chapterConfig(floor,trialLevel)),...(daily?{difficulty:DIFFICULTIES[1]}:{})},random=rng(seed),difficulty=clamp(floor-2,0,7)+Math.min(10,Math.max(0,config.trialLevel-1))*.45,cols=config.cols,rows=config.rows;stageInfo.config=config;SEALS_REQUIRED=config.seals;
 W=cols*8+3;H=rows*8+8;grid=new Int16Array(W*H).fill(-1);cells=[];rooms=[];START.x=Math.floor(W/2)*S;START.z=(H-3)*S;
 const names=['静寂の回廊','紫晶の祭壇','反響の間','光の樹','崩れた書庫','水鏡の庭','忘却の礼拝堂','夜の天文台','眠れる巨像','黒曜の祈り','王の回廊','灰の聖堂'];
 const carve=(x,z,id=-2)=>{if(x>0&&x<W-1&&z>0&&z<H-1&&grid[z*W+x]===-1)grid[z*W+x]=id;};
 const addRoom=(x,z,w,h,name)=>{const room={id:rooms.length,x,z,w,h,name,tiles:[],links:[]};rooms.push(room);for(let b=z-Math.floor(h/2);b<=z+Math.floor(h/2);b++)for(let a=x-Math.floor(w/2);a<=x+Math.floor(w/2);a++)carve(a,b,room.id);};
 addRoom(Math.round(START.x/S),H-4,3,3,'帰還の門');
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=4+col*8+Math.floor(random()*3)-1,z=4+row*8+Math.floor(random()*3)-1;addRoom(x,z,random()<.28?5:3,random()<.28?5:3,names[Math.floor(random()*names.length)]);}
 const edges=[];for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const a=1+row*cols+col;if(col+1<cols)edges.push({a,b:a+1,order:random()});if(row+1<rows)edges.push({a,b:a+cols,order:random()});}
 edges.sort((a,b)=>a.order-b.order);const parent=rooms.map(r=>r.id),root=a=>{while(parent[a]!==a)a=parent[a];return a;};
 const connect=(a,b)=>{const p=rooms[a],q=rooms[b];let x=p.x,z=p.z;const horizontalFirst=random()<.5;const axis=which=>{while(which?x!==q.x:z!==q.z){if(which)x+=Math.sign(q.x-x);else z+=Math.sign(q.z-z);carve(x,z);}};axis(horizontalFirst);axis(!horizontalFirst);};
 const spare=[];for(const e of edges){const a=root(e.a),b=root(e.b);if(a!==b){parent[a]=b;connect(e.a,e.b);}else spare.push(e);}
 for(const e of spare.slice(0,Math.max(3,Math.floor(rooms.length*.20))))connect(e.a,e.b);
 const near=rooms.filter(r=>r.id>0&&r.z>H-17).sort((a,b)=>Math.hypot(a.x-START.x/S,a.z-START.z/S)-Math.hypot(b.x-START.x/S,b.z-START.z/S))[0];connect(0,near.id);
 const queue=rooms.map(r=>({i:r.z*W+r.x,id:r.id})),seen=new Set(queue.map(v=>v.i));for(let j=0;j<queue.length;j++){const {i,id}=queue[j];if(grid[i]===-2)grid[i]=id;for(const n of neighbors(i))if(!seen.has(n)){seen.add(n);queue.push({i:n,id:grid[n]>=0?grid[n]:id});}}
 for(let i=0;i<grid.length;i++)if(grid[i]>=0){cells.push(i);rooms[grid[i]].tiles.push(i);}
 for(const i of cells)for(const n of neighbors(i)){const a=grid[i],b=grid[n];if(a!==b&&!rooms[a].links.includes(b))rooms[a].links.push(b);}
 homeIndex=indexAt(START.x,START.z);distances=distanceField(homeIndex);nextHome=new Int16Array(W*H).fill(-1);for(const i of cells)if(i!==homeIndex)nextHome[i]=neighbors(i).find(n=>distances[n]===distances[i]-1)??-1;
 const depths=rooms.slice(1).map(r=>({room:r,depth:distances[r.z*W+r.x]})).sort((a,b)=>a.depth-b.depth),maxDepth=depths[depths.length-1].depth;
 const selected=[],fields=[];for(const fraction of (config.seals===1?[.72]:config.seals===2?[.5,.88]:[.46,.73,.94])){const options=depths.filter(v=>!selected.some(s=>s.id===v.room.id)).map(v=>({...v,score:Math.abs(v.depth-maxDepth*fraction)+(fields.length?Math.max(0,9-Math.min(...fields.map(f=>f[v.room.z*W+v.room.x])))*3:0)+((v.room.id*31+(seed>>>0))%7)*.2})).sort((a,b)=>a.score-b.score);selected.push(options[0].room);fields.push(distanceField(options[0].room.z*W+options[0].room.x));}
 stageInfo.seed=seed>>>0;stageInfo.floor=floor;stageInfo.difficulty=difficulty;stageInfo.relics=selected.map((r,id)=>({id,room:r.id,x:r.x*S,z:r.z*S,collected:false,guardId:null}));
 stageInfo.jackpotRoom=depths.slice().reverse().find(v=>!selected.some(r=>r.id===v.room.id)).room.id;rooms[stageInfo.jackpotRoom].name='黄金の宝物庫';
 stageInfo.optimalSteps=optimalSealRoute().steps;stageInfo.enemyCount=Math.min(20,config.enemies);
 const idealSeconds=stageInfo.optimalSteps*S/SPEED;stageInfo.baseDrain=clamp(64/(idealSeconds*1.45+22),.22,.50)*config.lightScale*(1+Math.min(.45,Math.max(0,config.trialLevel-1)*.025));stageInfo.parTime=Math.ceil(idealSeconds*1.45+config.enemies*5+config.seals*2+12);return stageInfo;
}
export function homeDistance(x,z){const i=indexAt(x,z);if(i===homeIndex)return Math.hypot(x-START.x,z-START.z);const n=nextHome[i];return Math.max(0,(distances[i]-1)*S+Math.hypot(x-(n%W)*S,z-Math.floor(n/W)*S));}
export function canStand(x,z){const r=.26;return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([a,b])=>walkable(Math.round((x+a)/S),Math.round((z+b)/S)));}
export function lineOfSight(x,z,tx,tz){const dx=tx-x,dz=tz-z,n=Math.ceil(Math.hypot(dx,dz)/.22);for(let j=1;j<n;j++)if(!walkable(Math.round((x+dx*j/n)/S),Math.round((z+dz*j/n)/S)))return false;return true;}
export const maxLight=level=>100+Math.min(9,Math.max(0,level))*2;
export const drainRate=(count,seals=0,elapsed=0)=>stageInfo.baseDrain*(1+count*.10+seals*.22+clamp((elapsed-90)/150,0,.60));
export function returnRisk(light,distance,count,seals=0,elapsed=0){const required=distance/SPEED*drainRate(count,seals,elapsed+distance/SPEED/2);const buffer=light-required;return{required,status:buffer<Math.max(8,required*.24)?'DANGER':buffer<Math.max(20,required*.7)?'RISK':'SAFE'};}
export const collapseTime=distance=>stageInfo.config.difficulty.key==='abyss'?Math.max(24,distance/SPEED*1.12+8):stageInfo.config.difficulty.key==='hard'?Math.max(29,distance/SPEED*1.3+10):Math.max(34,distance/SPEED*(1.65-Math.min(10,stageInfo.difficulty)*.015)+12);
export const stageCleared=(success,seals,collapseRemaining,light)=>!!success&&seals===SEALS_REQUIRED&&collapseRemaining>0&&light>0;
export const tiers=[{name:'COMMON',value:100,color:0x9cefff,hex:'#adf4ff'},{name:'RARE',value:500,color:0xb084ff,hex:'#c2a0ff'},{name:'EPIC',value:1500,color:0xff78ca,hex:'#ff91d4'},{name:'LEGENDARY',value:5000,color:0xffca60,hex:'#ffd879'}];
export function treasurePlan(run=0){const random=rng(stageInfo.seed^run^0x54778),out=[],used=new Set(stageInfo.relics.map(r=>indexAt(r.x,r.z))),maxDepth=Math.max(...distances);
 const add=(i,tier)=>{if(i===undefined||used.has(i))return;used.add(i);out.push({x:i%W*S,z:Math.floor(i/W)*S,tier,value:tiers[tier].value+(tier===3?Math.floor(random()*4)*1000:0),collected:false,phase:random()*6.28});};
 const first=cells.filter(i=>distances[i]>=4&&distances[i]<8);add(first[Math.floor(random()*first.length)],0);
 for(const r of rooms.slice(1)){const options=r.tiles.filter(i=>distances[i]>7&&!used.has(i));if(!options.length)continue;const depth=distances[r.z*W+r.x]/maxDepth,count=r.id===stageInfo.jackpotRoom?5:1+(random()<.4?1:0);for(let j=0;j<count&&options.length;j++){const at=Math.floor(random()*options.length),i=options.splice(at,1)[0],roll=random(),tier=stageInfo.floor===1?0:r.id===stageInfo.jackpotRoom?(j===0?3:j%2+1):depth>.78&&roll>.94?3:depth>.52&&roll>.68?2:roll>.4?1:0;add(i,tier);}}return out;
}
export function orbPlan(){const available=rooms.slice(1).sort((a,b)=>distances[a.z*W+a.x]-distances[b.z*W+b.x]),count=Math.min(available.length,stageInfo.config.rules?.boss?12:stageInfo.floor<=2?3:5),selected=[];for(let i=0;i<count;i++){const r=available[Math.floor(i*(available.length-1)/Math.max(1,count-1))];selected.push({x:r.x*S-.6,z:r.z*S+.55,collected:false,amount:stageInfo.config.rules?.boss?28:stageInfo.floor<=2?16:18});}return selected;}
generateStage(9274,1);
