import {W,H,S,MASK,cells,rooms,clamp,lineOfSight} from './generation.js';
export * from './generation.js';
export class Reveal{
 constructor(encoded){this.data=new Uint8Array(MASK*MASK);this.dirty=new Set();this.seen=new Set();this.completed=new Set();if(encoded){try{const b=atob(encoded);if(b.length===this.data.length)for(let i=0;i<b.length;i++)this.data[i]=b.charCodeAt(i);}catch{}}this.updateSeen();}
 uv(x,z){return [clamp(Math.floor((x/S+.5)/W*MASK),0,MASK-1),clamp(Math.floor((z/S+.5)/H*MASK),0,MASK-1)];}
 sample(x,z){const [a,b]=this.uv(x,z);return this.data[b*MASK+a]/255;}
 stamp(x,z,radius){let changed=0;const [cx,cz]=this.uv(x,z),rx=Math.ceil(radius/(W*S)*MASK),rz=Math.ceil(radius/(H*S)*MASK);for(let b=Math.max(0,cz-rz);b<=Math.min(MASK-1,cz+rz);b++)for(let a=Math.max(0,cx-rx);a<=Math.min(MASK-1,cx+rx);a++){const px=(a/MASK*W-.5)*S,pz=(b/MASK*H-.5)*S,d=Math.hypot(px-x,pz-z);if(d>radius)continue;const i=b*MASK+a,target=Math.round(clamp((radius-d)/.75,0,1)*255);if(target>this.data[i]&&lineOfSight(x,z,px,pz)){this.data[i]=target;this.dirty.add(i);changed++;}}if(changed)this.updateSeen();return changed;}
 updateSeen(){for(const i of cells)if(!this.seen.has(i)&&this.sample(i%W*S,Math.floor(i/W)*S)>.7)this.seen.add(i);}
 roomRatio(id){const ts=rooms[id].tiles;return ts.filter(i=>this.seen.has(i)).length/ts.length;}
 fillRoom(id){for(const i of rooms[id].tiles){const x=i%W,z=Math.floor(i/W);const [a,b]=this.uv((x-.5)*S,(z-.5)*S),[c,d]=this.uv((x+.5)*S,(z+.5)*S);for(let j=b;j<=d;j++)for(let k=a;k<=c;k++){const index=j*MASK+k;if(this.data[index]!==255){this.data[index]=255;this.dirty.add(index);}}}this.updateSeen();}
 get percent(){return this.seen.size/cells.length*100;}
 encode(){let s='';for(let i=0;i<this.data.length;i+=8192)s+=String.fromCharCode(...this.data.subarray(i,i+8192));return btoa(s);}
}
