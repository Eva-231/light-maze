import {awakened} from './abyss-gear.js';
export const has=(s,k)=>(s.powers||[]).includes(k),cursed=(s,k)=>(s.curses||[]).includes(k),syn=(s,k)=>(s.synergies||[]).includes(k);
export function effectStats(stats){const s=stats;s.powers??=[];s.curses??=[];s.synergies=awakened(s.powers).map(a=>a.key);s.lightDrain=1;s.lootQuality=0;s.spawnFactor=1;s.normalHeal=1;s.castSpeed=1;
 if(has(s,'deepfreeze'))s.freezeBonus+=2;if(has(s,'manareturn'))s.killMp+=4;if(has(s,'fastcast'))s.castSpeed=.75;if(has(s,'minereye'))s.mineSpeed*=1.5;if(has(s,'treasure'))s.treasureBonus*=1.3;
 if(has(s,'eternallamp'))s.lightDrain*=.7;if(has(s,'abysssense'))s.lootQuality+=.15;if(has(s,'greed'))s.treasureBonus*=1.6;if(has(s,'berserk'))s.armor*=.5;if(has(s,'procession'))s.spawnFactor*=.8;
 if(cursed(s,'greedking')){s.lootQuality+=.35;s.spawnFactor*=.6;}if(cursed(s,'bloodamulet'))s.normalHeal=0;if(cursed(s,'blindlamp')){s.lightDrain=.4;s.noMap=true;}if(cursed(s,'deathcontract'))s.maxHp=Math.round(s.maxHp*.6);
 if(has(s,'echo')){s.echo=true;s.echoCount=2;s.echoDamage=.5;}if(has(s,'lightpact'))s.economy=Math.min(.65,s.economy+.3);return s;
}
export function runtimeStats(base,run){const s={...base,powers:[...(base.powers||[])],curses:[...(base.curses||[])]};for(const boon of run?.boons||[]){if(boon==='altar')s.spellMultiplier*=1.15;if(boon==='bolt')s.boltBonus*=1.2;if(boon==='leech')s.boonLeech=(s.boonLeech||0)+3;if(boon==='blast'){s.blastRange=(s.blastRange||1)+.4;if(!s.powers.includes('blast'))s.powers.push('blast');}if(boon==='mana')s.mpRegen*=1.3;if(boon==='stride')s.moveSpeed*=1.08;if(boon==='wick')s.lightDrain*=.88;}s.blastRange=Math.min(3,s.blastRange||1);s.moveSpeed=Math.min(1.65,s.moveSpeed);s.boltBonus=Math.min(base.boltBonus*2.4,s.boltBonus);s.spellMultiplier=Math.min(base.spellMultiplier*1.6,s.spellMultiplier);s.mpRegen=Math.min(base.mpRegen*2,s.mpRegen);s.boonLeech=Math.min(12,s.boonLeech||0);s.lightDrain=Math.max((base.lightDrain||1)*.35,s.lightDrain||1);s.abyssFloor=run?.floor||0;return s;}
export function strikeMultiplier(s,p,e,index,distance,ordinal){const m=p.effectState??={},health=p.hp/s.maxHp;let value=1;
 if(has(s,'pristine')&&health>=.999)value*=2;if(has(s,'fullmoon')&&health>=.999)value*=1.3;if(has(s,'executioner')&&e.hp/e.maxHp<.3)value*=1.8;if(has(s,'giantslayer')&&[2,5].includes(e.kind))value*=1.7;
 if(has(s,'focus')&&m.target===e.id)value*=1+Math.min(.75,(m.focus||0)*.15);if(has(s,'overcharge')&&(p.elapsed-(m.lastCast??-10))>=3)value*=2;
 if(has(s,'sniper'))value*=1+Math.min(.7,distance*.06);if(has(s,'pointblank')&&distance<3)value*=1.7;if(has(s,'combo')&&p.elapsed-(m.lastHit||0)<2)value*=1+Math.min(.5,(m.combo||0)*.1);
 if(has(s,'challenger')&&e.elite)value*=1.7;if(has(s,'revenge')&&p.elapsed-(m.lastDamage??-20)<4)value*=1.8;if(has(s,'lastlight')&&p.light/p.lightMax<.2)value*=1.8;
 if(has(s,'berserk'))value*=1.5;if(has(s,'desperate')&&health<.3)value*=2;if(has(s,'condition')&&health>=.8)value*=1.2;if(has(s,'perfection')&&p.elapsed-(m.lastDamage||0)>15)value*=1.35;
 if(has(s,'hunting'))value*=1+Math.min(.3,(p.huntChain||0)*.03);if(has(s,'asura')&&(p.nearEnemies||0)>=3)value*=1.5;if(has(s,'solitary')&&p.nearEnemies===1)value*=1.5;
 if(has(s,'assimilation'))value*=1+Math.min(.36,Math.floor((s.abyssFloor||0)/10)*.04);if(has(s,'secondform')&&p.reviveUsed)value*=1.5;if(has(s,'eater'))value*=1+Math.min(1.5,(m.devoured||0)*.006);if(has(s,'eaterking'))value*=1.4;
 if(has(s,'iceburial')&&e.stun>.35)value*=1.8;if(has(s,'drill'))value*=1+ordinal*.35;if(cursed(s,'madking'))value*=2.2;return value;
}
export function rememberStrike(s,p,e){const m=p.effectState??={};m.focus=m.target===e.id?Math.min(5,(m.focus||0)+1):1;m.target=e.id;m.combo=p.elapsed-(m.lastHit||0)<2?Math.min(5,(m.combo||0)+1):1;m.lastHit=p.elapsed;m.hits=(m.hits||0)+1;if(has(s,'cycle')||syn(s,'permafrost'))p.mp=Math.min(s.maxMp,p.mp+(syn(s,'permafrost')?3:1));}
export function damageEffects(s,p,amount,random=Math.random){const m=p.effectState??={};let damage=amount;const hp=p.hp/s.maxHp;
 if(has(s,'evade')&&random()<.2)return{damage:0,blocked:true};if(syn(s,'flawless')&&p.elapsed-(m.shieldAt??-8)>=8&&p.elapsed-(m.lastDamage??-8)>=8){m.shieldAt=p.elapsed;return{damage:0,blocked:true};}
 if(has(s,'barrier')&&p.elapsed-(m.shieldAt??-8)>=8&&p.elapsed-(m.lastDamage??-8)>=8){damage=Math.max(0,damage-20);m.shieldAt=p.elapsed;}
 if(has(s,'fullmoon')&&hp>=.999)damage*=.7;if(has(s,'emergency')&&hp<.25)damage*=.6;if(has(s,'greed'))damage*=1.2;if(cursed(s,'madking'))damage*=1.5;
 if(has(s,'manaarmor')){const spent=Math.min(p.mp,Math.ceil(damage*.4));p.mp-=spent;damage-=spent;}m.lastDamage=p.elapsed;return{damage:Math.max(0,damage)};
}
export function reviveEffects(s,p){if(p.reviveUsed)return false;if(has(s,'reincarnation')){p.hp=s.maxHp;p.mp=s.maxMp;p.light=p.lightMax;p.reviveUsed=true;return true;}if(has(s,'unyielding')){p.hp=1;p.reviveUsed=true;return true;}return false;}
export function killEffects(s,p,e){const m=p.effectState??={};m.devoured=Math.min(300,(m.devoured||0)+(e.level||1));const multiplier=syn(s,'nightfeast')?2:1,heal=((has(s,'leech')?5:0)+(s.boonLeech||0)+(cursed(s,'bloodamulet')?7:0)+(syn(s,'deathline')&&p.hp/s.maxHp<.3?8:0))*multiplier;p.hp=Math.min(s.maxHp,p.hp+heal);if(has(s,'devourlight'))p.light=Math.min(p.lightMax,p.light+3*multiplier);if(has(s,'plunder'))p.bag+=100;if(has(s,'procession'))p.bag+=64;}
export function temporaryMove(s,p){return has(s,'condition')&&p.hp/s.maxHp>=.8?1.12:1;}
export function lootQuality(s,p){return Math.min(.65,(s.lootQuality||0)+(has(s,'luckchain')?Math.min(.15,Math.floor((p.huntChain||0)/5)*.05):0));}
