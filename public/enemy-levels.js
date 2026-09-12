import {enemyLevelScale,MUTATIONS,bossTitle,ENEMY_CAP} from './abyss-rules.js';
export const aliveCount=enemies=>enemies.filter(e=>!e.dead&&!e.escaped).length;
export function levelEnemy(e,config,random=Math.random){
 const level=config.enemyLevel||1,s=enemyLevelScale(level);e.level=level;e.scale=s;e.mutations=[];e.elite=false;
 if(level>=5&&random()<Math.min(.42,.07+(level-5)*.035)*(config.rules?.elite||1)){e.elite=true;const pool=MUTATIONS.filter(m=>m.min<=level);for(let n=0;n<(level>=8?2:1);n++)e.mutations.push(pool.splice(Math.floor(random()*pool.length),1)[0].id);}
 const has=k=>e.mutations.includes(k);e.maxHp=Math.round(e.maxHp*s.hp*(e.elite?1.4:1)*(has('giant')?1.45:1));e.hp=e.maxHp;
 e.levelSpeed=s.speed*(has('swift')?1.25:1)*(has('giant')?.85:1);e.levelDamage=s.damage*(has('fury')?1.35:1)*(config.rules?.damage||1);e.levelTempo=s.tempo*(has('fury')?.9:1);if(has('giant'))e.scale={...s,range:s.range*1.2};e.ward=has('ward')?2:0;
 e.bossPattern=e.kind===5&&config.abyss?Math.min(9,Math.floor(config.abyssFloor/10)-1+(config.abyssFloor===98?1:0)):null;e.title=e.bossPattern!==null?bossTitle(config.abyssFloor):'';
 e.label='Lv.'+level+' '+e.mutations.map(k=>MUTATIONS.find(m=>m.id===k)?.name).join(' ')+' '+(e.elite?'◆':'');return e;
}
export function spawnDue(clock,dt,rules,enemies){if(rules.bonus){clock.seconds=0;return 0;}const interval=rules.spawnDelay||rules.spawnInterval;clock.seconds=(clock.seconds||0)+dt;if(clock.seconds<interval)return 0;clock.seconds%=interval;return Math.max(0,Math.min(rules.spawnCount,ENEMY_CAP-aliveCount(enemies)));}
export function bossZones(e,player){
 // Guardian rifts are a reaction check, not unavoidable damage: keep at most two
 // simultaneous danger circles and shrink them enough to leave a real escape lane.
 const r=(e.enraged?1.30:1.10)*(e.scale?.range||1),aim={x:player.x,z:player.z,radius:r};
 if(e.bossPattern===null||e.bossPattern===undefined)return[aim];
 const pattern=e.bossPattern%5;
 if(pattern===0)return[aim,{x:e.x,z:e.z,radius:1.75}];
 if(pattern===1)return[{x:aim.x-2.7,z:aim.z,radius:r*.78},{x:aim.x+2.7,z:aim.z,radius:r*.78}];
 if(pattern===2)return[aim,{x:aim.x,z:aim.z+3.0,radius:r*.82}];
 if(pattern===3)return[aim,{x:e.x+(player.x>=e.x?-3.1:3.1),z:e.z,radius:r*.82}];
 const angle=Math.atan2(player.z-aim.z,player.x-aim.x)+Math.PI/2;
 return[aim,{x:aim.x+Math.cos(angle)*3.4,z:aim.z+Math.sin(angle)*3.4,radius:r*.76}];
}
