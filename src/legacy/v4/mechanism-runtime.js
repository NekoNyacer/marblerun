import {WIDTH,RADIUS,rng} from './world.js';

// Status is transmitted separately from the four-float position/velocity stream.
// Temporary captures remain contenders; permanent losses can never win.
export const BALL_STATUS=Object.freeze({ACTIVE:0,ELIMINATED:1,NODE_FILL:2,JAVA_HELD:3,VORTEX:4});
export const isContender=status=>status===0||status===3||status===4;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mod=(value,period)=>((value%period)+period)%period;
const hazardTypes=new Set(['not-found','node-hole','java-hole','dotnet-hole','teapot']);

export class MechanismRuntime {
 constructor(race){
  this.race=race;this.random=rng(race.seed^0x418404);this.eliminated=[];
  this.hopStart=new Float64Array(race.count).fill(-100);
  this.items=race.course.filter(o=>hazardTypes.has(o.type)).map(o=>{
   const state={o,p:o.params,phase:'idle',filled:0,held:[],seen:new Set(),nextRelease:0,fullAt:null,liftAt:null};
   if(o.type==='node-hole')state.holes=[-1,1].map(side=>({x:(o.x??0)+side*o.params.spacing,s:o.s,owners:[]}));
   if(o.type==='java-hole')state.phase='collecting';
   if(o.type==='teapot')state.lastSteam=new Int32Array(race.count).fill(-2147483648);
   return state;
  });
 }
 potential(){const r=this.race;let count=0;for(let i=0;i<r.count;i++)if(r.finish[i]<0&&isContender(r.status[i]))count++;return count;}
 capture(item,i,status,reason){
  const r=this.race;r.status[i]=status;r.vx[i]=r.vs[i]=0;
  if(status===BALL_STATUS.ELIMINATED){this.eliminated.push({i,reason,time:r.t});r.emit({type:'eliminate',i,obstacle:item.o.label,reason});}
  else if(status===BALL_STATUS.NODE_FILL)r.emit({type:'node-trap',i,obstacle:item.o.label,reason});
 }
 beforeStep(){
  const r=this.race;
  for(let i=0;i<r.count;i++){
   if(r.status[i]===0){const age=r.t-this.hopStart[i];r.vertical[i]=age>=0&&age<.7?Math.sin(age/.7*Math.PI)*.85:0;}
  }
  for(const item of this.items){
   const {o,p}=item;
   if(o.type==='node-hole'){
    for(const hole of item.holes)for(let n=0;n<hole.owners.length;n++){const i=hole.owners[n];r.x[i]=hole.x;r.s[i]=hole.s;r.vertical[i]=-.25;}
   }else if(o.type==='java-hole')this.updateJava(item);
   else if(o.type==='dotnet-hole')this.updateVortex(item);
   else if(o.type==='teapot')item.phase=mod(r.t+(o.phase??0)*.23,p.period)<p.pulse?'steaming':'idle';
  }
 }
 updateJava(item){
  const r=this.race,{o,p}=item;
  if(item.phase==='released')return;
  const capacity=Math.max(1,Math.min(Math.ceil(p.capacity),this.potential()));
  item.capacity=capacity;
  if(item.held.length>=capacity&&item.fullAt===null)item.fullAt=r.t;
  if(item.fullAt!==null&&r.t>=item.fullAt+p.hold&&item.liftAt===null){item.liftAt=r.t;item.phase='lifting';r.emit({type:'java-lift',obstacle:o.label,count:item.held.length});}
  const lift=item.liftAt===null?0:clamp((r.t-item.liftAt)/p.liftTime,0,1);item.lift=lift;
  for(let n=0;n<item.held.length;n++){
    const i=item.held[n],cols=Math.min(20,Math.max(1,capacity)),rows=Math.max(1,Math.floor((p.depth-1)/.8));
   r.x[i]=(n%cols-(cols-1)/2)*.83+(o.x??0);r.s[i]=o.s+((Math.floor(n/cols)%rows)-(rows-1)/2)*.8;
   r.vertical[i]=-.25+Math.sin(lift*Math.PI/2)*1.65;
  }
  if(lift>=1){
   const released=item.held.length;
   for(let n=0;n<item.held.length;n++){
    const i=item.held[n];r.status[i]=0;r.s[i]=o.s+p.depth/2+RADIUS+1+(Math.floor(n/20)%3)*.86;r.vertical[i]=0;r.vs[i]=8;r.vx[i]=Math.sign(r.x[i]-(o.x??0))*.6;r.boundary(i);
   }
   item.held=[];item.phase='released';r.emit({type:'java-release',obstacle:o.label,count:released});
  }
 }
 updateVortex(item){
  const r=this.race,{o,p}=item;
  for(const h of item.held){
   const age=r.t-h.at,progress=clamp(age/(h.releaseAt-h.at),0,1),radius=p.radius*(.85-.42*progress),angle=h.angle+age*(2.1+h.spin*.7);
   r.x[h.i]=(o.x??0)+Math.cos(angle)*radius;r.s[h.i]=o.s+Math.sin(angle)*radius*.52;r.vertical[h.i]=-.22-.12*progress;
  }
  if(r.t>=item.nextRelease){
   let ready=null;for(const h of item.held)if(h.releaseAt<=r.t&&(!ready||h.releaseAt<ready.releaseAt))ready=h;
   if(ready){
    const i=ready.i;r.status[i]=0;r.x[i]=(o.x??0)+Math.sin(ready.angle)*2.1;r.s[i]=o.s+p.radius+RADIUS+1;r.vs[i]=7;r.vx[i]=Math.sin(ready.angle)*1.4;r.vertical[i]=0;
    item.held.splice(item.held.indexOf(ready),1);item.nextRelease=r.t+p.releaseInterval;r.emit({type:'vortex-release',i,obstacle:o.label});
   }
  }
  item.phase=item.held.length?'swirling':'idle';
 }
 detect(i){
  const r=this.race;if(r.status[i]!==0||r.finish[i]>=0)return;
  for(const item of this.items){
   const {o,p}=item,dx=r.x[i]-(o.x??0),ds=r.s[i]-o.s;
   if(o.type==='not-found'){
    if(ds>=p.depth*.15&&ds<=p.depth/2+RADIUS&&Math.abs(dx)>=p.pocketX-p.pocketWidth/2){this.capture(item,i,1,'404 Not Found：走入死路');r.vertical[i]=-.3;return;}
   }else if(o.type==='node-hole'){
    for(const hole of item.holes){
     const capacity=Math.max(1,Math.ceil(p.capacity));
     if(hole.owners.length<capacity&&Math.hypot(r.x[i]-hole.x,ds)<p.radius*.82){this.capture(item,i,2,'Node.js 漏洞：填補小坑');hole.owners.push(i);item.filled++;r.x[i]=hole.x;r.s[i]=hole.s;r.vertical[i]=-.25;return;}
    }
   }else if(o.type==='java-hole'){
    if(item.phase!=='released'&&item.fullAt===null&&Math.abs(ds)<p.depth/2&&Math.abs(dx)<WIDTH/2){
     this.capture(item,i,3);item.held.push(i);item.filled++;item.capacity=Math.max(1,Math.min(Math.ceil(p.capacity),this.potential()));
     if(item.held.length>=item.capacity)item.fullAt=r.t;
     r.emit({type:'java-fill',i,obstacle:o.label,count:item.held.length,capacity:item.capacity});return;
    }
   }else if(o.type==='dotnet-hole'){
    if(!item.seen.has(i)&&dx*dx+ds*ds<p.radius*p.radius){
     this.capture(item,i,4);item.seen.add(i);const spin=this.random(),duration=p.hold*(.75+this.random());item.held.push({i,at:r.t,releaseAt:r.t+duration,angle:Math.atan2(ds/.65,dx),spin});item.filled++;item.phase='swirling';r.emit({type:'vortex-enter',i,obstacle:o.label});return;
    }
   }else if(o.type==='teapot'){
    const clock=r.t+(o.phase??0)*.23,cycle=Math.floor(clock/p.period);
    if(item.phase==='steaming'&&Math.abs(dx)<p.width/2&&Math.abs(ds)<p.depth/2&&item.lastSteam[i]!==cycle){
     item.lastSteam[i]=cycle;r.vs[i]=-p.strength*.8;r.vx[i]+=Math.sign(dx||Math.sin(i+cycle))*p.strength*.28;this.hopStart[i]=r.t;r.emit({type:'steam',i,obstacle:o.label});
    }
   }
  }
 }
 afterStep(){for(const item of this.items)if(item.o.type==='java-hole')this.updateJava(item);}
 snapshot(){return this.items.map(item=>{
  const state={id:item.o.id,type:item.o.type,phase:item.phase,filled:item.filled,capacity:item.capacity??(item.o.type==='node-hole'?Math.ceil(item.p.capacity)*2:item.p.capacity??0),count:item.held.length,lift:item.lift??0};
  if(item.holes)state.holes=item.holes.map(h=>({x:h.x,s:h.s,filled:h.owners.length>=Math.ceil(item.p.capacity),owner:h.owners[0]??null}));
  return state;
 });}
}
