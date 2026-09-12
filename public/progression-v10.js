// LIGHT MAZE v10 progression expansion: traps, rarity tuning, enemy levels and 99F Abyss.
export const RARITY_RATES={gacha:{normal:.625,rare:.29,epic:.075,legend:.01},mine:{normal:.63,rare:.29,epic:.07,legend:.01},rareMine:{normal:.38,rare:.42,epic:.18,legend:.02},deepMine:{normal:.10,rare:.47,epic:.38,legend:.05}};
export function enemyLevelForFloor(floor,{endless=false}={}){if(endless)return Math.min(5,3+Math.floor(Math.max(0,floor-1)/25));return floor>=13?3:floor>=8?2:1;}
export function enemyLevelScale(level=1){return {hp:1+(level-1)*.28,damage:1+(level-1)*.20,effect:1+(level-1)*.14,speed:1+(level-1)*.055};}
export const CAMPAIGN_TIERS=[{from:1,to:7,label:'導入'},{from:8,to:12,label:'中難度'},{from:13,to:18,label:'高難度'}];
export const LEGENDARY_AFFIXES=[{id:'eternal-wick',name:'永劫の灯芯',text:'光の自然消費速度 -18%',stat:'lightDrain',value:-.18},{id:'prism-heart',name:'光晶心臓',text:'最大HP +22% / 最大MP +15%',stats:{hp:.22,mp:.15}},{id:'executioner',name:'処刑の星',text:'弱点・反撃ダメージ +30%',stat:'counterDamage',value:.30},{id:'last-light',name:'最後の灯',text:'LIGHT 20%以下で被ダメージ -24%',stat:'lowLightGuard',value:.24},{id:'abyss-hunter',name:'深淵狩り',text:'Lv3以上の敵へのダメージ +20%',stat:'highLevelDamage',value:.20},{id:'second-dawn',name:'第二の夜明け',text:'探索中1回だけ致死ダメージを耐えHP25%で復帰',stat:'revive',value:1}];
export const ENDLESS={unlockCampaignFloor:18,maxFloor:99,sealsPerFloor:3,collapse:false};
export function endlessDifficulty(floor){const f=Math.max(1,Math.min(99,floor));return {enemyLevel:Math.min(5,3+Math.floor((f-1)/25)),enemyHp:1+(f-1)*.018,enemyDamage:1+(f-1)*.014,trapDensity:1+Math.min(2.5,(f-1)*.025),trapPower:1+Math.min(1.6,(f-1)*.018),lootPower:1+Math.min(2.8,(f-1)*.035),legendBonus:f<10?0:(f-9)*.0015,explorationGearBonus:f<10?0:.15+Math.min(.45,(f-10)*.006)};}
export function endlessGateOptions(){return [{id:'next',label:'次のフロアへ'},{id:'save',label:'中断セーブ'},{id:'return',label:'帰還して戦利品を確定'}];}
export const TRAP_TUTORIAL={title:'罠を見破れ',body:'床の赤い印は罠です。踏むとダメージだけでなく、鈍足・敵の増援・光の消失などが起こります。罠を正面の照準に入れて一定時間見つめると解除できます。解除中は罠の外から狙い、敵が近い時は先に安全を確保しましょう。'};
export function rarityRevealClass(rarity){return rarity==='legend'?'reveal-legend':rarity==='epic'?'reveal-epic':'';}
