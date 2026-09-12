import http from 'node:http';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,copyFile} from 'node:fs/promises';
import {extname,join,normalize} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const publicDir=join(root,'public');
const dataDir=process.env.LIGHT_MAZE_DATA_DIR||join(root,'data');
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.mp3':'audio/mpeg','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp'};
const anonymousKey=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{32,128}$/.test(v);
const hash=v=>createHash('sha256').update(v).digest('hex');
const identity=req=>{const key=req.headers['x-light-maze-player'];if(!anonymousKey(key))return null;const id='anonymous-'+hash('light-maze-anonymous:'+key);return{id,owner:id.slice(0,34)};};
const reply=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',...headers});res.end(JSON.stringify(data));};
const body=async req=>{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>100000)throw Error('too-large');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));};
const atomic=async(path,value)=>{await mkdir(join(path,'..'),{recursive:true});const temp=path+'.'+randomUUID()+'.tmp';await writeFile(temp,value);await rename(temp,path);};
const loadJson=async(path,fallback)=>{try{return JSON.parse(await readFile(path,'utf8'));}catch{return fallback;}};
const savePath=id=>join(dataDir,'progress',id+'.json');
const validProgress=d=>d&&typeof d==='object'&&!Array.isArray(d)&&Number.isFinite(d.totalBank)&&Number.isInteger(d.format)&&d.format>=1&&d.format<=7&&Array.isArray(d.inventory)&&d.inventory.length<=300;
const headers=(who,raw,mutation='')=>({'x-save-revision':raw?hash(raw):'new','x-save-owner':who.owner,'x-save-identity':'anonymous','x-save-mutation':mutation});

