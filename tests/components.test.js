import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/simulation.js';
import {OBSTACLE_COMPONENTS} from '../src/components/obstacles/index.js';
import {obstacleShapes,contactFor,surfaceVelocity} from '../src/obstacles.js';
import {WIDTH,RADIUS,FINISH,center} from '../src/track-geometry.js';

const newTypes=['scope-change','sprint','ux-flow','handoff','code-review'];
const entry=(type,s=100,phase=0)=>({id:`test-${type}`,type,s,phase});
const finish={id:'finish',type:'finish',s:FINISH,phase:0};

test('every component keeps stable solid identities and dimensions through its animation',()=>{
 for(const type of Object.keys(OBSTACLE_COMPONENTS)){
  const o=entry(type),first=obstacleShapes(o,0,0);
  assert.equal(new Set(first.map(shape=>shape.id)).size,first.length,`${type}: duplicate solid id`);
  assert.ok(first.length,`${type}: no physical solids`);
  for(const t of [.13,1.9,3.7,8.99,13.1]){
   const shapes=obstacleShapes(o,0,t);
   assert.deepEqual(shapes.map(shape=>shape.id),first.map(shape=>shape.id),`${type}: unstable animation IDs`);
   for(let n=0;n<shapes.length;n++)for(const key of ['kind','w','d','h','r'])assert.equal(shapes[n][key],first[n][key],`${type}: dimensions change without rebuilding geometry`);
   for(const shape of shapes)for(const key of ['wx','s','y','h','angle','reach'])assert.ok(Number.isFinite(shape[key]),`${type}: nonfinite ${key}`);
  }
 }
});

test('new moving arms apply the velocity of their actual animated contact surface',()=>{
 const t=3.17,dt=1e-5;
 for(const type of ['scope-change','handoff','code-review']){
  const o=entry(type,164,2),before=obstacleShapes(o,0,t-dt),after=obstacleShapes(o,0,t+dt);
  const current=obstacleShapes(o,0,t).filter(shape=>shape.omega);
  assert.ok(current.length);
  for(const shape of current){
   const a=before.find(s=>s.id===shape.id),b=after.find(s=>s.id===shape.id),u=shape.w*.37,v=shape.d*.2;
   const point=s=>({wx:s.wx+u*Math.cos(s.angle)-v*Math.sin(s.angle),s:s.s+u*Math.sin(s.angle)+v*Math.cos(s.angle)});
   const pa=point(a),pb=point(b),p=point(shape),velocity=surfaceVelocity(shape,p.wx,p.s);
   assert.ok(Math.abs(velocity.vx-(pb.wx-pa.wx)/(2*dt))<1e-6,`${shape.id}: incorrect lateral velocity`);
   assert.ok(Math.abs(velocity.vs-(pb.s-pa.s)/(2*dt))<1e-6,`${shape.id}: incorrect forward velocity`);
  }
 }
});

test('Sprint offers an actually passable lane throughout every gate transition',()=>{
 for(const phase of [0,3,7])for(let t=0;t<18;t+=.035){
  const bars=obstacleShapes(entry('sprint',393,phase),0,t).filter(shape=>shape.role==='sprint');
  assert.equal(bars.length,3);
  assert.ok(bars.some(shape=>!contactFor(shape,shape.wx,shape.s)),`all Sprint lanes blocked at ${t}, phase ${phase}`);
 }
});

test('both rail-hugging straight paths intersect guide solids on straight and curved sections',()=>{
 const edge=WIDTH/2-RADIUS;
 for(const type of ['scope-change','ux-flow'])for(const s of [52,100,316,393])for(const side of [-1,1])for(const t of [0,3,9]){
  const shapes=obstacleShapes(entry(type,s),0,t).filter(shape=>shape.role==='guide'||shape.role==='ux-card');
  let blocked=false;
  for(let ds=-11;ds<=11&&!blocked;ds+=.04)blocked=shapes.some(shape=>contactFor(shape,center(s+ds)+side*edge,s+ds));
  assert.ok(blocked,`${type}: ${side<0?'left':'right'} rail route bypasses the guides at ${s}`);
 }
});

test('edge-launched marbles collide, move inward, and clear both guide mechanisms',()=>{
 const edge=WIDTH/2-RADIUS;
 for(const [type,s] of [['scope-change',52],['ux-flow',316]])for(const side of [-1,1])for(const phase of [0,3,7]){
  const race=new RaceSimulation(1,1,19,[entry(type,s,phase),finish]);
  race.x[0]=side*edge;race.s[0]=s-14;race.vs[0]=11;
  let hit=false,inward=false;
  while(race.s[0]<s+12&&race.t<70){
   race.step();
   hit ||=race.events.some(event=>event.type==='hit');
   if(hit&&side*race.x[0]<edge-1.5)inward=true;
  }
  assert.ok(hit,`${type}: edge launch avoided every solid`);
  assert.ok(inward,`${type}: edge launch did not merge inward`);
  assert.ok(race.s[0]>=s+12,`${type}: edge launch trapped at ${race.s[0]}`);
 }
});

test('each new mechanism allows isolated entrants across lanes and animation phases to finish',()=>{
 for(const type of newTypes)for(const phase of [0,3,7])for(const x of [-9.62,-4,0,4,9.62]){
  const race=new RaceSimulation(1,1,7,[entry(type,100,phase),finish]);
  race.x[0]=x;race.s[0]=86;race.vs[0]=11;
  while(!race.done&&race.t<120)race.step();
  assert.ok(race.done,`${type}: x=${x}, phase=${phase} trapped at ${race.s[0]}, ${race.x[0]}`);
  assert.ok(race.x.every(Number.isFinite));
 }
});
