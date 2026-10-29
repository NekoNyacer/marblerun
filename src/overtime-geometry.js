import {simSin,simCos} from './deterministic-math.js';
import {center,elevation} from './track-geometry.js';

// Shared by the contact solver and the rendered hardware. Coordinates are
// metres in a stationary world frame: x across the track, z downstream, y up.
export const STAIR_COUNT=6, STAIR_START=-14, STAIR_DEPTH=1.8, BOWL_CENTER=9.2;
export const STAIR_GEAR_RATIO=2.2, STAIR_SLOPE=.35, DECK_SLOPE=.14, THROAT_RADIUS=.56, BOWL_DEPTH=1.7, LOWER_DEPTH=2;
export const stairCenter=(o,n)=>o.s+STAIR_START+(n+.5)*STAIR_DEPTH;
// The crank amplifies actuator travel. A motor acceleration limit keeps a
// requested fast cycle from throwing every load off on the downstroke.
export const stairPeriod=p=>Math.max(p.period,Math.PI*2*Math.sqrt(p.amplitude*STAIR_GEAR_RATIO/4.4));
export const stairWave=(t,phase,p)=>simSin((t+phase*.23)*Math.PI*2/stairPeriod(p));
export const stairHeight=(n,t,phase,p)=>Math.max(n===0?-.35:.04,(n+.5)*p.rise+(n%2?-1:1)*(p.amplitude*STAIR_GEAR_RATIO)*stairWave(t,phase,p));
export function stairVelocity(n,t,phase,p){
 const raw=(n+.5)*p.rise+(n%2?-1:1)*p.amplitude*STAIR_GEAR_RATIO*stairWave(t,phase,p);
 return raw<=(n===0?-.35:.04)?0:(n%2?-1:1)*p.amplitude*STAIR_GEAR_RATIO*Math.PI*2/stairPeriod(p)*simCos((t+phase*.23)*Math.PI*2/stairPeriod(p));
}
export const CHUTE_WIDTH=1.68, GUARD_HEIGHT=2.8;
export function inPolygon(x,z,polygon){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
export function overtimeGeometry(o,p){
 const base=elevation(o.s),high=p.rise*STAIR_COUNT,bowlX=center(o.s+BOWL_CENTER)-center(o.s),radius=p.radius;
 const lipY=base+high-1,depthScale=Math.min(1,(high-1-.8)/(BOWL_DEPTH+LOWER_DEPTH));
 const throatY=lipY-BOWL_DEPTH*depthScale,exitY=lipY-(BOWL_DEPTH+LOWER_DEPTH)*depthScale;
 const entryR=radius-.65,rx=.68,rz=-Math.sqrt(1-rx*rx),tx=-rz,tz=rx;
 const entryX=bowlX+entryR*rx,lipS=BOWL_CENTER+entryR*rz,chuteLength=6.8;
 const neckX=entryX-tx*chuteLength,neckS=lipS-tz*chuteLength,half=CHUTE_WIDTH/2;
 const neckLeft=[neckX-tz*half,neckS+tx*half],neckRight=[neckX+tz*half,neckS-tx*half];
 const endLeft=[entryX-tz*half,lipS+tx*half],endRight=[entryX+tz*half,lipS-tx*half];
 const deckStart=STAIR_START+STAIR_COUNT*STAIR_DEPTH,front=deckStart-.55,frontX=center(o.s+front)-center(o.s);
 const startLeft=[frontX-10.2,front],startRight=[frontX+10.2,front];
 const entryY=lipY+.05,deckY=z=>entryY+DECK_SLOPE*(lipS-z);
 const deckPolygons=[[startLeft,startRight,neckRight,neckLeft],[neckLeft,neckRight,endRight,endLeft]];
 const rimEnd=(a,b)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1],x=a[0]-bowlX,z=a[1]-BOWL_CENTER,A=dx*dx+dz*dz,B=2*(x*dx+z*dz),C=x*x+z*z-radius*radius,root=Math.sqrt(Math.max(0,B*B-4*A*C)),u=Math.max(0,Math.min(1,(-B-root)/(2*A)));
  return [a[0]+dx*u,a[1]+dz*u];
 };
 const guides=[[...startLeft,...neckLeft],[...neckLeft,...rimEnd(neckLeft,endLeft)],[...startRight,...neckRight],[...neckRight,...rimEnd(neckRight,endRight)]];
 return {originX:center(o.s),base,high,entryX,lipS,lipY,deckStart,deckFront:front,deckY,deckPolygons,guides,neckS,neckX,chuteWidth:CHUTE_WIDTH,
  chute:[neckX,neckS,entryX,lipS],bowlX,bowlS:BOWL_CENTER,radius,throatY,exitY,guardTop:base+Math.max(high+3,(STAIR_COUNT-.5)*p.rise+p.amplitude*STAIR_GEAR_RATIO+1.5),
  steps:Array.from({length:STAIR_COUNT},(_,n)=>({n,z:STAIR_START+(n+.5)*STAIR_DEPTH,x:center(stairCenter(o,n))-center(o.s),base:elevation(stairCenter(o,n))}))};
}

export const SWEEPER_RADIUS=.17,SWEEPER_ORBIT=.91,SWEEPER_SPEED=.95;
export function throatSweeper(t,g){const angle=t*SWEEPER_SPEED;return {x:g.bowlX+simCos(angle)*SWEEPER_ORBIT,z:g.bowlS+simSin(angle)*SWEEPER_ORBIT,y:g.throatY+.55,vx:-simSin(angle)*SWEEPER_ORBIT*SWEEPER_SPEED,vz:simCos(angle)*SWEEPER_ORBIT*SWEEPER_SPEED};}
