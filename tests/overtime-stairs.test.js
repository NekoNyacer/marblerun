import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/simulation.js';
import {RADIUS,STEP,center,centerSlope,elevation} from '../src/track-geometry.js';
import {STAIR_START,STAIR_SLOPE,BOWL_CENTER,BOWL_DEPTH,THROAT_RADIUS,overtimeGeometry,stairHeight,stairVelocity} from '../src/overtime-geometry.js';

const course=[{id:'stairs',type:'overtime-stairs',s:50,phase:0},{id:'finish',type:'finish',s:430,phase:0}];
const createRace=(count=1,seed=99)=>new RaceSimulation(count,count,seed,course);
const geometry=r=>{const item=r.mechanisms.items[0];return overtimeGeometry(item.o,item.p);};

// Put a physical sphere in the mechanism so gravity and contact behavior can be
// tested independently of the time it takes to reach the station in a race.
function addBall(r,i,state){
 const item=r.mechanisms.items[0],g=geometry(r);
 const h={i,x:g.bowlX,z:BOWL_CENTER,y:elevation(item.o.s+BOWL_CENTER)+RADIUS+.5,vx:0,vz:0,vy:0,stage:'drop',...state};
 item.held.push(h);item.seen.add(i);item.filled++;r.status[i]=5;
 r.s[i]=item.o.s+h.z;r.x[i]=g.originX+h.x-center(r.s[i]);r.vertical[i]=h.y-elevation(r.s[i])-RADIUS;
 return h;
}
function advance(r,steps=1){
 for(let n=0;n<steps;n++){r.t+=STEP;r.mechanisms.items[0].motion.update();}
}
function bowlBall(r,i,velocity={}){
 const item=r.mechanisms.items[0],g=geometry(r),radius=item.p.radius*.65;
 const slope=BOWL_DEPTH/(item.p.radius-THROAT_RADIUS);
 return addBall(r,i,{x:g.bowlX+radius,z:BOWL_CENTER,y:g.throatY+slope*(radius-THROAT_RADIUS)+RADIUS*Math.hypot(1,slope),stage:'bowl',...velocity});
}

test('step surface velocity matches the derivative of the rendered height, including governed fast cycles',()=>{
 const presets=[{period:2.4,rise:1.05,amplitude:.65},{period:1,rise:.6,amplitude:.36},{period:8,rise:1.5,amplitude:1.5*1.2}];
 const epsilon=1e-5;
 for(const p of presets)for(const phase of [0,1.37,8.22])for(let n=0;n<6;n++)for(const t of [.123,.47,1.03,2.8,6.91]){
  const derivative=(stairHeight(n,t+epsilon,phase,p)-stairHeight(n,t-epsilon,phase,p))/(2*epsilon);
  assert.ok(Math.abs(stairVelocity(n,t,phase,p)-derivative)<1e-5,`moving contact velocity must match step ${n} at ${t}s`);
 }
});

test('entering the mechanism preserves the incoming world-space momentum',()=>{
 const r=createRace(),item=r.mechanisms.items[0];
 r.s[0]=item.o.s+STAIR_START;r.x[0]=2.1;r.vx[0]=1.25;r.vs[0]=6.5;
 const before={x:r.x[0]+center(r.s[0]),s:r.s[0],vx:r.vx[0]+centerSlope(r.s[0])*r.vs[0],vz:r.vs[0]};
 assert.equal(item.motion.tryEnter(0),true);assert.equal(r.status[0],5);assert.equal(item.held.length,1);
 const h=item.held[0],g=geometry(r);
 assert.ok(Math.abs(h.x+g.originX-before.x)<1e-9,'entry must not teleport the ball sideways');
 assert.ok(Math.abs(h.z+item.o.s-before.s)<1e-9,'entry must not teleport the ball forwards');
 assert.ok(Math.abs(h.vx-before.vx)<1e-9,'lateral momentum must survive entry');
 assert.ok(Math.abs(h.vz-before.vz)<1e-9,'forward momentum must survive entry');
});

test('an unsupported sphere accelerates under gravity instead of following a timed fall',()=>{
 const r=createRace(),h=addBall(r,0,{vx:1.2,vz:.8,vy:.3}),before={...h};
 advance(r,3);const elapsed=3*STEP;
 assert.equal(r.status[0],5,'the sphere should still be airborne');
 assert.ok(Math.abs(h.vy-(before.vy-9.81*elapsed))<.003,`vertical acceleration must be gravity: ${h.vy}`);
 assert.ok(h.x>before.x&&h.z>before.z,'free flight must retain horizontal motion');
 assert.ok(h.y<before.y+before.vy*elapsed,'gravity must bend the flight downwards');
});

