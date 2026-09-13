import {ABYSS_GEAR,POWERS,composePowers} from './abyss-gear.js';
import {depthLoot,RARITY_RATES} from './abyss-rules.js';
import {gearGrade,gradeScale,rollGrade,applyEnchants,enchantText} from './equipment-crafting.js';
import {effectStats} from './gear-effects.js';
import {CHAPTERS} from './journey.js';
// Rare grades increase both intrinsic abilities and affixes; abyss gear only comes from clears.
export const DRAW_COST=600,INVENTORY_LIMIT=300,CACHE_LIMIT=300;
export const RARITIES=[{name:'COMMON',ja:'通常',color:'#b0ced1'},{name:'RARE',ja:'希少',color:'#b7a1ff'},{name:'EPIC',ja:'特級',color:'#ff9bd9'},{name:'LEGENDARY',ja:'伝説',color:'#ffdc83'},{name:'ABYSS',ja:'深淵',color:'#76ffe4'},{name:'MYTHIC',ja:'神話',color:'#fff4c7'}];
export const RELICS=[
 {name:'暁光の杖',slot:0,effect:'光弾の威力 +10%',key:'dawn'},
 {name:'氷晶の杖',slot:0,effect:'氷槍の凍結 +1秒 · 狼/銀光特効',key:'frost'},
 {name:'反響の杖',slot:0,effect:'光弾が近くの敵1体にも35%伝播',key:'echo'},
 {name:'魂喰いの杖',slot:0,effect:'撃破時のMP回復 +2',key:'soul'},
 {name:'不屈の護符',slot:1,effect:'最大HP +8',key:'vigor'},
 {name:'緋色の護符',slot:1,effect:'治癒の回復量 +20%',key:'mend'},
 {name:'月読の護符',slot:1,effect:'最大MP +8',key:'moon'},
 {name:'鷹眼の護符',slot:1,effect:'会心率 +5%',key:'hawk'},
 {name:'帰路の灯芯',slot:2,effect:'光の容量 +4',key:'home'},
 {name:'探鉱の灯芯',slot:2,effect:'採掘速度 +20%',key:'miner'},
 {name:'黄金の灯芯',slot:2,effect:'宝の価値 +8%',key:'gold'},
 {name:'星泉の灯芯',slot:2,effect:'MP自然回復 +25%',key:'spring'},
 {name:'疾風の護衣',slot:1,effect:'移動速度 ×1.1',key:'swift'},
 {name:'定着の護衣',slot:1,effect:'敵の転位術を無効化',key:'anchor'},
 {name:'巨岩の護衣',slot:1,effect:'巨兵・番人の叩きつけダメージ −35%',key:'granite'},
 {name:'王の星槍',slot:0,effect:'弱点への魔法ダメージ +20%',key:'royal'},
 {name:'銀星の杖',slot:0,effect:'光弾の再使用時間 −15%',key:'silver'},
 {name:'黎明の灯芯',slot:2,effect:'光の回復アイテムの効果 +25%',key:'dawnlight'},
 {name:'夜王の断光槍',slot:0,effect:'弱点ダメージ +80% · 弱点命中でMP +3（1射1回）',key:'nightking',exclusive:true},
 {name:'不死鳥の黒鎧',slot:1,effect:'致命傷を1ラン1回耐えHP35%で復活 · 最大HP +24',key:'phoenix',exclusive:true},
 {name:'星蝕の灯芯',slot:2,effect:'攻撃を移動で見切ると光 +4・MP +3（再発動4秒）',key:'eclipse',exclusive:true},
 ...ABYSS_GEAR
];
export const TYPE_UNLOCKS=[2,4,5,4,3,3,3,3,4,4,4,4,3,5,5,8,6,8,8,8,8];
export const CATALOG_SIZE=75+ABYSS_GEAR.length;
export const SLOTS=['武器','防具・護符','灯芯'];
export const AFFIXES=[{name:'魔力',key:'power',max:8},{name:'体力',key:'hp',max:16},{name:'魔力容量',key:'mp',max:12},{name:'防御',key:'armor',max:4},{name:'会心',key:'crit',max:5},{name:'省魔力',key:'economy',max:5}];
export function random(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function rarityOdds(quality=0,pity=0){return pity>=9?[0,0,.99,.01]:quality>=1?[.40,.39,.20,.01]:[...RARITY_RATES.gacha];}
export function rollRelic(seed,quality=0,pity=0,options={}){
 const r=random(seed),odds=rarityOdds(quality,pity);let roll=r(),tier=3;for(let i=0;i<4;i++){roll-=odds[i];if(roll<0){tier=i;break;}}
 const depth=options.abyssFloor?depthLoot(options.abyssFloor,options.source):null;
 if(depth){const chance=r(),boost=Math.min(.65,options.qualityBoost||0),mythic=depth.mythic*(options.source==='elite'?4:1),abyss=depth.abyss*(1+boost),legend=depth.legend*(1+boost);tier=chance<mythic?5:chance<mythic+abyss?4:chance<mythic+abyss+legend?3:2;}
 const deepSource=['mine','enemy','elite'].includes(options.source)&&(options.abyssFloor||0)>=10;if(deepSource)tier=Math.max(tier,4);
 tier=Math.max(tier,options.minTier||0,depth?.minTier||0);if(options.mythic)tier=5;
 const unlocked=options.unlocked||18,allowed=RELICS.map((_,i)=>i).filter(i=>tier>=4?RELICS[i].abyss&&!!RELICS[i].mythic===(tier===5)&&(RELICS[i].minFloor||10)<=(options.mythic?Math.max(80,options.abyssFloor||99):options.abyssFloor||99):!RELICS[i].exclusive&&TYPE_UNLOCKS[i]<=unlocked);
 const type=options.forcedType??allowed[Math.floor(r()*allowed.length)]??0,def=RELICS[type];if(def.exclusive)tier=def.mythic?5:def.abyss?4:3;
 const deepGrade=()=>{const f=options.abyssFloor||10,base=f>=90?5:f>=70?4:f>=50?3:2,bonus=f>=90?0:f>=70?.15:f>=50?.15:f>=30?.20:.10;return Math.min(5,base+(r()<bonus?1:0));};
 const abyssGrade=tier===4?(deepSource?deepGrade():rollGrade(options.abyssFloor||10,r,['chest','boss'].includes(options.source))):0,maxRoll=tier===4?50+abyssGrade*10:100;
 const a=Math.floor(r()*AFFIXES.length),b=(a+1+Math.floor(r()*(AFFIXES.length-1)))%AFFIXES.length,minRoll=Math.max(1,Math.min(maxRoll,options.minRoll||depth?.minRoll||1));
 const extraPool=POWERS.filter(p=>p.minFloor<=(options.abyssFloor||10)&&!def.powers?.includes(p.key)),extraPowers=def.abyss&&!def.curse&&extraPool.length?[extraPool[Math.floor(r()*extraPool.length)].key]:[];
 return{id:(seed>>>0).toString(36)+'-'+Math.floor(r()*1e8).toString(36),type,tier,a,b,rollA:minRoll+Math.floor(r()*(maxRoll+1-minRoll)),rollB:minRoll+Math.floor(r()*(maxRoll+1-minRoll)),depth:Math.max(0,Math.min(20,Math.floor(options.depth||depth?.powerDepth||0))),favorite:false,...(tier===4?{abyssGrade}:{}),...(def.abyss?{extraPowers,upgrade:0,evolutionKills:0,evolved:false}: {})};
}
export function affixValue(item,second=false){const depth=Math.max(0,Math.min(20,item.depth||0)),scale=(1+depth*.025)*gradeScale(item);return Math.max(1,Math.round(AFFIXES[second?item.b:item.a].max*[.55,.90,1.45,2.6,3.5,4.8][item.tier]*(1+(item.upgrade||0)*.04)*(.45+(second?item.rollB:item.rollA)/100*.55)*scale));}
export function relicQuality(item){return Math.round((item.rollA+item.rollB)/2);}
export function relicPower(item){const depth=Math.max(0,Math.min(20,item.depth||0));return [25,65,150,360,650,1100][item.tier]+Math.round(relicQuality(item)*[.18,.30,.55,1.1,1.5,2.2][item.tier])+(RELICS[item.type].exclusive?120:0)+depth*14;}
export function salvageValue(item){return [80,180,500,2400,5000,12000][item.tier];}
export function toggleFavorite(item){if(!item)return false;item.favorite=!item.favorite;return item.favorite;}
export function sellRelic(progress,id){const item=progress.inventory.find(i=>i.id===id);if(!item)return{error:'装備が見つかりません。'};if(item.favorite)return{error:'お気に入りの装備は売却できません。★を外してください。'};if(progress.equipped.includes(item.id))return{error:'装備中の品は売却できません。'};progress.inventory=progress.inventory.filter(i=>i!==item);const value=salvageValue(item);progress.totalBank+=value;return{item,value};}
export function loadoutStats(progress,daily=false){
 const stats={maxHp:100,maxMp:60,power:0,armor:0,crit:.05,economy:0,lightBonus:0,mineSpeed:1,treasureBonus:1,mpRegen:1.20,killMp:6,healBonus:1,boltBonus:1,freezeBonus:0,echo:false,moveSpeed:1,warpImmune:false,slamResist:0,weakBonus:1,boltCooldown:1,lightRecovery:1,spellMultiplier:1,damageReduction:0,trapResist:0,echoCount:1,echoDamage:.35,weakMana:0,lastStand:false,dodgeLight:0,staffType:0,staffTier:0,gearDepth:0,gradeAbility:1,enemyMultipliers:[1,1,1,1,1,1]};
 if(daily)return effectStats(stats);
 for(const id of progress.equipped||[]){const item=progress.inventory?.find(i=>i.id===id);if(!item)continue;const depth=Math.max(0,Math.min(20,item.depth||0));stats.gearDepth=Math.max(stats.gearDepth,depth);if(RELICS[item.type].slot===0){stats.staffType=item.type;stats.staffTier=item.tier;stats.spellMultiplier=[1,1.10,1.25,1.60,2.05,2.55][item.tier];}else if(RELICS[item.type].slot===1){stats.maxHp+=[0,4,10,28,42,60][item.tier];stats.damageReduction=[0,.04,.10,.20,.27,.34][item.tier];}else stats.lightBonus+=[0,2,6,16,24,35][item.tier];const grade=Math.min(3,item.tier);
  for(const [a,n] of [[item.a,affixValue(item)],[item.b,affixValue(item,true)]]){const key=AFFIXES[a].key;if(key==='hp')stats.maxHp+=n;else if(key==='mp')stats.maxMp+=n;else if(key==='crit'||key==='economy')stats[key]+=n/100;else stats[key]+=n;}
  switch(RELICS[item.type].key){
   case'dawn':stats.boltBonus=[1.1,1.2,1.4,1.9][grade];stats.enemyMultipliers[0]=[1.12,1.18,1.28,1.45][grade];break;case'frost':stats.freezeBonus=[1,1.3,2,3.2][grade];stats.enemyMultipliers[1]=stats.enemyMultipliers[4]=[1.15,1.25,1.4,1.65][grade];break;
   case'echo':stats.echo=true;stats.echoCount=[1,1,2,3][grade];stats.echoDamage=[.35,.5,.7,1][grade];break;case'soul':stats.killMp+=[2,3,5,9][grade];break;
   case'vigor':stats.maxHp+=[8,14,24,45][grade];break;case'mend':stats.healBonus=[1.2,1.35,1.65,2.2][grade];break;case'moon':stats.maxMp+=[8,12,20,36][grade];break;case'hawk':stats.crit+=[.05,.08,.12,.18][grade];break;
   case'home':stats.lightBonus+=[4,8,14,25][grade];break;case'miner':stats.mineSpeed=[1.2,1.35,1.7,2.2][grade];break;case'gold':stats.treasureBonus=[1.08,1.15,1.25,1.45][grade];break;case'spring':stats.mpRegen*=[1.25,1.5,2,3][grade];break;
   case'swift':stats.moveSpeed=[1.1,1.14,1.20,1.28][grade];break;case'anchor':stats.warpImmune=true;stats.trapResist=[0,.1,.25,.45][grade];break;case'granite':stats.slamResist=[.35,.42,.52,.65][grade];break;
   case'royal':stats.weakBonus=[1.2,1.35,1.6,2.2][grade];for(const k of [2,3,5])stats.enemyMultipliers[k]=[1.12,1.22,1.38,1.65][grade];break;case'silver':stats.boltCooldown=[.85,.8,.7,.52][grade];break;case'dawnlight':stats.lightRecovery=[1.25,1.4,1.65,2.1][grade];break;
   case'nightking':stats.weakBonus=1.8;stats.weakMana=3;break;case'phoenix':stats.lastStand=true;stats.maxHp+=24;break;case'eclipse':stats.dodgeLight=4;break;
  }
 }
 stats.gradeAbility=1+Math.max(0,...(progress.equipped||[]).map(id=>gearGrade(progress.inventory.find(i=>i.id===id)||{})-1))*.04;
 const depth=stats.gearDepth||0;stats.maxHp=Math.min(240+depth*4,stats.maxHp);stats.maxMp=Math.min(160+depth*2,stats.maxMp);stats.power=Math.min(70+depth*2,stats.power);stats.armor=Math.min(22+depth,stats.armor);stats.crit=Math.min(.45+Math.min(.08,depth*.004),stats.crit);stats.economy=Math.min(.32+Math.min(.06,depth*.003),stats.economy);Object.assign(stats,composePowers((progress.equipped||[]).map(id=>progress.inventory.find(i=>i.id===id)).filter(Boolean),RELICS));return applyEnchants(effectStats(stats),(progress.equipped||[]).map(id=>progress.inventory.find(i=>i.id===id)).filter(Boolean));
}
export function rewardPrecisionEvade(player,stats,action,capacity){
 if(!action.precision||!stats.dodgeLight||player.elapsed<(player.dodgeRewardAt||0))return null;
 const light=Math.min(stats.dodgeLight,capacity-player.light),mp=Math.min(3,stats.maxMp-player.mp);player.light+=light;player.mp+=mp;player.dodgeRewardAt=player.elapsed+4;return{light,mp};
}
export function resolveDamage(amount,cause,stats,hp,reviveUsed=false){
 const resist=cause==='slam'?stats.slamResist:cause==='trap'?stats.trapResist||0:0,damage=Math.max(1,Math.round(amount*(1-resist)*(1-(stats.damageReduction||0))-stats.armor)),remaining=Math.max(0,hp-damage),revived=remaining===0&&!!stats.lastStand&&!reviveUsed;
 return{damage,hp:revived?Math.ceil(stats.maxHp*.35):remaining,revived};
}
export function relicDescription(item){
 const t=Math.min(3,item.tier),r=RELICS[item.type],effects={
 dawn:'光弾の威力 +'+[10,20,40,90][t]+'% · 影兵特効',frost:'氷槍の凍結 +'+[1,1.3,2,3.2][t]+'秒 · 狼/銀光特効',echo:'光弾が近くの敵'+[1,1,2,3][t]+'体に'+[35,50,70,100][t]+'%伝播',soul:'撃破ドロップのMP回復 +'+[2,3,5,9][t],vigor:'最大HP +'+[8,14,24,45][t],mend:'治癒の回復量 +'+[20,35,65,120][t]+'%',moon:'最大MP +'+[8,12,20,36][t],hawk:'会心率 +'+[5,8,12,18][t]+'%',home:'光の容量 +'+[4,8,14,25][t],miner:'採掘速度 +'+[20,35,70,120][t]+'%',gold:'宝の価値 +'+[8,15,25,45][t]+'%',spring:'MP自然回復 +'+[25,50,100,200][t]+'%',swift:'移動速度 ×'+[1.1,1.14,1.20,1.28][t],anchor:'敵の転位術を無効化'+(t?' · 罠ダメージ −'+[0,10,25,45][t]+'%':''),granite:'叩きつけダメージ −'+[35,42,52,65][t]+'%',royal:'弱点への魔法ダメージ +'+[20,35,60,120][t]+'% · 巨兵/術師/番人特効',silver:'光弾の再使用時間 −'+[15,20,30,48][t]+'%',dawnlight:'光の回復アイテムの効果 +'+[25,40,65,110][t]+'%'};
 const g=item.tier,intrinsic=g?(r.slot===0?'全攻撃魔法 ×'+[1,1.1,1.25,1.6,2.05,2.55][g]:r.slot===1?'HP +'+[0,4,10,28,42,60][g]+' · 全ダメージ −'+[0,4,10,20,27,34][g]+'%':'光容量 +'+[0,2,6,16,24,35][g]):'';
 const depth=Math.max(0,Math.min(20,item.depth||0)),depthText=depth?' ／ 深度補正 +'+Math.round(depth*2.5)+'%':'';return (effects[r.key]||r.effect)+((item.extraPowers||[]).length?' ／ '+item.extraPowers.map(k=>POWERS.find(p=>p.key===k)?.effect||k).join(' ／ '):'')+(item.evolved?' ／ 深淵王喰らい：最終火力×1.4':'')+(intrinsic?' ／ '+intrinsic:'')+depthText+(item.tier===4?' ／ 深淵 Grade '+['I','II','III','IV','V'][gearGrade(item)-1]+'・付加性能 ×'+gradeScale(item).toFixed(1):'')+((item.enchants||[]).length?' ／ エンチャント '+item.enchants.length+'/4：'+item.enchants.map(enchantText).join(' ／ '):'');
}
export function appraisal(progress,seed,{cache=false}={}){
 if(progress.floor<4)return{error:'遺物の鑑定は3面クリアで解放されます。'};
 if(!cache&&progress.inventory.length>=INVENTORY_LIMIT)return{error:'装備庫が満杯です。不要な装備を売却してください。'};
 if(cache&&!progress.caches.length)return{error:'未鑑定の遺物がありません。'};
 const spent=(progress.level*(1000+(1000+(progress.level-1)*750)))/2;
 if(!cache&&progress.totalBank-spent-progress.forgeSpent<DRAW_COST)return{error:'銀行の残高が足りません。'};
 const token=cache?progress.caches.shift():null,item=rollRelic(token?token.seed:seed,token?.quality||0,cache?0:progress.pity,token?{...token,unlocked:Math.max(2,progress.floor)}:{unlocked:Math.max(4,progress.floor)});
 if(!cache){progress.forgeSpent+=DRAW_COST;progress.draws++;progress.pity=item.tier>=2?0:progress.pity+1;}
 const existing=new Set(progress.inventory.map(i=>i.id));while(existing.has(item.id))item.id+='x';
 progress.inventory.push(item);const key=catalogKey(item),isNew=!progress.catalog.includes(key);if(isNew)progress.catalog.push(key);
 return{item,isNew,cache};
}
export function appraisalBatch(progress,seeds){
 if(progress.floor<4)return{error:'遺物の鑑定は3面クリアで解放されます。'};
 if(seeds.length!==10)return{error:'10連の抽選を準備できませんでした。'};
 if(progress.inventory.length+10>INVENTORY_LIMIT)return{error:'10連には装備庫の空きが10枠必要です。'};
 const spent=progress.level*(2000+(progress.level-1)*750)/2;
 if(progress.totalBank-spent-progress.forgeSpent<DRAW_COST*10)return{error:'10連には銀行の宝 ¥6,000 が必要です。'};
 const draft=structuredClone(progress),results=seeds.map(seed=>appraisal(draft,seed));
 if(results.some(r=>r.error))return{error:'抽選を完了できませんでした。宝は消費していません。'};
 Object.assign(progress,draft);return{results,highest:Math.max(...results.map(r=>r.item.tier)),cost:DRAW_COST*10};
}
export function dailyChallenge(now=new Date()){
 const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);let seed=2166136261;for(const ch of 'LIGHT-MAZE-8-'+day)seed=Math.imul(seed^ch.charCodeAt(0),16777619);return{day,seed:seed>>>0,floor:7};
}
export function calculateScore(run,coverage,cleared,success){
 const parts={宝:Math.floor(run.bag*.45),撃破:run.kills*180,探索:Math.floor(coverage*12),遺物:run.caches.length*250,突破:cleared?run.floor*1500:0,時間:cleared?Math.floor(Math.max(0,300-run.elapsed)*12):0,生還:success?Math.floor(run.hp*4+run.light*6):0};
 const raw=Object.values(parts).reduce((a,b)=>a+b,0),score=success?raw:Math.floor(raw*.25);return{score,parts,rank:score>=14000?'S':score>=9500?'A':score>=5500?'B':score>=2500?'C':'D'};
}

