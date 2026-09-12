const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',...headers}});
const integer=(n,min=0,max=1e12)=>Number.isInteger(n)&&n>=min&&n<=max;
const finite=(n,min=0,max=1e12)=>Number.isFinite(n)&&n>=min&&n<=max;
const list=(a,max)=>Array.isArray(a)&&a.length<=max;
const validAnonymousKey=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{32,128}$/.test(value);
export function validPlayerName(value){const name=typeof value==='string'?value.normalize('NFKC').trim().replace(/\s+/g,' '):'';return Array.from(name).length>=2&&Array.from(name).length<=12&&/^[-_・ー \p{L}\p{N}]+$/u.test(name)&&!name.includes('@')&&!name.includes('.');}
function validRelic(i){return i&&typeof i.id==='string'&&/^[a-z0-9-]{1,80}$/.test(i.id)&&integer(i.type,0,20)&&integer(i.tier,0,3)&&integer(i.a,0,5)&&integer(i.b,0,5)&&i.a!==i.b&&integer(i.rollA,1,100)&&integer(i.rollB,1,100)&&(i.favorite===undefined||typeof i.favorite==='boolean');}
export function validProgress(d){
 if(!d||![1,2,3,4,5,6,7].includes(d.format)||typeof d.mask!=='string'||d.mask.length>90000||!list(d.completed,13))return false;
 if(d.mask&&!/^[A-Za-z0-9+/]{87382}==$/.test(d.mask))return false;
 for(const k of ['totalBank','level','runs','best','deepest','escapes','busts'])if(!finite(d[k]))return false;
 if(!integer(d.level,0,9)||!d.completed.every(n=>integer(n,0,12)))return false;
 if(d.format>=2){if(d.mask!==''||d.completed.length)return false;for(const k of ['floor','clears','bestCoverage','bestClearTime'])if(!finite(d[k]))return false;if(!integer(d.floor,1,1000000)||d.bestCoverage>100)return false;}
 if(d.format>=3){
  for(const k of ['forgeSpent','pity','draws','totalKills','bestScore'])if(!integer(d[k]))return false;if(d.pity>9)return false;
  if(!list(d.inventory,d.format>=6?300:60)||!d.inventory.every(validRelic)||new Set(d.inventory.map(i=>i.id)).size!==d.inventory.length)return false;
  if(!list(d.equipped,3)||d.equipped.length!==3||!d.equipped.every((id,slot)=>id===''||d.inventory.some(i=>i.id===id&&[0,0,0,0,1,1,1,1,2,2,2,2,1,1,1,0,0,2,0,1,2][i.type]===slot)))return false;
  if(!list(d.caches,d.format>=6?300:120)||!d.caches.every(i=>i&&integer(i.seed,0,4294967295)&&integer(i.quality,0,2)&&(i.forcedType===undefined||integer(i.forcedType,0,20))&&(i.minTier===undefined||integer(i.minTier,0,3))&&(i.minRoll===undefined||integer(i.minRoll,1,100))))return false;
  if(!list(d.catalog,84)||!d.catalog.every(i=>integer(i,0,83))||new Set(d.catalog).size!==d.catalog.length)return false;
  if(!list(d.history,20)||!d.history.every(h=>h&&integer(h.at,0,8640000000000000)&&integer(h.seed,0,4294967295)&&integer(h.floor,1,1000000)&&integer(h.score)&&integer(h.kills,0,100)&&finite(h.time,0,100000)&&finite(h.loot)&&finite(h.hp,0,240)&&finite(h.light,0,200)&&finite(h.coverage,0,100)&&integer(h.relics,0,123)&&typeof h.success==='boolean'&&typeof h.cleared==='boolean'&&['normal','daily'].includes(h.mode)))return false;
  if(!list(d.dailyBests,14)||!d.dailyBests.every(b=>b&&/^\d{4}-\d{2}-\d{2}$/.test(b.day)&&integer(b.score)&&finite(b.time,0,100000)))return false;
 }
 if(d.format>=4){if(!integer(d.bestSkill))return false;if(!d.chapterStars||typeof d.chapterStars!=='object'||Array.isArray(d.chapterStars)||Object.entries(d.chapterStars).some(([k,v])=>!(/^[1-8]$/.test(k))||!integer(v,1,3)))return false;
  if(!list(d.claimedGifts,8)||!d.claimedGifts.every(n=>integer(n,1,8))||!list(d.hintsSeen,48)||!d.hintsSeen.every(k=>typeof k==='string'&&/^[a-z0-9-]{1,40}$/.test(k)))return false;
  if(!integer(d.trialLevel,1,1000000)||!integer(d.bestTrial,0,999999)||d.bestTrial>=d.trialLevel)return false;
 }
 if(d.format>=5){if(!d.difficultyStats||typeof d.difficultyStats!=='object'||Array.isArray(d.difficultyStats)||Object.entries(d.difficultyStats).some(([key,v])=>!['easy','normal','hard','abyss'].includes(key)||!v||!integer(v.attempts)||!integer(v.clears,0,v.attempts)))return false;}
 if(d.format>=7&&d.playerName!==''&&!validPlayerName(d.playerName))return false;
 let cost=0;for(let i=0;i<d.level;i++)cost+=1000+i*750;return d.totalBank>=cost+(d.format>=3?d.forgeSpent:0);
}

