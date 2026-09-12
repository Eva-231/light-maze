import * as T from './vendor/three.module.js';
import {RELICS,RARITIES} from './relics.js';
import {gearGrade} from './equipment-crafting.js';
// One transient low-resolution context, only after appraisal; all GPU objects retired on close.
export class RelicPreview{
 constructor(canvas,item){this.canvas=canvas;this.frame=0;this.last=0;try{
  const def=RELICS[item.type],color=def.curse?0xad79d1:new T.Color(RARITIES[item.tier].color).getHex();this.renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});this.renderer.setPixelRatio(1);this.renderer.setSize(260,220,false);this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(35,260/220,.1,20);this.camera.position.set(0,0,4.8);this.scene.add(new T.HemisphereLight(0xffffff,0x334044,2.5));this.group=new T.Group();this.scene.add(this.group);
  const metal=new T.MeshStandardMaterial({color:0x74868d,metalness:.65,roughness:.35,emissive:color,emissiveIntensity:.12}),glow=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1+item.tier*.2+gearGrade(item)*.1,roughness:.2});const body=new T.Mesh(def.slot===0?new T.CylinderGeometry(.035,.06,1.7,8):def.slot===1?new T.IcosahedronGeometry(.55,0):new T.CylinderGeometry(.23,.18,.65,8),metal);this.group.add(body);const core=new T.Mesh(new T.OctahedronGeometry(def.slot===1?.26:.18),glow);core.position.y=def.slot===0?.85:0;this.group.add(core);
  if(item.tier>=2)for(let i=0;i<Math.min(4,item.tier-1);i++){const ring=new T.Mesh(new T.TorusGeometry(.30+i*.07,.012,4,24),glow);ring.rotation.x=Math.PI/2+i*.6;ring.position.y=core.position.y;this.group.add(ring);}if(def.mythic){const count=def.key==='amaterasu'?8:def.key==='eater'?3:6;for(let i=0;i<count;i++){const shard=new T.Mesh(new T.OctahedronGeometry(.06),glow);shard.position.set(Math.cos(i/count*Math.PI*2)*.65,Math.sin(i/count*Math.PI*2)*.65,0);this.group.add(shard);}}
  this.frame=requestAnimationFrame(t=>this.draw(t));
 }catch{this.close();canvas.hidden=true;}}
 draw(t){if(!this.renderer)return;this.frame=requestAnimationFrame(n=>this.draw(n));if(document.hidden||t-this.last<66)return;this.last=t;this.group.rotation.y=t*.00045;this.group.rotation.z=.1;this.renderer.render(this.scene,this.camera);}
 close(){cancelAnimationFrame(this.frame);const gs=new Set(),ms=new Set();this.scene?.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());this.renderer?.dispose();this.renderer?.forceContextLoss?.();this.renderer=null;}
}
