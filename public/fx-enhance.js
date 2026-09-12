import * as T from './vendor/three.module.js';
import {World} from './world.js';

const additive=(color,opacity=.4)=>new T.MeshBasicMaterial({
  color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending
});

function transientStore(world){return world._cinematicFx??=([]);}
function addTransient(world,mesh,life,update){world.root.add(mesh);transientStore(world).push({mesh,life,age:0,update});return mesh;}
function updateTransients(world,dt){
  const list=transientStore(world);
  for(let i=list.length-1;i>=0;i--){
    const fx=list[i];fx.age+=dt;const p=Math.min(1,fx.age/fx.life);fx.update?.(fx,p,dt);
    if(p<1)continue;
    world.root.remove(fx.mesh);fx.mesh.traverse?.(o=>{o.geometry?.dispose?.();if(o.material&&!Array.isArray(o.material))o.material.dispose?.();});list.splice(i,1);
  }
}
function lineBetween(world,x,z,tx,tz,color=0xbef8ff,life=.22,width=.12){
  const from=new T.Vector3(x,1.42,z),to=new T.Vector3(tx,.95,tz),delta=to.clone().sub(from),len=delta.length();
  const g=new T.Group(),outer=new T.Mesh(new T.CylinderGeometry(width*1.8,width*2.4,1,8),additive(color,.22)),core=new T.Mesh(new T.CylinderGeometry(width*.55,width*.85,1,8),additive(0xffffff,.88)),tip=new T.Mesh(new T.SphereGeometry(width*2.2,10,8),additive(color,.75));
  outer.scale.y=len*1.04;core.scale.y=len;tip.position.y=len*.5;g.add(outer,core,tip);g.position.copy(from.clone().add(to).multiplyScalar(.5));g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());
  addTransient(world,g,life,(fx,p)=>{const fade=1-p;outer.material.opacity=.10+.25*fade;core.material.opacity=.35+.60*fade;tip.material.opacity=.25+.70*fade;tip.scale.setScalar(.7+fade*.8);});
}
function shockRing(world,x,z,color,scale=1,life=.42){
  const ring=new T.Mesh(new T.RingGeometry(.46,.72,40),additive(color,.55));ring.rotation.x=-Math.PI/2;ring.position.set(x,.055,z);
  addTransient(world,ring,life,(fx,p)=>{const s=1+p*(1.8+scale);ring.scale.setScalar(s);ring.material.opacity=(1-p)*.55;});
}
function flashOrb(world,x,z,color,scale=1,life=.28){
  const orb=new T.Mesh(new T.SphereGeometry(.22,12,10),additive(color,.75));orb.position.set(x,.52,z);
  addTransient(world,orb,life,(fx,p)=>{const s=(.7+p*3.2)*scale;orb.scale.setScalar(s);orb.material.opacity=(1-p)*.65;});
}
function ensureBossFx(world,e){
  if(e._bossReadabilityFx)return e._bossReadabilityFx;
  const outer=new T.Mesh(new T.RingGeometry(.82,1,48),additive(0xfff0a8,.55));outer.rotation.x=-Math.PI/2;
  const mid=new T.Mesh(new T.RingGeometry(.56,.72,48),additive(0xffc85c,.50));mid.rotation.x=-Math.PI/2;
  const fill=new T.Mesh(new T.CircleGeometry(1,48),additive(0xff9e32,.14));fill.rotation.x=-Math.PI/2;
  const pillar=new T.Mesh(new T.CylinderGeometry(.035,.26,3.7,14,1,true),additive(0xffd16b,.18));
  const link=new T.Mesh(new T.CylinderGeometry(.025,.06,1,8),additive(0xffe49a,.34));
  const projectile=new T.Mesh(new T.SphereGeometry(.15,10,8),additive(0xfff0a8,.85));
  for(const m of [outer,mid,fill,pillar,link,projectile]){m.visible=false;world.root.add(m);}
  e._bossReadabilityFx={outer,mid,fill,pillar,link,projectile};return e._bossReadabilityFx;
}
function setLine(mesh,from,to){const d=to.clone().sub(from),len=Math.max(.001,d.length());mesh.position.copy(from.clone().add(to).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());mesh.scale.set(1,len,1);}
function hideBossFx(fx){for(const m of Object.values(fx))m.visible=false;}
function enhanceBossTelegraph(world,time){
  for(const entry of world.enemyMeshes||[]){const e=entry.enemy;if(e.kind!==5)continue;const fx=ensureBossFx(world,e),rift=e.windup>0&&e.attackKind==='rift'&&e.attackAim;
    if(!rift){hideBossFx(fx);continue;}
    const radius=e.enraged?1.85:1.55,progress=Math.max(0,Math.min(1,1-e.windup/(e.windupMax||1))),pulse=1+Math.sin(time*20)*(.04+.05*progress),x=e.attackAim.x,z=e.attackAim.z;
    for(const m of [fx.outer,fx.mid,fx.fill]){m.visible=true;m.position.set(x,.045,z);}
    fx.outer.scale.setScalar(radius*(1.03+.09*progress)*pulse);fx.mid.scale.setScalar(radius*(.72+.16*progress));fx.fill.scale.setScalar(radius*(.52+.48*progress));
    fx.outer.material.opacity=.42+.40*progress;fx.mid.material.opacity=.30+.42*progress;fx.fill.material.opacity=.08+.18*progress;
    fx.pillar.visible=true;fx.pillar.position.set(x,1.86,z);fx.pillar.scale.set(1,1+.18*progress,1);fx.pillar.material.opacity=.10+.22*progress;
    const from=new T.Vector3(e.x,1.55,e.z),to=new T.Vector3(x,.18,z);fx.link.visible=true;setLine(fx.link,from,to);fx.link.material.opacity=.12+.22*progress;
    fx.projectile.visible=true;fx.projectile.position.copy(from.clone().lerp(to,.18+.78*progress));fx.projectile.scale.setScalar(.9+.75*progress);fx.projectile.material.opacity=.55+.35*progress;
  }
}
function ensureTrapMarker(world,t){
  if(t._readabilityFx)return t._readabilityFx;
  const color={spike:0xff6259,mire:0xa4c96e,ambush:0xd88cff,eclipse:0xa28cff}[t.item.kind]||0xff765f;
  const pillar=new T.Mesh(new T.CylinderGeometry(.012,.055,1.65,8,1,true),additive(color,.12));pillar.position.set(t.item.x,.84,t.item.z);
  const top=new T.Mesh(new T.OctahedronGeometry(.075,0),additive(color,.45));top.position.set(t.item.x,1.72,t.item.z);
  world.root.add(pillar,top);t._readabilityFx={pillar,top};return t._readabilityFx;
}
function enhanceTraps(world,state){
  for(const t of world.trapMeshes||[]){const fx=ensureTrapMarker(world,t),visible=t.ring.visible&&!t.item.spent,armed=t.item.timer>=0,pulse=.88+Math.sin(world.elapsed*(armed?24:5)+t.item.x)*.12;
    fx.pillar.visible=fx.top.visible=visible;if(!visible)continue;
    fx.pillar.material.opacity=armed?.22:.08;fx.top.material.opacity=armed?.9:.48;fx.top.scale.setScalar((armed?1.55:1)*pulse);
    t.ring.scale.setScalar((armed?1.34:1.06)*pulse);t.ring.material.opacity=Math.max(t.ring.material.opacity,armed?.82:.58);
  }
}