const bytesToHex=buffer=>[...new Uint8Array(buffer)].map(n=>n.toString(16).padStart(2,'0')).join('');
async function digest(value){return bytesToHex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));}
async function identityFor(request){
 const token=request.headers.get('x-light-maze-player');
 if(validAnonymousKey(token)){const hash=await digest('light-maze-anonymous:'+token);return{mode:'anonymous',participantId:'anonymous-'+hash,key:'light-maze/v2/anonymous/'+hash+'.json',owner:'anonymous-'+hash.slice(0,24)};}
 const uid=request.headers.get('oai-authenticated-user-id');
 if(uid){const hash=await digest('light-maze-account:'+uid);return{mode:'account',participantId:'account-'+hash,key:'light-maze/v1/'+encodeURIComponent(uid)+'.json',owner:encodeURIComponent(uid)};}
 return null;
}
const saveHeaders=(identity,object,extra={})=>({'x-save-revision':object?.etag||'new','x-save-owner':identity.owner,'x-save-identity':identity.mode,'x-save-mutation':object?.customMetadata?.mutationId||'',...extra});
const invalidOrigin=(request,url)=>request.headers.get('sec-fetch-site')==='cross-site'||(request.headers.has('origin')&&request.headers.get('origin')!==url.origin);
async function parseBody(request,max=100000){if(!request.headers.get('content-type')?.startsWith('application/json'))return{error:json({error:'JSON required'},415)};if(Number(request.headers.get('content-length'))>max)return{error:json({error:'Too large'},413)};const raw=await request.text();if(raw.length>max)return{error:json({error:'Too large'},413)};try{return{raw,data:JSON.parse(raw)}}catch{return{error:json({error:'Invalid JSON'},400)}}}

