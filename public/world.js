import {enemyLabel,featureMesh,retireMeshes,gearTint} from './abyss-visuals.js';
import * as T from './vendor/three.module.js';
import {ENEMY_TYPES,sealUnlocked} from './enemies.js';
import {W,H,S,MASK,START,rooms,cells,grid,walkable,canStand,clamp,tiers,rng,stageInfo} from './core.js';

const vertex=`
varying vec3 vWorld,vNormal,vTint;
void main(){
 vec4 p=vec4(position,1.0);vec3 n=normal;vTint=vec3(1.0);
 #ifdef USE_INSTANCING
 p=instanceMatrix*p;n=mat3(instanceMatrix)*n;
 #endif
 #ifdef USE_INSTANCING_COLOR
 vTint=instanceColor;
 #endif
 vec4 wp=modelMatrix*p;vWorld=wp.xyz;vNormal=normalize(mat3(modelMatrix)*n);
 gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const stoneFragment=`
uniform sampler2D uMask;uniform vec2 uMapSize;uniform vec3 uPlayer,uBase,uWave;
uniform float uTime,uLight,uMenu,uWaveAge,uRevealPulse;
varying vec3 vWorld,vNormal,vTint;
float hash(vec3 p){p=fract(p*.3183099+vec3(.13,.27,.51));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main(){
 vec3 n=normalize(vNormal);vec3 p=vWorld;float d=length(p.xz-uPlayer.xz);
 float reveal=texture2D(uMask,(p.xz+vec2(1.7))/uMapSize).r;
 reveal=max(reveal,uMenu*(1.0-smoothstep(12.0,30.0,d)));
 float lamp=(1.0-smoothstep(1.2,8.5*max(.42,uLight),length(p-uPlayer)))*max(.04,uLight);
 if(reveal<.01&&uMenu<.5){gl_FragColor=vec4(.007,.016,.021,1.);return;}
 float grit=hash(floor(p*9.0))*.15+hash(floor(p*31.0))*.05;float veins=abs(noise(p*.6)-.50);
 vec2 tiled=abs(n.y)>.5?p.xz:vec2(abs(n.z)>.5?p.x:p.z,p.y);
 float row=floor(tiled.y/.65);vec2 brick=fract(vec2(tiled.x/1.5+mod(row,2.0)*.5,tiled.y/.65));
 float mortar=min(min(brick.x,1.0-brick.x),min(brick.y,1.0-brick.y));
 float seam=smoothstep(.005,.033,mortar);if(abs(n.y)>.5){vec2 tile=fract((p.xz+vec2(1.7))/1.7);seam=smoothstep(.002,.014,min(min(tile.x,1.0-tile.x),min(tile.y,1.0-tile.y)));}
 float ao=mix(.46,1.0,smoothstep(0.0,.55,p.y));
 vec3 col=uBase*vTint*(.74+grit)*mix(.35,1.0,seam);
 float key=max(0.0,dot(n,normalize(uPlayer+vec3(0,.1,0)-p)));float top=max(0.0,dot(n,normalize(vec3(-.3,1.0,.25))));
 vec3 lit=col*(vec3(.14,.37,.40)*reveal*ao+vec3(.57,.84,.71)*lamp*(key*.9+.27)+vec3(.12,.21,.22)*top*reveal);
 vec3 viewDir=normalize(cameraPosition-p);vec3 halfDir=normalize(viewDir+normalize(uPlayer-p));
 float wet=pow(max(0.0,dot(n,halfDir)),mix(25.0,100.0,grit));
 lit+=vec3(.42,.65,.55)*wet*lamp*seam*.6;
 float edge=(1.0-smoothstep(.012,.045,veins))*smoothstep(.17,.8,hash(floor(p*.8)));
 lit+=vec3(.04,.24,.19)*edge*reveal*.24;
 float wave=exp(-pow((length(p.xz-uWave.xz)-uWaveAge*15.0)*1.0,2.0))*step(0.0,uWaveAge)*step(uWaveAge,3.0);
 lit+=vec3(.18,1.1,.75)*wave*(.35+.65*abs(n.y));
 lit+=vec3(.02,.13,.10)*uRevealPulse*reveal*(1.0-smoothstep(4.0,6.2,d));
 float darkness=smoothstep(.015,.5,reveal);lit*=mix(.005,1.0,darkness);
 float haze=1.0-exp(-length(p-cameraPosition)*.028);
 lit=mix(lit,vec3(.009,.024,.03),haze*.88);
 gl_FragColor=vec4(lit,1.0);
}`;
const gemFrag=`uniform vec3 uColor;uniform float uTime;varying vec3 vWorld,vNormal,vTint;void main(){vec3 n=normalize(vNormal),v=normalize(cameraPosition-vWorld);float face=max(0.0,dot(n,normalize(vec3(.4,1.,.7))));float fresnel=pow(1.0-abs(dot(n,v)),2.4);float spec=pow(max(0.0,dot(reflect(-normalize(vec3(-.4,.6,.8)),n),v)),24.0);vec3 col=uColor*(.55+face*.9+fresnel*1.3)+vec3(spec*3.5);gl_FragColor=vec4(col,1.0);}`;
const spriteVert=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const glowFrag=`uniform vec3 uColor;uniform float uOpacity;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.0;float a=pow(max(0.0,1.0-d),3.5)*uOpacity;gl_FragColor=vec4(uColor,a);}`;
const fullscreenVert=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const blurFrag=`uniform sampler2D tInput;uniform vec2 uStep;uniform float uThreshold;varying vec2 vUv;vec3 tap(vec2 p){vec3 c=texture2D(tInput,p).rgb;return c*max(0.0,1.0-uThreshold/max(.0001,max(c.r,max(c.g,c.b))));}void main(){vec3 c=tap(vUv)*.227027;c+=(tap(vUv+uStep*1.384615)+tap(vUv-uStep*1.384615))*.316216;c+=(tap(vUv+uStep*3.230769)+tap(vUv-uStep*3.230769))*.07027;gl_FragColor=vec4(c,1.);}`;
const compositeFrag=`uniform sampler2D tScene,tBloom;uniform float uStrength,uTime;varying vec2 vUv;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}void main(){vec3 c=texture2D(tScene,vUv).rgb+texture2D(tBloom,vUv).rgb*uStrength;c=aces(c*1.3);c=pow(c,vec3(1.0/2.2));float grain=fract(sin(dot(vUv+uTime*.0001,vec2(12.9898,78.233)))*43758.5453)-.5;c+=grain*.011;gl_FragColor=vec4(c,1.);}`;

export class World{
 constructor(canvas,reveal,settings){
  this.reveal=reveal;this.settings=settings;this.elapsed=0;this.bloomKick=0;this.hitShake=0;this.abyssFeatures=[];this.loot=[];this.orbs=[];this.sealMeshes=[];this.enemyMeshes=[];this.veinMeshes=[];this.trapMeshes=[];this.supplyMeshes=[];this.beamFX=[];this.dropMeshes=[];this.actorEnemies=[];this.animations=[];this.obstacles=[];this.particles=[];this.qualityScale=1;this.frameBudget=[];
  this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',alpha:false});this.renderer.setClearColor(0x02080c);this.renderer.outputColorSpace=T.LinearSRGBColorSpace;this.renderer.toneMapping=T.NoToneMapping;
  this.scene=new T.Scene();this.root=new T.Group();this.scene.add(this.root);this.scene.background=new T.Color(.005,.011,.016);this.scene.fog=new T.FogExp2(0x051219,.04);
  this.camera=new T.PerspectiveCamera(65,1,.065,100);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
  this.maskPending=new Set();this.maskBytes=new Uint8Array(reveal.data);this.mask=new T.DataTexture(this.maskBytes,MASK,MASK,T.RedFormat,T.UnsignedByteType);this.mask.minFilter=T.LinearFilter;this.mask.magFilter=T.LinearFilter;this.mask.needsUpdate=true;
  this.uniforms={uMask:{value:this.mask},uMapSize:{value:new T.Vector2(W*S,H*S)},uPlayer:{value:new T.Vector3(START.x,1.7,START.z)},uTime:{value:0},uLight:{value:1},uMenu:{value:1},uWave:{value:new T.Vector3(0,0,0)},uWaveAge:{value:10},uRevealPulse:{value:0}};
  this.stone=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:stoneFragment,uniforms:{...this.uniforms,uBase:{value:new T.Color(.40,.47,.47)}},vertexColors:true});
  this.bronze=new T.MeshStandardMaterial({color:0x877049,metalness:.78,roughness:.37});
  this.darkmetal=new T.MeshStandardMaterial({color:0x1d3336,metalness:.7,roughness:.3});
  this.glowMaterials=tiers.map(t=>new T.ShaderMaterial({vertexShader:vertex,fragmentShader:gemFrag,uniforms:{uColor:{value:new T.Color(t.color)},uTime:this.uniforms.uTime}}));
  this.scene.add(new T.HemisphereLight(0xb3e7ee,0x081c23,1.25));this.lamp=new T.PointLight(0xc4ffd9,35,18,1.5);this.scene.add(this.lamp);
  this.buildArchitecture();this.buildLandmarks();this.buildLantern();this.buildParticles();this.buildPost();this.resize();
 }
 resetLevel(reveal,items,orbs,relics,enemies,expedition=null){
  const keep=new Set([this.stone,this.bronze,this.darkmetal,...this.glowMaterials]),geometries=new Set(),materials=new Set();this.root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])if(!keep.has(m))materials.add(m);});this.root.clear();for(const g of geometries)g.dispose();for(const m of materials){m.map?.dispose();m.dispose();}
  this.reveal=reveal;this.maskPending=new Set();this.maskBytes.set(reveal.data);this.mask.needsUpdate=true;this.uniforms.uMapSize.value.set(W*S,H*S);this.uniforms.uWaveAge.value=10;
  this.abyssFeatures=[];this.loot=[];this.orbs=[];this.sealMeshes=[];this.enemyMeshes=[];this.veinMeshes=[];this.trapMeshes=[];this.supplyMeshes=[];this.beamFX=[];this.dropMeshes=[];this.actorEnemies=[];this.animations=[];this.obstacles=[];this.particles=[];this.jackBeam=null;
  const tint=[[.40,.47,.47],[.44,.39,.51],[.34,.49,.43],[.51,.38,.32]][(stageInfo.floor-1)%4];this.stone.uniforms.uBase.value.setRGB(...tint);
  this.buildArchitecture();this.buildLandmarks();this.buildParticles();this.setLoot(items,orbs);this.buildSeals(relics);this.buildEnemies(enemies);if(expedition)this.buildExpedition(expedition);this.buildBeams();
 }
 pruneActors(){const dead=this.enemyMeshes.filter(e=>e.enemy.dead||e.enemy.escaped),objects=dead.flatMap(e=>[e.group,e.telegraph,...(e.zones||[]),...Object.values(e.enemy._bossReadabilityFx||{})]);const drops=this.dropMeshes.filter(d=>d.item.collected);objects.push(...drops.map(d=>d.group));if(objects.length)retireMeshes(this.root,objects,[this.stone,this.bronze,this.darkmetal,...this.glowMaterials]);this.enemyMeshes=this.enemyMeshes.filter(e=>!dead.includes(e));this.dropMeshes=this.dropMeshes.filter(d=>!drops.includes(d));}
 setAbyssFeatures(chest,event){this.abyssFeatures=[];for(const [item,isChest] of [[chest,true],[event,false]])if(item){const group=featureMesh(item,isChest);this.abyssFeatures.push(group);this.root.add(group);}}
 buildSeals(relics){
  for(const item of relics){const group=new T.Group();group.position.set(item.x,1.35,item.z);const material=new T.MeshStandardMaterial({color:0xe9fbd5,emissive:0xa3ffd4,emissiveIntensity:1.4,metalness:.55,roughness:.23});
   const rings=[];for(let i=0;i<3;i++){const ring=new T.Mesh(new T.TorusGeometry(.42+i*.13,.028,6,36),material);ring.rotation.set(i*.7,i*1.1,0);group.add(ring);rings.push(ring);}
   const core=new T.Mesh(new T.IcosahedronGeometry(.17,0),material);group.add(core);const glow=this.glow(0xbdffb6,3.6,.4);group.add(glow);this.root.add(group);this.sealMeshes.push({item,group,rings,glow,material});
  }
 }
 buildEnemies(enemies){
  if(!enemies.length)return;
  this.actorEnemies=enemies;
  const bodyMat=new T.MeshStandardMaterial({color:0x172029,metalness:.45,roughness:.5}),headGeo=new T.SphereGeometry(.23,10,8),box=new T.BoxGeometry(1,1,1),orb=new T.IcosahedronGeometry(1,0);
  for(const enemy of enemies){const group=new T.Group(),kind=enemy.kind,accent=new T.MeshBasicMaterial({color:ENEMY_TYPES[kind].color}),armor=new T.MeshStandardMaterial({color:kind===5?0x8f7550:kind===4?0xc2d4dc:0x29343b,metalness:kind===4?.95:.7,roughness:.28}),legs=[];
   const mesh=(geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);group.add(m);return m;};let body;
   if(kind===1){body=mesh(orb,bodyMat,0,.65,0,.47,.44,.88);mesh(orb,armor,0,.82,-.67,.29,.30,.38);for(const side of [-1,1])for(const z of [-.47,.50])legs.push(mesh(box,armor,side*.35,.31,z,.12,.57,.17));for(const side of [-1,1])mesh(orb,accent,side*.17,.9,-.93,.045,.045,.045);}
   else if(kind===2||kind===5){const scale=kind===5?1.22:1;body=mesh(box,armor,0,1,0,.85,1.1,.55);mesh(box,armor,0,1.84,0,.58,.5,.5);for(const side of [-1,1]){mesh(box,armor,side*.65,1.20,0,.43,.9,.58);legs.push(mesh(box,armor,side*.26,.30,0,.34,.60,.40));mesh(orb,accent,side*.15,1.89,-.26,.06,.04,.035);}const core=mesh(orb,accent,0,1.1,-.30,.18,.28,.08);if(kind===5){const crown=mesh(new T.TorusGeometry(.48,.055,5,24),this.bronze,0,2.22,0);crown.rotation.x=Math.PI/2;for(const x of [-.37,0,.37])mesh(new T.ConeGeometry(.10,.4,4),accent,x,2.33,0);group.scale.setScalar(scale);}body.userData.core=core;}
   else if(kind===4){body=mesh(new T.IcosahedronGeometry(.44,1),armor,0,.51,0,1.05,.72,1);for(const x of [-.13,.13])mesh(new T.SphereGeometry(.06,6,4),bodyMat,x,.59,-.37);const ring=mesh(new T.TorusGeometry(.48,.018,4,30),accent,0,.55,0);ring.rotation.x=Math.PI/2;}
   else{body=mesh(new T.ConeGeometry(kind===3?.36:.48,1.4,8,1,true),bodyMat,0,.78,0);body.rotation.z=Math.PI;mesh(headGeo,bodyMat,0,1.48,0,1,1.2,1);for(const x of [-.09,.09])mesh(new T.SphereGeometry(.037,6,4),accent,x,1.53,-.2);if(kind===3){for(let i=0;i<3;i++){const a=i*Math.PI*2/3;mesh(orb,accent,Math.cos(a)*.63,1.7,Math.sin(a)*.63,.11,.23,.11);}const halo=mesh(new T.TorusGeometry(.43,.026,5,30),accent,0,1.96,0);halo.rotation.x=Math.PI/2;}}
   if(enemy.elite){armor.emissive.setHex(0x743153);armor.emissiveIntensity=.5;}if(enemy.mutations?.includes('giant'))group.scale.multiplyScalar(1.18);const label=enemyLabel(enemy);if(label)group.add(label);
   const aura=this.glow(ENEMY_TYPES[kind].color,kind===5?3.2:2.3,.15);aura.position.y=1;group.add(aura);this.root.add(group);
   const telegraph=new T.Mesh(kind===1?new T.PlaneGeometry(1.1,7):new T.RingGeometry(kind===2?2.38:kind===5?3:1.18,kind===2?2.58:kind===5?3.23:1.35,40),new T.MeshBasicMaterial({color:kind===3?0xc183ff:0xff6e50,transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide}));telegraph.rotation.x=-Math.PI/2;telegraph.visible=false;this.root.add(telegraph);
   const zones=[];if(kind===5)for(let i=0;i<5;i++){const zone=new T.Mesh(new T.RingGeometry(.92,1,32),new T.MeshBasicMaterial({color:0xffb747,transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.visible=false;this.root.add(zone);zones.push(zone);}this.enemyMeshes.push({enemy,group,eyes:accent,aura,body,legs,telegraph,zones});
  }
 }
 spawnEnemies(additions,all){this.pruneActors();this.buildEnemies(additions);this.actorEnemies=all;}
 animateActors(time,state){
  for(const s of this.sealMeshes){s.group.visible=!s.item.collected;if(!s.group.visible)continue;const unlocked=sealUnlocked(s.item,this.actorEnemies),color=unlocked?0xa3ffd4:0xff8271;s.material.emissive.setHex(color);s.glow.material.uniforms.uColor.value.setHex(color);s.group.position.y=1.35+Math.sin(time*1.6+s.item.id)*.08;for(let i=0;i<s.rings.length;i++){s.rings[i].rotation.x+=.004*(i+1);s.rings[i].rotation.y=time*(.30+i*.13);}s.glow.quaternion.copy(this.camera.quaternion);}
  for(const e of this.enemyMeshes){const a=e.enemy;e.group.visible=!a.dead&&!a.escaped&&!state.menu&&Math.hypot(a.x-state.x,a.z-state.z)<35;for(let i=0;i<(e.zones||[]).length;i++){const zone=e.zones[i],data=a.attackZones?.[i];zone.visible=!!data&&e.group.visible&&a.windup>0&&a.attackKind==='rift';if(zone.visible){zone.position.set(data.x,.055,data.z);zone.scale.setScalar(data.radius);zone.material.opacity=.4+.5*(1-a.windup/(a.windupMax||1));}}e.telegraph.visible=e.group.visible&&a.windup>0;if(!e.group.visible)continue;e.group.position.set(a.x,.05+Math.sin(time*2+a.phase)*(a.kind===3?.17:.045),a.z);e.group.rotation.y=a.attackYaw||0;
   for(let i=0;i<e.legs.length;i++)e.legs[i].rotation.x=Math.sin(time*(a.mode==='charge'?23:8)+i*Math.PI)*(['chase','charge','flee'].includes(a.mode)?.35:.025);
   e.eyes.color.setHex(a.stun>0?0x8dffcf:a.windup>0?0xffffff:ENEMY_TYPES[a.kind].color);if(e.body.userData.core)e.body.userData.core.scale.setScalar(a.recovery>0?.34:.19);e.aura.material.uniforms.uOpacity.value=a.recovery>0?.42:a.windup>0?.45:.13;e.aura.quaternion.copy(this.camera.quaternion);e.aura.quaternion.premultiply(e.group.quaternion.clone().invert());
   if(e.telegraph.visible){if(a.kind===1){e.telegraph.position.set(a.x-Math.sin(a.attackYaw)*3.5,.036,a.z-Math.cos(a.attackYaw)*3.5);e.telegraph.rotation.set(-Math.PI/2,0,-a.attackYaw);}else{const rift=a.kind===5&&a.attackKind==='rift',aim=rift?a.attackAim:null;e.telegraph.position.set(aim?.x??(a.kind===3?state.x:a.x),.038,aim?.z??(a.kind===3?state.z:a.z));e.telegraph.scale.setScalar(rift?(a.attackRadius||1.55)/3:(a.scale?.range||1));e.telegraph.material.color.setHex(rift?0xffd16b:a.kind===3?0xc183ff:0xff6e50);}e.telegraph.material.opacity=.3+.55*(1-a.windup/(a.windupMax||1));}
  }
 }
 spawnDrops(drops){
  for(const item of drops){const group=new T.Group(),rare=item.kind==='relic',color=rare?0xffd485:0xc5ef91;group.position.set(item.x,.45,item.z);const core=new T.Mesh(rare?new T.OctahedronGeometry(.28):new T.IcosahedronGeometry(.19,1),this.glowMaterials[rare?3:0]);group.add(core);const ring=new T.Mesh(new T.TorusGeometry(rare?.34:.25,.018,4,24),this.glowMaterials[rare?3:1]);ring.rotation.x=Math.PI/2;group.add(ring);const glow=this.glow(color,rare?3.1:1.7,rare?.5:.35);group.add(glow);let beam=null;if(rare){beam=new T.Mesh(new T.CylinderGeometry(.06,.22,2.7,8,1,true),new T.MeshBasicMaterial({color,transparent:true,opacity:.18,depthWrite:false,blending:T.AdditiveBlending}));beam.position.y=1.1;group.add(beam);}this.root.add(group);this.dropMeshes.push({item,group,core,glow,beam});}
 }
 setEquipment(stats){this.equipment=stats;if(this.abyssStaffMaterial){this.abyssStaffMaterial.dispose();this.abyssStaffMaterial=null;}if(!this.focusWeapon)return;this.staffCore.material=(stats.staffTier>=4?(this.abyssStaffMaterial??=new T.MeshStandardMaterial({color:gearTint(stats),emissive:gearTint(stats),emissiveIntensity:2,metalness:.6,roughness:.2})):this.glowMaterials[stats.staffTier||0]);this.staffCrown.visible=(stats.staffTier||0)>0;this.staffCrown.material=(stats.staffTier>=4?(this.abyssStaffMaterial??=new T.MeshStandardMaterial({color:gearTint(stats),emissive:gearTint(stats),emissiveIntensity:2,metalness:.6,roughness:.2})):this.glowMaterials[stats.staffTier||0]);this.focusWeapon.scale.setScalar(1+(stats.staffType>=15?.14:0));}
 buildExpedition(expedition){
  const rockGeo=new T.IcosahedronGeometry(.23,0),oreGeo=new T.OctahedronGeometry(.11,0);
  for(const item of expedition.veins){const group=new T.Group();group.position.set(item.x,1.25,item.z);group.rotation.y=Math.atan2(-item.dx,-item.dz);const r=rng(stageInfo.seed^item.id),chunks=[],ores=[];
   for(let i=0;i<7;i++){const rock=new T.Mesh(rockGeo,this.stone);rock.position.set((r()-.5)*1.05,(r()-.5)*.85,r()*.07);rock.scale.set(1+r(),.8+r(),.5);rock.rotation.set(r()*2,r()*2,r()*2);group.add(rock);chunks.push(rock);const ore=new T.Mesh(oreGeo,this.glowMaterials[item.quality+1]);ore.position.copy(rock.position);ore.position.z+=.12;ore.scale.set(.65,1.4,.65);group.add(ore);ores.push(ore);}
   const glow=this.glow(tiers[item.quality+1].color,1.9,.16);glow.position.z=.16;group.add(glow);this.root.add(group);this.veinMeshes.push({item,group,chunks,ores,glow});
  }
  const trapGeo=new T.TorusGeometry(.42,.022,4,20);for(const item of expedition.traps){const colors={spike:0x743137,mire:0x52693c,ambush:0x8e5c9e,eclipse:0x66518d},mat=new T.MeshBasicMaterial({color:colors[item.kind]||0x5c2425,transparent:true,opacity:.5}),ring=new T.Mesh(trapGeo,mat);ring.rotation.x=-Math.PI/2;ring.position.set(item.x,.032,item.z);if(item.instant){const outer=new T.Mesh(trapGeo,mat);outer.scale.setScalar(1.34);ring.add(outer);}this.root.add(ring);this.trapMeshes.push({item,ring});}
  for(const item of expedition.supplies){const color=item.kind==='heal'?0xfd9baa:0x839fff,mat=new T.MeshBasicMaterial({color}),group=new T.Group();group.position.set(item.x,.72,item.z);const orb=new T.Mesh(new T.IcosahedronGeometry(.20,1),mat);group.add(orb);const ring=new T.Mesh(new T.TorusGeometry(.32,.018,4,24),mat);ring.rotation.x=Math.PI/2;group.add(ring);const glow=this.glow(color,1.7,.28);group.add(glow);this.root.add(group);this.supplyMeshes.push({item,group,orb,glow});}
 }
 buildBeams(){const geo=new T.CylinderGeometry(.025,.042,1,6);for(let i=0;i<8;i++){const mesh=new T.Mesh(geo,this.glowMaterials[0]);mesh.visible=false;this.root.add(mesh);this.beamFX.push({mesh,life:0});}}
 castBeam(x,z,tx,tz){const b=this.beamFX.find(b=>b.life<=0)||this.beamFX[0];if(!b)return;const from=new T.Vector3(x,1.40,z),to=new T.Vector3(tx,1.12,tz),delta=to.clone().sub(from);b.mesh.position.copy(from.add(to).multiplyScalar(.5));b.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());b.mesh.scale.set(1,delta.length(),1);b.life=.16;b.mesh.visible=true;this.bloomKick=Math.max(this.bloomKick,.40);}
 animateExpedition(dt,state){
  for(const group of this.abyssFeatures||[]){const d=group.userData;group.visible=!state.menu&&!d.item.opened&&!d.item.used&&Math.hypot(group.position.x-state.x,group.position.z-state.z)<30;d.core.rotation.y+=dt*.5;}

  for(const b of this.beamFX){b.life-=dt;b.mesh.visible=b.life>0&&!state.menu;}
  for(const v of this.veinMeshes){const item=v.item;v.group.visible=!state.dark&&Math.hypot(item.x-state.x,item.z-state.z)<26;if(!v.group.visible)continue;const done=item.hits>=item.layers;for(let i=0;i<v.chunks.length;i++){v.chunks[i].visible=i>=item.hits*2||done;v.ores[i].visible=!done;v.ores[i].scale.setScalar(.7+item.hits*.28+Math.sin(this.elapsed*3+i)*.06);}v.glow.visible=!done;v.glow.material.uniforms.uOpacity.value=.12+item.hits*.07+item.progress*.15;}
  for(const t of this.trapMeshes){t.ring.visible=!t.item.spent&&!state.menu&&(this.reveal.sample(t.item.x,t.item.z)>.25||Math.hypot(t.item.x-state.x,t.item.z-state.z)<5);const armed=t.item.timer>=0,colors={spike:0xba4b4b,mire:0x7c9e58,ambush:0xc47cda,eclipse:0x8870cb};t.ring.material.color.setHex(armed?0xff725e:t.item.instant?0xffbe63:colors[t.item.kind]||0x6e3037);t.ring.material.opacity=armed?.75+Math.sin(this.elapsed*28)*.25:t.item.instant?.85:.52;t.ring.scale.setScalar(armed?1.25:1);}
  for(const s of this.supplyMeshes){s.group.visible=!s.item.collected;s.group.position.y=.72+Math.sin(this.elapsed*1.9+s.item.x)*.1;s.orb.rotation.y=this.elapsed;s.glow.quaternion.copy(this.camera.quaternion);}
 }
 batch(geometry,material,placements){if(!placements.length)return;const mesh=new T.InstancedMesh(geometry,material,placements.length),o=new T.Object3D(),c=new T.Color();for(let i=0;i<placements.length;i++){const p=placements[i];o.position.set(...p.p);o.rotation.set(...(p.r||[0,0,0]));o.scale.set(...(p.s||[1,1,1]));o.updateMatrix();mesh.setMatrixAt(i,o.matrix);if(p.c)mesh.setColorAt(i,c.setRGB(...p.c));}mesh.computeBoundingSphere();this.root.add(mesh);return mesh;}
 buildArchitecture(){
  const random=rng(stageInfo.seed),floors=[],walls=[],trims=[],pillars=[],caps=[],arches=[],ceilings=[];
  for(const i of cells){const x=i%W,z=Math.floor(i/W),wx=x*S,wz=z*S,shade=.85+random()*.3;
   floors.push({p:[wx,-.17,wz],s:[S,.3,S],c:[shade*.86,shade*.92,shade]});ceilings.push({p:[wx,4.85,wz],s:[S,.25,S],c:[.3,.35,.38]});
   for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]])if(!walkable(x+dx,z+dz)){
    const xx=wx+dx*S/2,zz=wz+dz*S/2,angle=dx?Math.PI/2:0;
    walls.push({p:[xx,2.35,zz],s:[S+.06,4.7,.26],r:[0,angle,0],c:[shade,shade,shade*.97]});
    trims.push({p:[xx,.16,zz],s:[S+.09,.32,.44],r:[0,angle,0],c:[.64,.7,.73]});
    trims.push({p:[xx,4.40,zz],s:[S+.12,.24,.49],r:[0,angle,0],c:[.68,.76,.76]});
    if((x+z)%2===0){pillars.push({p:[xx-dx*.17,2.12,zz-dz*.17],s:[.25,4.20,.25],c:[.85,.88,.91]});caps.push({p:[xx-dx*.17,.2,zz-dz*.17],s:[.67,.4,.67],c:[.57,.61,.63]});caps.push({p:[xx-dx*.17,4.2,zz-dz*.17],s:[.70,.24,.70],c:[.68,.7,.7]});}
   }
   const ns=walkable(x,z-1)&&walkable(x,z+1)&&!walkable(x-1,z)&&!walkable(x+1,z);
   const ew=walkable(x-1,z)&&walkable(x+1,z)&&!walkable(x,z-1)&&!walkable(x,z+1);
   if((ns||ew)&&(x+z)%3===0){const angle=ew?Math.PI/2:0;arches.push({p:[wx,2.95,wz],r:[0,angle,0],c:[.96,.93,.84]});for(const sign of [-1,1]){pillars.push({p:[wx+(ew?0:sign*1.53),1.48,wz+(ew?sign*1.53:0)],s:[.18,2.96,.18],c:[.88,.86,.80]});}}
  }
  const box=new T.BoxGeometry(1,1,1);this.batch(box,this.stone,floors);this.batch(box,this.stone,walls);this.batch(box,this.stone,trims);this.batch(box,this.stone,ceilings);this.batch(new T.CylinderGeometry(1,1,1,10),this.stone,pillars);this.batch(box,this.stone,caps);this.batch(new T.TorusGeometry(1.53,.15,5,22,Math.PI),this.stone,arches);
  const inlays=[];for(const r of rooms){for(const offset of [-1.45,1.45]){inlays.push({p:[r.x*S+offset,.008,r.z*S],s:[.025,.015,r.h*S-1]});inlays.push({p:[r.x*S,.009,r.z*S+offset],s:[r.w*S-1,.016,.025]});}}
  this.batch(box,this.bronze,inlays);
  const floorRing=new T.TorusGeometry(1.3,.018,4,60);for(const r of rooms){const m=new T.Mesh(floorRing,this.bronze);m.rotation.x=Math.PI/2;m.position.set(r.x*S,.02,r.z*S);this.root.add(m);}
  // Small luminous veins on the revealed floor, with the same occlusion mask.
  const veinMat=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:`uniform sampler2D uMask;uniform vec2 uMapSize;uniform float uMenu;uniform vec3 uPlayer;varying vec3 vWorld,vNormal,vTint;void main(){float r=texture2D(uMask,(vWorld.xz+1.7)/uMapSize).r;r=max(r,uMenu*(1.-smoothstep(10.,24.,distance(vWorld,uPlayer))));gl_FragColor=vec4(vec3(.08,.37,.30)*r,1.);}`,uniforms:this.uniforms});
  const veins=[];for(const i of cells)if(i%4===0)veins.push({p:[i%W*S+.8,.017,Math.floor(i/W)*S],s:[.018,.018,1.3]});this.batch(box,veinMat,veins);
 }
 glow(color,size=2,opacity=.5){const mat=new T.ShaderMaterial({vertexShader:spriteVert,fragmentShader:glowFrag,uniforms:{uColor:{value:new T.Color(color)},uOpacity:{value:opacity}},transparent:true,depthWrite:false,blending:T.AdditiveBlending});const mesh=new T.Mesh(new T.PlaneGeometry(size,size),mat);return mesh;}
 beam(x,z,color,height=3){const mat=new T.ShaderMaterial({vertexShader:spriteVert,fragmentShader:`uniform vec3 uColor;varying vec2 vUv;void main(){float a=pow(1.-abs(vUv.x-.5)*2.,3.)*(1.-vUv.y)*.18;gl_FragColor=vec4(uColor,a);}`,uniforms:{uColor:{value:new T.Color(color)}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});const m=new T.Mesh(new T.PlaneGeometry(1.4,height),mat);m.position.set(x,height/2,z);this.root.add(m);return m;}
 buildLandmarks(){
  // The entrance is both a physical gate and a warm, unmistakable destination.
  const portal=new T.Group();portal.position.set(START.x,0,START.z+.55);this.root.add(portal);
  const trim=new T.Mesh(new T.TorusGeometry(1.2,.085,10,50,Math.PI),this.bronze);trim.position.y=2.0;portal.add(trim);
  for(const x of [-1.2,1.2]){const col=new T.Mesh(new T.CylinderGeometry(.1,.14,2,10),this.bronze);col.position.set(x,1,0);portal.add(col);}
  const homeMat=new T.ShaderMaterial({vertexShader:spriteVert,fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){float x=abs(vUv.x-.5)*2.;float waves=sin(vUv.x*85.+uTime*1.5)*.1+.9;float alpha=pow(1.-x,2.)*.20*waves*(1.-pow(abs(vUv.y-.5)*2.,3.));gl_FragColor=vec4(vec3(.9,.78,.42)*2.,alpha);}`,uniforms:{uTime:this.uniforms.uTime},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});const veil=new T.Mesh(new T.PlaneGeometry(2.25,3.15),homeMat);veil.position.y=1.53;portal.add(veil);
  this.homeGlow=this.glow(0xffd783,5,.75);this.homeGlow.position.set(START.x,1.5,START.z+.3);this.root.add(this.homeGlow);
  for(const r of [...new Set([rooms[1],rooms[3],rooms[5],rooms[8],rooms[stageInfo.jackpotRoom]].filter(Boolean))]){
   const center=new T.Group();center.position.set(r.x*S,0,r.z*S);this.root.add(center);
   if(r.id===5||r.id===1){const y=r.id===5?3.3:3.2,scale=r.id===5?1.3:.8;const axis=new T.Group();axis.position.y=y;axis.scale.setScalar(scale);center.add(axis);for(let k=0;k<3;k++){const ring=new T.Mesh(new T.TorusGeometry(1.55+k*.13,.035,6,60),this.bronze);ring.rotation.set(k*1.0,.5+k*.8,k*.5);axis.add(ring);}const star=new T.Mesh(new T.IcosahedronGeometry(.35,0),this.glowMaterials[0]);axis.add(star);this.animations.push({mesh:axis,kind:'rings'});const halo=this.glow(0x68ffc9,4,.18);halo.position.set(r.x*S,y,r.z*S);this.root.add(halo);this.animations.push({mesh:halo,kind:'glow'});}
   if(r.id===3){for(let k=0;k<3;k++){const crystal=new T.Mesh(new T.OctahedronGeometry(1,0),this.glowMaterials[1]);crystal.scale.set(.22,1.2+k*.34,.22);crystal.position.set((k-1)*1.35,1.25+k*.2,-2.1);center.add(crystal);this.obstacles.push({x:r.x*S+(k-1)*1.35,z:r.z*S-2.1,r:.30});} }
   if(r.id===8){const trunkMat=new T.MeshStandardMaterial({color:0x375d61,metalness:.45,roughness:.4});const branches=[[[0,0,0],[.15,1.1,0],[-.2,2.2,.1],[.1,3.5,0]],[[-.05,1.7,0],[-.6,2.2,.2],[-1.6,2.8,.3]],[[0,2.2,0],[.7,2.7,-.2],[1.6,3.1,-.6]],[[0,2.7,0],[.2,3.2,1],[.3,3.7,1.2]]];for(const pts of branches){const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));const branch=new T.Mesh(new T.TubeGeometry(curve,12,.095,5,false),trunkMat);center.add(branch);}const random=rng(81);for(let i=0;i<35;i++){const leaf=new T.Mesh(new T.OctahedronGeometry(.07+random()*.07),this.glowMaterials[0]);leaf.position.set((random()-.5)*3.2,2.7+random(),(random()-.5)*2.0);center.add(leaf);}this.obstacles.push({x:r.x*S,z:r.z*S,r:.34});}
   if(r.id===stageInfo.jackpotRoom){for(const off of [-1,1]){const crown=new T.Mesh(new T.TorusGeometry(1.5,.09,8,48),this.bronze);crown.position.set(off*1.7,2.5,-2.3);crown.scale.set(.7,1,1);center.add(crown);}this.jackBeam=this.beam(r.x*S,r.z*S,0xffce66,4.5);}
  }
 }
 buildLantern(){
  const g=new T.Group();g.position.set(.26,-.37,-.60);g.scale.setScalar(.145);g.rotation.z=.06;this.camera.add(g);this.lantern=g;
  const staff=new T.Group();staff.position.set(-.28,-.48,-.63);staff.rotation.z=-.2;this.camera.add(staff);this.focusWeapon=staff;const shaft=new T.Mesh(new T.CylinderGeometry(.022,.032,.55,8),this.bronze);staff.add(shaft);this.staffCore=new T.Mesh(new T.OctahedronGeometry(.075),this.glowMaterials[0]);this.staffCore.position.y=.34;this.staffCore.scale.y=1.8;staff.add(this.staffCore);this.staffCrown=new T.Mesh(new T.TorusGeometry(.11,.012,5,25),this.glowMaterials[0]);this.staffCrown.position.y=.33;staff.add(this.staffCrown);
  const brass=new T.MeshStandardMaterial({color:0x8e7850,metalness:.85,roughness:.32});
  for(const y of [-.60,.64]){const m=new T.Mesh(new T.CylinderGeometry(.38,.44,.12,10),brass);m.position.y=y;g.add(m);}
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,m=new T.Mesh(new T.CylinderGeometry(.027,.027,1.25,5),brass);m.position.set(Math.cos(a)*.35,.02,Math.sin(a)*.35);g.add(m);}
  const handle=new T.Mesh(new T.TorusGeometry(.25,.033,6,22,Math.PI),brass);handle.position.y=.78;g.add(handle);
  this.lanternCore=new T.Mesh(new T.OctahedronGeometry(.24),this.glowMaterials[0]);this.lanternCore.scale.y=1.8;g.add(this.lanternCore);
 }
 setLoot(items,orbs){
  for(const l of this.loot){this.root.remove(l.group);l.gem.geometry.dispose();l.glow.geometry.dispose();l.glow.material.dispose();l.floor.material.dispose();l.floor.geometry.dispose();}
  for(const o of this.orbs){this.root.remove(o.mesh);o.mesh.geometry.dispose();}
  this.loot=items.map(item=>{const group=new T.Group();group.position.set(item.x,0,item.z);const size=[.20,.29,.34,.42][item.tier];const gem=new T.Mesh(new T.OctahedronGeometry(size,0),this.glowMaterials[item.tier]);gem.scale.y=1.45;gem.position.y=.85;group.add(gem);const glow=this.glow(tiers[item.tier].color,item.tier===3?3.5:2.1,item.tier===3?.6:.36);glow.position.y=.85;group.add(glow);const floor=this.glow(tiers[item.tier].color,2.2,.26);floor.rotation.x=-Math.PI/2;floor.position.y=.03;group.add(floor);this.root.add(group);return{item,group,gem,glow,floor};});
  this.orbs=orbs.map(item=>{const mesh=new T.Mesh(new T.IcosahedronGeometry(.25,1),this.glowMaterials[3]);mesh.position.set(item.x,.9,item.z);this.root.add(mesh);return{item,mesh};});
 }
 buildParticles(){
  const count=360,positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count),random=rng(182);for(let i=0;i<count;i++){const c=cells[Math.floor(random()*cells.length)];positions[i*3]=(c%W)*S+(random()-.5)*3;positions[i*3+1]=.2+random()*3.8;positions[i*3+2]=Math.floor(c/W)*S+(random()-.5)*3;colors.set([.16+random()*.2,.65,.52],i*3);sizes[i]=1.2+random()*1.6;}
  const particleMaterial=new T.ShaderMaterial({uniforms:{uTime:this.uniforms.uTime,uPlayer:this.uniforms.uPlayer,uRatio:{value:1}},vertexShader:`attribute vec3 aColor;attribute float aSize;uniform float uTime,uRatio;uniform vec3 uPlayer;varying vec3 vColor;varying float vAlpha;void main(){vec3 p=position;p.y+=sin(uTime*.5+position.x)*.1;vColor=aColor;vAlpha=(1.-smoothstep(4.,14.,distance(p,uPlayer)))*.8;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uRatio*10./-mv.z,1.,9.);}`,fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){float a=max(0.,1.-length(gl_PointCoord-.5)*2.);gl_FragColor=vec4(vColor,a*a*vAlpha);}`,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setAttribute('aColor',new T.BufferAttribute(colors,3));geo.setAttribute('aSize',new T.BufferAttribute(sizes,1));this.root.add(new T.Points(geo,particleMaterial));
  this.burstData=new Float32Array(180*3);this.burstColors=new Float32Array(180*3);this.burstSizes=new Float32Array(180);this.burstData.fill(-100);const bgeo=new T.BufferGeometry();bgeo.setAttribute('position',new T.BufferAttribute(this.burstData,3));bgeo.setAttribute('aColor',new T.BufferAttribute(this.burstColors,3));bgeo.setAttribute('aSize',new T.BufferAttribute(this.burstSizes,1));this.burstGeo=bgeo;this.burstPoints=new T.Points(bgeo,particleMaterial);this.burstPoints.frustumCulled=false;this.root.add(this.burstPoints);this.particleIndex=0;
 }
 burst(x,z,tier,count=24){const color=new T.Color(tiers[tier].color);for(let k=0;k<count;k++){const i=this.particleIndex++%180;this.particles[i]={x,y:.8,z,vx:(Math.random()-.5)*3.3,vy:Math.random()*2.8,vz:(Math.random()-.5)*3.3,life:.7+Math.random()*.55};this.burstColors.set([color.r*1.8,color.g*1.8,color.b*1.8],i*3);this.burstSizes[i]=3+Math.random()*3;}this.burstGeo.attributes.aColor.needsUpdate=true;this.burstGeo.attributes.aSize.needsUpdate=true;this.bloomKick=Math.max(this.bloomKick,.3+tier*.35);}
 wave(x,z){this.uniforms.uWave.value.set(x,0,z);this.uniforms.uWaveAge.value=0;this.bloomKick=1.4;}
 hitImpact(power=1){this.hitShake=Math.max(this.hitShake,power);this.bloomKick=Math.max(this.bloomKick,.8);}
 buildPost(){const type=this.renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType;this.sceneRT=new T.WebGLRenderTarget(1,1,{type,depthBuffer:true});this.blurA=new T.WebGLRenderTarget(1,1,{type,depthBuffer:false});this.blurB=new T.WebGLRenderTarget(1,1,{type,depthBuffer:false});this.postScene=new T.Scene();this.postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);this.blurMat=new T.ShaderMaterial({vertexShader:fullscreenVert,fragmentShader:blurFrag,uniforms:{tInput:{value:null},uStep:{value:new T.Vector2()},uThreshold:{value:.8}},depthTest:false,depthWrite:false});this.compositeMat=new T.ShaderMaterial({vertexShader:fullscreenVert,fragmentShader:compositeFrag,uniforms:{tScene:{value:this.sceneRT.texture},tBloom:{value:this.blurB.texture},uStrength:{value:.65},uTime:this.uniforms.uTime},depthTest:false,depthWrite:false});this.quad=new T.Mesh(new T.PlaneGeometry(2,2),this.blurMat);this.postScene.add(this.quad);}
 resize(){const w=innerWidth,h=innerHeight,q=this.settings.quality,ratio=Math.min(devicePixelRatio||1,q==='high'?1.65:q==='low'?.85:1.15)*this.qualityScale;this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();const a=Math.floor(w*ratio),b=Math.floor(h*ratio);this.sceneRT.setSize(a,b);this.blurA.setSize(Math.max(1,a>>2),Math.max(1,b>>2));this.blurB.setSize(Math.max(1,a>>2),Math.max(1,b>>2));}
 canMove(x,z){return canStand(x,z)&&!this.obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.26);}
 render(dt,state){
  this.elapsed+=dt;const time=this.elapsed;this.uniforms.uTime.value=time;this.uniforms.uWaveAge.value+=dt;this.uniforms.uRevealPulse.value*=Math.exp(-dt*4);this.bloomKick*=Math.exp(-dt*3.4);
  this.hitShake*=Math.exp(-dt*18);const shake=this.settings.reduced?0:this.hitShake;this.camera.position.set(state.x+(Math.random()-.5)*shake*.09,1.70+(Math.random()-.5)*shake*.055,state.z+(Math.random()-.5)*shake*.09);this.camera.rotation.set(state.pitch+(Math.random()-.5)*shake*.018,state.yaw+(Math.random()-.5)*shake*.025,0,'YXZ');this.uniforms.uPlayer.value.set(state.x,1.70,state.z);this.uniforms.uLight.value=state.dark?0:(state.elapsed<(state.blindUntil||0)?.32:1)*clamp(state.light/14,.3,1);this.uniforms.uMenu.value=state.menu?1:0;
  this.lamp.position.copy(this.camera.position);this.lamp.intensity=state.dark?0:30*this.uniforms.uLight.value;this.lanternCore.rotation.y=time*.4;this.lantern.visible=!state.menu&&!state.dark;this.lanternCore.scale.set(.9,1.7,.9);this.lantern.position.x=.26+state.move*.002*Math.sin(time*3);
  let changed=false;const alpha=1-Math.exp(-dt*13);for(const i of this.reveal.dirty)this.maskPending.add(i);this.reveal.dirty.clear();for(const i of this.maskPending){const gap=this.reveal.data[i]-this.maskBytes[i];if(gap>0){this.maskBytes[i]+=Math.min(gap,Math.max(1,Math.ceil(gap*alpha)));changed=true;}if(this.maskBytes[i]>=this.reveal.data[i])this.maskPending.delete(i);}if(changed)this.mask.needsUpdate=true;
  for(const l of this.loot){const d=Math.hypot(l.item.x-state.x,l.item.z-state.z);l.group.visible=!l.item.collected&&d<36;if(!l.group.visible)continue;l.gem.position.y=.85+Math.sin(time*1.7+l.item.phase)*.11;l.gem.rotation.y=time*.65+l.item.phase;l.gem.rotation.z=Math.sin(time+l.item.phase)*.08;l.glow.position.y=l.gem.position.y;l.glow.quaternion.copy(this.camera.quaternion);l.glow.material.uniforms.uOpacity.value=(.26+l.item.tier*.1)*(1.0+Math.sin(time*2+l.item.phase)*.13);}
  for(const o of this.orbs){o.mesh.visible=!o.item.collected;o.mesh.position.y=.85+Math.sin(time*2)*.15;o.mesh.rotation.y=time;}
  for(const a of this.animations){if(a.kind==='rings'){a.mesh.rotation.y=time*.10;a.mesh.rotation.z=Math.sin(time*.15)*.13;}else a.mesh.quaternion.copy(this.camera.quaternion);}
  this.homeGlow.quaternion.copy(this.camera.quaternion);if(this.jackBeam)this.jackBeam.rotation.y=state.yaw;this.animateActors(time,state);this.animateExpedition(dt,state);if(this.focusWeapon){this.focusWeapon.visible=!state.menu&&!state.dark&&stageInfo.config.spells.length>0;this.staffCore.rotation.y=time*.5;this.staffCrown.rotation.y=time*.6;}
  for(const d of this.dropMeshes){d.group.visible=!d.item.collected&&!state.menu&&Math.hypot(d.item.x-state.x,d.item.z-state.z)<35;if(!d.group.visible)continue;d.group.position.y=.38+Math.sin(Math.min(1,d.item.age/.65)*Math.PI)*.65+Math.sin(time*2+d.item.phase)*.045;d.core.rotation.y=time*1.2;d.glow.quaternion.copy(this.camera.quaternion);}
  for(let i=0;i<180;i++){const p=this.particles[i];if(!p||p.life<=0){this.burstData[i*3+1]=-100;continue;}p.life-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;p.vy-=2.5*dt;this.burstData.set([p.x,p.y,p.z],i*3);}this.burstGeo.attributes.position.needsUpdate=true;
  this.renderer.setRenderTarget(this.sceneRT);this.renderer.render(this.scene,this.camera);
  this.quad.material=this.blurMat;this.blurMat.uniforms.tInput.value=this.sceneRT.texture;this.blurMat.uniforms.uThreshold.value=.72;this.blurMat.uniforms.uStep.value.set(2/this.blurA.width,0);this.renderer.setRenderTarget(this.blurA);this.renderer.render(this.postScene,this.postCamera);
  this.blurMat.uniforms.tInput.value=this.blurA.texture;this.blurMat.uniforms.uThreshold.value=0;this.blurMat.uniforms.uStep.value.set(0,2/this.blurA.height);this.renderer.setRenderTarget(this.blurB);this.renderer.render(this.postScene,this.postCamera);
  this.quad.material=this.compositeMat;this.compositeMat.uniforms.uStrength.value=this.settings.reduced?.3:.57+this.bloomKick;this.renderer.setRenderTarget(null);this.renderer.render(this.postScene,this.postCamera);
 }
}