export function claimMilestoneGifts(progress){
 const received=[];for(const c of CHAPTERS){if(c.gift===undefined||!progress.chapterStars[String(c.id)]||progress.claimedGifts.includes(c.id)||progress.inventory.length>=INVENTORY_LIMIT)continue;
  const item=rollRelic(981237+c.id*377,0,0,{forcedType:c.gift,minTier:c.id===7?3:1});item.id='gift-'+c.id;progress.inventory.push(item);progress.claimedGifts.push(c.id);const key=catalogKey(item);if(!progress.catalog.includes(key))progress.catalog.push(key);const slot=RELICS[item.type].slot;if(!progress.equipped[slot])progress.equipped[slot]=item.id;received.push(item);
 }return received;
}

export const catalogKey=item=>item.type<21?item.type*4+item.tier:1000+item.type;
export function appraiseAll(progress){const n=progress.caches.length;if(!n)return{error:'未鑑定の遺物がありません。'};const draft=structuredClone(progress),results=[];for(let i=0;i<n;i++){const result=appraisal(draft,0,{cache:true});if(result.error)return result;results.push(result);}Object.assign(progress,draft);return{results,highest:Math.max(...results.map(r=>r.item.tier)),cost:0};}
export function workshop(progress,id,action,seed=1,lock=false){const item=progress.inventory.find(i=>i.id===id);if(!item||item.tier<3)return{error:'伝説以上の装備を選んでください。'};progress.shards??=0;
 if(action==='salvage'){if(item.favorite||progress.equipped.includes(id))return{error:'お気に入り・装備中は分解できません。'};const value=[0,0,0,5,12,30][item.tier];progress.inventory=progress.inventory.filter(i=>i.id!==id);progress.shards+=value;return{message:'星屑 +'+value};}
 const cost=action==='upgrade'?5+5*(item.upgrade||0):lock?20:10;if(progress.shards<cost)return{error:'星屑 '+cost+' が必要です。'};
 if(action==='upgrade'){if((item.upgrade||0)>=5)return{error:'強化上限 +5 です。'};item.upgrade=(item.upgrade||0)+1;}else if(action==='reroll'){const r=random(seed),maxRoll=item.tier===4?50+gearGrade(item)*10:100;if(!lock){item.a=Math.floor(r()*AFFIXES.length);item.rollA=1+Math.floor(r()*maxRoll);}item.b=(item.a+1+Math.floor(r()*5))%6;item.rollB=1+Math.floor(r()*maxRoll);if(RELICS[item.type].abyss&&!lock){const pool=POWERS.filter(p=>p.minFloor<=Math.max(10,item.depth*5)&&!RELICS[item.type].powers?.includes(p.key));if(pool.length)item.extraPowers=[pool[Math.floor(r()*pool.length)].key];}}else return{error:'不明な操作です。'};progress.shards-=cost;return{message:action==='upgrade'?'性能を強化しました':'付加効果を再抽選しました（固有能力は保持）'};
}
