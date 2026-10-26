import {WIDTH,RADIUS,FINISH,STEP,OBSTACLES,rng,shuffled,gateState,rotorAngle,center} from './world.js';
const D=RADIUS*2, CELL=D*1.2;
export class RaceSimulation{
 constructor(count,quota,seed){
  this.count=count;this.quota=Math.min(count,quota);this.seed=seed>>>0;this.t=0;this.steps=0;this.done=false;this.winners=[];this.events=[];
  this.x=new Float64Array(count);this.s=new Float64Array(count);this.vx=new Float64Array(count);this.vs=new Float64Array(count);this.finish=new Float64Array(count).fill(-1);this.lastHit=new Float64Array(count).fill(-100);
  const order=shuffled(count,seed),random=rng(seed^0x82ae);
  const cols=Math.min(24,count);for(let slot=0;slot<count;slot++){const i=order[slot];this.x[i]=(slot%cols-(cols-1)/2)*.79;this.s[i]=-Math.floor(slot/cols)*.86;this.vs[i]=0;this.vx[i]=(random()-.5)*.06;}
  this.order=order;this.cells=new Map();this.hits=new Map();
 }
 emit(event){if(this.events.length<15)this.events.push(event);}
 collideSegment(i,ax,as,bx,bs,ux=0,us=0){
  const dx=bx-ax,ds=bs-as,den=dx*dx+ds*ds;let q=den?((this.x[i]-ax)*dx+(this.s[i]-as)*ds)/den:0;q=Math.max(0,Math.min(1,q));
  let nx=this.x[i]-(ax+q*dx),ns=this.s[i]-(as+q*ds),dist=Math.hypot(nx,ns),limit=RADIUS+.23;
  if(dist>=limit)return false;
  if(dist<1e-6){nx=0;ns=-1;dist=1;}else{nx/=dist;ns/=dist;}
  const penetration=limit-(dist===1&&nx===0&&ns===-1?0:dist);this.x[i]+=nx*penetration;this.s[i]+=ns*penetration;
  const vel=(this.vx[i]-ux)*nx+(this.vs[i]-us)*ns;if(vel<0){this.vx[i]-=1.65*vel*nx;this.vs[i]-=1.65*vel*ns;}
  return true;
 }
 step(){
  if(this.done)return;const dt=STEP;this.t=++this.steps*dt;const crosses=[];
  for(let i=0;i<this.count;i++){
   if(this.finish[i]>=0)continue;
   this.vs[i]+=(2.65-this.vs[i]*.24)*dt;
   // Curved, banked trough: lateral drift comes from track curvature, not racer-specific power.
   this.vx[i]+=(-Math.sin(this.s[i]/52)*this.vs[i]*this.vs[i]*.0026-this.vx[i]*.48)*dt;
   this.x[i]+=this.vx[i]*dt;this.s[i]+=this.vs[i]*dt;
   const edge=WIDTH/2-RADIUS;if(this.x[i]<-edge){this.x[i]=-edge;this.vx[i]=Math.abs(this.vx[i])*.7;}if(this.x[i]>edge){this.x[i]=edge;this.vx[i]=-Math.abs(this.vx[i])*.7;}
   for(let k=0;k<OBSTACLES.length;k++){
    const o=OBSTACLES[k];if(Math.abs(this.s[i]-o.s)>7)continue;let hit=false;
    if(o.type==='rotor'){
     const a=rotorAngle(this.t,k),dx=Math.cos(a)*7.5,ds=Math.sin(a)*7.5;
     const projection=((this.x[i])*Math.cos(a)+(this.s[i]-o.s)*Math.sin(a));
     const curveOffset=center(o.s)-center(this.s[i]);
     hit=this.collideSegment(i,-dx+curveOffset,o.s-ds,dx+curveOffset,o.s+ds,-Math.sin(a)*projection*.8,Math.cos(a)*projection*.8);
    }else if(o.type==='gate'){
     const state=gateState(this.t,k);hit=this.collideSegment(i,state.leftClosed?-10:.35,o.s,state.leftClosed?-.35:10,o.s);
     // Funnel curvature helps a stopped marble roll toward the open route.
     if(this.s[i]>o.s-4&&this.s[i]<o.s+.6)this.vx[i]+=(state.leftClosed?1:-1)*3*dt;
    }else if(o.type==='error'){
     for(let j=0;j<3;j++){const cx=(j-1)*6,raised=Math.sin(this.t*1.25+j*2+k)>.05;if(raised)hit=this.collideSegment(i,cx-1.65,o.s,cx+1.65,o.s)||hit;}
    }else if(o.type==='rate'){
     for(let j=0;j<4;j++){if((this.t+j*.65+k)%3.8<2.2)hit=this.collideSegment(i,-10+j*5,o.s,-6+j*5,o.s)||hit;}
    }else if(o.type==='pendulum'){
     const cx=Math.sin(this.t*1.3+k)*7;hit=this.collideSegment(i,cx-.9,o.s,cx+.9,o.s,Math.cos(this.t*1.3+k)*9.1,0);
    }
    if(hit&&this.t-this.lastHit[i]>2.5){this.lastHit[i]=this.t;this.emit({type:'hit',i,obstacle:o.label});}
   }
  }
  // Spatial hash: collide local neighbours, not every possible pair.
  const cells=this.cells;cells.clear();
  for(let i=0;i<this.count;i++){
   if(this.finish[i]>=0)continue;const cx=Math.floor(this.x[i]/CELL),cs=Math.floor(this.s[i]/CELL);
   for(let dx=-1;dx<=1;dx++)for(let ds=-1;ds<=1;ds++){
    const bucket=cells.get((cx+dx)+','+(cs+ds));if(!bucket)continue;
    for(const j of bucket){let nx=this.x[i]-this.x[j],ns=this.s[i]-this.s[j],d2=nx*nx+ns*ns;if(d2>=D*D)continue;
     let d=Math.sqrt(d2);if(d<1e-8){nx=1;ns=0;d=1e-4;}else{nx/=d;ns/=d;}
     const correction=(D-d)*.51;this.x[i]+=nx*correction;this.s[i]+=ns*correction;this.x[j]-=nx*correction;this.s[j]-=ns*correction;
     const relative=(this.vx[i]-this.vx[j])*nx+(this.vs[i]-this.vs[j])*ns;
     if(relative<0){const impulse=-relative*.82;this.vx[i]+=impulse*nx;this.vs[i]+=impulse*ns;this.vx[j]-=impulse*nx;this.vs[j]-=impulse*ns;}
    }
   }
   const key=cx+','+cs;let bucket=cells.get(key);if(!bucket){bucket=[];cells.set(key,bucket);}bucket.push(i);
  }
  for(let i=0;i<this.count;i++){
   if(this.finish[i]>=0)continue;
   this.x[i]=Math.max(-WIDTH/2+RADIUS,Math.min(WIDTH/2-RADIUS,this.x[i]));
   this.vx[i]=Math.max(-16,Math.min(16,this.vx[i]));this.vs[i]=Math.max(-12,Math.min(18,this.vs[i]));
   if(this.s[i]>=FINISH){const fraction=this.vs[i]>0?Math.max(0,Math.min(dt,(this.s[i]-FINISH)/this.vs[i])):0;crosses.push({i,time:this.t-fraction});}
  }
  crosses.sort((a,b)=>a.time-b.time||a.i-b.i);for(const c of crosses){this.finish[c.i]=c.time;this.s[c.i]=FINISH;this.vs[c.i]=0;this.vx[c.i]=0;this.winners.push(c);this.emit({type:'finish',i:c.i,rank:this.winners.length,time:c.time});}
  if(this.winners.length>=this.quota){this.winners=this.winners.slice(0,this.quota);this.done=true;}
 }
 ranking(){return Array.from({length:this.count},(_,i)=>i).sort((a,b)=>{const af=this.finish[a],bf=this.finish[b];return af>=0&&bf>=0?af-bf:af>=0?-1:bf>=0?1:this.s[b]-this.s[a]||a-b;});}
 snapshot(){const data=new Float32Array(this.count*4);for(let i=0;i<this.count;i++){data[i*4]=this.x[i];data[i*4+1]=this.s[i];data[i*4+2]=this.vx[i];data[i*4+3]=this.vs[i];}const events=this.events.splice(0);return {data,t:this.t,done:this.done,winners:this.winners.slice(),events};}
}