function jstDay(now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function score(run){const accuracy=run.shots?Math.round(run.hits/run.shots*100):0,depth=run.mode==='daily'?1260:run.floor===8?1600+Math.min(run.trialLevel,100)*120:run.floor*180;return 2000+Math.round(Math.max(0,Math.min(1.5,run.parTime/Math.max(1,run.time)))*1800)+Math.max(0,1000-Math.round(run.damageTaken*15))+accuracy*10+Math.min(run.dodges,5)*180+Math.min(run.counterHits,5)*220+Math.min(run.maxHuntChain,5)*180+Math.min(run.interrupts,5)*180+Math.min(run.weakHits,10)*80+depth;}
const validName=n=>typeof n==='string'&&Array.from(n.trim()).length>=2&&Array.from(n.trim()).length<=12&&!/[.@]/.test(n);
const validRun=r=>r&&r.rules===8&&r.cleared===true&&r.success===true&&['normal','daily'].includes(r.mode)&&Number.isFinite(r.time)&&r.time>=1&&r.time<=5000&&Number.isInteger(r.floor)&&r.floor>=1&&r.floor<=8;
const boardData=(rows,board,who)=>{const period=board==='daily'?jstDay():'all',filtered=rows.filter(x=>x.board===board&&x.period===period).sort((a,b)=>b.rankValue-a.rankValue||a.submittedAt-b.submittedAt),entries=filtered.slice(0,50).map((x,i)=>({rank:i+1,playerName:x.playerName,score:x.score,elapsedMs:x.elapsedMs,trialLevel:x.trialLevel,floor:x.floor,mine:x.participantId===who?.id})),index=filtered.findIndex(x=>x.participantId===who?.id);return{board,period,entries,own:index<0?null:{rank:index+1,playerName:filtered[index].playerName,score:filtered[index].score,elapsedMs:filtered[index].elapsedMs,trialLevel:filtered[index].trialLevel,floor:filtered[index].floor,mine:true},total:filtered.length};};

async function api(req,res,url){
 const who=identity(req);
 if(url.pathname==='/api/progress'){
  if(!who)return reply(res,401,{error:'Anonymous key required'});const path=savePath(who.id),raw=await readFile(path,'utf8').catch(()=>''),current=headers(who,raw);
  if(req.method==='GET')return raw?(res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',...current}),res.end(raw)):reply(res,200,{},current);
  if(req.method!=='PUT')return reply(res,405,{error:'Method not allowed'});try{const data=await body(req);if(!validProgress(data))return reply(res,400,{error:'Invalid progress'});const expected=req.headers['x-save-revision'];if(expected!==(raw?hash(raw):'new'))return reply(res,409,{error:'Save changed in another session'});if(raw){await mkdir(join(dataDir,'progress'),{recursive:true});await copyFile(path,path+'.backup');}const next=JSON.stringify(data);await atomic(path,next);return reply(res,200,{ok:true},headers(who,next,String(req.headers['x-save-mutation']||'')));}catch(e){return reply(res,e.message==='too-large'?413:400,{error:'Invalid JSON'});}
 }
 if(url.pathname==='/api/progress/recovery'&&req.method==='POST'){if(!who)return reply(res,401,{error:'Anonymous key required'});try{const data=await body(req);if(!validProgress(data))return reply(res,400,{error:'Invalid progress'});await atomic(savePath(who.id)+'.recovery-'+Date.now(),JSON.stringify(data));return reply(res,200,{ok:true});}catch{return reply(res,400,{error:'Invalid JSON'});}}
 const leaderboardPath=join(dataDir,'leaderboard.json'),rows=await loadJson(leaderboardPath,[]);
 if(url.pathname==='/api/leaderboard'&&req.method==='GET'){const board=url.searchParams.get('board')||'daily';return ['daily','abyss','skill'].includes(board)?reply(res,200,boardData(rows,board,who)):reply(res,400,{error:'Unknown board'});}
 if((url.pathname==='/api/leaderboard/name'||url.pathname==='/api/leaderboard/submit')&&req.method==='POST'){
  if(!who)return reply(res,401,{error:'Anonymous key required'});try{const data=await body(req),name=String(data.playerName||'').normalize('NFKC').trim().replace(/\s+/g,' ');if(!validName(name))return reply(res,400,{error:'Invalid player name'});for(const row of rows)if(row.participantId===who.id)row.playerName=name;if(url.pathname.endsWith('/submit')){if(!validRun(data.run))return reply(res,400,{error:'Invalid ranked run'});const run=data.run,s=score(run),elapsedMs=Math.round(run.time*1000),items=run.mode==='daily'?[['daily',run.day,1e15-elapsedMs*1e5+Math.min(s,99999)]]:[['skill','all',s],...(run.floor===8?[['abyss','all',run.trialLevel*100000+s]]:[])];for(const [board,period,rankValue] of items){const next={participantId:who.id,board,period,playerName:name,rankValue,score:s,elapsedMs,trialLevel:run.trialLevel,floor:run.floor,submittedAt:Date.now()},i=rows.findIndex(x=>x.participantId===who.id&&x.board===board&&x.period===period);if(i<0)rows.push(next);else if(rankValue>rows[i].rankValue)rows[i]=next;}await atomic(leaderboardPath,JSON.stringify(rows));return reply(res,200,{ok:true,ranks:items.map(([board])=>{const d=boardData(rows,board,who);return{board,rank:d.own?.rank||0,total:d.total,score:s,elapsedMs,trialLevel:run.trialLevel};})});}await atomic(leaderboardPath,JSON.stringify(rows));return reply(res,200,{ok:true});}catch{return reply(res,400,{error:'Invalid JSON'});}
 }
 return reply(res,404,{error:'Not found'});
}

const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/'))return await api(req,res,url);let pathname=decodeURIComponent(url.pathname);if(pathname==='/'||!extname(pathname))pathname='/index.html';const clean=normalize(pathname).replace(/^(\.\.(\/|\\|$))+/,''),path=join(publicDir,clean);if(!path.startsWith(publicDir))return reply(res,403,{error:'Forbidden'});const data=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':extname(path)==='.html'?'no-cache':'public, max-age=3600'});res.end(data);}catch{reply(res,404,{error:'Not found'});}});
server.listen(port,()=>console.log(`LIGHT MAZE independent server: http://localhost:${port}`));
