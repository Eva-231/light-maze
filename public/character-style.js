import * as T from './vendor/three.module.js';

const mat=(color,emissive=0,ei=0)=>new T.MeshStandardMaterial({color,emissive,emissiveIntensity:ei,metalness:.78,roughness:.24});
const dark=()=>mat(0x101820),silver=()=>mat(0x778a96),gold=()=>mat(0x6e5835,0xd89b3d,.25);
const glow=c=>new T.MeshBasicMaterial({color:c,transparent:true,opacity:.95});
const mesh=(g,geo,m,p,s=[1,1,1],r=[0,0,0])=>{const x=new T.Mesh(geo,m);x.position.set(...p);x.scale.set(...s);x.rotation.set(...r);g.add(x);return x;};

export function stylizeEnemy(group,kind,color){
 const d=dark(),s=silver(),a=glow(color);
 if(kind===0){ // shadow knight: sharp pauldrons + luminous chest blade
  for(const side of [-1,1]){mesh(group,new T.ConeGeometry(.18,.62,8),d,[side*.39,1.27,0],[1,1,1],[0,0,side*.62]);mesh(group,new T.ConeGeometry(.08,.42,6),s,[side*.31,.73,.02],[1,1,1],[0,0,side*.16]);}
  mesh(group,new T.OctahedronGeometry(.11,1),a,[0,1.12,-.31],[.7,1.5,.45]);
 }else if(kind===1){ // rift wolf: unmistakable ears, muzzle, tail and glowing claws
  for(const side of [-1,1])mesh(group,new T.ConeGeometry(.13,.38,7),d,[side*.17,1.12,-.72],[1,1,1],[.18,0,side*.08]);
  mesh(group,new T.ConeGeometry(.19,.58,8),d,[0,.82,-.92],[1,.72,1],[Math.PI/2,0,0]);
  const tail=mesh(group,new T.ConeGeometry(.11,.92,8),d,[0,.77,.72],[1,1,1],[-1.02,0,0]);
  for(const side of [-1,1])for(const z of [-.50,.48])mesh(group,new T.ConeGeometry(.035,.28,5),a,[side*.36,.10,z-.10],[1,1,1],[Math.PI/2,0,0]);
  tail.userData.stylePart='tail';
 }else if(kind===2){ // stone giant: massive curved shoulders + glowing cracked core
  for(const side of [-1,1]){mesh(group,new T.SphereGeometry(.47,14,9),d,[side*.72,1.48,0],[1.25,.75,.9]);mesh(group,new T.CylinderGeometry(.25,.34,.82,10),s,[side*.73,.78,0]);}
  mesh(group,new T.TorusGeometry(.26,.035,7,28),a,[0,1.16,-.34],[1,1,1],[Math.PI/2,0,0]);
 }else if(kind===3){ // teleport mage: floating layered mantle and arcane halos
  mesh(group,new T.ConeGeometry(.66,1.55,18,1,true),d,[0,.82,0],[1,1,1],[0,0,Math.PI]);
  for(let i=0;i<2;i++){const h=mesh(group,new T.TorusGeometry(.48+i*.18,.025,6,40),a,[0,1.82+i*.22,0]);h.rotation.x=Math.PI/2+i*.35;h.userData.styleSpin=i?-.8:.8;}
  mesh(group,new T.SphereGeometry(.15,14,10),a,[0,1.48,-.22],[.55,1,.35]);
 }else if(kind===4){ // silver wisp: elegant luminous wings
  for(const side of [-1,1]){const wing=mesh(group,new T.SphereGeometry(.34,14,9),s,[side*.39,.65,.08],[.35,1.25,.12],[0,0,side*.55]);wing.material.emissive.setHex(color);wing.material.emissiveIntensity=.7;}
  mesh(group,new T.OctahedronGeometry(.18,1),a,[0,.64,-.28],[.65,1.45,.5]);
 }else if(kind===5){ // abyss guardian: black-gold knight, crown fins and mantle
  for(const side of [-1,1]){mesh(group,new T.SphereGeometry(.52,16,10),gold(),[side*.75,1.55,0],[1.25,.7,.95]);mesh(group,new T.ConeGeometry(.15,.72,7),gold(),[side*.48,2.18,.05],[1,1,1],[0,0,side*.35]);}
  mesh(group,new T.ConeGeometry(.72,1.75,18,1,true),d,[0,.92,.38],[1,1,.55],[0,0,Math.PI]);
  mesh(group,new T.TorusGeometry(.34,.045,8,36),a,[0,1.18,-.42],[1,1,1],[Math.PI/2,0,0]);
 }
 group.userData.stylized=true;
}

export function stylizeFirstPerson(lantern,staff){
 if(!lantern||lantern.userData.stylized)return;
 lantern.userData.stylized=true;
 const armor=mat(0x18242c,0x16394a,.18),light=glow(0x9feaff);
 // A visible black-silver armored gauntlet around the LIGHT lantern.
 mesh(lantern,new T.SphereGeometry(.34,16,10),armor,[.30,-.48,.12],[1.15,.55,.85],[0,0,-.22]);
 for(let i=0;i<3;i++)mesh(lantern,new T.BoxGeometry(.11,.34,.12),silver(),[.12+i*.12,-.62,-.08],[1,1,1],[0,0,-.15]);
 mesh(lantern,new T.TorusGeometry(.39,.025,8,40),light,[0,.03,0],[1,1,1],[Math.PI/2,0,0]);
 if(staff){mesh(staff,new T.ConeGeometry(.055,.34,8),armor,[0,.50,0]);const halo=mesh(staff,new T.TorusGeometry(.15,.014,6,32),light,[0,.39,0]);halo.rotation.x=Math.PI/2;}
}
