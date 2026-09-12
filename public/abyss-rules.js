// Shared, deterministic balance rules. Campaign 1–7 use their existing configuration.
export const ABYSS_MAX_FLOOR=99,ENEMY_CAP=20;
export const BOSS_FLOORS=[10,20,30,40,60,70,80,98],BONUS_FLOORS=[25,50,75,99];
export const isBonusFloor=f=>BONUS_FLOORS.includes(f);
export const bound=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
export function enemyLevelForFloor(floor,{endless=false}={}){return endless?Math.min(10,3+Math.floor((bound(floor,1,99)-1)/13)):floor>=13?3:floor>=8?2:1;}
export function enemyLevelScale(level=1){const n=bound(level,1,10)-1;return{hp:1+n*.38+n*n*.025,damage:1+n*.24,speed:1+n*.036,tempo:Math.max(.62,1-n*.039),range:1+Math.floor(n/2)*.055};}
export function population(depth=1){const f=bound(depth,1,99);return f>=95?{initial:17,spawn:3}:f>=80?{initial:16,spawn:3}:f>=65?{initial:15,spawn:3}:f>=50?{initial:14,spawn:2}:f>=35?{initial:13,spawn:2}:f>=20?{initial:11,spawn:2}:f>=10?{initial:10,spawn:1}:{initial:9,spawn:1};}
export const MUTATIONS=[
 {id:'swift',name:'俊足',effect:'移動速度 +25%',min:5}, {id:'giant',name:'巨体',effect:'HP +45%・攻撃範囲 +20%',min:5},
 {id:'fury',name:'狂暴',effect:'攻撃力 +35%・予告時間 −10%',min:5},{id:'regen',name:'再生',effect:'毎秒HP1.5%回復。凍結中は止まる',min:5},
 {id:'drain',name:'吸光',effect:'命中時LIGHTを奪う',min:5},{id:'ward',name:'結界',effect:'最初の2撃を軽減。氷槍で全解除',min:5},
 {id:'split',name:'分裂',effect:'撃破時に子を2体残す（上限20体）',min:7},{id:'phantom',name:'幻影',effect:'通常時の被ダメージ−25%。凍結で無効',min:7}
];
export const ROUTES=[{id:'normal',name:'通常の回廊',text:'通常の危険度と報酬',enemy:1,quality:0,traps:1},{id:'hunt',name:'修羅の回廊',text:'初期敵 +50%（最大20）・品質 +20%',enemy:1.5,quality:.20,traps:1},{id:'trap',name:'埋もれた回廊',text:'罠 +60%・発掘率と品質上昇',enemy:1,quality:.12,traps:1.6}];
export const MUTATORS=[{id:'wrath',name:'敵攻撃 +50%'},{id:'horde',name:'増援30秒'},{id:'famine',name:'HP回復半減'},{id:'elite',name:'エリート大量'},{id:'night',name:'LIGHT消費 +40%'}];
export function floorRules(floor,{route='normal',mutators=[]}={}){const f=bound(floor,1,99),r=ROUTES.find(r=>r.id===route)||ROUTES[0],pop=population(f),bonus=isBonusFloor(f),night=f>=20&&f<40||f>=60&&f<80,horde=f>=40&&f<60||f>=80;return{floor:f,bonus,bonusCount:bonus?(f===25?1:f===50?2:f===75?3:1):0,route:r.id,level:enemyLevelForFloor(f,{endless:true}),initial:bonus?0:Math.min(20,Math.ceil(pop.initial*r.enemy)),spawnCount:bonus?0:pop.spawn,spawnInterval:horde||mutators.includes('horde')?30:60,light:bonus?0:(night?1.3:1)*(mutators.includes('night')?1.4:1),damage:mutators.includes('wrath')?1.5:1,heal:mutators.includes('famine')?.5:1,elite:(horde?2:1)*(mutators.includes('elite')?3:1),quality:r.quality+(night?.4:0)+mutators.length*.08,traps:bonus?0:r.traps,scoreMultiplier:1+mutators.length*.25,curse:bonus?'':night?'永夜：LIGHT +30%・品質 +40%':horde?'百鬼夜行：増援30秒・エリート率×2':'',boss:BOSS_FLOORS.includes(f),chest:f%5===0||bonus};}
export function excavationCount(random=Math.random,route='normal'){const n=random();return n<(route==='trap'?.12:.32)?0:n<.90?1:2;}
export const EVENT_TYPES=[{id:'altar',name:'祭壇',text:'HP25%を捧げて、探索中の攻撃力+15%'},{id:'vault',name:'呪われた宝物庫',text:'影兵2体を呼び、高品質遺物を得る'},{id:'merchant',name:'深淵の商人',text:'この探索の宝¥600でHPとMPを回復'},{id:'spring',name:'星の泉',text:'HP40%・LIGHT25を回復。増援タイマーを20秒進める'},{id:'grave',name:'墓標',text:'LIGHT20を捧げて探索強化を1つ選ぶ'}];
export const BOONS=[{id:'bolt',name:'光弾 +20%',text:'探索終了まで光弾威力を強化'},{id:'leech',name:'撃破吸命',text:'撃破時HP +3'},{id:'blast',name:'光爆範囲 +40%',text:'範囲攻撃の半径を拡大。未所持なら小光爆を付与'},{id:'mana',name:'魔力の泉',text:'MP自然回復 +30%'},{id:'stride',name:'疾走',text:'移動速度 +8%'},{id:'wick',name:'長命の灯',text:'LIGHT消費 −12%'}];
export const BOSS_PATTERNS=['双環の番人','追光の番人','凍てる番人','影召の番人','吸光の番人','三環の番人','狂嵐の番人','鏡像の番人','終焉の番人','深淵王'];
export function bossTitle(floor){return BOSS_PATTERNS[floor===98?9:Math.max(0,Math.min(8,Math.floor(floor/10)-1))];}
export function depthLoot(depth=0,source='mine'){const f=bound(depth,0,99),band=f>=90?5:f>=70?4:f>=50?3:f>=30?2:f>=10?1:0;return{band,minRoll:Math.min(90,30+band*11),powerDepth:f?Math.min(20,Math.floor(f/5)+2):0,legend:f?Math.min(.25,.025+f*.0022):.01,abyss:f>=10?.06+band*.07:0,mythic:f>=80?.05:0,minTier:source==='chest'?(f>=10?3:2):source==='boss'?3:0};}
export const RARITY_RATES={gacha:[.625,.29,.075,.01],mine:[.63,.29,.07,.01]};
