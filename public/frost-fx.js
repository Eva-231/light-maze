export function frostNovaFx(radius=6.3,hitCount=0){
 if(typeof document==='undefined'||typeof window==='undefined')return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const root=document.createElement('div');
 root.setAttribute('aria-hidden','true');
 Object.assign(root.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'9999',overflow:'hidden'});
 const center=document.createElement('div');
 Object.assign(center.style,{position:'absolute',left:'50%',top:'54%',width:'42vmin',height:'42vmin',transform:'translate(-50%,-50%)',borderRadius:'50%',border:'4px solid rgba(184,232,255,.95)',boxShadow:'0 0 26px rgba(135,211,255,.95), inset 0 0 34px rgba(164,228,255,.65)',background:'radial-gradient(circle,rgba(220,246,255,.28) 0%,rgba(113,190,255,.15) 36%,rgba(70,145,255,.05) 55%,rgba(0,0,0,0) 72%)'});
 root.append(center);
 for(let i=0;i<3;i++){
  const ring=document.createElement('div');
  Object.assign(ring.style,{position:'absolute',left:'50%',top:'54%',width:(26+i*15)+'vmin',height:(26+i*15)+'vmin',transform:'translate(-50%,-50%) scale(.25)',borderRadius:'50%',border:(5-i)+'px solid rgba('+(185-i*20)+','+(235-i*10)+',255,'+(.95-i*.18)+')',boxShadow:'0 0 '+(18+i*10)+'px rgba(126,208,255,.8)',opacity:'0'});
  root.append(ring);
  if(!reduced)ring.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:0},{offset:.18,opacity:1},{transform:'translate(-50%,-50%) scale(1.25)',opacity:0}],{duration:520+i*110,easing:'cubic-bezier(.08,.72,.19,1)',fill:'forwards'});
  else ring.style.opacity='.75';
 }
 for(let i=0;i<18;i++){
  const shard=document.createElement('div'),a=i/18*Math.PI*2,dist=16+Math.random()*22;
  Object.assign(shard.style,{position:'absolute',left:'50%',top:'54%',width:'4px',height:(18+Math.random()*34)+'px',borderRadius:'8px',background:'linear-gradient(#effcff,#7ec8ff 55%,rgba(77,150,255,0))',boxShadow:'0 0 12px rgba(154,221,255,.95)',transformOrigin:'50% 100%',transform:`translate(-50%,-100%) rotate(${a}rad) translateY(-${dist}px) scaleY(.4)`,opacity:'0'});
  root.append(shard);
  if(!reduced)shard.animate([{opacity:0,transform:`translate(-50%,-100%) rotate(${a}rad) translateY(-8px) scaleY(.2)`},{offset:.22,opacity:1},{opacity:0,transform:`translate(-50%,-100%) rotate(${a}rad) translateY(-${dist*2.2}px) scaleY(1.25)`}],{duration:520+Math.random()*180,easing:'ease-out',fill:'forwards'});
  else shard.style.opacity='.65';
 }
 const label=document.createElement('div');
 label.textContent=`❄ 氷結範囲 ${radius.toFixed(1)}m${hitCount?` · ${hitCount}体 HIT`:''}`;
 Object.assign(label.style,{position:'absolute',left:'50%',top:'17%',transform:'translateX(-50%)',padding:'8px 14px',border:'1px solid rgba(180,228,255,.75)',borderRadius:'999px',background:'rgba(5,20,38,.72)',backdropFilter:'blur(5px)',color:'#dff7ff',font:'700 13px/1.1 system-ui,sans-serif',letterSpacing:'.08em',textShadow:'0 0 12px #6fc4ff',whiteSpace:'nowrap'});
 root.append(label);
 if(!reduced){center.animate([{transform:'translate(-50%,-50%) scale(.35)',opacity:.15},{offset:.2,opacity:1},{transform:'translate(-50%,-50%) scale(1.35)',opacity:0}],{duration:650,easing:'ease-out',fill:'forwards'});label.animate([{opacity:0,transform:'translateX(-50%) translateY(8px)'},{opacity:1},{offset:.65,opacity:1},{opacity:0,transform:'translateX(-50%) translateY(-8px)'}],{duration:900,easing:'ease-out',fill:'forwards'});} 
 document.body.append(root);setTimeout(()=>root.remove(),reduced?500:950);
}
