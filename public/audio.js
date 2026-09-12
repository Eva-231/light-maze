import {abyssMusicKey} from './abyss-music.js';
export const MUSIC_TRACKS={
 abyssRitual:{title:'石環の鼓動 · トライバル',src:'./audio/abyss-ritual.mp3?v=13'},
 abyssChip:{title:'星屑の回路 · チップチューン',src:'./audio/abyss-chip.mp3?v=13'},
 abyssPiano:{title:'忘れられた舞踏会 · ピアノワルツ',src:'./audio/abyss-piano.mp3?v=13'},
 abyssBreaks:{title:'黒曜ドライブ · ブレイクビーツ',src:'./audio/abyss-breaks.mp3?v=13'},
 abyssJazz:{title:'地下零時 · ジャズ',src:'./audio/abyss-jazz.mp3?v=13'},
 abyssCosmic:{title:'星のない海 · アンビエント',src:'./audio/abyss-cosmic.mp3?v=13'},
 home:{title:'帰還の灯',src:'./audio/home.mp3?v=13'},
 forge:{title:'星鋳の儀式',src:'./audio/forge.mp3?v=13'},
 stage1:{title:'最初の燐光',src:'./audio/stage-1.mp3?v=13'},
 stage2:{title:'影の足音',src:'./audio/stage-2.mp3?v=13'},
 stage3:{title:'疾走する回廊',src:'./audio/stage-3.mp3?v=13'},
 stage4:{title:'紫晶鉱脈',src:'./audio/stage-4.mp3?v=13'},
 stage5:{title:'転位の残響',src:'./audio/stage-5.mp3?v=13'},
 stage6:{title:'銀光を追え',src:'./audio/stage-6.mp3?v=13'},
 stage7:{title:'深淵の門',src:'./audio/stage-7.mp3?v=13'},
 stage8:{title:'終わらない試練',src:'./audio/stage-8.mp3?v=13'},
 boss:{title:'番人、覚醒',src:'./audio/boss.mp3?v=13'},
 escape:{title:'灯が尽きる前に',src:'./audio/escape.mp3?v=13'}
};
export function musicScene({mode='menu',floor=1,boss=false,collapse=false,forge=false,abyssFloor=0,abyssSeed=0}={}){
 if(forge)return'forge';if(mode==='play'){if(abyssFloor)return abyssMusicKey(abyssSeed,abyssFloor);if(collapse)return'escape';if(boss)return'boss';return'stage'+Math.max(1,Math.min(8,Math.floor(floor||1)));}return'home';
}
function installCampNavigationRepair(){
 if(typeof document==='undefined'||document.documentElement.dataset.campNavRepair)return;document.documentElement.dataset.campNavRepair='1';
 const ready=()=>{
  const camp=document.getElementById('camp-open'),result=document.getElementById('result-camp'),dialog=document.getElementById('camp-dialog'),forge=document.querySelector('[data-camp-tab="forge"]');if(!camp||!dialog||!forge)return;
  const fallback=()=>setTimeout(()=>{if(!dialog.open){try{forge.click();dialog.showModal();}catch{}}},40);
  camp.addEventListener('click',fallback);result?.addEventListener('click',fallback);
  if(!document.getElementById('gacha-open')){const b=document.createElement('button');b.id='gacha-open';b.type='button';b.textContent='遺物ガチャ';b.setAttribute('aria-label','遺物ガチャを開く');b.addEventListener('click',()=>{camp.click();setTimeout(()=>forge.click(),0);});camp.parentElement?.insertBefore(b,camp.nextSibling);}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
}
export class Sound{
 constructor(settings){this.settings=settings;this.context=null;this.duckUntil=0;this.heart=0;this.step=0;this.lastHaptic=0;this.voices=0;this.musicTarget=-1;this.filterTarget=-1;this.currentKey='home';this.pendingKey='home';this.tracks=new Map();this.track=null;this.pauseTimers=new Map();this.unlock=()=>{if(!this.settings.sound)return;this.start();};for(const type of ['pointerdown','touchstart','keydown'])document.addEventListener(type,this.unlock,{capture:true,passive:true});installCampNavigationRepair();}
 ensureTrack(key){
  if(this.tracks.has(key))return this.tracks.get(key);const meta=MUSIC_TRACKS[key]||MUSIC_TRACKS.home,audio=new Audio(meta.src);audio.loop=true;audio.preload='auto';audio.playsInline=true;audio.setAttribute('playsinline','');const gain=this.context.createGain();gain.gain.value=0;const source=this.context.createMediaElementSource(audio);source.connect(gain);gain.connect(this.musicFilter);const channel={audio,gain,source,key};this.tracks.set(key,channel);return channel;
 }
 switchTrack(key=this.pendingKey,seconds=1.15){
  this.pendingKey=MUSIC_TRACKS[key]?key:'home';if(!this.context)return;const ctx=this.context,old=this.track?this.tracks.get(this.currentKey):null,next=this.ensureTrack(this.pendingKey);if(old===next){this.track=next.audio;if(this.settings.sound&&this.settings.musicVolume!==0)next.audio.play().catch(()=>{});return;}
  clearTimeout(this.pauseTimers.get(next.key));next.gain.gain.cancelScheduledValues(ctx.currentTime);next.gain.gain.setValueAtTime(next.gain.gain.value,ctx.currentTime);next.gain.gain.linearRampToValueAtTime(1,ctx.currentTime+seconds);if(this.settings.sound&&this.settings.musicVolume!==0)next.audio.play().catch(()=>{});
  if(old){old.gain.gain.cancelScheduledValues(ctx.currentTime);old.gain.gain.setValueAtTime(old.gain.gain.value,ctx.currentTime);old.gain.gain.linearRampToValueAtTime(.0001,ctx.currentTime+seconds);const timer=setTimeout(()=>{if(this.currentKey!==old.key)old.audio.pause();},Math.ceil(seconds*1000)+80);this.pauseTimers.set(old.key,timer);}
  this.currentKey=next.key;this.track=next.audio;
 }
 async start(){
  try{
   if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=this.context=new C();this.master=ctx.createGain();this.master.gain.value=this.settings.sound?.6:0;this.master.connect(ctx.destination);
    this.music=ctx.createGain();this.music.gain.value=0;this.music.connect(this.master);this.musicFilter=ctx.createBiquadFilter();this.musicFilter.type='lowpass';this.musicFilter.frequency.value=5200;this.musicFilter.connect(this.music);
    this.noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.15),ctx.sampleRate);const b=this.noise.getChannelData(0);for(let i=0;i<b.length;i++)b[i]=(Math.random()*2-1)*(1-i/b.length);this.switchTrack(this.pendingKey,0);
   }
   const ctx=this.context;this.setEnabled();if(ctx.state==='suspended')await ctx.resume();if(this.settings.sound&&this.settings.musicVolume!==0){const channel=this.ensureTrack(this.currentKey);if(channel.audio.paused)await channel.audio.play().catch(()=>{});}
  }catch(error){console.warn('Sound unavailable:',error?.name);}
 }
 suspend(){for(const channel of this.tracks.values())channel.audio.pause();this.context?.suspend().catch(()=>{});}
 setEnabled(){if(!this.context)return;const t=this.context.currentTime;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(this.settings.sound?.6:0,t,.08);if(!this.settings.sound||this.settings.musicVolume===0)for(const channel of this.tracks.values())channel.audio.pause();else this.start();}
 setScene(scene){const key=typeof scene==='string'?scene:musicScene(scene);if(key!==this.pendingKey||key!==this.currentKey)this.switchTrack(key);}
 get title(){return MUSIC_TRACKS[this.currentKey]?.title||MUSIC_TRACKS.home.title;}
 note(freq,duration=.28,volume=.07,delay=0,type='sine'){
  const ctx=this.context;if(!ctx||!this.settings.sound||this.voices>=40)return;this.voices++;const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.connect(g);g.connect(this.master);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.onended=()=>{o.disconnect();g.disconnect();this.voices=Math.max(0,this.voices-1);};o.start(t);o.stop(t+duration+.03);
 }
 chime(tier=0){const f=[659.25,880,1108.73,1318.51][tier]||1318.51;this.note(f,.34,.08);this.note(f*1.5,.50,.035,.05);if(tier>0){this.note(f*1.2599,.42,.05,.11);this.note(f*2,.55,.045,.11);}}
 reveal(){this.note(1050+Math.random()*120,.13,.014);}
 chain(n){const f=440*2**((n-1)*3/12);this.note(f,.6,.09);this.note(f*1.5,.6,.05,.08);this.note(f*2,.9,.05,.16);}
 legendary(){this.duckUntil=(this.context?.currentTime||0)+1;this.note(110,.35,.10);for(let i=0;i<5;i++)this.note([523.25,659.25,783.99,1046.5,1567.98][i],1.1,.07,.30+i*.075);}
 prelude(tier){this.duckUntil=(this.context?.currentTime||0)+1.8;this.note(73.42,.75,.08);if(tier>=2)for(let i=0;i<4;i++)this.note([293.66,440,587.33,880][i],.9,.035,.25+i*.18);}
 bank(){for(let i=0;i<6;i++)this.note([261.63,329.63,392,523.25,659.25,1046.5][i],1.3,.08,i*.09);}
 tick(dt,light,moving,playing,floor=1,collapse=false,scene={}){
  this.setScene({...scene,mode:scene.mode||(playing?'play':'menu'),floor,collapse});const ctx=this.context;if(!ctx)return;const scale=!playing?.72:light<5?.015:light<15?.19:light<30?.68:1;
  const target=ctx.currentTime<this.duckUntil?0:Math.max(0,this.settings.musicVolume??.65)*1.08*scale;
  if(Math.abs(target-this.musicTarget)>.003){this.musicTarget=target;this.music.gain.cancelScheduledValues(ctx.currentTime);this.music.gain.setTargetAtTime(target,ctx.currentTime,.34);}
  const cutoff=light<15?900:collapse?2900:scene.abyssFloor?12000:floor>=6?3600:5200;if(cutoff!==this.filterTarget){this.filterTarget=cutoff;this.musicFilter.frequency.setTargetAtTime(cutoff,ctx.currentTime,.65);}
  if(!playing||!this.settings.sound)return;this.heart-=dt;this.step-=dt;
  if(light<30&&this.heart<=0){this.heart=light<5?.57:light<15?.82:1.3;this.note(48,.15,light<15?.13:.055);this.note(43,.13,.07,.16);}
  if(moving&&this.step<=0){this.step=.40;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=this.noise;filter.type='lowpass';filter.frequency.value=350;gain.gain.value=.11;src.connect(filter);filter.connect(gain);gain.connect(this.master);src.start();src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};}
 }
 haptic(level=0){if(!this.settings.haptic||!navigator.vibrate)return;const now=performance.now();if(now-this.lastHaptic<(level===0?1400:180))return;this.lastHaptic=now;try{navigator.vibrate([[5],[12],[20,30,12],[35,35,55]][level]);}catch{}}
}
