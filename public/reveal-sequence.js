// Presentation only: every result has already been paid for and saved.
export class RevealSequence {
 constructor(results,emit,{schedule=setTimeout,cancel=clearTimeout}={}){this.results=results;this.emit=emit;this.schedule=schedule;this.cancel=cancel;this.timers=[];this.done=false;this.index=-1;}
 after(delay,fn){this.timers.push(this.schedule(()=>{if(!this.done)fn();},delay));}
 start(){this.emit({phase:'gather',index:-1});this.after(1100,()=>this.next());}
 next(){this.index++;if(this.index>=this.results.length){this.finish();return;}const index=this.index,tier=this.results[index].item.tier;
  this.emit({phase:'sealed',index});
  if(tier>=2){this.after(900,()=>this.emit({phase:'charge',index}));if(tier===3)this.after(3000,()=>this.emit({phase:'silence',index}));this.after(tier===3?4000:2400,()=>this.emit({phase:'promise',index,tier}));}
  const revealAt=tier===3?5200:tier===2?3500:tier===1?800:420,hold=tier===3?3200:tier===2?2000:tier===1?850:480;
  this.after(revealAt,()=>this.emit({phase:'burst',index,tier,result:this.results[index]}));this.after(revealAt+hold,()=>this.next());
 }
 finish(silent=false){if(this.done)return;this.done=true;for(const t of this.timers)this.cancel(t);this.timers=[];this.emit({phase:'complete',silent});}
}