test('a rising step transfers momentum through contact while a detached sphere keeps falling',()=>{
 const r=createRace(2),item=r.mechanisms.items[0],g=geometry(r),step=g.steps[2];
 const top=step.base+stairHeight(step.n,0,item.o.phase,item.p);
 const supported=addBall(r,0,{x:step.x,z:step.z,y:top+RADIUS*Math.hypot(1,STAIR_SLOPE),stage:'stairs'});
 const detached=addBall(r,1,{x:step.x+2,z:step.z,y:top+RADIUS+1.2,stage:'stairs'});
 const supportedY=supported.y,detachedY=detached.y;
 advance(r);
 assert.ok(supported.vy>.5&&supported.y>supportedY,'a touching sphere must be lifted by the moving solid');
 assert.ok(detached.vy<0&&detached.y<detachedY,'a sphere above the step must not be carried without contact');
});

test('a sphere outside the visible deck footprint falls instead of landing on an invisible platform',()=>{
 const r=createRace(),g=geometry(r),z=g.deckStart+1.5;
 const h=addBall(r,0,{x:14,z,y:g.deckY(z)+RADIUS*Math.hypot(1,.18),stage:'walk'}),before=h.y;
 advance(r,3);
 assert.ok(h.vy<-.3&&h.y<before-.002,'there must be no support outside the finite deck and guide rails');
});

test('airborne spheres exchange momentum through three-dimensional contact',()=>{
 const r=createRace(2),g=geometry(r);
 const left=addBall(r,0,{x:g.bowlX-.35,vx:1}),right=addBall(r,1,{x:g.bowlX+.35,vx:-1});
 advance(r);
 const distance=Math.hypot(left.x-right.x,left.z-right.z,left.y-right.y);
 assert.ok(distance>=2*RADIUS-.012,`contact must separate overlapping spheres: ${distance}`);
 assert.ok(left.vx<0&&right.vx>0,'collision must change velocities, not merely separate displayed positions');
 assert.ok(Math.abs(left.vx+right.vx)<.02,'equal-mass contact must preserve total lateral momentum');
});

test('gravity makes a stationary sphere roll down the actual funnel surface',()=>{
 const r=createRace(),g=geometry(r),h=bowlBall(r,0),before=Math.hypot(h.x-g.bowlX,h.z-BOWL_CENTER);
 advance(r,45);
 const after=Math.hypot(h.x-g.bowlX,h.z-BOWL_CENTER);
 assert.ok(after<before-.05,`a stationary sphere must move downhill: ${before} -> ${after}`);
 assert.ok(h.vx<-.1,'the funnel normal must turn gravity into inward motion');
 assert.ok(h.y<g.lipY+RADIUS,'the sphere must descend into the funnel');
});

test('different incoming tangential velocities produce different funnel trajectories',()=>{
 const slow=createRace(),fast=createRace(),a=bowlBall(slow,0,{vz:0}),b=bowlBall(fast,0,{vz:3});
 advance(slow,30);advance(fast,30);
 assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.3,'the route must respond to momentum rather than a prescribed spiral');
 assert.ok(Math.abs(a.vz-b.vz)>.2,'different initial velocities must remain physically observable');
});

test('landing returns the sphere to the road with its horizontal momentum',()=>{
 const r=createRace(),h=addBall(r,0,{vx:1.1,vz:2.3});
 for(let n=0;n<180&&r.status[0]===5;n++)advance(r);
 assert.equal(r.status[0],0,'a sphere must be released on contact with the road');
 assert.equal(r.vertical[0],0);
 assert.ok(r.vs[0]>1&&r.vs[0]<4,`landing must preserve forward motion rather than reset to a fixed release speed: ${r.vs[0]}`);
 assert.ok(r.vx[0]+centerSlope(r.s[0])*r.vs[0]>.3,'landing must retain lateral momentum');
 assert.equal(r.mechanisms.items[0].held.includes(h),false);
 assert.equal(r.mechanisms.items[0].motion.tryEnter(0),false,'a released contender must not be recaptured');
});

test('a full field passes the physical stairs and funnel reproducibly',()=>{
 const a=createRace(100,103),b=createRace(100,103);let elevated=false,insideBowl=false;
 while(!a.done&&a.t<240){
  a.step();b.step();
  const item=a.mechanisms.items[0];
  for(const h of item.held){
   assert.ok([h.x,h.z,h.y,h.vx,h.vz,h.vy].every(Number.isFinite),'physical state must remain finite');
   elevated ||= a.vertical[h.i]>4;
   insideBowl ||= h.stage==='bowl';
  }
 }
 assert.ok(a.done,`${a.winners.length}/100 finished at ${a.t.toFixed(1)}s`);
 assert.equal(a.winners.length,100);assert.equal(a.mechanisms.items[0].held.length,0);
 assert.ok(elevated,'the stairs must physically lift contenders');assert.ok(insideBowl,'contenders must pass through the funnel');
 assert.deepEqual(a.winners,b.winners);assert.deepEqual(a.status,b.status);assert.deepEqual(a.s,b.s);assert.deepEqual(a.x,b.x);
});
