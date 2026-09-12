export const RANKING_RULES=8;
export const RANKING_BOARDS={daily:{label:'本日最速',empty:'本日の突破者はまだいません。最初の記録を刻もう。'},abyss:{label:'深淵到達',empty:'99F深淵の帰還記録はまだありません。'},skill:{label:'世界技量',empty:'突破記録はまだありません。'}};

export function normalizePlayerName(value){
 const name=String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
 if(Array.from(name).length<2||Array.from(name).length>12||!/^[-_・ー \p{L}\p{N}]+$/u.test(name)||name.includes('@')||name.includes('.'))return'';
 return name;
}

const metric=(entry,board)=>board==='daily'?(entry.elapsedMs/1000).toFixed(2)+'秒':board==='abyss'?entry.trialLevel+'F':entry.score.toLocaleString('ja-JP')+'点';
const detail=(entry,board)=>board==='daily'?'技量 '+entry.score.toLocaleString('ja-JP'):board==='abyss'?'技量 '+entry.score.toLocaleString('ja-JP')+' · '+(entry.elapsedMs/1000).toFixed(1)+'秒':entry.floor+'面突破';

export class Rankings{
 constructor({save,getProgress,changed,sound}){
  this.save=save;this.getProgress=getProgress;this.changed=changed;this.sound=sound;this.board='daily';this.request=0;this.lastResult=null;
  const $=id=>document.getElementById(id);this.$=$;
  for(const button of document.querySelectorAll('[data-ranking-board]'))button.addEventListener('click',()=>this.show(button.dataset.rankingBoard));
  $('player-name-save').addEventListener('click',()=>this.updateName());
  $('ranking-refresh').addEventListener('click',()=>this.load());
 }
 syncName(){const p=this.getProgress();this.$('player-name').value=p.playerName||'';this.$('ranking-privacy').textContent='公開されるのはプレイヤーネームと記録だけ。メールアドレス・復旧キーは表示しません。';}
 show(board=this.board){if(RANKING_BOARDS[board])this.board=board;this.syncName();for(const b of document.querySelectorAll('[data-ranking-board]'))b.setAttribute('aria-selected',String(b.dataset.rankingBoard===this.board));this.load();}
 render(data){
  const entries=data.entries||[],board=data.board;this.$('ranking-period').textContent=data.period.includes('v10')?'V10 SEASON':data.period==='all'?'ALL TIME':data.period+' · JST';
  this.$('ranking-list').innerHTML=entries.length?entries.map(entry=>`<div class="ranking-row ${entry.mine?'mine':''}"><b>${entry.rank}</b><span><strong>${escapeHtml(entry.playerName)}</strong><small>${detail(entry,board)}</small></span><em>${metric(entry,board)}</em></div>`).join(''):`<p class="empty-note">${RANKING_BOARDS[board].empty}</p>`;
  const own=data.own;this.$('own-ranking').hidden=!own;if(own){const gap=own.gap?` · 次まで ${escapeHtml(own.gap)}`:'';this.$('own-ranking').innerHTML=`<span>YOUR RANK</span><strong>#${own.rank}</strong><p>${metric(own,board)}${gap} · ${data.total}人中</p>`;}
  this.$('ranking-state').textContent='上位50名 · ベスト記録だけを反映';
 }
 async load(){
  const id=++this.request;this.$('ranking-state').textContent='ランキングを読み込んでいます…';this.$('ranking-list').innerHTML='';this.$('own-ranking').hidden=true;
  try{const response=await fetch('/api/leaderboard?board='+encodeURIComponent(this.board),{headers:this.save.identityHeaders(),cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('ranking');const data=await response.json();if(id!==this.request)return;this.render(data);}
  catch{if(id!==this.request)return;this.$('ranking-state').textContent='ランキングに接続できません。記録は端末とクラウドへ保存されています。';}
 }
 async updateName(){
  const input=this.$('player-name'),name=normalizePlayerName(input.value);if(!name){this.$('player-name-message').textContent='2〜12文字の文字・数字・空白・_・- が使えます。メールアドレスは使用できません。';return false;}
  const p=this.getProgress();p.playerName=name;input.value=name;this.$('player-name-message').textContent='名前と記録を保存しています…';const local=await this.changed();
  try{const response=await fetch('/api/leaderboard/name',{method:'POST',headers:{'Content-Type':'application/json',...this.save.identityHeaders()},body:JSON.stringify({playerName:name}),signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('name');this.$('player-name-message').textContent=local===false?'名前は保持中。接続後に進行と一緒に再送します。':'プレイヤーネームを更新しました。';this.sound.chime(0);await this.load();return true;}
  catch{this.$('player-name-message').textContent='名前は進行データに保存しました。ランキングへの反映は次の突破時に再試行します。';return false;}
 }
 async submit(record){
  if(!record?.cleared)return null;const playerName=normalizePlayerName(this.getProgress().playerName);if(!playerName)return null;
  try{const response=await fetch('/api/leaderboard/submit',{method:'POST',headers:{'Content-Type':'application/json',...this.save.identityHeaders()},body:JSON.stringify({playerName,run:record}),signal:AbortSignal.timeout(12000)});if(!response.ok)return null;this.lastResult=await response.json();return this.lastResult;}
  catch{return null;}
 }
}

function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