async function readProgressObject(env,identity,request){
 let object=await env.BUCKET.get(identity.key);if(object||identity.mode!=='anonymous')return{object};
 // New anonymous clients inherit the owner's old account save once, then no login is needed.
 const uid=request.headers.get('oai-authenticated-user-id');if(!uid)return{object:null};
 const legacy=await env.BUCKET.get('light-maze/v1/'+encodeURIComponent(uid)+'.json');if(!legacy)return{object:null};
 const raw=await legacy.text();let data;try{data=JSON.parse(raw)}catch{}if(!validProgress(data))return{object:null};
 const created=await env.BUCKET.put(identity.key,raw,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'},customMetadata:{mutationId:'',migratedAt:new Date().toISOString()}});
 if(created)return{object:created,raw};object=await env.BUCKET.get(identity.key);return{object};
}

async function progressRoute(request,env,url,recovery){
 const identity=await identityFor(request);if(!identity)return json({error:'Anonymous key or sign in required'},401);
 if(!env.BUCKET)return json({error:'Save service unavailable'},503);
 try{
  if(request.method==='GET'&&!recovery){
   const loaded=await readProgressObject(env,identity,request),object=loaded.object;if(!object)return json({},200,saveHeaders(identity,null));const raw=loaded.raw??await object.text();let data;try{data=JSON.parse(raw)}catch{}
   if(!validProgress(data)){const backup=await env.BUCKET.get(identity.key+'.backup');if(backup){const body=await backup.text();try{if(validProgress(JSON.parse(body)))return new Response(body,{headers:{'Content-Type':'application/json','Cache-Control':'private, no-store',...saveHeaders(identity,object,{'x-save-recovered':'1','x-save-mutation':''})}})}catch{}}return json({error:'Saved data needs recovery'},503);}
   return new Response(raw,{headers:{'Content-Type':'application/json','Cache-Control':'private, no-store',...saveHeaders(identity,object)}});
  }
  if(request.method!==(recovery?'POST':'PUT'))return json({error:'Method not allowed'},405);if(invalidOrigin(request,url))return json({error:'Invalid origin'},403);
  const parsed=await parseBody(request);if(parsed.error)return parsed.error;if(!validProgress(parsed.data))return json({error:'Invalid progress'},400);const {raw,data}=parsed;
  if(recovery){await env.BUCKET.put(identity.key+'.recovery-'+crypto.randomUUID(),raw,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});return json({ok:true});}
  const revision=request.headers.get('x-save-revision'),mutationId=request.headers.get('x-save-mutation')||'';if(!revision||revision.length>100||mutationId&&!/^[a-zA-Z0-9-]{1,80}$/.test(mutationId))return json({error:'Invalid save token'},400);
  const previous=await env.BUCKET.get(identity.key);let old='',before;if(previous){old=await previous.text();try{before=JSON.parse(old)}catch{}
   if(mutationId&&previous.customMetadata?.mutationId===mutationId&&old===raw)return json({ok:true},200,saveHeaders(identity,previous));if(before?.format>data.format)return json({error:'Reload the updated game'},409);}
  if(revision==='new'?!!previous:previous?.etag!==revision)return json({error:'Save changed in another session'},409);
  if(previous&&validProgress(before)&&before.format>=4&&data.format>=4){const counters=['totalBank','level','runs','floor','clears','draws','forgeSpent','totalKills','bestSkill','bestTrial','trialLevel','escapes','busts'];if(Object.entries(before.difficultyStats||{}).some(([k,v])=>(data.difficultyStats?.[k]?.attempts||0)<v.attempts||(data.difficultyStats?.[k]?.clears||0)<v.clears)||counters.some(k=>data[k]<before[k])||before.catalog.some(k=>!data.catalog.includes(k))||Object.entries(before.chapterStars).some(([k,v])=>(data.chapterStars[k]||0)<v))return json({error:'Refusing to overwrite newer progress'},409);}
  if(previous&&validProgress(before)){if(before.format===1&&data.format>=2)await env.BUCKET.put(identity.key+'.original-maze',old,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});await env.BUCKET.put(identity.key+'.backup',old,{httpMetadata:{contentType:'application/json'}});}
  const result=await env.BUCKET.put(identity.key,raw,{httpMetadata:{contentType:'application/json'},customMetadata:{mutationId,savedAt:new Date().toISOString()},onlyIf:revision==='new'?{etagDoesNotMatch:'*'}:{etagMatches:revision}});if(!result)return json({error:'Save changed in another session'},409);
  return json({ok:true},200,saveHeaders(identity,result,{'x-save-mutation':mutationId}));
 }catch(error){console.error('Save service request failed',error?.name);return json({error:'Save service unavailable'},503);}
}

