// Touch roles stay attached to pointer IDs until release; rendering never owns input.
export class MovementInput{
 constructor(){this.x=0;this.y=0;this.stick=null;this.look=null;this.keys=new Set();}
 begin(id,x,y,width,type='touch'){
  if(type!=='mouse'&&x<width/2){if(this.stick)return null;this.stick={id,x,y,type};this.x=0;this.y=0;return 'move';}
  if(this.look)return null;this.look={id,x,y,type};return 'look';
 }
 move(id,x,y,buttons=1,type='touch'){
  // Some iOS/WebView builds report buttons=0 while a touch is still down.
  // Pointer up/cancel owns touch release; the buttons guard is mouse-only.
  if(type==='mouse'&&buttons===0){this.release(id);return null;}
  if(this.stick?.id===id){const dx=x-this.stick.x,dy=y-this.stick.y,len=Math.hypot(dx,dy),scale=Math.min(1,42/Math.max(1,len));this.x=dx*scale/42;this.y=-dy*scale/42;return{kind:'move',x:dx*scale,y:dy*scale};}
  if(this.look?.id===id){const delta={kind:'look',x:x-this.look.x,y:y-this.look.y};this.look.x=x;this.look.y=y;return delta;}return null;
 }
 release(id){if(this.stick?.id===id){this.stick=null;this.x=0;this.y=0;}if(this.look?.id===id)this.look=null;}
 reset(){this.x=0;this.y=0;this.stick=null;this.look=null;this.keys.clear();}
 guard(frameGap,hasCapture){if(frameGap>.35){this.reset();return true;}for(const p of [this.stick,this.look])if(p&&p.type==='mouse'&&hasCapture&&!hasCapture(p.id))this.release(p.id);return false;}
}
