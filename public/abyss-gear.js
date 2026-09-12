// Data-only catalog. Stable keys are stored in saves; indexes of the original 21 relics never change.
const rows=[
 ['pristine','無傷の一撃','HP満タンで与ダメージ×2',0],['blast','光爆','命中時、周囲3mに35%の範囲ダメージ',0],['pierce','貫光','光弾が3体を貫通',0],['executioner','処刑者','HP30%未満の敵に×1.8',0],['giantslayer','巨敵殺し','巨兵・番人に×1.7',0],['chain','連鎖光','撃破地点から5mの2体に連鎖攻撃',2],['split','散光','命中時、近い2体へ35%分裂弾',0],['homing','追尾光','光弾の照準許容角が広がる',0],['drill','穿孔','貫通3体・後続に1体ごと+35%',0],['ricochet','跳弾','1回の壁反射で与ダメージ×1.5',0],['focus','収束','同じ敵へ連続命中ごと+15%、最大+75%',0],['overcharge','過充電','3秒以上攻撃しないと次撃×2',0],['sniper','狙撃','距離に応じ+0〜70%',0],['pointblank','零距離','3m以内で×1.7',0],['combo','連撃','2秒以内の連続命中+10%、最大+50%',0],['corpse','死体爆破','撃破時3mに敵最大HPの35%爆発',1],['rain','光の槍雨','5命中ごと周囲6mに光槍',0],['insight','弱点看破','敵の硬い装甲を無視',0],['execute','処刑光','通常敵HP15%未満で処刑',0],['challenger','対強者','エリートに×1.7',0],['revenge','復讐者','被弾後4秒間×1.8',0],
 ['unyielding','不屈','探索中1回、致死攻撃をHP1で耐える',1],['fullmoon','満月','HP満タンで攻撃+30%、被ダメージ−30%',1],['leech','吸命','撃破でHP5回復',1],['barrier','結界','8秒無傷で次の被ダメージを20軽減',1],['emergency','緊急障壁','HP25%未満で被ダメージ−40%',1],['reprisal','報復障壁','被弾時近い敵に20ダメージ',1],['evade','完全回避','20%で被ダメージ無効',1],['teleport','緊急転移','HP25%未満で被弾時、12秒ごと安全な近傍へ退避',1],['manaarmor','魔力装甲','MPを消費し被ダメージの40%を肩代わり',1],['lifetrade','生命変換','治癒時LIGHTを5使い、回復量2倍',1],
 ['cycle','魔力循環','魔法命中ごとMP1回復',2],['fastcast','連続詠唱','魔法の再使用時間−25%',0],['infinite','無限魔力','15%で魔法消費MP0',2],['bloodpact','血の契約','MP不足分をHPで支払う。HP1を残す',2],['lightpact','光の契約','MP消費を30%減らし、魔法ごとLIGHT1消費',2],['echo','反響','光弾から周囲2体に50%伝播',0],
 ['eternallamp','永久灯','LIGHT減少速度−30%',2],['devourlight','捕食する灯','撃破でLIGHT3回復',2],['lastlight','最後の灯','LIGHT20%未満で与ダメージ×1.8',2],['eclipsepower','皆既食','LIGHT10%未満で5秒間敵を凍結。30秒ごと',2],
 ['minereye','坑夫の眼','発掘速度+50%、鉱脈を遠くから感知',2],['abysssense','深淵嗅覚','発掘品質+15%、イベントを遠くから感知',2],['treasure','宝探し','宝の価値+30%',2],['plunder','略奪者','撃破した敵から追加通貨100',0],['luckchain','幸運連鎖','無傷5連続撃破ごと発掘品質が上昇、最大+15%',2],
 ['trapkiller','罠師殺し','罠破壊でMP5回復',0],['trapeater','罠喰い','罠の効果を無効化しLIGHT5回復',1],['trapreverse','罠反転','踏んだ罠が近い敵を凍結させる',1],['trapmaster','罠支配','罠破壊時に周囲の敵へ60ダメージ',0],
 ['greed','強欲','宝+60%、被ダメージ+20%',2],['berserk','狂戦士','与ダメージ+50%、防御半減',0],['desperate','背水','HP30%未満で×2',0],['condition','絶好調','HP80%以上で移動+12%、火力+20%',2],['perfection','完璧主義','無傷15秒で与ダメージ+35%',1],['hunting','連続狩猟','撃破ごと火力+3%、被弾でリセット、最大30%',0],['asura','修羅','敵3体以上が近いと火力+50%',0],['solitary','孤高','近い敵1体のみなら×1.5',1],['sealthief','封印強奪','封印解除時HP・MP20回復',2],['assimilation','深淵同化','深淵10Fごと攻撃+4%、最大36%',1],['procession','百鬼夜行','自然湧きが早くなる代わりに撃破報酬+80%',2],['secondform','第二形態','復活後、探索終了まで火力+50%',1],['timestop','時間停止','会心時周囲の敵を2秒停止、12秒ごと',0],
 ['iceburial','氷葬','凍結中の敵に×1.8',0],['deepfreeze','凍結強化','氷槍の凍結+2秒',1],['manareturn','MP回復','撃破でMP4追加回復',2]
];
export const POWERS=rows.map(([key,name,effect,slot],i)=>({key,name,effect,slot,minFloor:10+Math.floor(i/14)*15}));
export const SYNERGIES=[
 {key:'supernova',name:'超新星',requires:['blast','chain','corpse'],effect:'撃破が6mの超新星に進化。周囲へ最大HPの70%ダメージ'},
 {key:'permafrost',name:'永久凍土',requires:['iceburial','deepfreeze','manareturn'],effect:'氷槍が周囲5mの敵を4秒凍結、命中でMP3回復'},
 {key:'flawless',name:'完全無欠',requires:['pristine','barrier','condition'],effect:'無傷8秒ごと、1回の被弾を完全に無効化'},
 {key:'deathline',name:'死線',requires:['desperate','berserk','unyielding'],effect:'HP30%未満で撃破時、周囲を2秒停止してHP8回復'},
 {key:'eventhorizon',name:'事象の地平',hidden:true,requires:['pierce','ricochet','split'],effect:'壁で反射した光弾が最大5体へ貫通・分裂'},
 {key:'nightfeast',name:'夜宴',hidden:true,requires:['devourlight','leech','lastlight'],effect:'撃破回復が2倍、LIGHT20%未満なら敵の結界を破壊'}
];
export const CURSED_GEAR=[
 {key:'madking',name:'狂王の杖',slot:0,effect:'与ダメージ×2.2 / 被ダメージ×1.5',powers:[],curse:'madking',minFloor:20},
 {key:'greedking',name:'強欲王の灯',slot:2,effect:'発掘品質+35% / 自然湧き間隔−40%',powers:[],curse:'greedking',minFloor:20},
 {key:'bloodamulet',name:'血塗られた護符',slot:1,effect:'撃破でHP12回復 / 通常回復無効',powers:['leech'],curse:'bloodamulet',minFloor:30},
 {key:'blindlamp',name:'無明',slot:2,effect:'LIGHT消費−60% / ミニマップ無効',powers:['eternallamp'],curse:'blindlamp',minFloor:30},
 {key:'deathcontract',name:'死神との契約',slot:1,effect:'通常敵に10%で即死・残HP15%以下で処刑 / 最大HP−40%',powers:['execute'],curse:'deathcontract',minFloor:40}
];
export const MYTHICS=[
 {key:'reincarnation',name:'輪廻',slot:1,effect:'死亡時、探索中1回HP・MP・LIGHT全快で復活',powers:['unyielding','secondform'],mythic:true,minFloor:80},
 {key:'amaterasu',name:'天照',slot:0,effect:'LIGHTが高いほど光爆範囲拡大（3〜7m）',powers:['blast','pristine'],mythic:true,minFloor:80},
 {key:'eater',name:'深淵喰らい',slot:0,effect:'撃破した敵Lvに応じ探索中成長。Lv7以上を100体撃破で進化',powers:['hunting','devourlight'],mythic:true,minFloor:80},
 {key:'kaleidoscope',name:'万華鏡',slot:0,effect:'光弾が貫通・反射・分裂',powers:['pierce','ricochet','split'],mythic:true,minFloor:99}
];
export const ABYSS_GEAR=[...POWERS.map(p=>({...p,name:p.name+'の'+['杖','護符','灯芯'][p.slot],powers:[p.key],exclusive:true})),...CURSED_GEAR,...MYTHICS].map(p=>({...p,exclusive:true,abyss:true}));
export const awakened=powers=>SYNERGIES.filter(s=>s.requires.every(k=>powers.includes(k)));
export function composePowers(items,relics){const powers=[],curses=[];for(const item of items){const def=relics[item.type];powers.push(...(def?.powers||[]),...(item.extraPowers||[]));if(def?.curse)curses.push(def.curse);if(def?.mythic)powers.push(def.key);if(item.evolved&&def?.key==='eater')powers.push('eaterking');}return{powers:[...new Set(powers)],curses:[...new Set(curses)]};}
export function evolutionProgress(progress,enemy){const changed=[];if((enemy.level||1)<7)return changed;for(const id of progress.equipped){const item=progress.inventory.find(i=>i.id===id);if(item?.type!==21+ABYSS_GEAR.findIndex(d=>d.key==='eater'))continue;item.evolutionKills=Math.min(100,(item.evolutionKills||0)+1);if(item.evolutionKills===100&&!item.evolved){item.evolved=true;changed.push(item);}}return changed;}
