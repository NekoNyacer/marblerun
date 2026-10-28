import * as T from 'three';
import {elevation,position} from './track-geometry.js';
import {resolveObstacle} from './components/obstacles/index.js';
import {obstacleShapes,shapeReach} from './obstacles.js';

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
// Generic view adapter: all obstacle-specific decoration and animation live in components.
export class ObstacleView{
 constructor(host,o,k){
  this.host=host;this.o=o;this.k=k;this.phase=o.phase??k;
  const {def,params}=resolveObstacle(o);this.definition=def;this.params=params;
  this.group=new T.Group();host.scene.add(this.group);this.decor=new T.Group();this.decor.position.set(...position(o.s,o.x??0));this.group.add(this.decor);this.solids=new Map();
  host.hazardMaterial??=hazardMaterial();
  this.shapes=obstacleShapes(o,k,0);
  for(const shape of this.shapes)this.solids.set(shape.id,new SolidView(shape,this.materialFor(shape),this.group));
  def.decorate?.(this,params);
  def.update?.(this,0,this.shapes,params);
 }
 materialFor(shape){
  if(shape.materialKey==='hazard')return this.host.hazardMaterial;
  if(shape.materialKey)return this.host.materials[shape.materialKey]??this.host.materials.deep;
  return this.host.materials.deep;
 }
 sign(text,x,y,w,sub='',warning=false){
  const host=this.host,g=this.decor;
  const backing=host.box(w+.18,1.65,.3,host.materials.deep,x,y,.6,g),face=host.screen(text,w,1.5,sub,g,warning);
  face.position.set(x,y,.78);return {face,backing};
 }
 update(t,shapes=obstacleShapes(this.o,this.k,t)){
  this.shapes=shapes;
  for(const shape of this.shapes)this.solids.get(shape.id).update(shape);
  this.definition.update?.(this,t,this.shapes,this.params);
  return {o:this.o,k:this.k,shapes:this.shapes,reach:shapeReach(this.o,this.shapes)};
 }
}
