import {simSin,simCos,simHypot} from './deterministic-math.js';
// Generic collision adapter: components own their geometry and movement.
import {OBSTACLES,RADIUS,elevation} from './world.js';
import {resolveObstacle} from './components/obstacles/index.js';
import {createShapeBuilder} from './components/obstacles/shared.js';
export function obstacleShapes(o,k,t) {
 const {def,params}=resolveObstacle(o),ctx=createShapeBuilder(o,k);
 def.build(ctx,params,t,o.phase??k);
 return ctx.shapes;
}
export function shapeReach(o,shapes) {
 return Math.max(0,...shapes.map(shape=>Math.abs(shape.s-o.s)+shape.reach))+RADIUS;
}
export function obstacleNotice(o,k,t) {
 const {def,params}=resolveObstacle(o);
 const notice=def.notice?.(t,o.phase??k,params);
 return notice?{...notice,key:`${o.id??k}:${notice.key}`}:null;
}
export function courseShapes(t,course=OBSTACLES) {
 return course.map((o,k)=>{const shapes=obstacleShapes(o,k,t);return {o,k,shapes,reach:shapeReach(o,shapes)};});
}
export function planarBallRadius(shape,r=RADIUS,ballS=shape.s){
 if(shape.kind==='sphere'){
  const dy=elevation(shape.s)-elevation(ballS)+shape.y+shape.r-r;const sum=r+shape.r;return Math.abs(dy)<sum?Math.sqrt(sum*sum-dy*dy):0;
 }
 const dy=Math.max(shape.y-r,r-(shape.y+shape.h),0);return dy<r?Math.sqrt(r*r-dy*dy):0;
}
export function contactFor(shape,wx,s,r=RADIUS,previous=null){
 if(Math.abs(s-shape.s)>shape.reach+r||Math.abs(wx-shape.wx)>shape.reach+r)return null;
 const radius=planarBallRadius(shape,r,s);if(!radius)return null;
 const dx=wx-shape.wx,ds=s-shape.s;
 if(shape.kind!=='box'){
  const limit=shape.kind==='sphere'?radius:radius+shape.r,d2=dx*dx+ds*ds;if(d2>=limit*limit)return null;
  const d=Math.sqrt(d2);let nx,ns;if(d>1e-8){nx=dx/d;ns=ds/d;}else{const px=previous?previous.wx-shape.wx:0,ps=previous?previous.s-shape.s:-1,n=simHypot(px,ps)||1;nx=px/n;ns=ps/n;}
  return {nx,ns,depth:limit-d};
 }
 const c=simCos(shape.angle),a=simSin(shape.angle),u=dx*c+ds*a,v=-dx*a+ds*c,hw=shape.w/2,hd=shape.d/2;
 let nu=u-Math.max(-hw,Math.min(hw,u)),nv=v-Math.max(-hd,Math.min(hd,v));const d2=nu*nu+nv*nv;if(d2>=radius*radius)return null;
 let depth;if(d2>1e-12){const d=Math.sqrt(d2);nu/=d;nv/=d;depth=radius-d;}else{
  // Keep an embedded body on its incoming side, including dense packs pushing against a gate.
  const px=previous?previous.wx-shape.wx:dx,ps=previous?previous.s-shape.s:ds,pu=px*c+ps*a,pv=-px*a+ps*c;
  if(Math.abs(pv)>hd||Math.abs(pu)<=hw&&hw-Math.abs(u)>hd-Math.abs(v)){nu=0;nv=Math.sign(pv)||-1;depth=radius+hd-nv*v;}else{nu=Math.sign(pu)||1;nv=0;depth=radius+hw-nu*u;}
 }
 return {nx:nu*c-nv*a,ns:nu*a+nv*c,depth};
}
export function surfaceVelocity(shape,wx,s){return {vx:(shape.vx||0)-(shape.omega||0)*(s-shape.s),vs:(shape.vs||0)+(shape.omega||0)*(wx-shape.wx)};}
export function projectVisualBall(wx,s,groups,r=RADIUS){
 for(let pass=0;pass<2;pass++)for(const group of groups){if(Math.abs(s-group.o.s)>(group.reach??13))continue;for(const shape of group.shapes){const contact=contactFor(shape,wx,s,r);if(contact){wx+=contact.nx*(contact.depth+1e-5);s+=contact.ns*(contact.depth+1e-5);}}}
 return {wx,s};
}
