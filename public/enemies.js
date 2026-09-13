import {has,cursed,syn,strikeMultiplier,rememberStrike} from './gear-effects.js';
import {reflectedTargets} from './combat-targets.js';
import {levelEnemy,aliveCount,bossZones,spawnDue} from './enemy-levels.js';
import {ENEMY_CAP} from './abyss-rules.js';
import {frostNovaFx} from './frost-fx.js';
import {W,S,START,rooms,cells,grid,stageInfo,rng,distances,indexAt,shortestPath,neighbors,distanceField,canStand,lineOfSight,clamp} from './core.js';
export const ENEMY_TYPES=[
 {name:'影兵',hint:'振りかぶったら後ろへ。隙に光弾。',hp:44,color:0xf77b67},
 {name:'裂走狼',hint:'赤い直線を横に避ける。突進後が好機。',hp:42,color:0xff985e},
 {name:'石の巨兵',hint:'円の外へ退避。叩きつけた後は装甲が開く。',hp:84,color:0xffbd74},
 {name:'転位の術師',hint:'紫の詠唱を光弾で中断。壁に隠れても防げる。',hp:58,color:0xc58bff},
 {name:'銀光の精',hint:'逃げ切る前に氷環で足止め。銀光には1.6倍。希少遺物を必ず落とす。',hp:32,color:0xd8f9ff},
 {name:'深淵の番人',hint:'広い衝撃波を避け、攻撃後に露出する核を狙う。',hp:200,color:0xffc66e}
];
let enemySerial=0;
export function enemyPlan(extra=0){enemySerial=0;if(stageInfo.config.rules?.bonus)return [];
 const random=rng(stageInfo.seed^0xA734F),config=stageInfo.config,out=[];
 if(!config.enemies)return out;
 const create=(room,kind,guardSeal=null)=>{const tile=room.tiles.find(i=>Math.hypot(i%W-room.x,Math.floor(i/W)-room.z)===1)||room.z*W+room.x,id=out.length,maxHp=Math.round((ENEMY_TYPES[kind].hp+stageInfo.difficulty*(kind===5?12:3))*config.difficulty.hp);const e={id,x:tile%W*S,z:Math.floor(tile/W)*S,homeRoom:room.id,guardSeal,mode:'patrol',stun:0,exposure:0,memory:0,windup:0,recovery:0,attackCooldown:0,path:[],target:-1,patrolClock:0,phase:random()*6.28,kind,hp:maxHp,maxHp,dead:false,escaped:false,charge:0,fleeTime:0,attackYaw:0,attackAim:null,attackKind:'',enraged:false};levelEnemy(e,config,random);out.push(e);if(guardSeal!==null)stageInfo.relics[guardSeal].guardId=id;};
 for(const seal of stageInfo.relics){let kind=0;if(config.id===3)kind=seal.id===0?1:2;else if(config.id>=4)kind=[config.id>=5?3:1,2,config.id>=7&&(!config.abyss||config.rules.boss)?5:1][seal.id];create(rooms[seal.room],kind,seal.id);}
 const choices=rooms.slice(1).filter(r=>distances[r.z*W+r.x]>6&&!out.some(e=>e.homeRoom===r.id)).map(r=>({r,key:random()})).sort((a,b)=>a.key-b.key);
 for(const {r} of choices){if(out.length>=Math.min(ENEMY_CAP,stageInfo.enemyCount+extra))break;const kinds=config.kinds.filter(k=>k!==5&&k!==4);let kind=kinds[Math.floor(random()*kinds.length)];if(config.id>=6&&!out.some(e=>e.kind===4)&&(config.id===6||random()<.4))kind=4;create(r,kind);}
 while(out.length<Math.min(ENEMY_CAP,stageInfo.enemyCount+extra)&&choices.length){const room=choices[out.length%choices.length].r;create(room,config.kinds.filter(k=>k<4)[out.length%4]??0);out.at(-1).x+=out.length%2?.65:-.65;}
 enemySerial=out.length;return out;
}
export function spawnTrapEnemies(enemies,trap,count=2){if(stageInfo.config.rules?.bonus)return [];const spawned=[],base=Math.max(enemySerial,Math.max(-1,...enemies.map(e=>e.id))+1),grade=stageInfo.config.difficulty;for(let n=0;n<Math.min(count,ENEMY_CAP-aliveCount(enemies));n++){const angle=n*Math.PI*2/count+(trap.id||0),distance=1.7+n*.25,x=trap.x+Math.cos(angle)*distance,z=trap.z+Math.sin(angle)*distance;if(!canStand(x,z))continue;const kind=trap.natural?(trap.kind??n%4):n%2,maxHp=Math.round((ENEMY_TYPES[kind].hp+stageInfo.difficulty*3)*grade.hp);spawned.push({id:base+n,x,z,homeRoom:grid[indexAt(x,z)]||1,guardSeal:null,mode:'chase',stun:.35,exposure:0,memory:8,windup:0,recovery:.4,attackCooldown:1,path:[],target:indexAt(trap.x,trap.z),patrolClock:0,phase:n,kind,hp:maxHp,maxHp,dead:false,escaped:false,charge:0,fleeTime:0,attackYaw:0,attackAim:null,attackKind:'',enraged:false});}enemySerial=base+count;for(const e of spawned)levelEnemy(e,stageInfo.config,rng(stageInfo.seed+e.id*371));enemies.push(...spawned);return spawned;}
export const sealUnlocked=(seal,enemies)=>seal.guardId===null||seal.guardId===undefined||enemies.some(e=>e.id===seal.guardId&&e.dead);
export const precisionEvade=(enemy,player)=>!!enemy.attackAim&&Math.hypot(player.x-enemy.attackAim.x,player.z-enemy.attackAim.z)>.85&&Math.hypot(player.x-enemy.attackAim.x,player.z-enemy.attackAim.z)<5.5;
export function facing(player,x,z,angle=.52){const dx=x-player.x,dz=z-player.z,d=Math.hypot(dx,dz);return d<.05||((-Math.sin(player.yaw)*dx-Math.cos(player.yaw)*dz)/d>Math.cos(angle)&&Math.abs(player.pitch-Math.atan2(-.20,d))<(d<1.2?1.0:.60));}
function stopCast(e,time){e.stun=time;e.exposure=0;e.windup=0;e.charge=0;e.mode='stunned';e.recovery=time;}
export function flashEnemies(enemies,player){let count=0;for(const e of enemies)if(!e.dead&&!e.escaped&&Math.hypot(e.x-player.x,e.z-player.z)<8.5&&lineOfSight(player.x,player.z,e.x,e.z)){stopCast(e,e.kind===5?1.1:4.4);e.memory=0;count++;}return count;}
export function alertEnemies(enemies,player){for(const e of enemies)if(!e.dead&&!e.escaped&&Math.hypot(e.x-player.x,e.z-player.z)<22){e.memory=Math.max(e.memory,5);e.target=indexAt(player.x,player.z);}}
export function warpDestination(enemy,player){
 const current=indexAt(player.x,player.z),field=distanceField(current),visited=player.explored,options=cells.filter(i=>field[i]>=4&&field[i]<=7+Math.floor((enemy.level||1)/3)&&distances[i]>4&&(!visited||visited.has(i))&&(player.canOccupy?.(i%W*S,Math.floor(i/W)*S)??canStand(i%W*S,Math.floor(i/W)*S)));
 if(!options.length)return null;const i=options[(stageInfo.seed+enemy.id*31+Math.floor(enemy.patrolClock))%options.length];return{x:i%W*S,z:Math.floor(i/W)*S};
}
function moveAlongPath(e,target,speed,dt){
 const current=indexAt(e.x,e.z),cx=current%W*S,cz=Math.floor(current/W)*S,centered=Math.hypot(e.x-cx,e.z-cz)<.12;
 if(!e.path.length||(centered&&e.path.at(-1)!==target)){e.path=shortestPath(current,target);if(centered)e.path.shift();}
 const node=e.path[0];if(node===undefined)return;const tx=node%W*S,tz=Math.floor(node/W)*S,dx=tx-e.x,dz=tz-e.z,len=Math.hypot(dx,dz);if(len<.04){e.x=tx;e.z=tz;e.path.shift();return;}
 const step=Math.min(len,speed*dt),nx=e.x+dx/len*step,nz=e.z+dz/len*step;if(canStand(nx,nz)&&Math.hypot(nx-START.x,nz-START.z)>6){e.x=nx;e.z=nz;e.attackYaw=Math.atan2(-dx,-dz);}else{e.path=[];e.target=-1;}
}
let cachedField=null,cachedCell=-1,cachedStage='';
export function updateEnemies(enemies,player,dt){
 const events=[],grade=stageInfo.config.difficulty;let threat=0;if(!enemies.length)return{events,threat};const cell=indexAt(player.x,player.z),key=stageInfo.seed+':'+stageInfo.floor;if(!cachedField||cachedCell!==cell||cachedStage!==key){cachedField=distanceField(cell);cachedCell=cell;cachedStage=key;}const playerField=cachedField;
 for(const e of enemies){if(e.dead||e.escaped)continue;const damageScale=grade.damage*(e.levelDamage||1),tempo=grade.windup*(e.levelTempo||1);if(e.mutations?.includes('regen')&&e.stun<=0)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.015*dt);if(e.bossPattern===6&&e.recovery>0)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.008*dt);e.attackCooldown=Math.max(0,e.attackCooldown-dt);e.stun=Math.max(0,e.stun-dt);e.recovery=Math.max(0,e.recovery-dt);e.patrolClock+=dt;
  const d=Math.hypot(e.x-player.x,e.z-player.z),visible=d<(e.kind===5?20:15)&&lineOfSight(e.x,e.z,player.x,player.z),safe=Math.hypot(player.x-START.x,player.z-START.z)<6;
  if(e.kind===5&&!e.enraged&&e.hp<=e.maxHp*.45){e.enraged=true;e.memory=12;e.attackCooldown=0;events.push({type:'enraged',enemy:e});}
  const rage=e.kind===5&&e.enraged?1.22:1;
  if(e.stun>0){e.mode='stunned';e.exposure=0;continue;}
  if(e.kind===4){
   if(visible&&d<11&&!e.fleeTime){e.fleeTime=12;events.push({type:'silver',enemy:e});}
   if(e.fleeTime>0){e.fleeTime-=dt;if(e.fleeTime<=0){e.escaped=true;e.mode='escaped';events.push({type:'escaped',enemy:e});continue;}e.mode='flee';const options=neighbors(indexAt(e.x,e.z)).filter(i=>distances[i]>4).sort((a,b)=>playerField[b]-playerField[a]);if(!e.path.length&&options.length)e.target=options[0];moveAlongPath(e,e.target,5.6,dt);continue;}
  }
  if(e.charge>0){e.mode='charge';const step=Math.min(e.charge,8.7*grade.speed*(e.levelSpeed||1)*(e.level>=3?1.12:1)*dt),nx=e.x-Math.sin(e.attackYaw)*step,nz=e.z-Math.cos(e.attackYaw)*step;e.charge-=step;
   if(canStand(nx,nz)&&Math.hypot(nx-START.x,nz-START.z)>6){e.x=nx;e.z=nz;}else e.charge=0;
   if(!safe&&!e.chargeHit&&Math.hypot(e.x-player.x,e.z-player.z)<1.0&&visible){e.chargeHit=true;events.push({type:'hit',enemy:e,damage:Math.round((23+Math.floor(stageInfo.difficulty))*damageScale)});}
   if(e.charge<=0){if(e.level>=5&&(e.combo||0)<(e.level>=10?2:1)){e.combo=(e.combo||0)+1;e.windup=.5*tempo;e.attackAim={x:player.x,z:player.z};e.attackZones=e.kind===5?bossZones(e,player):[];e.attackRadius=(e.kind===5?(e.attackKind==='rift'?1.55:3.4):e.kind===2?2.55:1.55)*(e.scale?.range||1);e.windupMax=e.windup;e.attackYaw=Math.atan2(-(player.x-e.x),-(player.z-e.z));}else e.combo=0;if(!e.chargeHit)events.push({type:'dodged',enemy:e,precision:precisionEvade(e,player)});e.recovery=1.6*grade.recovery;e.stun=.7*grade.recovery;e.attackCooldown=3.5*tempo;}continue;
  }
  if(e.windup>0){
   if(e.kind===3&&(!visible||safe)){e.windup=0;e.attackCooldown=4;e.recovery=1.2;events.push({type:'dodged',enemy:e,cover:true});continue;}
   e.windup-=dt;e.mode='attack';if(e.windup>0){threat=Math.max(threat,.9);continue;}
   if(e.kind===3){if(player.warpImmune)events.push({type:'warpBlocked',enemy:e});else{const destination=warpDestination(e,player);if(destination)events.push({type:'warp',enemy:e,destination});}e.attackCooldown=7*tempo;e.recovery=1.5*grade.recovery;}
   else if(e.kind===1){e.charge=e.level>=7?9:7;e.chargeHit=false;}
   else if(e.kind===5&&e.attackKind==='rift'){const aim=e.attackAim||{x:player.x,z:player.z},radius=e.attackRadius||1.55,inside=(e.attackZones||[{...aim,radius}]).some(a=>Math.hypot(player.x-a.x,player.z-a.z)<a.radius);if(!safe&&inside)events.push({type:'hit',enemy:e,damage:Math.round((32+Math.floor(stageInfo.difficulty))*damageScale*rage),cause:'rift'});else events.push({type:'dodged',enemy:e,precision:precisionEvade(e,player)});for(const zone of e.attackZones||[{...aim,radius}])events.push({type:'impact',enemy:e,...zone,ranged:true});if(e.bossPattern===9&&e.enraged&&(e.royalCasts=(e.royalCasts||0)+1)%3===0)events.push({type:'summon',enemy:e,count:2});if(e.bossPattern===3||e.bossPattern===8)events.push({type:'summon',enemy:e,count:e.bossPattern===8?3:2});if(e.bossPattern===2&&inside)events.push({type:'slow',enemy:e,seconds:4});if(e.bossPattern===7)events.push({type:'warp',enemy:e,destination:warpDestination(e,player)||{x:player.x,z:player.z}});if(e.bossPattern===4||e.bossPattern===9)events.push({type:'drain',enemy:e,amount:inside?8:0});if(e.bossPattern===5)e.ward=2;e.recovery=1.35*grade.recovery/rage;e.stun=.35*grade.recovery;e.attackCooldown=2.8*tempo/rage;}
   else{const radius=(e.kind===5?3.4:e.kind===2?2.55:1.55)*(e.scale?.range||1),damage=e.kind===5?38:e.kind===2?30:stageInfo.floor===2?13:18;if(!safe&&d<radius&&visible)events.push({type:'hit',enemy:e,damage:Math.round((damage+Math.floor(stageInfo.difficulty*.8))*damageScale*rage),cause:e.kind===5?'slam':'shadow'});else if(d<radius+4)events.push({type:'dodged',enemy:e,precision:precisionEvade(e,player)});events.push({type:'impact',enemy:e,radius});e.recovery=(e.kind===5?2.35:e.kind===2?2:1.2)*grade.recovery/rage;e.stun=(e.kind===0?.45:.8)*grade.recovery;e.attackCooldown=(e.kind===5?3.1:2.5)*tempo/rage;}
   e.attackKind='';
   continue;
  }
  if(visible&&d<7.2&&player.light>0&&facing(player,e.x,e.z)&&e.kind!==5){e.exposure+=dt;if(e.exposure>=1.5/(grade.windup)){stopCast(e,1.2);events.push({type:'repelled',enemy:e});events.push(hurtEnemy(e,6));continue;}}else e.exposure=Math.max(0,e.exposure-dt*1.6);
  if(!safe&&visible&&d<(e.kind===5?18:11)){if(e.memory<=0&&e.kind!==4)events.push({type:'spotted',enemy:e});e.memory=e.kind===5?10:6;e.target=indexAt(player.x,player.z);}else e.memory=Math.max(0,e.memory-dt);
  if(safe){e.memory=0;e.target=-1;}
  const chasing=e.memory>0;e.mode=e.recovery>0?'recover':chasing?'chase':'patrol';if(!safe&&visible)threat=Math.max(threat,(1-clamp(d/14,0,1))*(chasing?1:.35));
  const attackRange=e.kind===3?10:e.kind===1?7:e.kind===2?2.3:e.kind===5?12:1.2;
  if(!safe&&visible&&e.kind!==4&&d<attackRange&&e.attackCooldown<=0&&e.recovery<=0){e.attackKind=e.kind===5&&d>3.6?'rift':'melee';e.windup=(e.kind===3?1.65:e.kind===1?.85:e.kind===2?1.1:e.kind===5?(e.attackKind==='rift'?1.05:1.20)/rage:.7)*tempo;e.attackAim={x:player.x,z:player.z};e.attackZones=e.kind===5?bossZones(e,player):[];e.attackRadius=(e.kind===5?(e.attackKind==='rift'?1.55:3.4):e.kind===2?2.55:1.55)*(e.scale?.range||1);e.windupMax=e.windup;e.attackYaw=Math.atan2(-(player.x-e.x),-(player.z-e.z));e.mode='attack';events.push({type:'windup',enemy:e,attackKind:e.attackKind});continue;}
  if(e.recovery>0)continue;
  const room=rooms[e.homeRoom],current=indexAt(e.x,e.z);
  if(!chasing&&e.guardSeal!==null&&Math.hypot(e.x-room.x*S,e.z-room.z*S)>14){e.target=room.z*W+room.x;}
  else if(chasing&&e.kind===3&&d<5){const options=neighbors(current).sort((a,b)=>playerField[b]-playerField[a]);e.target=options[0]??current;}
  else if(chasing)e.target=indexAt(player.x,player.z);
  else if(e.target<0||!e.path.length){const destinations=e.guardSeal!==null?[room.id]:[room.id,...room.links].filter(id=>id!==0),r=rooms[destinations[(Math.floor(e.patrolClock*.22)+e.id)%destinations.length]];e.target=r.z*W+r.x;}
  const speed=chasing?(e.kind===2?2.0:e.kind===5?2.85:e.kind===1?3.5:2.6)+Math.min(.5,stageInfo.difficulty*.05):1.05;
  moveAlongPath(e,e.target,speed*grade.speed*rage*(e.levelSpeed||1),dt);
 }
 return{events,threat};
}
export const SPELLS=[{name:'光弾',key:'bolt',cost:6,cooldown:.65,description:'狙って放つ。外すとMPを消費。攻撃後の隙で威力上昇。'},{name:'氷環',key:'frost',cost:16,cooldown:0,description:'自分の周囲6.3mを凍結爆破。最大12体へ強めのダメージ＋足止め。MPがある限り連続使用できる。'},{name:'治癒',key:'heal',cost:20,cooldown:0,description:'HPを30回復。MPがある限り連続使用できる。'}];
export function hurtEnemy(enemy,damage){if(enemy.dead||enemy.escaped)return{type:'ignored',enemy,damage:0};const dealt=Math.min(enemy.hp,Math.max(0,Math.round(damage)));enemy.hp-=dealt;enemy.hitFlash=.2;if(enemy.hp<=0){enemy.hp=0;enemy.dead=true;enemy.windup=0;enemy.charge=0;enemy.mode='dead';}return{type:enemy.dead?'killed':'damaged',enemy,damage:dealt};}
export function spellCost(index,stats){return Math.ceil(SPELLS[index].cost*(1-stats.economy));}
export function castSpell(index,enemies,player,stats,random=Math.random){
 let cost=spellCost(index,stats);if(has(stats,'infinite')&&random()<.15)cost=0;const blood=has(stats,'bloodpact')&&player.mp<cost&&player.hp>cost-player.mp;if(!stageInfo.config.spells.includes(index))return{ok:false,reason:'この魔法は、先のステージで解放されます。'};if(index!==2&&Math.hypot(player.x-START.x,player.z-START.z)<6.1)return{ok:false,reason:'帰還の門の結界内からは攻撃できません。'};if(player.mp<cost&&!blood)return{ok:false,reason:'MP不足。青い結晶か、敵のドロップを拾おう。'};if(index===2&&player.hp>=stats.maxHp)return{ok:false,reason:'HPは満タンです。'};
 const frostRadius=6.3,cone=has(stats,'homing')?.5:stageInfo.floor<=2?.30:stageInfo.floor<=4?.23:.17,targets=enemies.filter(e=>!e.dead&&!e.escaped&&Math.hypot(e.x-player.x,e.z-player.z)<(index===1?frostRadius:12)&&lineOfSight(player.x,player.z,e.x,e.z)&&(index===1||index===2||facing(player,e.x,e.z,cone))).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z));if(blood){player.hp-=cost-player.mp;player.mp=0;}else player.mp-=cost;if(has(stats,'lightpact'))player.light=Math.max(.1,player.light-1);const events=[];
 if(index===2){const heal=Math.min(stats.maxHp-player.hp,Math.round(30*stats.healBonus*(stats.normalHeal??1)*(stageInfo.config.rules?.heal||1)*(has(stats,'lifetrade')&&player.light>5?2:1)));player.hp+=heal;if(heal&&has(stats,'lifetrade')&&player.light>5)player.light-=5;return{ok:true,heal,events,cost};}
 let bounced=[];const selected=index===0?targets.slice(0,has(stats,'pierce')||has(stats,'drill')?3:has(stats,'twinstar')?2:1):index===1?targets.slice(0,12):targets;if(index===0&&stats.echo&&selected.length){const first=selected[0],echo=enemies.filter(e=>!e.dead&&!e.escaped&&e!==first&&Math.hypot(e.x-first.x,e.z-first.z)<5&&lineOfSight(first.x,first.z,e.x,e.z)).slice(0,stats.echoCount||1);selected.push(...echo);}
 if(index===0&&!selected.length&&has(stats,'ricochet')){bounced=reflectedTargets(player,enemies);selected.push(...bounced.slice(0,syn(stats,'eventhorizon')?5:has(stats,'pierce')?3:1).map(a=>a.enemy));}
 const counter=index===0&&(player.counterUntil||0)>player.elapsed;
 for(let i=0;i<selected.length;i++){const e=selected[i],interrupted=e.kind===3&&e.windup>0,weak=e.recovery>0||e.stun>.35||(e.kind!==5&&e.windup>0),critical=player.runMode!=='daily'&&random()<stats.crit,isCounter=counter&&i===0,frostFavored=index===1&&[1,4].includes(e.kind),affinity=(stats.enemyMultipliers?.[e.kind]||1)*(frostFavored?1.6:1);let damage=((index===0?28*stats.boltBonus:26)+stats.power)*(stats.spellMultiplier||1)*affinity;if(weak)damage*=1.5*(stats.weakBonus||1);else if((e.kind===2||e.kind===5)&&!has(stats,'insight'))damage*=e.kind===5?.40:.6;if(isCounter)damage*=1.5;if(critical)damage*=1.6;if(index===0&&i>0&&!has(stats,'pierce')&&!has(stats,'drill')&&!has(stats,'twinstar'))damage*=stats.echoDamage??.35;damage*=strikeMultiplier(stats,player,e,index,Math.hypot(e.x-player.x,e.z-player.z),i);if(bounced.length)damage*=1.5;if(index===1)e.ward=0;if(e.ward>0){e.ward--;damage*=.2;}if(e.mutations?.includes('phantom')&&e.stun<=0&&index!==1)damage*=.75;if(syn(stats,'nightfeast')&&player.light/player.lightMax<.2)e.ward=0;if(e.kind!==5&&((has(stats,'execute')&&e.hp/e.maxHp<.15)||(cursed(stats,'deathcontract')&&random()<.1)||(has(stats,'death')&&random()<.08)))damage=e.hp;
  const hit=hurtEnemy(e,damage);Object.assign(hit,{critical,weak,interrupted,counter:isCounter,affinity:affinity>1.01,frost:index===1,area:index===1});if(bounced.length)hit.bounce=bounced[0].bounce;events.push(hit);rememberStrike(stats,player,e);
  if(!e.dead){e.memory=e.kind===5?10:6;e.target=indexAt(player.x,player.z);if(index===1||interrupted){stopCast(e,e.kind===5?.8:interrupted?2.1:(frostFavored?5.0:3.2)+stats.freezeBonus);e.attackCooldown=Math.max(e.attackCooldown,2);if(e.kind===1)e.charge=0;}else if(e.kind===0||e.kind===4){e.stun=.15;}}
 }
 const primary=[...events],m=player.effectState??={};
 if(primary.length){
  if(has(stats,'afterbolt')&&(m.hits||0)%3===0&&!primary[0].enemy.dead)events.push({...hurtEnemy(primary[0].enemy,primary[0].damage*.35),secondary:true});
  const origin=primary[0].enemy;if(has(stats,'thunder'))for(const e of enemies.filter(e=>!e.dead&&!e.escaped&&e!==origin&&Math.hypot(e.x-origin.x,e.z-origin.z)<5&&lineOfSight(origin.x,origin.z,e.x,e.z)).slice(0,3)){stopCast(e,.7);events.push({...hurtEnemy(e,primary[0].damage*.25),secondary:true});}
  const range=(has(stats,'amaterasu')?3+4*player.light/player.lightMax:3)*(stats.blastRange||1),rain=has(stats,'rain')&&(m.hits||0)%5===0;
  if(has(stats,'blast')||has(stats,'split')||rain){const splash=enemies.filter(e=>!e.dead&&!e.escaped&&!selected.includes(e)&&Math.hypot(e.x-origin.x,e.z-origin.z)<(rain?6:has(stats,'split')?5:range)&&lineOfSight(origin.x,origin.z,e.x,e.z)).slice(0,has(stats,'blast')||rain?6:2);for(const e of splash)events.push({...hurtEnemy(e,primary[0].damage*(rain?.7:.35)),secondary:true});}
  if(index===1&&syn(stats,'permafrost'))for(const e of enemies)if(!e.dead&&Math.hypot(e.x-player.x,e.z-player.z)<7)stopCast(e,e.kind===5?1:4.5);
  if(has(stats,'timestop')&&primary.some(a=>a.critical)&&player.elapsed>=(m.stopAt||0)){m.stopAt=player.elapsed+12;for(const e of enemies)if(!e.dead&&Math.hypot(e.x-player.x,e.z-player.z)<6)stopCast(e,2);}
 }m.lastCast=player.elapsed;
 if(index===1)frostNovaFx(frostRadius,selected.length);
 if(counter&&events.length)player.counterUntil=0;
 const recovered=events.some(e=>e.weak)?Math.min(stats.maxMp-player.mp,stats.weakMana||0):0;player.mp+=recovered;return{ok:true,events,cost,recovered,area:index===1?frostRadius:0,miss:index===0&&!events.length};
}
export function enemyDrops(enemy,seed){
 const r=rng((seed^Math.imul(enemy.id+1,492927))>>>0),drops=[{kind:'essence',light:enemy.kind===5?28:enemy.kind===4?22:12,mp:enemy.kind===5?20:10,value:enemy.kind===4?1200:enemy.kind===5?700:80}];
 if(enemy.kind===4||r()<(enemy.elite?.20:.05)){const type=({1:12,2:14,3:13,4:16,5:15})[enemy.kind];drops.push({kind:'relic',seed:Math.floor(r()*4294967296),quality:2,minTier:2,...(type===undefined?{}:{forcedType:type}),rare:true});}
 else if(enemy.kind===5)drops.push({kind:'relic',seed:Math.floor(r()*4294967296),quality:2,rare:false});
 if(stageInfo.config.abyss)for(const d of drops)if(d.kind==='relic'){delete d.forcedType;Object.assign(d,{abyssFloor:stageInfo.config.abyssFloor,source:enemy.kind===5?'boss':enemy.elite?'elite':'drop',...(enemy.level===10&&enemy.elite&&r()<.04?{mythic:true}: {})});}
 return drops.map((d,i)=>{const offset=(i?-.5:.5),x=canStand(enemy.x+offset,enemy.z)?enemy.x+offset:enemy.x;return{...d,x,z:enemy.z,collected:false,age:0,phase:r()*6.28};});
}

export function naturalSpawn(enemies,player,count,random=Math.random){
 const options=cells.filter(i=>grid[i]>0&&distances[i]>7&&Math.hypot(i%W*S-START.x,Math.floor(i/W)*S-START.z)>18&&Math.hypot(i%W*S-player.x,Math.floor(i/W)*S-player.z)>16&&!lineOfSight(player.x,player.z,i%W*S,Math.floor(i/W)*S)&&!enemies.some(e=>!e.dead&&!e.escaped&&Math.hypot(e.x-i%W*S,e.z-Math.floor(i/W)*S)<3));
 const added=[];for(let n=0;n<count&&aliveCount(enemies)<ENEMY_CAP&&options.length;n++){const i=options.splice(Math.floor(random()*options.length),1)[0],spawn=spawnTrapEnemies(enemies,{x:i%W*S,z:Math.floor(i/W)*S,id:n,natural:true,kind:Math.floor(random()*4)},1);for(const e of spawn){e.x=i%W*S;e.z=Math.floor(i/W)*S;e.homeRoom=grid[i];}added.push(...spawn);}return added;
}
export {aliveCount,spawnDue};