import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MovementInput} from './public/input.js';
import {Save,newProgress,balance} from './public/save.js';
import {appraisal,appraisalBatch,rollRelic,INVENTORY_LIMIT} from './public/relics.js';
import {buildEquipmentAvatar,disposeAvatar} from './public/avatar.js';
import {Sound} from './public/audio.js';
import worker from './src/worker.js';
let passed=0;const test=async(name,fn)=>{await fn();passed++;console.log('PASS',name);};
await test('Two-thumb input keeps movement and look independent across iOS buttons=0 events, releases, and stalled frames',()=>{
 const input=new MovementInput();assert.equal(input.begin(1,60,650,390),'move');assert.equal(input.begin(2,320,650,390),'look');assert.equal(input.begin(3,100,640,390),null);input.move(1,60,608);assert.equal(input.y,1);input.move(2,330,655);assert.equal(input.y,1);
 for(let i=0;i<10000;i++)input.guard(.016,()=>true);assert.equal(input.y,1,'A stationary held thumb must not time out');input.release(2);assert.equal(input.y,1);input.release(1);assert.equal(input.y,0);
 input.begin(4,70,650,390);input.move(4,100,620);input.guard(.016,()=>false);assert.notEqual(input.x,0,'Touch capture differences must not cancel a held thumb');input.release(4);input.begin(5,70,650,390);input.move(5,100,620,0,'touch');assert(input.stick);input.release(5);input.begin(7,250,650,390,'mouse');input.move(7,260,650,0,'mouse');assert.equal(input.look,null);
 input.begin(6,70,650,390);input.move(6,70,608);input.keys.add('KeyW');assert(input.guard(.8,()=>true));assert.equal(input.y,0);assert.equal(input.keys.size,0);
});
await test('Dungeon touch surfaces block browser double-tap and pinch zoom without disabling menu scrolling',async()=>{
 const [html,css,game]=await Promise.all(['public/index.html','public/style.css','public/game.js'].map(path=>readFile(path,'utf8')));assert(html.includes('maximum-scale=1, user-scalable=no'));assert(css.includes('.playing #world,.playing #hud,.playing #hud *{touch-action:none'));assert(css.includes('dialog{')&&css.includes('touch-action:pan-y'));assert(game.includes("document.addEventListener('dblclick'"));assert(game.includes("['gesturestart','gesturechange','gestureend']"));
});
await test('Ten pulls charge once, honor the existing pity sequence, guarantee an epic, and never partially charge when capacity or funds are insufficient',()=>{
 for(let n=0;n<80;n++){const p=newProgress();p.floor=8;p.totalBank=20000;const seeds=Array.from({length:10},(_,i)=>n*20+i),comparison=structuredClone(p);const result=appraisalBatch(p,seeds);for(const seed of seeds)appraisal(comparison,seed);assert.deepEqual(p,comparison);assert.equal(result.results.length,10);assert(result.highest>=2);assert.equal(balance(p),14000);assert.equal(p.draws,10);}
 for(const mode of ['funds','capacity','locked']){const p=newProgress();p.floor=mode==='locked'?2:8;p.totalBank=mode==='funds'?5999:1000000;if(mode==='capacity')p.inventory=Array.from({length:INVENTORY_LIMIT-9},(_,i)=>rollRelic(i));const before=structuredClone(p);assert(appraisalBatch(p,Array.from({length:10},(_,i)=>i)).error);assert.deepEqual(p,before);}
});
class Bucket{
 constructor(){this.data=new Map();this.counter=0;}
 async get(key){const d=this.data.get(key);return d?{body:d.body,etag:d.etag,customMetadata:d.customMetadata,text:async()=>d.body}:null;}
 async put(key,body,{onlyIf,customMetadata}={}){const old=this.data.get(key);if(onlyIf?.etagDoesNotMatch==='*'&&old)return null;if(onlyIf?.etagMatches&&old?.etag!==onlyIf.etagMatches)return null;const d={body,etag:'revision-'+(++this.counter),customMetadata};this.data.set(key,d);return d;}
}
const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
const ANONYMOUS_KEY='light-maze-anonymous-key-v1',outboxes=()=>[...storage.keys()].filter(key=>key.startsWith('light-maze-outbox:'));
const timers=new Map();let timerId=0;globalThis.setTimeout=fn=>(timers.set(++timerId,fn),timerId);globalThis.clearTimeout=id=>timers.delete(id);
function fixture(){
 storage.clear();timers.clear();const env={BUCKET:new Bucket(),ASSETS:{fetch:()=>new Response('asset')}},network={owner:'player-a',failure:'',writes:0,keepalive:false};
 globalThis.fetch=async(path,options={})=>{
  const method=options.method||'GET',headers={...options.headers};if(network.owner)headers['oai-authenticated-user-id']=network.owner;
  if(method==='PUT'&&network.failure==='before'){network.failure='';throw new Error('Disconnected before upload');}
  const r=await worker.fetch(new Request('https://example.test'+path,{...options,headers}),env);
  if(method==='PUT'){network.writes++;network.keepalive=options.keepalive;if(network.failure==='after'){network.failure='';throw new Error('Lost acknowledgement');}}
  return r;
 };return{env,network};
}
await test('A new session restores bank, equipment, unlocks, and pity from anonymous cloud save, including a complete ten-pull transaction',async()=>{
 const {network}=fixture(),s=new Save(()=>{}),p=await s.load();assert.equal(s.identity,'anonymous');assert(p.playerName.startsWith('探索者'));p.floor=8;p.totalBank=20000;appraisalBatch(p,Array.from({length:10},(_,i)=>i+102));assert(await s.save(p));assert(network.keepalive);assert.equal(outboxes().length,0);const restored=await new Save(()=>{}).load();assert.deepEqual(restored,p);assert.equal(balance(restored),14000);assert.equal(restored.inventory.length,10);
});
await test('An interrupted upload survives a reload in an owner-scoped outbox and automatically resends without losing rewards',async()=>{
 const {network}=fixture(),s=new Save(()=>{}),p=await s.load();p.totalBank=5000;p.floor=4;await s.save(p);p.totalBank=7500;p.inventory.push(rollRelic(918,0,0,{forcedType:13}));network.failure='before';assert.equal(await s.save(p),false);assert.equal(s.status,'error');assert(storage.size>0);
 const next=new Save(()=>{}),restored=await next.load();assert.deepEqual(restored,p);assert.equal(next.status,'anonymous');assert.equal(outboxes().length,0);assert.deepEqual(await new Save(()=>{}).load(),p);
});
await test('A committed draw with a lost acknowledgement is recognized on reload and is never charged or awarded twice',async()=>{
 const {network}=fixture(),s=new Save(()=>{}),p=await s.load();p.floor=8;p.totalBank=20000;await s.save(p);appraisalBatch(p,Array.from({length:10},(_,i)=>i+2));network.failure='after';assert.equal(await s.save(p),false);const writes=network.writes;const next=new Save(()=>{}),restored=await next.load();assert.equal(network.writes,writes);assert.equal(restored.draws,10);assert.equal(restored.inventory.length,10);assert.equal(restored.forgeSpent,6000);assert.equal(outboxes().length,0);
});
await test('Coalesced unsent changes survive an acknowledged earlier write, and another account never receives the pending snapshot',async()=>{
 const {network}=fixture(),s=new Save(()=>{}),p=await s.load();p.totalBank=1000;await s.save(p);p.totalBank=2000;network.failure='after';await s.save(p);
 // A later mutation queued while the first acknowledgement is unknown.
 p.totalBank=3000;s.writing=true;s.save(p);s.writing=false;const resumed=await new Save(()=>{}).load();assert.equal(resumed.totalBank,3000);
 p.totalBank=4000;network.failure='before';await s.flush(); // The old instance may conflict; its outbox remains isolated.
 storage.set(ANONYMOUS_KEY,'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');network.owner='player-b';const other=await new Save(()=>{}).load();assert.equal(other.totalBank,0);assert.equal(other.inventory.length,0);
});
await test('Stale tabs and reset snapshots cannot overwrite a newer save; pending data is archived before accepting the cloud version',async()=>{
 const {env}=fixture(),a=new Save(()=>{}),b=new Save(()=>{}),pa=await a.load(),pb=await b.load();pa.totalBank=5000;await a.save(pa);pb.totalBank=1000;assert.equal(await b.save(pb),false);assert(b.conflict);assert.equal((await new Save(()=>{}).load()).totalBank,5000);
 const restored=await b.reloadAfterConflict();assert.equal(restored.totalBank,5000);assert([...env.BUCKET.data.keys()].some(k=>k.includes('.recovery-')));const current=new Save(()=>{});await current.load();assert.equal(await current.save(newProgress()),false);assert(current.conflict);assert.equal((await new Save(()=>{}).load()).totalBank,5000);
});
await test('Anonymous browsers are isolated, retain backups, and can migrate old device or signed-in progress without email',async()=>{
 const {env,network}=fixture(),s=new Save(()=>{}),p=await s.load(),firstToken=storage.get(ANONYMOUS_KEY);p.totalBank=1000;await s.save(p);p.totalBank=2000;await s.save(p);const key=[...env.BUCKET.data.keys()].find(value=>value.startsWith('light-maze/v2/anonymous/')&&!value.includes('.backup'));assert(key);assert.equal(JSON.parse(env.BUCKET.data.get(key+'.backup').body).totalBank,1000);
 storage.set(ANONYMOUS_KEY,'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');network.owner='';const guest=new Save(()=>{}),guestProgress=await guest.load();assert(guest.loaded&&!guest.guest&&guest.identity==='anonymous');guestProgress.totalBank=777;assert(await guest.save(guestProgress));guestProgress.totalBank=888;assert(await guest.save(guestProgress));assert.equal((await new Save(()=>{}).load()).totalBank,888);assert.equal(guestProgress.format,8);
 storage.set(ANONYMOUS_KEY,firstToken);network.owner='player-a';assert.equal((await new Save(()=>{}).load()).totalBank,2000);env.BUCKET.data.get(key).body='{broken';assert.equal((await new Save(()=>{}).load()).totalBank,1000);
 env.BUCKET.data.get(key).body=JSON.stringify({...p,catalog:null});const recovery=new Save(()=>{}),recovered=await recovery.load();assert.equal(recovered.totalBank,1000);recovered.totalBank+=100;assert.equal(await recovery.save(recovered),true);assert.equal((await new Save(()=>{}).load()).totalBank,1100);
 const legacy={...newProgress(),playerName:'旧探索者',totalBank:4321};env.BUCKET.data.set('light-maze/v1/legacy-player.json',{body:JSON.stringify(legacy),etag:'legacy-r1',customMetadata:{}});storage.set(ANONYMOUS_KEY,'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC');network.owner='legacy-player';assert.equal((await new Save(()=>{}).load()).totalBank,4321);
 storage.clear();storage.set('light-maze-guest-progress',JSON.stringify({...newProgress(),format:6,totalBank:6543}));network.owner='';const migrated=await new Save(()=>{}).load();assert.equal(migrated.totalBank,6543);assert.equal(migrated.format,8);
});
await test('The 3D avatar reflects equipped weapon and armor, adds ornament for higher rarity, and disposes geometry and materials',()=>{
 const make=tier=>{const p=newProgress();p.inventory=[rollRelic(8,0,0,{forcedType:15,minTier:tier}),rollRelic(9,0,0,{forcedType:13,minTier:tier})];p.inventory.forEach(i=>i.tier=tier);p.equipped=[p.inventory[0].id,p.inventory[1].id,''];return buildEquipmentAvatar(p);};const common=make(0),legend=make(3);assert.equal(legend.group.userData.staffType,15);assert.equal(legend.group.userData.armorType,13);assert.equal(legend.group.userData.tier,3);assert(legend.animated.length>common.animated.length);let disposed=0;const geos=new Set();legend.group.traverse(o=>{assert(o.position.toArray().every(Number.isFinite));if(o.geometry)geos.add(o.geometry);});for(const g of geos)g.addEventListener('dispose',()=>disposed++);disposeAvatar(legend.group);assert.equal(disposed,geos.size);disposeAvatar(common.group);
});
await test('Music plays the composed track, respects volume/background suspension, and effect voices are bounded and disconnected',async()=>{
 const nodes=[];const param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}});
 const node=()=>{const n={gain:param(),frequency:param(),connect(){},disconnect(){this.disconnected=true;},start(){},stop(){}};nodes.push(n);return n;};
 class AudioContext{constructor(){this.currentTime=1;this.state='running';this.sampleRate=1000;this.destination={};}createGain(){return node();}createBiquadFilter(){return node();}createOscillator(){return node();}createMediaElementSource(){return node();}createBuffer(){return{getChannelData:()=>new Float32Array(150)};}createBufferSource(){return node();}resume(){return Promise.resolve();}suspend(){return Promise.resolve();}}
 globalThis.window={AudioContext};globalThis.Audio=class{constructor(src){this.src=src;this.paused=true;this.loop=false;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};
 const settings={sound:true,musicVolume:.65},sound=new Sound(settings);await sound.start();assert.equal(sound.track.src,'/audio/home.mp3?v=7');assert(sound.track.loop);assert(!sound.track.paused);sound.tick(.1,100,false,true,4,false);assert.equal(sound.currentKey,'stage4');assert.equal(sound.track.src,'/audio/stage-4.mp3?v=7');const normal=sound.music.gain.value;assert(normal>.6);sound.tick(.1,100,false,true,7,false,{boss:true});assert.equal(sound.currentKey,'boss');sound.tick(.1,100,false,true,7,true,{boss:true});assert.equal(sound.currentKey,'escape');sound.tick(.1,4,false,true,7,false);assert(sound.music.gain.value<normal*.05);for(let i=0;i<100;i++)sound.note(440);assert.equal(sound.voices,40);for(const n of nodes)if(n.onended)n.onended();assert.equal(sound.voices,0);assert(nodes.some(n=>n.disconnected));settings.musicVolume=0;sound.setEnabled();assert([...sound.tracks.values()].every(channel=>channel.audio.paused));sound.suspend();
});
console.log(`${passed} input, save recovery, multi-pull, avatar, and audio checks passed.`);
