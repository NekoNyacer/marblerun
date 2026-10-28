import {createCourse} from './course.js';
import {WIDTH,RADIUS,FINISH,STEP,rng,shuffled,center,centerSlope,OBSTACLES} from './world.js';
import {courseShapes,contactFor,surfaceVelocity} from './obstacles.js';
import {MechanismRuntime,isContender} from './mechanism-runtime.js';
const D=RADIUS*2,CELL=D*1.2;
export class RaceSimulation{
 constructor(count,quota,seed,course=OBSTACLES){
  this.course=createCourse(course);
  this.count=count;this.quota=Math.min(count,quota);this.seed=seed>>>0;this.t=0;this.steps=0;this.done=false;this.winners=[];this.events=[];
  this.x=new Float64Array(count);this.s=new Float64Array(count);this.vx=new Float64Array(count);this.vs=new Float64Array(count);this.finish=new Float64Array(count).fill(-1);this.lastHit=new Float64Array(count).fill(-100);this.previousX=new Float64Array(count);this.previousS=new Float64Array(count);
  const order=shuffled(count,seed),random=rng(seed^0x82ae),cols=Math.min(24,count);
  for(let slot=0;slot<count;slot++){const i=order[slot];this.x[i]=(slot%cols-(cols-1)/2)*.79;this.s[i]=-Math.floor(slot/cols)*.86;this.vx[i]=(random()-.5)*.06;}
  this.status=new Uint8Array(count);this.vertical=new Float32Array(count);this.mechanisms=new MechanismRuntime(this);this.shortfall=false;
  this.order=order;this.cells=new Map();this.groups=courseShapes(0,this.course);
 }
 emit(event){
  if(this.events.length<30){this.events.push(event);return;}
  // Dense packs may generate hundreds of contacts; a lift/release/result must
  // remain observable even when contact chatter has filled the bounded queue.
  const priority=type=>type==='finish'||type==='java-lift'||type==='java-release'?4:type==='eliminate'||type==='node-trap'?3:type==='steam'?2:type==='hit'?0:1;
  const at=this.events.findIndex(old=>priority(old.type)<priority(event.type));
  if(at>=0){this.events.splice(at,1);this.events.push(event);}
 }
 worldX(i){return this.x[i]+center(this.s[i]);}
 setWorld(i,wx,s){this.s[i]=s;this.x[i]=wx-center(s);}
 boundary(i){const edge=WIDTH/2-RADIUS;if(this.x[i]<-edge){this.x[i]=-edge;this.vx[i]=Math.abs(this.vx[i])*.7;}if(this.x[i]>edge){this.x[i]=edge;this.vx[i]=-Math.abs(this.vx[i])*.7;}}
 resolveObstacles(i,groups=this.groups){
  let wx=this.worldX(i),s=this.s[i];const previous={wx:this.previousX[i],s:this.previousS[i]};
  for(const group of groups){if(Math.abs(s-group.o.s)>(group.reach??13))continue;
   for(const shape of group.shapes){
    const hit=contactFor(shape,wx,s,RADIUS,previous);if(!hit)continue;
    let worldVX=this.vx[i]+centerSlope(s)*this.vs[i];const velocity=surfaceVelocity(shape,wx,s),relative=(worldVX-velocity.vx)*hit.nx+(this.vs[i]-velocity.vs)*hit.ns;
    wx+=hit.nx*(hit.depth+1e-6);s+=hit.ns*(hit.depth+1e-6);
    if(relative<0){const impulse=-relative*1.5;worldVX+=impulse*hit.nx;this.vs[i]+=impulse*hit.ns;}
    this.vx[i]=worldVX-centerSlope(s)*this.vs[i];
    if(this.t-this.lastHit[i]>2.5){this.lastHit[i]=this.t;this.emit({type:'hit',i,obstacle:group.o.label});}
   }
  }
  this.setWorld(i,wx,s);this.boundary(i);
 }
 step(){
  if(this.done)return;const dt=STEP;this.t=++this.steps*dt;this.groups=courseShapes(this.t,this.course);this.mechanisms.beforeStep();const crosses=[];
  for(let i=0;i<this.count;i++){
   if(this.finish[i]>=0||this.status[i]!==0)continue;this.previousX[i]=this.worldX(i);this.previousS[i]=this.s[i];
   this.vs[i]+=(2.65-this.vs[i]*.24)*dt;
   this.vx[i]+=(-Math.sin(this.s[i]/52)*this.vs[i]*this.vs[i]*.0026-this.vx[i]*.48)*dt;
   this.x[i]+=this.vx[i]*dt;this.s[i]+=this.vs[i]*dt;this.boundary(i);this.resolveObstacles(i);this.mechanisms.detect(i);
  }
  // Local-neighbour collisions in the SAME world plane used by obstacle geometry.
  const cells=this.cells;cells.clear();
  for(let i=0;i<this.count;i++){
   if(this.finish[i]>=0||this.status[i]!==0)continue;const cx=Math.floor(this.worldX(i)/CELL),cs=Math.floor(this.s[i]/CELL);
   for(let dx=-1;dx<=1;dx++)for(let ds=-1;ds<=1;ds++){
    const bucket=cells.get((cx+dx)+','+(cs+ds));if(!bucket)continue;
    for(const j of bucket){let wxi=this.worldX(i),wxj=this.worldX(j),si=this.s[i],sj=this.s[j],nx=wxi-wxj,ns=si-sj,d2=nx*nx+ns*ns;if(d2>=D*D)continue;
     let d=Math.sqrt(d2);if(d<1e-8){nx=1;ns=0;d=1e-4;}else{nx/=d;ns/=d;}
     let vi=this.vx[i]+centerSlope(si)*this.vs[i],vj=this.vx[j]+centerSlope(sj)*this.vs[j];const relative=(vi-vj)*nx+(this.vs[i]-this.vs[j])*ns;
     if(relative<0){const impulse=-relative*.82;vi+=impulse*nx;this.vs[i]+=impulse*ns;vj-=impulse*nx;this.vs[j]-=impulse*ns;}
     const correction=(D-d)*.51;si+=ns*correction;sj-=ns*correction;this.setWorld(i,wxi+nx*correction,si);this.setWorld(j,wxj-nx*correction,sj);
     this.vx[i]=vi-centerSlope(si)*this.vs[i];this.vx[j]=vj-centerSlope(sj)*this.vs[j];
    }
   }
   const key=cx+','+cs;let bucket=cells.get(key);if(!bucket){bucket=[];cells.set(key,bucket);}bucket.push(i);
  }
  // Contacts are solved again AFTER the crowd solver; other balls cannot push a marble through a pillar.
  for(let i=0;i<this.count;i++){
   if(this.finish[i]>=0||this.status[i]!==0)continue;this.resolveObstacles(i);this.resolveObstacles(i);this.mechanisms.detect(i);if(this.status[i]!==0)continue;
   this.vx[i]=Math.max(-16,Math.min(16,this.vx[i]));this.vs[i]=Math.max(-12,Math.min(18,this.vs[i]));
   if(this.s[i]>=FINISH){const fraction=this.vs[i]>0?Math.max(0,Math.min(dt,(this.s[i]-FINISH)/this.vs[i])):0;crosses.push({i,time:this.t-fraction});}
  }
  crosses.sort((a,b)=>a.time-b.time||a.i-b.i);for(const c of crosses){this.finish[c.i]=c.time;this.s[c.i]=FINISH;this.vs[c.i]=0;this.vx[c.i]=0;this.winners.push(c);this.emit({type:'finish',i:c.i,rank:this.winners.length,time:c.time});}
  this.mechanisms.afterStep();
  if(this.winners.length>=this.quota){this.winners=this.winners.slice(0,this.quota);this.done=true;}
  else if(!this.mechanisms.potential()){this.shortfall=true;this.done=true;}
 }
 ranking(){return Array.from({length:this.count},(_,i)=>i).sort((a,b)=>{const af=this.finish[a],bf=this.finish[b];return af>=0&&bf>=0?af-bf:af>=0?-1:bf>=0?1:Number(!isContender(this.status[a]))-Number(!isContender(this.status[b]))||this.s[b]-this.s[a]||a-b;});}
 snapshot(){const data=new Float32Array(this.count*4);for(let i=0;i<this.count;i++){data[i*4]=this.x[i];data[i*4+1]=this.s[i];data[i*4+2]=this.vx[i];data[i*4+3]=this.vs[i];}return {data,t:this.t,done:this.done,winners:this.winners.slice(),events:this.events.splice(0),status:this.status.slice(),vertical:this.vertical.slice(),mechanismStates:this.mechanisms.snapshot(),eliminated:this.mechanisms.eliminated.slice(),shortfall:this.shortfall,remainingPotential:this.mechanisms.potential()};}
}
