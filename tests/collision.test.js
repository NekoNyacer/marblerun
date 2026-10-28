import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/simulation.js';
import {OBSTACLES,RADIUS,center,rotorAngle} from '../src/world.js';
import {obstacleShapes,contactFor,courseShapes} from '../src/obstacles.js';
function fixture(type,t=0){const k=OBSTACLES.findIndex(o=>o.type===type);return {o:OBSTACLES[k],k,shapes:obstacleShapes(OBSTACLES[k],k,t)};}
function resolveAt(shape,wx,s,vx=0,vs=0){
 const race=new RaceSimulation(1,1,7);race.setWorld(0,wx,s);race.vx[0]=vx;race.vs[0]=vs;race.previousX[0]=wx-vx/90;race.previousS[0]=s-vs/90;
 const groups=[{o:{s:shape.s,label:'TEST'},shapes:[shape]}];race.resolveObstacles(0,groups);return race;
}
test('rate and Timeout pillars have physical contacts matching their full visible footprint',()=>{
 for(const type of ['rate','pendulum','gate']){const f=fixture(type),post=f.shapes.find(s=>s.role==='post');const s=post.s-post.d/2-RADIUS+.12,race=resolveAt(post,post.wx,s,0,10);assert.ok(race.s[0]<=post.s-post.d/2-RADIUS+1e-4);assert.ok(race.vs[0]<0);}
});
test('gate divider blocks from the side along its entire five-metre length',()=>{
 const divider=fixture('gate').shapes.find(s=>s.role==='divider');for(const ds of [-2,0,2]){const race=resolveAt(divider,divider.wx-.4,divider.s+ds,8,0);assert.ok(race.worldX(0)<divider.wx-divider.w/2-RADIUS+1e-4);assert.ok(race.vx[0]<0);}
});
test('rotor tip beyond the old seven-metre cutoff collides on a curved track',()=>{
 const f=fixture('rotor'),t=(Math.PI/2-f.o.phase*.9+Math.PI*4)/.8,blade=obstacleShapes(f.o,f.k,t).find(s=>s.role==='rotor');assert.ok(Math.abs(Math.cos(blade.angle))<1e-10);
 const race=resolveAt(blade,blade.wx+.4,blade.s+7.2,-9,0);assert.ok(race.worldX(0)>=blade.wx+blade.d/2+RADIUS-1e-4);assert.equal(contactFor(blade,race.worldX(0),race.s[0]),null);
});
test('raised barriers allow passage; low barriers block; alternating gates always offer a route',()=>{
 const f=fixture('gate');for(let t=0;t<10;t+=.05){const bars=obstacleShapes(f.o,f.k,t).filter(s=>s.role==='gate');assert.ok(bars.some(s=>!contactFor(s,s.wx,s.s)));}
 const bar=f.shapes.find(s=>s.role==='gate');assert.ok(contactFor({...bar,y:.1},bar.wx,bar.s));assert.equal(contactFor({...bar,y:2},bar.wx,bar.s),null);
});
test('pegs actually redirect a marble, and all five peg fields have collision definitions',()=>{
 const fields=OBSTACLES.filter(o=>o.type==='pegs');assert.equal(fields.length,5);assert.equal(courseShapes(0).flatMap(g=>g.shapes).filter(s=>s.role==='peg').length,100);
 const peg=fixture('pegs').shapes[0],race=resolveAt(peg,peg.wx+.65,peg.s,-7,0);assert.ok(race.vx[0]>0);assert.equal(contactFor(peg,race.worldX(0),race.s[0]),null);
});
test('fast marbles cannot cross the in-lane gate post during actual integration steps',()=>{
 const f=fixture('gate'),post=f.shapes.find(s=>s.role==='post'&&Math.abs(s.wx-center(s.s))<.1),race=new RaceSimulation(1,1,8);race.setWorld(0,post.wx,post.s-4);race.vs[0]=18;let max=-Infinity;
 for(let n=0;n<25;n++){race.step();max=Math.max(max,race.s[0]);}assert.ok(max<post.s-post.d/2-RADIUS+.01);
});
test('edge pegs leave enough rail clearance for a marble instead of forming a dead-end wedge',()=>{
 for(const group of courseShapes(0))for(const shape of group.shapes.filter(s=>s.role==='peg')){const x=Math.abs(shape.wx-center(shape.s));assert.ok(10-x-shape.r>=2*RADIUS+.1);}
});
test('crowd resolution does not leave bodies inside a gate divider or support',()=>{
 const f=fixture('gate'),race=new RaceSimulation(24,24,81);for(let i=0;i<24;i++){race.x[i]=(i%4-1.5)*.75;race.s[i]=f.o.s-4-Math.floor(i/4)*.77;race.vs[i]=15;}
 for(let n=0;n<100;n++)race.step();const solids=obstacleShapes(f.o,f.k,race.t).filter(s=>s.role==='divider'||s.role==='post');let max=0;for(let i=0;i<24;i++)for(const solid of solids)max=Math.max(max,contactFor(solid,race.worldX(i),race.s[i])?.depth||0);assert.ok(max<.005,`deepest residual overlap ${max}`);
});
