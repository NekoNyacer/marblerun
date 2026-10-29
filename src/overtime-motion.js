import {simCos,simHypot} from './deterministic-math.js';
import {center,centerSlope,elevation,RADIUS,STEP} from './track-geometry.js';
import {STAIR_COUNT,STAIR_START,STAIR_DEPTH,STAIR_SLOPE,DECK_SLOPE,BOWL_CENTER,THROAT_RADIUS,overtimeGeometry,stairHeight,stairVelocity,inPolygon,throatSweeper,SWEEPER_RADIUS} from './overtime-geometry.js';
export {STAIR_COUNT,STAIR_START,STAIR_DEPTH,BOWL_CENTER,stairCenter,stairHeight,stairWave} from './overtime-geometry.js';
export const GRAVITY=9.81;
const D=RADIUS*2,SUBSTEPS=4,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// A local 3D sphere solver. Stages are telemetry only: no stage, clock or random
// value prescribes a marble position, orbit speed, admission or release time.
export class OvertimeMotion {
 constructor(race,item){this.race=race;this.item=item;this.geometry=overtimeGeometry(item.o,item.p);this.cells=new Map();this.stepCache=[];this.passedThroat=new Set();}
 tryEnter(i){
  const r=this.race,{o}=this.item,entry=o.s+STAIR_START-2;
  if(r.status[i]!==0||r.finish[i]>=0||this.item.seen.has(i)||r.s[i]<entry||r.s[i]>o.s+BOWL_CENTER+8)return false;
  this.item.held.push({i,x:r.worldX(i)-this.geometry.originX,z:r.s[i]-o.s,y:elevation(r.s[i])+RADIUS+r.vertical[i],vx:r.vx[i]+centerSlope(r.s[i])*r.vs[i],vz:r.vs[i],vy:0,stage:'stairs'});
  this.item.seen.add(i);this.item.filled++;r.status[i]=5;return true;
 }
 contact(b,nx,ny,nz,depth,vy=0,friction=.025,dt=STEP/SUBSTEPS){
  if(depth<=0)return;
  b.x+=nx*depth;b.y+=ny*depth;b.z+=nz*depth;
  const surfaceX=typeof vy==='object'?vy.vx:0,surfaceZ=typeof vy==='object'?vy.vz:0,surfaceY=typeof vy==='object'?0:vy;
  const relative=(b.vx-surfaceX)*nx+(b.vy-surfaceY)*ny+(b.vz-surfaceZ)*nz;
  if(relative<0){
   const impulse=-relative*(Math.abs(relative)>1.5?.12+1:1);
   b.vx+=nx*impulse;b.vy+=ny*impulse;b.vz+=nz*impulse;
   const normal=(b.vx-surfaceX)*nx+(b.vy-surfaceY)*ny+(b.vz-surfaceZ)*nz;
   const tx=b.vx-surfaceX-normal*nx,ty=b.vy-surfaceY-normal*ny,tz=b.vz-surfaceZ-normal*nz,speed=simHypot(tx,ty,tz);
   const drag=speed>1e-10?Math.min(1,friction*impulse/speed):0;
   b.vx-=tx*drag;b.vy-=ty*drag;b.vz-=tz*drag;
  }
 }
 prepareSteps(t){
  if(this.surfaceTime===t)return;this.surfaceTime=t;
  const p=this.item.p,phase=this.item.o.phase??0;
  this.stepCache=this.geometry.steps.map(step=>{
   const top=step.base+stairHeight(step.n,t,phase,p),lo=step.z-STAIR_DEPTH/2,hi=step.z+STAIR_DEPTH/2,bottom=step.base-12;
   return {top,lo,hi,bottom,vy:stairVelocity(step.n,t,phase,p),polygon:[[lo,bottom],[hi,bottom],[hi,top-STAIR_SLOPE*STAIR_DEPTH/2],[lo,top+STAIR_SLOPE*STAIR_DEPTH/2]]};
  });
 }
 stepContact(b,step,t,dt){
  if(Math.abs(b.z-step.z)>STAIR_DEPTH+RADIUS||Math.abs(b.x-step.x)>10.1)return;
  this.prepareSteps(t);const {top,lo,hi,bottom,vy,polygon}=this.stepCache[step.n];
  if(b.y>top+STAIR_SLOPE*STAIR_DEPTH/2+RADIUS)return;
  let best=Infinity,qz=0,qy=0;
  for(let k=0;k<4;k++){
   const a=polygon[k],c=polygon[(k+1)%4],dz=c[0]-a[0],dy=c[1]-a[1],u=clamp(((b.z-a[0])*dz+(b.y-a[1])*dy)/(dz*dz+dy*dy),0,1),z=a[0]+u*dz,y=a[1]+u*dy,d=(b.z-z)**2+(b.y-y)**2;
   if(d<best){best=d;qz=z;qy=y;}
  }
  const x=clamp(b.x,step.x-9.65,step.x+9.65),inside2=b.z>=lo&&b.z<=hi&&b.y>=bottom&&b.y<=top-STAIR_SLOPE*(b.z-step.z),insideX=x===b.x;
  let nx=b.x-x,ny=inside2?0:b.y-qy,nz=inside2?0:b.z-qz,d=simHypot(nx,ny,nz),depth=RADIUS-d;
  if(inside2&&insideX){
   // The slab spans a guarded lane: a deep penetration cannot be ejected
   // sideways into the rail and then pushed straight back into the slab.
   const distance=Math.sqrt(best);
   if(distance>1e-9){nx=0;ny=(qy-b.y)/distance;nz=(qz-b.z)/distance;depth=RADIUS+distance;}
   else{nx=0;ny=1/simHypot(1,STAIR_SLOPE);nz=STAIR_SLOPE*ny;depth=RADIUS;}
  }else if(d>1e-10){nx/=d;ny/=d;nz/=d;}else return;
  if(depth>0)this.contact(b,nx,ny,nz,depth,vy,.025,dt);
 }
 wall(b,segment,dt){
  const [x1,z1,x2,z2]=segment,dx=x2-x1,dz=z2-z1,length2=dx*dx+dz*dz;
  const u=clamp(((b.x-x1)*dx+(b.z-z1)*dz)/length2,0,1),x=x1+u*dx,z=z1+u*dz;
  const qx=b.x-x,qz=b.z-z,d=simHypot(qx,qz),radius=RADIUS+.09;
  if(d<radius&&d>1e-9)this.contact(b,qx/d,0,qz/d,radius-d,0,.02,dt);
 }
 cone(b,r1,y1,r2,y2,dt){
  const g=this.geometry,dx=b.x-g.bowlX,dz=b.z-g.bowlS,rho=simHypot(dx,dz),dr=r2-r1,dy=y2-y1;
  const u=clamp(((rho-r1)*dr+(b.y-y1)*dy)/(dr*dr+dy*dy),0,1),r=r1+u*dr,y=y1+u*dy;
  const nr=-Math.abs(dy)/simHypot(dr,dy),ny=dr*Math.sign(dy)/simHypot(dr,dy);
  let qr=rho-r,qy=b.y-y,d=simHypot(qr,qy),depth=RADIUS-d,nrHit=nr,nyHit=ny;
  if(u>0&&u<1){const distance=qr*nr+qy*ny;depth=RADIUS-distance;}
  else if(d>1e-9){nrHit=qr/d;nyHit=qy/d;}
  if(depth>0&&rho>1e-9)this.contact(b,nrHit*dx/rho,nyHit,nrHit*dz/rho,depth,0,.022*(5/this.item.p.orbit),dt);
 }
 surfaces(b,t,dt){
  const g=this.geometry,p=this.item.p;
  const stepIndex=Math.floor((b.z-STAIR_START)/STAIR_DEPTH);
  for(let n=Math.max(0,stepIndex-1);n<=Math.min(STAIR_COUNT-1,stepIndex+1);n++)this.stepContact(b,g.steps[n],t,dt);
  const rho=simHypot(b.x-g.bowlX,b.z-g.bowlS);
  // A continuous covered collector overlaps the final stair. Its riser
  // blocks low approaches; four joined walls lead to a two-marble-wide chute.
  if(b.z>=g.deckFront-RADIUS&&b.z<=g.lipS+2&&b.y>g.deckY(b.z)-1){
   const floor=g.deckY(b.z),roof=g.guardTop;
   if(b.y<roof+RADIUS)for(const segment of g.guides)this.wall(b,segment,dt);
   const onDeck=g.deckPolygons.some(polygon=>inPolygon(b.x,b.z,polygon));
   if(onDeck&&rho>p.radius-.25){
    const c=1/simHypot(1,DECK_SLOPE),distance=(b.y-floor)*c;
    if(distance<RADIUS)this.contact(b,0,c,DECK_SLOPE*c,RADIUS-distance,0,.015,dt);
    if(b.y>roof-RADIUS)this.contact(b,0,-c,-DECK_SLOPE*c,(b.y-roof+RADIUS)*c,0,.015,dt);
   }
  }
  // The front face is solid below its top; no marble can roll underneath the
  // collector when the last lift has not yet reached deck height.
  if(b.z>g.deckFront-RADIUS&&b.z<g.deckFront&&b.y<g.deckY(g.deckFront)&&Math.abs(b.x-g.deckPolygons[0][0][0]-10.2)<10.5)this.contact(b,0,0,-1,b.z-(g.deckFront-RADIUS),0,.01,dt);
  const inChute=inPolygon(b.x,b.z,g.deckPolygons[1]);
  if(rho<p.radius&&b.y>=g.throatY)b.enteredBowl=true;
  if((b.enteredBowl||rho<p.radius+RADIUS)&&b.y>=g.lipY-RADIUS&&b.y<g.guardTop+RADIUS&&!inChute&&rho>p.radius-RADIUS&&rho>0)this.contact(b,-(b.x-g.bowlX)/rho,0,-(b.z-g.bowlS)/rho,rho-p.radius+RADIUS,0,.009,dt);
  if(rho<=p.radius&&b.y>g.guardTop-RADIUS)this.contact(b,0,-1,0,b.y-g.guardTop+RADIUS,0,.009,dt);
  if(rho<p.radius+RADIUS&&b.y>=g.throatY-RADIUS&&b.y<g.lipY+2)this.cone(b,THROAT_RADIUS,g.throatY,p.radius,g.lipY,dt);
  if(rho<2.7+RADIUS&&b.y<g.throatY&&b.y>g.exitY-RADIUS)this.cone(b,THROAT_RADIUS,g.throatY,2.7,g.exitY,dt);
  // A rotating physical pin breaks stable arches without prescribing releases.
  if(b.y>g.throatY-.1&&b.y<g.throatY+1.4&&rho<1.7){
   const pin=throatSweeper(t,g),dx=b.x-pin.x,dz=b.z-pin.z,dy=b.y-Math.max(pin.y-.45,Math.min(pin.y+.45,b.y)),horizontal=simHypot(dx,dz),side=Math.max(0,horizontal-SWEEPER_RADIUS),distance=simHypot(side,dy);
   if(distance<RADIUS&&horizontal>1e-9){const scale=distance>1e-9?side/distance:1,ny=distance>1e-9?dy/distance:0;this.contact(b,dx/horizontal*scale,ny,dz/horizontal*scale,RADIUS-distance,pin,.012,dt);}
  }
  if(b.z>=STAIR_START&&b.z<g.deckStart&&b.y>g.guardTop-RADIUS)this.contact(b,0,-1,0,b.y-g.guardTop+RADIUS,0,.015,dt);
  // Side rails remain solid during ascent. At the open lower outlet the ball
  // is free to retain its lateral and downstream momentum.
  if(b.z<g.deckStart&&b.y<=g.guardTop+RADIUS){
   const x=center(this.item.o.s+b.z)-g.originX,edge=9.65-RADIUS;
   if(b.x<x-edge)this.contact(b,1,0,0,x-edge-b.x,0,.02,dt);
   if(b.x>x+edge)this.contact(b,-1,0,0,b.x-x-edge,0,.02,dt);
  }
  const road=elevation(this.item.o.s+b.z),slope=-.058+simCos((this.item.o.s+b.z)/45)*.4/45,c=1/simHypot(1,slope);
  if(b.y<road+RADIUS){this.contact(b,0,c,-slope*c,(road+RADIUS-b.y)*c,0,.02,dt);b.grounded=true;}
 }
 pairs(dt){
  const cells=this.cells;cells.clear();
  for(const b of this.item.held){
   const cx=Math.floor(b.x/D),cy=Math.floor(b.y/D),cz=Math.floor(b.z/D);
   for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
    const bucket=cells.get(cx+x+(cy+y)*128+(cz+z)*16384);if(!bucket)continue;
    for(const a of bucket){
     let nx=b.x-a.x,ny=b.y-a.y,nz=b.z-a.z,d2=nx*nx+ny*ny+nz*nz;if(d2>=D*D)continue;
     let d=Math.sqrt(d2);
     if(d<1e-9){nx=1;ny=nz=0;d=0;}else{nx/=d;ny/=d;nz/=d;}
     const correction=(D-d)*.505;b.x+=nx*correction;b.y+=ny*correction;b.z+=nz*correction;a.x-=nx*correction;a.y-=ny*correction;a.z-=nz*correction;
     const v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny+(b.vz-a.vz)*nz;
     if(v<0){const impulse=-v*.68;b.vx+=nx*impulse;b.vy+=ny*impulse;b.vz+=nz*impulse;a.vx-=nx*impulse;a.vy-=ny*impulse;a.vz-=nz*impulse;}
    }
   }
   const key=cx+cy*128+cz*16384;let bucket=cells.get(key);if(!bucket){bucket=[];cells.set(key,bucket);}bucket.push(b);
  }
 }
 update(){
  const r=this.race,item=this.item,g=this.geometry,dt=STEP/SUBSTEPS;
  for(let sub=0;sub<SUBSTEPS;sub++){
   const t=r.t-STEP+(sub+1)*dt;
   for(const b of item.held){
    b.grounded=false;b.vy-=GRAVITY*dt;
    b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;this.surfaces(b,t,dt);
   }
   // Repeat contacts after crowd impulses so stacked balls cannot push each
   // other through steps or the funnel. Neighbours use a 3D spatial hash.
   for(let pass=0;pass<2;pass++){this.pairs(dt);for(const b of item.held)this.surfaces(b,t,dt);}
   // Keep the existing road rolling force at the intake; only supported road
   // balls receive it. Airborne balls and all raised hardware use 3D gravity.
   for(const b of item.held){if(b.enteredBowl&&b.y<g.throatY&&simHypot(b.x-g.bowlX,b.z-g.bowlS)<THROAT_RADIUS-RADIUS+.035){b.passedThroat=true;this.passedThroat.add(b.i);}}
   for(const b of item.held)if(b.grounded&&b.z<g.deckStart)b.vz+=(2.65-.24*b.vz-GRAVITY*.058)*dt;
  }
  const remaining=[];
  for(const b of item.held){
   const i=b.i,s=item.o.s+b.z;r.s[i]=s;r.x[i]=g.originX+b.x-center(s);r.vertical[i]=b.y-elevation(s)-RADIUS;r.vs[i]=b.vz;r.vx[i]=b.vx-centerSlope(s)*b.vz;
   let stage=b.z<g.deckStart?'stairs':b.y>g.throatY&&simHypot(b.x-g.bowlX,b.z-g.bowlS)<item.p.radius?'bowl':b.y>g.throatY?'walk':'drop';
   if(stage==='drop'&&b.stage!=='drop')r.emit({type:'overtime-drop',i,obstacle:item.o.label});b.stage=stage;
   if(b.passedThroat&&b.grounded&&b.y<g.exitY+RADIUS+.15){
    r.status[i]=0;r.vertical[i]=0;r.boundary(i);r.emit({type:'overtime-release',i,obstacle:item.o.label});continue;
   }
   remaining.push(b);
  }
  item.held=remaining;item.phase=remaining.length?'active':'idle';
 }
}
