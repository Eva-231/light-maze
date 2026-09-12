import {gearOrnaments} from './abyss-visuals.js';
import * as T from './vendor/three.module.js';
import {RELICS,RARITIES} from './relics.js';

export function disposeAvatar(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();group.removeFromParent();}

// Lofted armor follows the shoulders, waist and joints instead of stacking boxes.
function loft(sections,segments=20){const positions=[],indices=[],uv=[];for(let j=0;j<sections.length;j++){const [y,rx,rz,cx=0,cz=0]=sections[j];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;positions.push(cx+Math.sin(a)*rx,y,cz+Math.cos(a)*rz);uv.push(i/segments,j/(sections.length-1));if(j&&i){const n=j*(segments+1)+i;indices.push(n,n-1,n-segments-1,n-1,n-segments-2,n-segments-1);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
function plate(points,depth=.025){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,steps:1,curveSegments:6});}
function cloakPanel(side){const p=[],uv=[],indices=[],cols=16,rows=20;for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const t=j/rows,u=i/cols,spread=.25+.34*t,width=spread*(.96-.08*Math.sin(t*Math.PI));p.push(side*(u*width+.025*t*t)-.05*t*t,2.13-1.91*t+.035*Math.sin(u*8+t),-.14-.26*Math.sin(t*Math.PI*.75)-.035*Math.cos(u*Math.PI*7)*(.15+t));uv.push(u,t);if(j&&i){const n=j*(cols+1)+i;indices.push(n,n-1,n-cols-1,n-1,n-cols-2,n-cols-1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
// Bake rigid parts by material: the detailed model stays cheap on a phone.
function batchRigid(group,animated){group.updateMatrixWorld(true);const held=new Set(animated),batches=new Map(),original=new Set(),remove=[];group.traverse(m=>{if(!m.isMesh)return;for(let p=m;p&&p!==group;p=p.parent)if(held.has(p))return;const clone=m.geometry.clone();clone.applyMatrix4(m.matrixWorld);const g=clone.index?clone.toNonIndexed():clone;if(g!==clone)clone.dispose();const list=batches.get(m.material)||[];list.push(g);batches.set(m.material,list);original.add(m.geometry);remove.push(m);});
 for(const m of remove)m.removeFromParent();for(const g of original)g.dispose();for(const [material,parts]of batches){const g=new T.BufferGeometry();for(const [name,size]of [['position',3],['normal',3],['uv',2]]){const count=parts.reduce((n,p)=>n+p.getAttribute('position').count,0),array=new Float32Array(count*size);let offset=0;for(const p of parts){const attr=p.getAttribute(name),length=p.getAttribute('position').count*size;if(attr)array.set(attr.array,offset);offset+=length;}g.setAttribute(name,new T.BufferAttribute(array,size));}for(const p of parts)p.dispose();g.computeBoundingSphere();group.add(new T.Mesh(g,material));}
}

export function buildEquipmentAvatar(progress){
 const [staff,armor,lamp]=progress.equipped.map(id=>progress.inventory.find(i=>i.id===id)),staffTier=staff?.tier??0,armorTier=armor?.tier??0,tier=Math.max(staffTier,armorTier,lamp?.tier??0),style=staff?.type??0,phoenix=armor?.type===19,heavy=armor?.type===14;
 const group=new T.Group(),animated=[],glows=[],capeColor=phoenix?0x39191b:armor?.type===13?0x201a35:armor?.type===12?0x152f36:0x15212b;
 const steel=new T.MeshStandardMaterial({color:heavy?0x687581:phoenix?0x303640:0x516373,metalness:.58,roughness:.34});
 const darkSteel=new T.MeshStandardMaterial({color:0x1b2732,metalness:.52,roughness:.42});
 const trim=new T.MeshStandardMaterial({color:armorTier>=3?0xcba770:armorTier===2?0x9b91b6:0x87989e,metalness:.66,roughness:.28});
 const gold=new T.MeshStandardMaterial({color:staffTier>=2?0xd3b279:0x839aa8,metalness:.68,roughness:.27});
 const cloth=new T.MeshStandardMaterial({color:capeColor,roughness:.91,side:T.DoubleSide});
 const leather=new T.MeshStandardMaterial({color:0x11191e,metalness:.05,roughness:.83});
 const black=new T.MeshStandardMaterial({color:0x05090e,roughness:.68});
 const emission=(grade,strength=1)=>{const c=new T.Color(RARITIES[grade].color),m=new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:strength,metalness:.18,roughness:.22});glows.push(m);return m;};
 const armorLight=emission(armorTier,armorTier>=2?1.1:.12),weaponLight=emission(staffTier,staffTier>=2?2:.45),lampLight=emission(lamp?.tier??0,1.15);
 const mesh=(geometry,material,x=0,y=0,z=0,sx=1,sy=1,sz=1,parent=group)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;};
 const sphere=new T.SphereGeometry(1,18,14),gem=new T.OctahedronGeometry(1),tube=(a,b,r1,r2,mat,parent=group)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),d=to.clone().sub(from),m=mesh(new T.CylinderGeometry(r2,r1,d.length(),12),mat,0,0,0,1,1,1,parent);m.position.copy(from.add(to).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;};
 const etch=(a,b,mat=trim,r=.006)=>tube(a,b,r,r,mat);
 // Eight-head anatomy, a relaxed contrapposto and fitted greaves.
 for(const side of [-1,1]){
  const hip=[side*.14,1.38,side===1?-.035:.025],knee=[side*.20,.80,side===1?-.055:.105],ankle=[side*.245,.19,side===1?-.025:.20];
  tube(hip,knee,.12,.085,leather);tube(knee,ankle,.081,.047,darkSteel);mesh(sphere,black,...knee,.089,.092,.088);
  const thigh=mesh(loft([[0,.105,.082],[.13,.129,.10],[.37,.11,.092],[.48,.085,.076]]),steel,side*.175,.89,side===1?-.01:.08);thigh.rotation.z=side*.075;
  mesh(plate([[-.065,.10],[0,.135],[.065,.10],[.073,-.035],[0,-.13],[-.073,-.035]],.026),trim,knee[0],knee[1],knee[2]+.072);
  mesh(loft([[0,.047,.063],[.20,.075,.09],[.42,.09,.10],[.48,.065,.083]]),steel,ankle[0],.24,ankle[2]-.01);
  etch([ankle[0],.29,ankle[2]+.06],[knee[0],.69,knee[2]+.098]);
  const boot=mesh(sphere,darkSteel,ankle[0],.12,ankle[2]+.064,.09,.095,.19);boot.rotation.y=-side*.10;
  for(let i=0;i<3;i++)mesh(plate([[-.075,.028],[.075,.028],[.066,-.026],[-.066,-.026]],.024),steel,ankle[0],.17-i*.017,ankle[2]+.045+i*.046).rotation.x=-.45;
  mesh(sphere,black,ankle[0],.057,ankle[2]+.059,.095,.035,.194);
 }
 mesh(loft([[1.29,.19,.117],[1.47,.22,.132],[1.57,.172,.106]]),leather);
 mesh(loft([[1.51,.177,.112],[1.66,.199,.125],[1.87,.291,.149],[2.04,.271,.135],[2.12,.16,.11]]),darkSteel);
 // Curved cuirass, overlapping abdominal lames and pointed tassets.
 for(let i=0;i<4;i++)mesh(loft([[1.54+i*.073,.19+i*.009,.121+i*.004],[1.595+i*.073,.20+i*.01,.127+i*.004]]),i%2?steel:darkSteel);
 mesh(plate([[-.245,2.04],[-.21,2.12],[-.073,2.10],[0,1.99],[.073,2.10],[.21,2.12],[.245,2.04],[.228,1.88],[0,1.75],[-.228,1.88]],.035),steel,0,0,.116);
 for(const side of [-1,1]){etch([side*.207,2.036,.168],[side*.14,1.925,.18]);etch([side*.14,1.925,.18],[0,1.81,.16]);mesh(plate([[-.08,.16],[.075,.135],[.11,-.10],[.05,-.285],[-.075,-.19]],.024),darkSteel,side*.15,1.40,.114).rotation.z=-side*.12;}
 mesh(loft([[1.47,.216,.141],[1.515,.216,.141]]),leather);mesh(plate([[-.044,.041],[.044,.041],[.05,-.025],[0,-.05],[-.05,-.025]],.024),trim,0,1.49,.14);
 mesh(gem,armorLight,0,1.95,.185,.027,.062,.016);
 // Bent elbows and individual gauntlet fingers avoid a toy-like T pose.
 for(const side of [-1,1]){
  const shoulder=[side*.315,2.047,-.005],elbow=[side*.424,1.76,side===-1?.065:.045],hand=[side*.455,1.48,side===-1?.20:.105];
  mesh(sphere,leather,...shoulder,.13,.12,.12);tube(shoulder,elbow,.104,.073,leather);tube(elbow,hand,.075,.048,darkSteel);mesh(sphere,black,...elbow,.075,.080,.078);
  const pauldron=mesh(sphere,steel,side*.32,2.045,.006,(heavy?.19:.152),.092,.17);pauldron.rotation.z=-side*.3;
  for(let k=0;k<(side===-1?3:2);k++){const p=mesh(plate([[-.12,.065],[.10,.067],[.136,-.022],[.075,-.105],[-.11,-.083]],.026),k===0?trim:steel,side*(.343+k*.025),2.036-k*.058,.086-k*.011);p.rotation.z=-side*.29;}
  const vambrace=mesh(loft([[0,.047,.06],[.20,.073,.085],[.25,.078,.089]]),steel,hand[0],hand[1]+.035,hand[2]-.03);vambrace.rotation.x=side===-1?-.40:-.18;vambrace.rotation.z=-side*.075;
  mesh(plate([[-.052,.049],[0,.079],[.052,.049],[.047,-.064],[0,-.089],[-.047,-.064]],.022),trim,hand[0],hand[1]+.014,hand[2]+.015);
  for(let finger=0;finger<4;finger++)tube([hand[0]-.031+finger*.020,hand[1]-.030,hand[2]+.005],[hand[0]-.031+finger*.020,hand[1]-.083,hand[2]+.024],.010,.009,steel);
  if(armorTier>=2)etch([side*.29,2.116,.06],[side*.43,2.03,.068],armorLight,.007);
 }
 // A narrow closed sallet with a black slit visor, no oversized glowing eyes.
 tube([0,2.08,0],[0,2.29,0],.067,.063,leather);
 mesh(loft([[2.275,.073,.068],[2.31,.109,.091],[2.40,.137,.113],[2.51,.133,.118],[2.59,.093,.083],[2.635,.012,.018]]),steel);
 mesh(plate([[-.13,.065],[-.06,.084],[0,.07],[.06,.084],[.13,.065],[.112,-.08],[0,-.145],[-.112,-.08]],.025),darkSteel,0,2.45,.097);
 mesh(plate([[-.12,.018],[0,.032],[.12,.018],[.108,-.005],[0,.003],[-.108,-.005]],.008),black,0,2.468,.135);
 etch([-.12,2.49,.149],[0,2.505,.151],trim,.005);etch([0,2.505,.151],[.12,2.49,.149],trim,.005);
 mesh(plate([[-.012,.045],[.012,.045],[.020,-.042],[0,-.112],[-.020,-.042]],.02),steel,0,2.432,.147);
 if(armorTier>=2){etch([-.085,2.477,.15],[-.035,2.48,.155],armorLight,.003);etch([.035,2.48,.155],[.085,2.477,.15],armorLight,.003);}
 // Cloth is curved and folded in 3D; its split hem exposes the stance.
 for(const side of [-1,1])mesh(cloakPanel(side),cloth);mesh(loft([[2.085,.162,.139],[2.175,.107,.098],[2.19,.075,.075]]),cloth);
 tube([-.20,2.096,.12],[.18,2.10,.13],.009,.009,trim);mesh(gem,trim,.18,2.10,.15,.026,.035,.013);
 if(phoenix||armorTier===3)for(let i=0;i<3;i++){const blade=mesh(plate([[-.025,.14],[.025,.10],[.031,-.08],[0,-.20],[-.024,-.10]],.012),trim,-.415-i*.042,2.13+i*.025,-.04-i*.026);blade.rotation.z=-.6-i*.14;}
 // The weapon remains the equipped staff/spear, held like a weighty human prop.
 const weapon=new T.Group();weapon.position.set(-.46,1.49,.205);weapon.rotation.z=-.11;weapon.rotation.x=-.03;group.add(weapon);
 tube([0,-1.14,0],[0,1.23,0],.019,.015,darkSteel,weapon);tube([0,-.20,0],[0,.16,0],.023,.023,leather,weapon);
 for(const y of [-.21,.17,.93,1.16])mesh(new T.TorusGeometry(.027,.008,5,16),gold,0,y,0,1,1,1,weapon).rotation.x=Math.PI/2;
 let staffCore=mesh(gem,weaponLight,0,1.20,0,.043,.116,.037,weapon);
 if(style===15||style===18){const blade=mesh(plate([[-.035,-.18],[-.075,.16],[0,.58],[.075,.16],[.035,-.18]],.017),style===18?darkSteel:steel,0,1.2,-.015,1,1,1,weapon);tube([0,1.16,.016],[0,1.74,.016],.008,.003,weaponLight,weapon);for(const side of [-1,1])tube([0,1.16,0],[side*.14,1.29,0],.025,.006,gold,weapon);staffCore.position.y=1.21;}
 else if(style===1||style===16){for(const side of [-1,1]){const prong=mesh(gem,steel,side*.08,1.19,0,.038,.22,.035,weapon);prong.rotation.z=-side*.2;}staffCore.scale.set(.055,.19,.05);}
 else{const crescent=mesh(new T.TorusGeometry(.108,.019,8,40,Math.PI*1.55),gold,0,1.20,0,1,1,1,weapon);crescent.rotation.z=-.85;mesh(gem,steel,0,1.44,0,.029,.12,.024,weapon);}
 if(staffTier>=2){const ring=mesh(new T.TorusGeometry(.16,.005,5,48,Math.PI*1.6),weaponLight,0,1.20,0,1,1,1,weapon);ring.rotation.y=.6;animated.push(ring);}
 if(staffTier===3)for(const side of [-1,1]){const shard=mesh(gem,weaponLight,side*.115,1.39,0,.014,.06,.014,weapon);animated.push(shard);}
 mesh(gem,lampLight,.228,1.40,.112,.028,.062,.026);mesh(new T.TorusGeometry(.045,.007,5,20),gold,.228,1.40,.117);
 if(armor?.type===13)for(let k=0;k<3;k++)etch([-.12,1.65+k*.07,.153],[.12,1.65+k*.07,.153],armorLight,.004);
 if(tier>=3){const halo=mesh(new T.TorusGeometry(.40,.006,5,64,Math.PI*1.40),emission(3,.6),0,2.37,-.19);halo.rotation.z=.3;animated.push(halo);}
 // Subtle emissive aura rather than a flat luminous silhouette.
 const auraMat=new T.ShaderMaterial({uniforms:{color:{value:new T.Color(RARITIES[tier].color)},strength:{value:tier>=5?.30:tier===4?.22:tier===3?.16:tier===2?.09:.025}},vertexShader:'varying vec2 uvp;void main(){uvp=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 color;uniform float strength;varying vec2 uvp;void main(){float d=length((uvp-.5)*vec2(1.2,.8))*2.;gl_FragColor=vec4(color,pow(max(0.,1.-d),3.)*strength);}',transparent:true,depthWrite:false,blending:T.AdditiveBlending});
 mesh(new T.PlaneGeometry(2.5,3.1),auraMat,0,1.49,-.55);
 const base=mesh(new T.CylinderGeometry(.73,.80,.045,48),darkSteel,0,.019,.025);mesh(new T.TorusGeometry(.727,.006,5,64),trim,0,.043,.025).rotation.x=Math.PI/2;
 if(tier>=4){const ornaments=gearOrnaments(staffTier===tier?staff:armorTier===tier?armor:lamp,tier);group.add(ornaments);animated.push(ornaments);}
 batchRigid(group,[...animated,staffCore]);group.userData={staffType:style,staffTier,armorType:armor?.type??-1,armorTier,tier,humanHeight:2.635,headHeight:.36};return{group,animated,glows,staffCore};
}

