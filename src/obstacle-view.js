import * as T from 'three';
import {elevation,position,gateState} from './world.js';
import {obstacleShapes} from './obstacles.js';

function hazardMaterial(){
 const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#e3a127';ctx.fillRect(0,0,256,64);ctx.fillStyle='#174e3b';
 for(let x=-64;x<320;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+26,0);ctx.lineTo(x-12,64);ctx.lineTo(x-38,64);ctx.closePath();ctx.fill();}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=T.RepeatWrapping;
 return new T.MeshStandardMaterial({map,roughness:.58,metalness:.08});
}
export class SolidView{
 constructor(shape,material,parent){
  const geometry=shape.kind==='box'?new T.BoxGeometry(shape.w,shape.h,shape.d):shape.kind==='sphere'?new T.SphereGeometry(shape.r,20,14):new T.CylinderGeometry(shape.r,shape.r,shape.h,16);
  this.base=new Float32Array(geometry.attributes.position.array);this.mesh=new T.Mesh(geometry,material);parent.add(this.mesh);this.mesh.frustumCulled=false;this.update(shape);
 }
 update(shape){
  const signature=[shape.wx,shape.s,shape.y,shape.angle].join(',');if(this.signature===signature)return;this.signature=signature;
  const p=this.mesh.geometry.attributes.position,a=p.array,b=this.base,c=Math.cos(shape.angle),sn=Math.sin(shape.angle);
  for(let j=0;j<a.length;j+=3){const u=b[j],z=b[j+2],s=shape.s+u*sn-z*c;a[j]=shape.wx+u*c+z*sn;a[j+2]=-s;
   a[j+1]=(shape.kind==='sphere'?elevation(shape.s):elevation(s))+shape.y+shape.h/2+b[j+1];
  }
  p.needsUpdate=true;this.mesh.geometry.computeVertexNormals();
 }
}
export function roadPatch(host,s,x,w,d,material){
 const vertices=[];for(const [u,v] of [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){const p=position(s+v,x+u);p[1]+=.018;vertices.push(...p);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex([0,1,2,1,3,2]);g.computeVertexNormals();return host.mesh(g,material);
}
export class ObstacleView{
 constructor(host,o,k){
  this.host=host;this.o=o;this.k=k;this.group=new T.Group();host.scene.add(this.group);this.decor=new T.Group();this.decor.position.set(...position(o.s));this.group.add(this.decor);this.solids=new Map();this.signs=[];
  host.hazardMaterial??=hazardMaterial();const m=host.materials;
  for(const shape of obstacleShapes(o,k,0))this.solids.set(shape.id,new SolidView(shape,['gate','rotor','rate','error'].includes(shape.role)?host.hazardMaterial:shape.role==='peg'?m.deep:shape.role==='pendulum'?m.amber:m.deep,this.group));
  const g=this.decor;
  const sign=(text,x,y,w,sub='',warning=false)=>{const backing=host.box(w+.18,1.65,.3,m.deep,x,y,.6,g),face=host.screen(text,w,1.5,sub,g,warning);face.position.set(x,y,.78);return {face,backing};};
  if(o.type==='gate'){
   host.box(21.6,.4,.7,m.deep,0,5.8,0,g);sign('ChatGPT',0,5.8,6.3,'Prompt Gate');
   for(let j=0;j<2;j++){
    const x=j?5:-5;const closed=sign(j?'FALLBACK':'CREDITS 0',x,3.8,7,'CLOSED',true),open=sign(j?'FALLBACK':'CREDITS OK',x,3.8,7,'OPEN');
    this.signs.push({closed,open});
   }
  }else if(o.type==='rotor')sign('>_ Codex',0,3.7,4.5,'Merge Conflict');
  else if(o.type==='rate'){host.box(21.6,.4,.7,m.deep,0,4.3,0,g);sign(o.label,0,4.3,8,'PLEASE RETRY');}
  else if(o.type==='pendulum'){
   host.box(21.6,.4,.7,m.deep,0,7,0,g);sign(o.label,0,7.65,6,'RETRY...');
   this.rod=host.cylinder(.1,4.75,m.metal,0,4.5,0,g);
  }else if(o.type==='pegs'){
   const label=sign(o.label,-12,2.4,4,'PEG ZONE');host.cylinder(.12,2.3,m.deep,-12,1.15,0,g);
   // Colored crown sits above marble height; it does not add an unseen collision radius.
   for(const shape of obstacleShapes(o,k,0)){
    const crown=host.cylinder(shape.r+.05,.12,m.amber,0,0,0,this.group);crown.position.set(shape.wx,elevation(shape.s)+1.1,-shape.s);
   }
  }else if(o.type==='error')sign(o.label,-11.8,2.4,4.5,'BUG DETECTED');
  else if(o.type==='finish'){host.box(21,1.7,1,m.deep,0,7,0,g);const finish=host.screen('DEPLOY SUCCESS',15,1.5,'FINISH',g);finish.position.set(0,7,.56);}
 }
 update(t){
  const shapes=obstacleShapes(this.o,this.k,t);for(const shape of shapes)this.solids.get(shape.id).update(shape);
  if(this.o.type==='gate'){
   const state=gateState(t,this.k);this.signs.forEach((sign,j)=>{const closed=j?state.rightClosed:state.leftClosed;sign.closed.face.visible=closed;sign.closed.backing.visible=closed;sign.open.face.visible=!closed;sign.open.backing.visible=!closed;});
  }
  if(this.rod){const head=shapes.find(s=>s.role==='pendulum');this.rod.position.x=head.wx-this.decor.position.x;}
  return {o:this.o,k:this.k,shapes};
 }
}
