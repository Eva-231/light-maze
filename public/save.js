export const newProgress=()=>({format:7,playerName:'',difficultyStats:{},chapterStars:{},claimedGifts:[],hintsSeen:[],trialLevel:1,bestTrial:0,bestSkill:0,mask:'',completed:[],forgeSpent:0,inventory:[],equipped:['','',''],caches:[],catalog:[],pity:0,draws:0,totalKills:0,bestScore:0,history:[],dailyBests:[],totalBank:0,level:0,runs:0,best:0,deepest:0,escapes:0,busts:0,floor:1,clears:0,bestCoverage:0,bestClearTime:0});
export const migrateProgress=data=>{const migrated={...newProgress(),...data,format:7,mask:'',completed:[]};migrated.playerName=typeof migrated.playerName==='string'?migrated.playerName.trim().slice(0,12):'';migrated.inventory=(migrated.inventory||[]).map(item=>({...item,favorite:!!item.favorite}));return migrated;};
export const upgradeCost=level=>1000+level*750;
export function spent(level){let n=0;for(let i=0;i<level;i++)n+=upgradeCost(i);return n;}
export const balance=p=>p.totalBank-spent(p.level)-(p.forgeSpent||0);
const GUEST_KEY='light-maze-guest-progress',GUEST_BACKUP=GUEST_KEY+'-backup',ANONYMOUS_KEY='light-maze-anonymous-key-v1';
const validAnonymousKey=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{32,128}$/.test(value);
const usableGuest=data=>data&&typeof data==='object'&&!Array.isArray(data)&&[1,2,3,4,5,6,7].includes(data.format)&&Number.isFinite(data.totalBank)&&(data.format<3||Array.isArray(data.inventory)&&Array.isArray(data.caches));
function createAnonymousKey(){try{const bytes=crypto.getRandomValues(new Uint8Array(24)),raw=String.fromCharCode(...bytes);return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}catch{return'';}}
function storedAnonymousKey(){try{const old=localStorage.getItem(ANONYMOUS_KEY);if(validAnonymousKey(old))return old;const key=createAnonymousKey();if(!key)return'';localStorage.setItem(ANONYMOUS_KEY,key);return localStorage.getItem(ANONYMOUS_KEY)===key?key:'';}catch{return'';}}
// The server is authoritative. This owner-scoped outbox only retains unsent writes.
export class Save{
 constructor(onStatus){this.revision='new';this.active=null;this.pending=null;this.writing=false;this.loaded=false;this.onStatus=onStatus;this.conflict=false;this.owner='';this.guest=false;this.identity='';this.anonymousKey=storedAnonymousKey();this.retryTimer=null;this.failures=0;this.lastBody='';this.status='loading';this.waiters=[];}
 notify(status){this.status=status;this.onStatus(status);}
 identityHeaders(){return this.anonymousKey?{'x-light-maze-player':this.anonymousKey}:{};}
 defaultPlayerName(){return '探索者'+(this.anonymousKey.slice(-4).toUpperCase()||'0001');}
 exportRecoveryKey(){return this.anonymousKey;}
 importRecoveryKey(value){const key=String(value||'').trim();if(!validAnonymousKey(key))return false;try{localStorage.setItem(ANONYMOUS_KEY,key);if(localStorage.getItem(ANONYMOUS_KEY)!==key)return false;this.anonymousKey=key;return true;}catch{return false;}}
 get key(){return this.owner?'light-maze-outbox:'+this.owner:'';}
 checkpoint(){if(!this.key)return;try{if(this.active||this.pending)localStorage.setItem(this.key,JSON.stringify({active:this.active,pending:this.pending,revision:this.revision}));else localStorage.removeItem(this.key);}catch{}}
 async load(){
  this.loaded=false;try{
  this.notify('loading');const response=await fetch('/api/progress',{headers:this.identityHeaders(),cache:'no-store',signal:AbortSignal.timeout(15000)});if(response.status===401||response.status===404||response.headers.get('content-type')?.includes('text/html')){this.guest=true;this.owner='guest';this.loaded=true;let local={};for(const key of [GUEST_KEY,GUEST_BACKUP])try{const raw=localStorage.getItem(key);if(!raw)continue;const candidate=JSON.parse(raw);if(usableGuest(candidate)){local=candidate;if(key===GUEST_BACKUP)localStorage.setItem(GUEST_KEY,raw);break;}}catch{}const result=migrateProgress(local);if(!result.playerName)result.playerName=this.defaultPlayerName();this.lastBody=JSON.stringify(result);this.notify('guest');return result;}if(!response.ok){this.notify('error');throw new Error('load');}
  const result=await response.json();if(!result||typeof result!=='object'||Array.isArray(result)||(Object.keys(result).length&&(![1,2,3,4,5,6,7].includes(result.format)||!Number.isFinite(result.totalBank)))){this.notify('error');throw new Error('Invalid saved progress');}
  this.revision=response.headers.get('x-save-revision');if(!this.revision)throw new Error('Missing save revision');this.owner=response.headers.get('x-save-owner')||'';this.identity=response.headers.get('x-save-identity')||'anonymous';this.loaded=true;this.conflict=false;const remoteEmpty=!Object.keys(result).length;let restored=migrateProgress(result);if(remoteEmpty&&this.identity==='anonymous'){for(const key of [GUEST_KEY,GUEST_BACKUP])try{const raw=localStorage.getItem(key);if(!raw)continue;const candidate=JSON.parse(raw);if(usableGuest(candidate)){restored=migrateProgress(candidate);break;}}catch{}}if(!restored.playerName)restored.playerName=this.defaultPlayerName();this.lastBody=remoteEmpty?'':JSON.stringify(restored);
  let draft=null;try{if(this.key)draft=JSON.parse(localStorage.getItem(this.key)||'null');}catch{}
  if(draft&&(draft.active||draft.pending)){
   this.active=draft.active;this.pending=draft.pending;const acknowledged=response.headers.get('x-save-mutation');
   if(this.active&&this.active.id===acknowledged)this.active=null;
   if(this.active&&this.active.base!==this.revision){this.conflict=true;this.notify('conflict');return migrateProgress(result);}
   if(!this.active&&this.pending&&draft.revision!==this.revision&&draft.active?.id!==acknowledged){this.conflict=true;this.notify('conflict');return migrateProgress(result);}
   const recovered=migrateProgress(JSON.parse((this.pending||this.active)?.body||this.lastBody));if(!recovered.playerName)recovered.playerName=this.defaultPlayerName();this.checkpoint();await this.flush();return this.conflict?restored:recovered;
  }
  if(remoteEmpty){await this.save(restored,{urgent:true});return restored;}this.notify(this.identity==='anonymous'?'anonymous':'saved');return restored;
  }catch(error){this.loaded=false;if(this.status!=='auth')this.notify('error');throw error;}
 }
 save(progress,{urgent=false}={}){
  if(!this.loaded||this.conflict)return Promise.resolve(false);const body=JSON.stringify(progress);if(this.guest){try{const previous=localStorage.getItem(GUEST_KEY);if(previous&&previous!==body)localStorage.setItem(GUEST_BACKUP,previous);localStorage.setItem(GUEST_KEY,body);this.lastBody=body;this.notify('guest');return Promise.resolve(true);}catch{this.notify('error');return Promise.resolve(false);}}
  if(body!==this.pending?.body&&(this.pending||body!==this.active?.body)&&(this.active||this.pending||body!==this.lastBody)){this.pending={id:crypto.randomUUID(),body};this.checkpoint();}
  return this.flush(urgent);
 }
 async flush(urgent=false){
  if(!this.loaded||this.conflict)return false;if(this.guest)return true;if(this.writing)return new Promise(resolve=>this.waiters.push(resolve));if(!this.active&&!this.pending)return true;
  clearTimeout(this.retryTimer);this.retryTimer=null;this.writing=true;
  try{
   while(this.active||this.pending){
    if(!this.active){this.active={...this.pending,base:this.revision};this.pending=null;this.checkpoint();}
    const write=this.active;this.notify('saving');const r=await fetch('/api/progress',{method:'PUT',headers:{'Content-Type':'application/json','x-save-revision':write.base,'x-save-mutation':write.id,...this.identityHeaders()},body:write.body,keepalive:write.body.length<55000,signal:AbortSignal.timeout(12000)});
    if(r.status===409){this.conflict=true;this.notify('conflict');return false;}
    if(!r.ok)throw new Error(r.status===401?'auth':'save');const revision=r.headers.get('x-save-revision');if(!revision)throw new Error('Missing save revision');
    this.revision=revision;this.lastBody=write.body;this.active=null;this.failures=0;this.checkpoint();
   }
   this.notify(this.identity==='anonymous'?'anonymous':'saved');return true;
  }catch(e){this.checkpoint();this.notify(e.message==='auth'?'auth':'error');if(e.message!=='auth'){this.failures++;this.retryTimer=setTimeout(()=>this.flush(),Math.min(30000,1500*2**Math.min(this.failures,4)));}return false;}
  finally{this.writing=false;for(const resolve of this.waiters.splice(0))resolve(!this.active&&!this.pending&&!this.conflict);}
 }
 async reloadAfterConflict(){
  // Archive the pending draft on the server before accepting another session's save.
  if(this.conflict&&(this.pending||this.active)){const body=(this.pending||this.active).body,r=await fetch('/api/progress/recovery',{method:'POST',headers:{'Content-Type':'application/json',...this.identityHeaders()},body,signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Recovery archive failed');}
  this.active=null;this.pending=null;this.conflict=false;this.checkpoint();return this.load();
 }
}