export class AvatarPreview{
 constructor(canvas){this.canvas=canvas;this.yaw=.18;this.drag=null;this.rig=null;this.visible=false;this.last=0;this.signature='';this.frame=0;
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();this.drag={id:e.pointerId,x:e.clientX};try{canvas.setPointerCapture(e.pointerId);}catch{}});
  canvas.addEventListener('pointermove',e=>{if(this.drag?.id===e.pointerId){this.yaw+=(e.clientX-this.drag.x)*.009;this.drag.x=e.clientX;}});for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>this.drag=null);
 }
 set(progress,visible){this.visible=visible;if(!visible){cancelAnimationFrame(this.frame);this.drag=null;return;}
  try{this.canvas.hidden=false;
   if(!this.renderer){this.renderer=new T.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:false,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));this.renderer.setClearColor(0x060d14,0);this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.45;
    this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(34,1,.1,20);this.camera.position.set(.13,1.56,6.25);this.camera.lookAt(0,1.48,0);this.scene.add(new T.HemisphereLight(0xd6e5ff,0x263039,2.1));
    const key=new T.DirectionalLight(0xf8e4c4,4);key.position.set(-2,4,3);this.scene.add(key);const rim=new T.DirectionalLight(0x839fce,3.5);rim.position.set(2,2,-2);this.scene.add(rim);const fill=new T.DirectionalLight(0xa8cde4,1.3);fill.position.set(2,1,2);this.scene.add(fill);
   }
   const signature=progress.equipped.map(id=>{const i=progress.inventory.find(a=>a.id===id);return id+':'+(i?.evolved||false)+':'+(i?.upgrade||0)+':'+(i?.abyssGrade||0)+':'+JSON.stringify(i?.enchants||[]);}).join('|');if(signature!==this.signature||!this.rig){if(this.rig)disposeAvatar(this.rig.group);this.rig=buildEquipmentAvatar(progress);this.scene.add(this.rig.group);this.signature=signature;}
   const width=Math.max(180,this.canvas.clientWidth||330),height=360;this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(t=>this.draw(t));
  }catch{this.canvas.hidden=true;}
 }
 draw(now){if(!this.visible||!this.renderer)return;this.frame=requestAnimationFrame(t=>this.draw(t));if(document.hidden||now-this.last<40)return;this.last=now;const time=now/1000;
  try{this.rig.group.rotation.y=this.yaw+(this.drag?0:Math.sin(time*.18)*.055);this.rig.group.position.y=Math.sin(time*1.1)*.002;for(let i=0;i<this.rig.animated.length;i++)this.rig.animated[i].rotation.y=time*(.12+i*.025);this.rig.staffCore.rotation.y=time*.25;this.renderer.render(this.scene,this.camera);}catch{this.close();this.canvas.hidden=true;}
 }
 close(){this.visible=false;cancelAnimationFrame(this.frame);this.drag=null;if(this.rig){disposeAvatar(this.rig.group);this.rig=null;}if(this.renderer){this.renderer.dispose();this.renderer=null;}this.signature='';}
}
