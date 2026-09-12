import {enemyLevelForFloor,floorRules} from './abyss-rules.js';
export const CHAPTERS=[
 {id:1,name:'はじまりの灯',lesson:'光を照らす・宝を拾う・入口へ帰る',cols:2,rows:2,seals:1,enemies:0,kinds:[],spells:[],flash:false,mine:false,traps:false,collapse:false,omens:false,lightScale:.58,reward:'光弾を解放 · 暁光の杖',gift:0},
 {id:2,name:'最初の守護者',lesson:'光弾で守護者を倒し、落とした光を拾う',cols:3,rows:2,seals:2,enemies:2,kinds:[0],spells:[0],flash:false,mine:false,traps:false,collapse:false,omens:false,lightScale:.72,reward:'治癒・FLASH・防具を解放 · 疾風の護衣',gift:12},
 {id:3,name:'踏み込む勇気',lesson:'突進を横に避ける・HPを回復する',cols:3,rows:3,seals:2,enemies:4,kinds:[0,1,2],spells:[0,2],flash:true,mine:false,traps:false,collapse:false,omens:false,lightScale:.85,reward:'氷槍・採掘・遺物鑑定を解放'},
 {id:4,name:'鉱脈のささやき',lesson:'鉱脈を掘り、遺物を生還して鑑定する',cols:3,rows:3,seals:2,enemies:5,kinds:[0,1,2],spells:[0,1,2],flash:true,mine:true,traps:false,collapse:false,omens:false,lightScale:.92,reward:'定着の護衣を獲得 · 転位術への備え',gift:13},
 {id:5,name:'ゆがむ回廊',lesson:'転位術を中断する・防具で対策を選ぶ',cols:4,rows:3,seals:3,enemies:6,kinds:[0,1,2,3],spells:[0,1,2],flash:true,mine:true,traps:true,collapse:false,omens:false,lightScale:1,reward:'銀光の精が出現 · 崩壊からの帰還を解放'},
 {id:6,name:'逃げる銀の光',lesson:'銀光の精を追い込む・崩壊前に帰還する',cols:4,rows:3,seals:3,enemies:7,kinds:[0,1,2,3,4],spells:[0,1,2],flash:true,mine:true,traps:true,collapse:true,omens:true,lightScale:1,reward:'深淵の番人への道が開く'},
 {id:7,name:'深淵の番人',lesson:'番人の予備動作を読み、攻撃後の隙を突く',cols:4,rows:4,seals:3,enemies:8,kinds:[0,1,2,3,4,5],spells:[0,1,2],flash:true,mine:true,traps:true,collapse:true,omens:true,lightScale:1.03,reward:'伝説の王の星槍 · 毎回 特級以上2個 · 第8面へ',gift:15},
 ...['残光の坑道','忘却の水路','紅蓮の工房','転位の塔','鏡界の門','黒き聖堂','裂けた月','亡王の庭','無明の海','星骸の宮','深淵の境界'].map((name,i)=>({id:i+8,name,lesson:i<5?'Lv.2の敵の隙を読み、装備を組み合わせる':'Lv.3の強化技を見切る。凍結・弱点・防御相性を使おう',cols:4,rows:4,seals:3,enemies:i<5?9:10,kinds:[0,1,2,3,4,5],spells:[0,1,2],flash:true,mine:true,traps:true,collapse:true,omens:true,lightScale:1.03,reward:i===10?'99F探索「深淵」を解放':i<5?'特級以上の装備2個 · 次の面へ':'特級以上2個・伝説1個 · 次の面へ'}))
];
export const DIFFICULTIES=[
 {key:'easy',name:'簡単',target:'80〜100%',hp:1.05,damage:1.05,speed:1.03,windup:.95,recovery:.94,trapFuse:.9,trapDamage:19,bonus:1},
 {key:'normal',name:'普通',target:'50%',hp:1.16,damage:1.22,speed:1.08,windup:.84,recovery:.82,trapFuse:.72,trapDamage:24,bonus:1},
 {key:'hard',name:'難しい',target:'20%',hp:1.85,damage:1.72,speed:1.19,windup:.62,recovery:.66,trapFuse:.20,trapDamage:48,bonus:2},
 {key:'abyss',name:'高難易度',target:'5%',hp:2.85,damage:2.55,speed:1.34,windup:.42,recovery:.50,trapFuse:.08,trapDamage:72,bonus:4}
];
export const difficultyFor=stage=>DIFFICULTIES[stage<=2?0:stage<=6?1:stage===7?2:stage<=12?1:2];
export function abyssRewardCurve(level=1){
 const n=Math.max(0,Math.floor(level)-1);
 return{count:Math.floor(level)%5===0?3:2,minRoll:Math.min(95,70+Math.floor(n*1.1)),depth:Math.min(20,Math.floor(n/2))};
}
export function clearRewardTokens(run){
 if(run.runMode==='daily'||run.floor<7)return[];
 const count=run.floor>=13?3:2;
 return Array.from({length:count},(_,i)=>({seed:((run.seed^0x7F83A)+Math.imul(i+1,2654435761))>>>0,quality:2,minTier:run.floor>=13&&i===0?3:2,minRoll:run.floor>=13?60:40,depth:Math.max(0,Math.floor((run.floor-7)/3))}));
}
export function recordAttempt(progress,stage){const key=difficultyFor(stage).key;progress.difficultyStats??={};const d=progress.difficultyStats[key]??={attempts:0,clears:0};d.attempts++;}
export function recordClear(progress,stage){const d=progress.difficultyStats?.[difficultyFor(stage).key];if(d)d.clears=Math.min(d.attempts,d.clears+1);}
export function abyssDifficulty(level=1){
 const base=DIFFICULTIES[3],n=Math.max(0,Math.floor(level)-1),first=Math.min(10,n),second=Math.min(10,Math.max(0,n-10)),deep=Math.max(0,n-20);
 const hp=Math.min(2,1+first*.035+second*.022+deep*.012),damage=Math.min(1.55,1+first*.020+second*.012+deep*.006),speed=Math.min(1.10,1+first*.006+second*.003+deep*.0015),tempo=Math.max(.82,1-first*.008-second*.004-deep*.002);
 return{...base,hp:base.hp*hp,damage:base.damage*damage,speed:base.speed*speed,windup:base.windup*tempo,recovery:base.recovery*Math.max(.84,tempo+.03),trapDamage:Math.round(base.trapDamage*Math.min(1.45,1+first*.015+second*.008+deep*.004))};
}
export function chapterConfig(stage=1,trialLevel=1){const chapter=CHAPTERS[Math.max(0,Math.min(17,Math.floor(stage)-1))];return{...chapter,difficulty:difficultyFor(stage),trialLevel:0,enemyLevel:enemyLevelForFloor(stage)};}
export function abyssConfig(floor=1,options={}){const rules=floorRules(floor,options);return{...CHAPTERS[17],id:18,name:'深淵 '+floor+'F',abyss:true,abyssFloor:floor,cols:4,rows:4,seals:3,enemies:rules.initial,kinds:rules.boss?[0,1,2,4,5]:[0,1,2,4],collapse:false,omens:false,traps:!rules.bonus,lightScale:1,trialLevel:0,enemyLevel:rules.level,rules,difficulty:{...DIFFICULTIES[1],key:'abyss',name:'深淵',target:'深度で変化',hp:1.25,damage:1.3,speed:1.08,windup:.85,recovery:.82,trapFuse:.45,trapDamage:24+rules.level*4}};}
export function stageStars(run,cleared){return cleared?1+(run.damageTaken===0?1:0)+(run.elapsed<=run.parTime?1:0):0;}
export function skillRating(run,cleared){
 const accuracy=run.shots?Math.round(run.hits/run.shots*100):0;
 const floor=Number.isFinite(run.floor)?run.floor:1,trial=Number.isFinite(run.trialLevel)?run.trialLevel:1,depth=run.runMode==='daily'?1260:run.runMode==='abyss'?1800+(run.abyssFloor||1)*140:floor*180;
 const parts={突破:cleared?2000:0,速度:cleared?Math.round(Math.max(0,Math.min(1.5,run.parTime/Math.max(1,run.elapsed)))*1800):0,無傷:cleared?Math.max(0,1000-Math.round(run.damageTaken*15)):0,命中:Math.round(accuracy*10),回避:Math.min(run.dodges||0,5)*180,反撃:Math.min(run.counterHits||0,5)*220,連戦:Math.min(run.maxHuntChain||0,5)*180,中断:Math.min(run.interrupts||0,5)*180,弱点:Math.min(run.weakHits||0,10)*80,深度:cleared?depth:0};
 const score=Object.values(parts).reduce((a,b)=>a+b,0);return{score,parts,accuracy,rank:score>=7000?'S':score>=5800?'A':score>=4200?'B':score>=2500?'C':'D'};
}
export function betterDaily(candidate,previous){if(!previous||previous.rules!==8)return true;if(candidate.cleared!==previous.cleared)return candidate.cleared;if(candidate.cleared&&Math.abs(candidate.time-previous.time)>.001)return candidate.time<previous.time;return candidate.score>previous.score;}
export function advanceJourney(progress,run,cleared){
 if(!cleared||run.runMode==='daily'||run.runMode==='abyss')return{first:false,reward:''};
 const id=Math.min(18,run.floor),key=String(id),first=!progress.chapterStars[key];progress.chapterStars[key]=Math.max(progress.chapterStars[key]||0,stageStars(run,true));
 if(id<18)progress.floor=Math.max(progress.floor,id+1);else{progress.abyss??={};progress.abyss.unlocked=true;}
 return{first,reward:chapterConfig(id).reward,gift:first?chapterConfig(id).gift:undefined};
}
