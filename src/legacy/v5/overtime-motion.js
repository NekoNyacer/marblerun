import {center,elevation,WIDTH} from './track-geometry.js';

// A 28 m long assembly fits between the editor's 33 m stations.
// The stepped part advances only during a stroke where the current slab is
// higher than the next one. Ball tracks are constrained to these 3D surfaces.
export const STAIR_COUNT=6, STAIR_START=-14, STAIR_DEPTH=1.8, BOWL_CENTER=6.2, LANES=24;
export const stairCenter=(o,n)=>o.s+STAIR_START+(n+.5)*STAIR_DEPTH;
export const stairWave=(t,phase,p)=>Math.sin((t+phase*.23)*Math.PI*2/p.period);
export const stairHeight=(n,t,phase,p)=>Math.max(.04,(n+.5)*p.rise+(n%2?-1:1)*p.amplitude*stairWave(t,phase,p));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export class OvertimeMotion {
 constructor(race,item){this.race=race;this.item=item;this.steps=Array.from({length:STAIR_COUNT},()=>new Int32Array(LANES).fill(-1));this.walk=new Int32Array(LANES).fill(-1);this.nextWalkAt=0;}
 lane(x){return clamp(Math.floor((x+WIDTH/2)/WIDTH*LANES),0,LANES-1);}
 tryEnter(i){
  const r=this.race,item=this.item,{o}=item;if(r.status[i]!==0||r.finish[i]>=0||item.seen.has(i))return false;
  const entry=o.s+STAIR_START;if(r.s[i]<entry)return false;
  // A lane on the first step takes one ball at a time; the others wait at
  // the foot instead of overlapping or passing underneath the mechanism.
  const lane=this.lane(r.x[i]);if(this.steps[0][lane]!==-1){r.s[i]=entry-.03;r.vs[i]=Math.min(0,r.vs[i]);return true;}
  this.steps[0][lane]=i;item.seen.add(i);const x=r.x[i],s=r.s[i];r.status[i]=5;r.vx[i]=r.vs[i]=0;r.vertical[i]=0;
  item.held.push({i,lane,x,s,stage:'entry',at:r.t,step:0,lastAdvance:-100});item.filled++;return true;
 }
 height(n,s){const {o,p}=this.item;return stairHeight(n,this.race.t,o.phase??0,p)+elevation(stairCenter(o,n))-elevation(s);}
 update(){
  const r=this.race,item=this.item,{o,p}=item,phase=o.phase??0,remaining=[];
  for(const h of item.held){const i=h.i;let age=r.t-h.at;
   if(h.stage==='entry'){
    const u=smooth(age/.4),target=stairCenter(o,0);r.s[i]=h.s+(target-h.s)*u;r.x[i]=h.x;r.vertical[i]=this.height(0,r.s[i])*u;
    if(age>=.4){h.stage='stairs';h.at=r.t;}
   }else if(h.stage==='stairs'){
    const n=h.step,center=stairCenter(o,n);r.s[i]=center;r.x[i]=h.x;r.vertical[i]=this.height(n,center);
    const currentTop=elevation(center)+stairHeight(n,r.t,phase,p);
    const nextTop=n+1<STAIR_COUNT?elevation(stairCenter(o,n+1))+stairHeight(n+1,r.t,phase,p):elevation(o.s-1)+p.rise*STAIR_COUNT;
    const raised=currentTop>nextTop+.02;
    const free=n+1<STAIR_COUNT?this.steps[n+1][h.lane]===-1:this.walk[h.lane]===-1;
    if(raised&&free&&r.t-h.lastAdvance>p.period*.4){if(n+1<STAIR_COUNT)this.steps[n+1][h.lane]=i;else this.walk[h.lane]=i;h.stage='transfer';h.at=r.t;h.lastAdvance=r.t;}
   }else if(h.stage==='transfer'){
    const n=h.step,u=smooth(age/.32),from=stairCenter(o,n),to=n+1<STAIR_COUNT?stairCenter(o,n+1):o.s+STAIR_START+STAIR_COUNT*STAIR_DEPTH+.5;
    r.s[i]=from+(to-from)*u;r.x[i]=h.x;
    const high=p.rise*STAIR_COUNT+elevation(o.s-1)-elevation(r.s[i]);r.vertical[i]=this.height(n,r.s[i])*(1-u)+(n+1<STAIR_COUNT?this.height(n+1,r.s[i]):high)*u;
    if(age>=.32){this.steps[n][h.lane]=-1;if(n+1<STAIR_COUNT){h.step++;h.stage='stairs';}else{h.stage='queue';h.startS=to;h.endX=clamp(h.x*.22,-2,2);h.endS=o.s+BOWL_CENTER-Math.sqrt(Math.max(0,p.radius*p.radius-h.endX*h.endX));h.endTrackX=h.endX+center(o.s+BOWL_CENTER)-center(h.endS);}h.at=r.t;}
   }else if(h.stage==='queue'){
    r.s[i]=h.startS;r.x[i]=h.x;r.vertical[i]=p.rise*STAIR_COUNT+elevation(o.s-1)-elevation(r.s[i]);
    // Funnel admission is metered, so the separate lanes converge one by one.
    if(r.t>=this.nextWalkAt){this.nextWalkAt=r.t+.45;h.stage='walk';h.at=r.t;}
   }else if(h.stage==='walk'){
    const u=smooth(age/1.6);r.s[i]=h.startS+(h.endS-h.startS)*u;r.x[i]=h.x+(h.endTrackX-h.x)*smooth((u-.45)/.55);r.vertical[i]=p.rise*STAIR_COUNT+elevation(o.s-1)-elevation(r.s[i]);
    if(age>=1.6){this.walk[h.lane]=-1;h.stage='orbit';h.at=r.t;h.angle=Math.atan2(h.endS-(o.s+BOWL_CENTER),h.endX);h.duration=p.orbit*(.75+item.random()*.5);h.spin=1.3+item.random()*.9;}
   }else if(h.stage==='orbit'){
    const u=clamp(age/h.duration,0,1),radius=p.radius*(1-u)+.65*u,angle=h.angle+age*h.spin;r.s[i]=o.s+BOWL_CENTER+radius*Math.sin(angle);r.x[i]=center(o.s+BOWL_CENTER)-center(r.s[i])+radius*Math.cos(angle);
    const worldHeight=p.rise*STAIR_COUNT-2.3*u;r.vertical[i]=worldHeight+elevation(o.s+BOWL_CENTER)-elevation(r.s[i]);
    if(u>=1){h.stage='drop';h.at=r.t;h.dropX=r.x[i];h.dropS=r.s[i];h.dropHeight=r.vertical[i];r.emit({type:'overtime-drop',i,obstacle:o.label});}
   }else if(h.stage==='drop'){
    const u=clamp(age/1.1,0,1);r.x[i]=h.dropX*(1-u);r.s[i]=h.dropS+u*2;r.vertical[i]=Math.max(0,h.dropHeight*(1-u*u));
    if(u>=1){r.status[i]=0;r.vertical[i]=0;r.vs[i]=7;r.vx[i]=h.x*.08;r.boundary(i);r.emit({type:'overtime-release',i,obstacle:o.label});continue;}
   }
   remaining.push(h);
  }
  this.separateOrbit(remaining);item.held=remaining;item.phase=item.held.length?'active':'idle';
 }
 // Small deterministic contact projection keeps orbiting marbles from occupying
 // the same 3D space as they converge. Heights remain on their guided paths;
 // horizontal correction is converted back to the curved road coordinate.
 separateOrbit(held){
  const r=this.race,orbit=held.filter(h=>h.stage==='orbit'),diameter=.76;
  for(let pass=0;pass<6;pass++)for(let a=0;a<orbit.length;a++)for(let b=0;b<a;b++){
   const i=orbit[a].i,j=orbit[b].i,si=r.s[i],sj=r.s[j],wi=r.x[i]+center(si),wj=r.x[j]+center(sj);
   let dx=wi-wj,ds=si-sj;const yi=elevation(si)+r.vertical[i],yj=elevation(sj)+r.vertical[j],dy=yi-yj;
   if(Math.abs(dy)>=diameter)continue;
   const target=Math.sqrt(diameter*diameter-dy*dy),d=Math.hypot(dx,ds);if(d>=target)continue;
   if(d<1e-7){const angle=(i*19+j*7)*.71;dx=Math.cos(angle);ds=Math.sin(angle);}else{dx/=d;ds/=d;}
   const shift=(target-d)*.505,ni=si+ds*shift,nj=sj-ds*shift;
   r.s[i]=ni;r.s[j]=nj;r.x[i]=wi+dx*shift-center(ni);r.x[j]=wj-dx*shift-center(nj);r.vertical[i]=yi-elevation(ni);r.vertical[j]=yj-elevation(nj);
  }
 }
}