const originalCastBeam=World.prototype.castBeam;
World.prototype.castBeam=function(x,z,tx,tz,...rest){const result=originalCastBeam.call(this,x,z,tx,tz,...rest);lineBetween(this,x,z,tx,tz,0xbef8ff,.24,.10);flashOrb(this,tx,tz,0xc9fbff,.75,.22);return result;};

const originalBurst=World.prototype.burst;
World.prototype.burst=function(x,z,tier,count=24){const result=originalBurst.call(this,x,z,tier,count);const color=[0xadf4ff,0xc2a0ff,0xff91d4,0xffd879][tier]||0xffffff,big=count>=30?1.45:1;shockRing(this,x,z,color,big,count>=38?.52:.40);flashOrb(this,x,z,color,big,count>=38?.34:.25);if(count>=38){this.hitShake=Math.max(this.hitShake,.32);this.bloomKick=Math.max(this.bloomKick,1.35);}return result;};

const originalAnimateActors=World.prototype.animateActors;
World.prototype.animateActors=function(time,state){const r=originalAnimateActors.call(this,time,state);enhanceBossTelegraph(this,time);return r;};

const originalAnimateExpedition=World.prototype.animateExpedition;
World.prototype.animateExpedition=function(dt,state){const r=originalAnimateExpedition.call(this,dt,state);enhanceTraps(this,state);return r;};

const originalRender=World.prototype.render;
World.prototype.render=function(dt,state){updateTransients(this,dt);return originalRender.call(this,dt,state);};

const originalReset=World.prototype.resetLevel;
World.prototype.resetLevel=function(...args){if(this._cinematicFx){for(const fx of this._cinematicFx)this.root.remove(fx.mesh);this._cinematicFx.length=0;}return originalReset.apply(this,args);};
