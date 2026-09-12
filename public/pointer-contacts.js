// PointerEvent IDs and Touch.identifier are different namespaces on iOS.
// Bind by the initial position, then reconcile by identifier, never by finger count.
export class PointerContacts {
 constructor(){this.contacts=new Map();this.touches=[];}
 begin(e){this.contacts.set(e.pointerId,{type:e.pointerType,x:e.clientX,y:e.clientY,touchId:null});this.bind(this.touches);}
 bind(touches){this.touches=Array.from(touches||[]);const used=new Set([...this.contacts.values()].map(p=>p.touchId).filter(id=>id!==null));for(const p of this.contacts.values()){if(p.type!=='touch'||p.touchId!==null)continue;const t=this.touches.find(t=>!used.has(t.identifier)&&Math.hypot(t.clientX-p.x,t.clientY-p.y)<6);if(t){p.touchId=t.identifier;used.add(t.identifier);}}}
 reconcile(touches){this.bind(touches);const live=new Set(this.touches.map(t=>t.identifier)),ended=[];for(const [id,p] of this.contacts){if(p.type==='touch'&&(!live.size||p.touchId!==null&&!live.has(p.touchId))){ended.push(id);this.contacts.delete(id);}}return ended;}
 release(id){this.contacts.delete(id);}
 reset(){this.contacts.clear();this.touches=[];}
}
