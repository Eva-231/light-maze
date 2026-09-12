import {W,S,START,rooms,cells,grid,distances,stageInfo,rng,walkable,indexAt,lineOfSight} from './core.js';
export const OMENS=[
 {name:'静かな迷宮',text:'静けさの先に、鉱脈が眠る。',light:1,mana:1,enemies:0,value:1},
 {name:'渇きの夜',text:'MP自然回復 半減 · 鉱脈の宝 +30%',light:1,mana:.5,enemies:0,value:1.3},
 {name:'影の巣',text:'影が2体増加 · 撃破した影は復活しない',light:1,mana:1,enemies:2,value:1.15},
 {name:'黄金の残響',text:'光の消費 +10% · 宝の価値 +30%',light:1.1,mana:1,enemies:0,value:1.3},
 {name:'星の満ち潮',text:'MP自然回復 +40% · 鉱脈が1つ増加',light:1,mana:1.4,enemies:0,value:1}
];
export const TRAP_TYPES=[
 {key:'spike',name:'刺突罠',hint:'赤い針が飛び出す。離れるか光弾で破壊。'},
 {key:'mire',name:'鈍足の沼',hint:'移動速度が5秒間低下する。'},
 {key:'ambush',name:'召喚罠',hint:'影兵を2〜3体呼び寄せる。'},
 {key:'eclipse',name:'星蝕罠',hint:'LIGHTとMPを奪う。HPだけ見ていると危険。'}
];
export function expeditionPlan(){
 const r=rng(stageInfo.seed^0xB371),omen=stageInfo.config.omens?OMENS[Math.floor(r()*OMENS.length)]:OMENS[0],maxDepth=Math.max(...distances);
 const occupied=new Set(stageInfo.relics.map(a=>indexAt(a.x,a.z))),eligible=cells.filter(i=>distances[i]>10&&grid[i]>0&&!occupied.has(i)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([x,z])=>!walkable(i%W+x,Math.floor(i/W)+z))).map(i=>({i,key:r()})).sort((a,b)=>a.key-b.key);
 const veins=[];for(const {i}of eligible){if(!stageInfo.config.mine)break;if(veins.length>=5+(omen===OMENS[4]?1:0))break;if(veins.some(v=>Math.hypot(v.x-i%W*S,v.z-Math.floor(i/W)*S)<12))continue;
  const sides=[[1,0],[-1,0],[0,1],[0,-1]].filter(([x,z])=>!walkable(i%W+x,Math.floor(i/W)+z)),[dx,dz]=sides[Math.floor(r()*sides.length)],quality=distances[i]/maxDepth>.65?2:r()<.35?1:0,layers=2+Math.floor(r()*3),rewards=[];
  for(let n=0;n<layers;n++)rewards.push({value:Math.floor((80+r()*120)*(1+quality*.8)*(n===layers-1?2:1)),cache:n===layers-1||r()<.08,seed:Math.floor(r()*4294967296),quality:n===layers-1?quality:0});
  veins.push({id:veins.length,x:i%W*S+dx*1.40,z:Math.floor(i/W)*S+dz*1.40,dx,dz,room:grid[i],quality,layers,hits:0,progress:0,rewards});
 }
 const traps=[],choices=cells.filter(i=>distances[i]>15&&!occupied.has(i)&&grid[i]!==0).map(i=>({i,key:r()})).sort((a,b)=>a.key-b.key);
 for(const {i}of choices){if(!stageInfo.config.traps)break;if(traps.length>=3+Math.floor(stageInfo.difficulty*.7))break;const offset=(r()-.5)*1.0,x=i%W*S+(r()<.5?offset:0),z=Math.floor(i/W)*S+(r()<.5?0:offset);if(traps.some(t=>Math.hypot(t.x-x,t.z-z)<12)||veins.some(v=>Math.hypot(v.x-x,v.z-z)<3))continue;const difficulty=stageInfo.config.difficulty,instant=difficulty.key==='abyss'&&r()<.35,available=stageInfo.floor<=5?2:stageInfo.floor===6?3:4,kind=TRAP_TYPES[Math.floor(r()*available)].key;traps.push({id:traps.length,x,z,kind,timer:-1,spent:false,instant,fuse:instant?0:difficulty.trapFuse,damage:difficulty.trapDamage,triggerRadius:.62,burstRadius:1.3});}
 const supplies=(stageInfo.floor>=2?rooms.slice(1):[]).filter(a=>!occupied.has(a.z*W+a.x)).map(a=>({a,key:r()})).sort((a,b)=>a.key-b.key).slice(0,4).map(({a},i)=>({x:a.x*S+.55,z:a.z*S+.55,kind:i%2?'mana':'heal',collected:false}));
 return{omen,veins,traps,supplies};
}
export function trapTarget(traps,player){return traps.filter(t=>!t.spent&&Math.hypot(t.x-player.x,t.z-player.z)<9&&lineOfSight(player.x,player.z,t.x,t.z)).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z)).find(t=>{const dx=t.x-player.x,dz=t.z-player.z,d=Math.hypot(dx,dz);return d>.3&&(-Math.sin(player.yaw)*dx-Math.cos(player.yaw)*dz)/d>Math.cos(.16)&&Math.abs(player.pitch-Math.atan2(-1.45,d))<.24;});}
export function advanceTraps(traps,player,dt){const events=[];for(const t of traps){if(t.spent)continue;const distance=Math.hypot(player.x-t.x,player.z-t.z);let armed=false;if(t.timer<0&&distance<(t.triggerRadius??.62)){t.timer=t.fuse??.9;armed=true;events.push({type:'armed',trap:t});}if(t.timer>=0){if(!armed)t.timer-=dt;if(t.timer<=0){t.spent=true;events.push({type:'burst',trap:t,hit:distance<(t.burstRadius??1.3),damage:t.damage??22,effect:t.kind||'spike',count:2+(t.id%2)});}}}return events;}
