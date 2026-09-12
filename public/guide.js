const $=id=>document.getElementById(id);

const TUTORIALS=[
  ['基本','宝を拾う → 守護者を倒す → 封印を解除 → ⌂へ生還。'],
  ['操作','スマホ：左で移動／右で視点。PC：WASDで移動。'],
  ['戦闘','予告を避ける → 攻撃後の隙に反撃。ギリギリ回避はCOUNTER。'],
  ['魔法','光弾＝基本攻撃。氷槍＝突進・逃走を止める。治癒＝HP回復。'],
  ['罠','小さな床紋章に注意。赤＝ダメージ、泥＝鈍足、紫＝敵召喚、深淵＝LIGHT/MP吸収。'],
  ['採掘・遺物','光る鉱脈を狙って採掘を長押し。遺物は生還して初めて持ち帰れる。'],
  ['黄金の番人','金の足元円 → 円の外へ。大円 → 番人から離れる。攻撃後、光る核へ反撃。']
];

const ENEMIES=[
  ['影兵','#f77b67','近距離の振りかぶり','後ろへ下がる','攻撃後に光弾'],
  ['裂走狼','#ff985e','赤い直線から突進','横へ避ける','突進後に反撃'],
  ['石の巨兵','#ffbd74','赤い円へ叩きつけ','円の外へ出る','攻撃後の装甲開放'],
  ['転位の術師','#c58bff','紫の詠唱で転位','光弾で中断／壁に隠れる','詠唱を止めた直後'],
  ['銀光の精','#d8f9ff','12秒で逃走','氷槍で足止め','氷槍が特に有効・希少遺物確定'],
  ['黄金の番人','#ffc66e','足元の金色亀裂／近距離の大円','金円の外へ／大円から離れる','攻撃後に光る核が弱点']
];

const LESSONS={
  '1面':'左で移動／右で視点。\n緑の封印を見つめて解除 → ⌂へ戻る。',
  '2面':'敵を照準に入れて「光弾」。\n守護者を倒す → 封印解除 → 生還。',
  '3面':'突進は横へ。赤い円は外へ。\nHPが減ったら「治癒」。',
  '4面':'光る壁を狙って「採掘」を長押し。\n遺物は生還して初めて持ち帰れる。',
  '5面':'紫の詠唱は光弾で中断。\n壁に隠れても転位を防げる。',
  '6面':'最後の封印で崩壊開始。\n欲張りすぎず、⌂への帰路を残す。',
  '7面':'金の足元円は外へ。大円は離れる。\n攻撃後に光る核へ反撃。',
  '8面':'金の足元円は外へ。大円は離れる。\n攻撃後に光る核へ反撃。',
  '裂走狼':'赤い直線 → 横へ回避。\n突進後に反撃。',
  '石の巨兵':'赤い円 → 円の外へ。\n叩きつけ後が弱点。',
  '転位の術師':'紫の詠唱 → 光弾で中断。\n壁に隠れてもOK。',
  '銀光の精':'12秒で逃走。\n氷槍で止めると有利。希少遺物確定。',
  '深淵の番人':'金の足元円 → 円の外へ。\n大円 → 番人から離れる。\n攻撃後に光る核へ反撃。',
  '召喚罠':'小さな紫の紋章 → 敵2〜3体。\n踏む前に光弾で壊す。'
};

function styles(){
  const style=document.createElement('style');
  style.textContent=`
  #field-guide{max-width:560px;padding:22px;max-height:min(84vh,820px);overflow:auto}
  #field-guide h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;margin:8px 0 12px}
  .guide-tabs{display:flex;border-bottom:1px solid #9bb2a744;margin-bottom:14px}
  .guide-tabs button{flex:1;padding:12px 6px;background:transparent;color:#94aba5;border-bottom:2px solid transparent}
  .guide-tabs button[aria-selected=true]{color:#e5f3d9;border-color:#d2e0b3}
  .guide-card{padding:12px 13px;margin:8px 0;border:1px solid #a8bbaa2b;background:#0c1b1a9c;border-radius:4px}
  .guide-card strong{display:block;color:#edf2df;font-size:15px;margin-bottom:4px}
  .guide-card p{margin:0!important;color:#b7c9bd!important;font-size:13px!important;line-height:1.6!important}
  .bestiary-card{display:grid;grid-template-columns:42px 1fr;gap:11px;padding:12px 0;border-bottom:1px solid #a7baad20}
  .enemy-sigil{width:38px;height:38px;border:1px solid color-mix(in srgb,var(--enemy),transparent 35%);background:color-mix(in srgb,var(--enemy),transparent 88%);display:grid;place-items:center;transform:rotate(45deg);margin-top:3px}
  .enemy-sigil span{transform:rotate(-45deg);color:var(--enemy);font-size:17px}.bestiary-card h3{font-size:17px;font-weight:500;color:#e6efdf;margin:0 0 5px}
  .bestiary-card p{font-size:12px!important;margin:3px 0!important;color:#aebfb5!important;line-height:1.55!important}.bestiary-card b{color:#d8c78f;font-weight:500}
  #lesson-body{white-space:pre-line;line-height:1.7!important}
  #pause-guide-panel{margin:12px 0 6px;max-height:38vh;overflow:auto;border-top:1px solid #9bb2a733;padding-top:9px}
  #pause-guide-panel[hidden]{display:none}.pause-guide-tabs{display:flex;gap:6px;margin-bottom:8px}.pause-guide-tabs button{flex:1;font-size:12px;padding:8px}
  `;
  document.head.appendChild(style);
}

