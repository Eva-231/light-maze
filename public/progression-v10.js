// Compatibility exports for the initial PR scaffold; live rules have one owner.
export {RARITY_RATES,enemyLevelForFloor,enemyLevelScale,floorRules as endlessDifficulty} from './abyss-rules.js';
export const CAMPAIGN_TIERS=[{from:1,to:7,label:'導入'},{from:8,to:12,label:'中難度'},{from:13,to:18,label:'高難度'}];
export const ENDLESS={unlockCampaignFloor:18,maxFloor:99,sealsPerFloor:3,collapse:false};
export const endlessGateOptions=()=>[{id:'next',label:'次のフロアへ'},{id:'save',label:'中断セーブ'},{id:'return',label:'帰還して戦利品を確定'}];
export const TRAP_TUTORIAL={title:'小さな床の印は罠',body:'踏むとダメージ・鈍足・敵召喚・光やMP減少など。\n印を避けるか、離れて光弾で破壊。\n通路の端を選び、戦闘中も足元に注意。'};
export const rarityRevealClass=tier=>'reveal-'+tier;
