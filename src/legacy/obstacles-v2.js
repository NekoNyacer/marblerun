// Gameplay solids are defined once. Both WebGL geometry and physics consume these exact poses.
import {OBSTACLES,WIDTH,RADIUS,center,elevation,gateState,rotorAngle} from './world-v2.js';
const smooth=x=>x*x*(3-2*x);
function liftWave(t){return smooth(Math.max(0,Math.min(1,(Math.sin(t)+.18)/.36)));}
export function obstacleShapes(o,k,t){
 const shapes=[],origin=center(o.s);
 const add=(id,kind,x,ds,y,h,props={})=>{const shape={id:`${k}:${id}`,kind,wx:origin+x,s:o.s+ds,y,h,angle:0,role:'bar',...props};shape.reach=kind==='box'?Math.hypot(shape.w/2,shape.d/2):shape.r;shapes.push(shape);return shape;};
 const box=(id,x,ds,y,h,w,d,props={})=>add(id,'box',x,ds,y,h,{w,d,...props});
 const post=(id,x,h)=>box(id,x,0,0,h,.6,.7,{role:'post'});
 if(o.type==='gate'){
  [-10.5,0,10.5].forEach((x,j)=>post(`post${j}`,x,5.8));
  box('divider',0,0,0,.65,.55,5,{role:'divider'});
  const state=gateState(t,k);
  [-5,5].forEach((x,j)=>box(`bar${j}`,x,0,.1+2.1*(j?state.rightLift:state.leftLift),.55,9.1,.55,{role:'gate',lane:j}));
 }else if(o.type==='rotor'){
  add('base','circle',0,0,0,.4,{r:.95,role:'base'});
  add('axle','circle',0,0,.4,2.7,{r:.48,role:'post'});
  box('blade',0,0,.12,.65,15,.6,{angle:rotorAngle(t,k),omega:.8,role:'rotor'});
 }else if(o.type==='rate'){
  [-10.5,10.5].forEach((x,j)=>post(`post${j}`,x,4.3));
  for(let j=0;j<4;j++){
   const phase=(t+j*.65+k)%3.8;const raised=phase<2?1:phase<2.2?1-smooth((phase-2)/.2):phase<3.6?0:smooth((phase-3.6)/.2);
   // Raise out of the road to open; no buried geometry intersects the road surface.
   box(`bar${j}`,-7.5+j*5,0,.08+2.1*(1-raised),.6,4.05,.65,{role:'rate'});
  }
 }else if(o.type==='error'){
  for(let j=0;j<3;j++)box(`piston${j}`,(j-1)*6,0,.08+1.7*(1-liftWave(t*1.25+j*2+k)),.72,3.3,.75,{role:'error'});
 }else if(o.type==='pendulum'){
  [-10.5,10.5].forEach((x,j)=>post(`post${j}`,x,7));
  add('head','sphere',Math.sin(t*1.3+k)*7,0,.04,2.1,{r:1.05,vx:Math.cos(t*1.3+k)*9.1,role:'pendulum'});
 }else if(o.type==='pegs'){
  const rows=[[-8,-4,0,4,8],[-6,-2,2,6],[-8,-4,0,4,8],[-8.5,-5.1,-1.7,1.7,5.1,8.5]];
  rows.forEach((xs,row)=>xs.forEach((x,col)=>{const ds=(row-1.5)*3.1,local=x+center(o.s+ds)-origin;add(`peg${row}-${col}`,'circle',local,ds,0,1.15,{r:.43,role:'peg'});}));
 }else if(o.type==='finish'){
  [-10.5,10.5].forEach((x,j)=>box(`post${j}`,x,0,0,7,.8,.8,{role:'post'}));
 }
 return shapes;
}
export function courseShapes(t){return OBSTACLES.map((o,k)=>({o,k,shapes:obstacleShapes(o,k,t)}));}
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
  const d=Math.sqrt(d2);let nx,ns;if(d>1e-8){nx=dx/d;ns=ds/d;}else{const px=previous?previous.wx-shape.wx:0,ps=previous?previous.s-shape.s:-1,n=Math.hypot(px,ps)||1;nx=px/n;ns=ps/n;}
  return {nx,ns,depth:limit-d};
 }
 const c=Math.cos(shape.angle),a=Math.sin(shape.angle),u=dx*c+ds*a,v=-dx*a+ds*c,hw=shape.w/2,hd=shape.d/2;
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
 for(let pass=0;pass<2;pass++)for(const group of groups){if(Math.abs(s-group.o.s)>13)continue;for(const shape of group.shapes){const contact=contactFor(shape,wx,s,r);if(contact){wx+=contact.nx*(contact.depth+1e-5);s+=contact.ns*(contact.depth+1e-5);}}}
 return {wx,s};
}