function tutorialHTML(){return TUTORIALS.map(([t,b])=>`<article class="guide-card"><strong>${t}</strong><p>${b}</p></article>`).join('');}
function bestiaryHTML(){return ENEMIES.map(([name,color,attack,evade,chance])=>`<article class="bestiary-card" style="--enemy:${color}"><div class="enemy-sigil"><span>◆</span></div><div><h3>${name}</h3><p><b>攻撃</b> ${attack}</p><p><b>避け方</b> ${evade}</p><p><b>反撃</b> ${chance}</p></div></article>`).join('');}

function makeGuide(){
  const dialog=document.createElement('dialog');dialog.id='field-guide';dialog.innerHTML=`<div class="dialog-head"><span>FIELD GUIDE</span><button class="close" aria-label="ガイドを閉じる">×</button></div><h2>迷ったら、ここを見る。</h2><div class="guide-tabs"><button data-tab="tutorial" aria-selected="true">遊び方</button><button data-tab="bestiary" aria-selected="false">敵図鑑</button></div><section data-page="tutorial">${tutorialHTML()}</section><section data-page="bestiary" hidden>${bestiaryHTML()}</section>`;
  document.querySelector('#game')?.appendChild(dialog);dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('cancel',()=>dialog.close());
  dialog.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(dialog,b.dataset.tab)));
  return dialog;
}
function selectTab(root,tab){root.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));root.querySelectorAll('[data-page]').forEach(p=>p.hidden=p.dataset.page!==tab);}
function addMenuButton(dialog){const settings=$('settings-open');if(!settings||$('guide-open'))return;const b=document.createElement('button');b.id='guide-open';b.textContent='遊び方・敵図鑑';settings.parentElement.insertBefore(b,settings);b.addEventListener('click',()=>dialog.showModal());}
function addPauseGuide(){const pause=$('pause-dialog'),settings=$('pause-settings');if(!pause||!settings||$('pause-guide'))return;const b=document.createElement('button');b.id='pause-guide';b.className='secondary';b.textContent='遊び方・敵図鑑';settings.before(b);const panel=document.createElement('div');panel.id='pause-guide-panel';panel.hidden=true;panel.innerHTML=`<div class="pause-guide-tabs"><button data-tab="tutorial">遊び方</button><button data-tab="bestiary">敵図鑑</button></div><section data-page="tutorial">${tutorialHTML()}</section><section data-page="bestiary" hidden>${bestiaryHTML()}</section>`;b.after(panel);panel.querySelectorAll('[data-tab]').forEach(x=>x.addEventListener('click',()=>selectTab(panel,x.dataset.tab)));b.addEventListener('click',()=>{panel.hidden=!panel.hidden;selectTab(panel,'tutorial');});}

function simplifyLesson(){const title=$('lesson-title'),body=$('lesson-body');if(!title||!body)return;const t=title.textContent.trim();let key=Object.keys(LESSONS).find(k=>t===k||t.startsWith(k));if(!key)return;if(t==='深淵の番人')title.textContent='黄金の番人（深淵の番人）';if(body.textContent!==LESSONS[key])body.textContent=LESSONS[key];}
function watchLessons(){const title=$('lesson-title'),body=$('lesson-body'),dialog=$('lesson-dialog');if(!title||!body||!dialog)return;const obs=new MutationObserver(()=>simplifyLesson());obs.observe(title,{childList:true,subtree:true,characterData:true});obs.observe(body,{childList:true,subtree:true,characterData:true});dialog.addEventListener('toggle',simplifyLesson);simplifyLesson();}

styles();const guide=makeGuide();addMenuButton(guide);addPauseGuide();watchLessons();