function jstDay(now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function dailySeed(day){let seed=2166136261;for(const char of 'LIGHT-MAZE-8-'+day)seed=Math.imul(seed^char.charCodeAt(0),16777619);return seed>>>0;}
export function competitiveScore(run){
 const accuracy=run.shots?Math.round(run.hits/run.shots*100):0,depth=run.mode==='daily'?1260:run.floor===8?1600+Math.min(run.trialLevel,100)*120:run.floor*180;
 const parts={clear:2000,speed:Math.round(Math.max(0,Math.min(1.5,run.parTime/Math.max(1,run.time)))*1800),untouched:Math.max(0,1000-Math.round(run.damageTaken*15)),accuracy:Math.round(accuracy*10),dodge:Math.min(run.dodges,5)*180,counter:Math.min(run.counterHits,5)*220,chain:Math.min(run.maxHuntChain,5)*180,interrupt:Math.min(run.interrupts,5)*180,weak:Math.min(run.weakHits,10)*80,depth};
 return Object.values(parts).reduce((sum,value)=>sum+value,0);
}
function validRankRun(run){
 if(!run||run.rules!==8||run.cleared!==true||run.success!==true||!['normal','daily'].includes(run.mode)||!integer(run.seed,0,4294967295)||!integer(run.floor,1,8)||!integer(run.trialLevel,0,1000000)||!finite(run.time,1,5000)||!finite(run.parTime,10,2000)||!integer(run.kills,0,100)||!integer(run.shots,0,1000)||!integer(run.hits,0,run.shots)||!integer(run.weakHits,0,run.hits)||!integer(run.dodges,0,100)||!integer(run.counterHits,0,run.kills)||!integer(run.maxHuntChain,0,run.kills)||!integer(run.interrupts,0,run.kills)||!finite(run.damageTaken,0,10000))return false;
 if(run.mode==='daily'){const day=jstDay();return run.day===day&&run.floor===7&&run.seed===dailySeed(day);}return true;
}
const toEntry=(row,rank,mine=false)=>({rank,playerName:row.player_name,score:Number(row.score),elapsedMs:Number(row.elapsed_ms),trialLevel:Number(row.trial_level),floor:Number(row.floor),mine});
async function leaderboardData(env,board,identity){
 const period=board==='daily'?jstDay():'all',top=await env.DB.prepare('SELECT participant_id, player_name, score, elapsed_ms, trial_level, floor, rank_value, submitted_at FROM leaderboard_entries WHERE board = ? AND period = ? ORDER BY rank_value DESC, submitted_at ASC LIMIT 50').bind(board,period).all(),rows=top.results||[];
 let previous=null,rank=0;const entries=rows.map((row,index)=>{if(previous===null||Number(row.rank_value)!==previous)rank=index+1;previous=Number(row.rank_value);return toEntry(row,rank,identity?.participantId===row.participant_id)});
 const totalRow=await env.DB.prepare('SELECT COUNT(*) AS count FROM leaderboard_entries WHERE board = ? AND period = ?').bind(board,period).first(),total=Number(totalRow?.count||0);let own=null;
 if(identity){const row=await env.DB.prepare('SELECT participant_id, player_name, score, elapsed_ms, trial_level, floor, rank_value, submitted_at FROM leaderboard_entries WHERE participant_id = ? AND board = ? AND period = ?').bind(identity.participantId,board,period).first();if(row){const count=await env.DB.prepare('SELECT COUNT(*) AS count FROM leaderboard_entries WHERE board = ? AND period = ? AND rank_value > ?').bind(board,period,row.rank_value).first(),next=await env.DB.prepare('SELECT score, elapsed_ms, trial_level FROM leaderboard_entries WHERE board = ? AND period = ? AND rank_value > ? ORDER BY rank_value ASC LIMIT 1').bind(board,period,row.rank_value).first();own=toEntry(row,Number(count?.count||0)+1,true);if(next)own.gap=board==='daily'?((Number(row.elapsed_ms)-Number(next.elapsed_ms))/1000).toFixed(2)+'秒':board==='abyss'&&Number(next.trial_level)>Number(row.trial_level)?Number(next.trial_level)-Number(row.trial_level)+'Lv':Math.max(0,Number(next.score)-Number(row.score)).toLocaleString('ja-JP')+'点';}}
 return{board,period,entries,own,total};
}
async function rankingRoute(request,env,url){
 if(!env.DB)return json({error:'Ranking service unavailable'},503);const identity=await identityFor(request);
 try{
  if(url.pathname==='/api/leaderboard'&&request.method==='GET'){const board=url.searchParams.get('board')||'daily';if(!['daily','abyss','skill'].includes(board))return json({error:'Unknown board'},400);return json(await leaderboardData(env,board,identity));}
  if(request.method!=='POST')return json({error:'Method not allowed'},405);if(!identity)return json({error:'Anonymous key required'},401);if(invalidOrigin(request,url))return json({error:'Invalid origin'},403);const parsed=await parseBody(request,20000);if(parsed.error)return parsed.error;const name=typeof parsed.data?.playerName==='string'?parsed.data.playerName.normalize('NFKC').trim().replace(/\s+/g,' '):'';if(!validPlayerName(name))return json({error:'Invalid player name'},400);
  if(url.pathname==='/api/leaderboard/name'){await env.DB.prepare('UPDATE leaderboard_entries SET player_name = ? WHERE participant_id = ?').bind(name,identity.participantId).run();return json({ok:true});}
  if(url.pathname!=='/api/leaderboard/submit')return json({error:'Not found'},404);const run=parsed.data.run;if(!validRankRun(run))return json({error:'Invalid ranked run'},400);const score=competitiveScore(run),elapsedMs=Math.round(run.time*1000),submittedAt=Date.now(),boards=[];
  if(run.mode==='daily')boards.push({board:'daily',period:run.day,rankValue:1000000000000000-elapsedMs*100000+Math.min(score,99999)});else{boards.push({board:'skill',period:'all',rankValue:score});if(run.floor===8)boards.push({board:'abyss',period:'all',rankValue:run.trialLevel*100000+score});}
  const statements=[env.DB.prepare('UPDATE leaderboard_entries SET player_name = ? WHERE participant_id = ?').bind(name,identity.participantId),...boards.map(item=>env.DB.prepare('INSERT INTO leaderboard_entries (participant_id, board, period, player_name, rank_value, score, elapsed_ms, trial_level, floor, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(participant_id, board, period) DO UPDATE SET player_name = excluded.player_name, rank_value = excluded.rank_value, score = excluded.score, elapsed_ms = excluded.elapsed_ms, trial_level = excluded.trial_level, floor = excluded.floor, submitted_at = excluded.submitted_at WHERE excluded.rank_value > leaderboard_entries.rank_value').bind(identity.participantId,item.board,item.period,name,item.rankValue,score,elapsedMs,run.trialLevel,run.floor,submittedAt))];await env.DB.batch(statements);
  const ranks=[];for(const item of boards){const data=await leaderboardData(env,item.board,identity);ranks.push({board:item.board,rank:data.own?.rank||0,total:data.total,score,elapsedMs,trialLevel:run.trialLevel});}return json({ok:true,ranks});
 }catch(error){console.error('Ranking service request failed',error?.name);return json({error:'Ranking service unavailable'},503);}
}

export default {async fetch(request,env){
 const url=new URL(request.url),recovery=url.pathname==='/api/progress/recovery';
 if(url.pathname==='/api/progress'||recovery)return progressRoute(request,env,url,recovery);
 if(url.pathname==='/api/leaderboard'||url.pathname==='/api/leaderboard/submit'||url.pathname==='/api/leaderboard/name')return rankingRoute(request,env,url);
 return env.ASSETS.fetch(request);
}};
