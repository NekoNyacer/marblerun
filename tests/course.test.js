import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COURSE_CONFIG} from '../src/course-config.js';
import {createCourse} from '../src/course.js';
import {obstacleShapes,courseShapes} from '../src/obstacles.js';
import {RaceSimulation} from '../src/simulation.js';
import {OBSTACLE_COMPONENTS,getObstacleDefinition} from '../src/components/obstacles/index.js';

const clone=()=>structuredClone(COURSE_CONFIG);
test('course supports reordering, disabling and per-instance overrides without mutating defaults',()=>{
 const entries=clone();entries.reverse();entries.find(o=>o.id==='requirements').params.speed=.2;entries.find(o=>o.id==='merge-2').enabled=false;
 const course=createCourse(entries);
 assert.equal(course.length,COURSE_CONFIG.length-1);assert.equal(course.at(-1).type,'finish');
 assert.equal(course.find(o=>o.id==='requirements').params.speed,.2);
 assert.equal(getObstacleDefinition('scope-change').defaults.speed,.5);
 const entry=course.find(o=>o.id==='prompt'),index=course.indexOf(entry);
 assert.deepEqual(obstacleShapes(entry,index,2),obstacleShapes(entry,999,2),'explicit phase and id are independent of array order');
 for(const type of ['code-review','not-found','teapot','node-hole','java-hole','dotnet-hole'])assert.ok(OBSTACLE_COMPONENTS[type]);
});
test('invalid edits fail before a race starts',()=>{
 for(const mutate of [
  e=>e[1].id=e[0].id,e=>e[0].type='missing',e=>e[0].type='toString',
  e=>e[0].s=Infinity,e=>e[0].params={rowSpacing:0},e=>e[0].phase=-1,
  e=>e.find(o=>o.type==='rate').params={laneCount:2.5},
  e=>e.find(o=>o.type==='ux-flow').params={thickness:10},
  e=>e.find(o=>o.type==='sprint').params={typo:2},
  e=>e.find(o=>o.type==='finish').enabled=false
 ]){const entries=clone();mutate(entries);assert.throws(()=>createCourse(entries));}
});
test('custom component extents participate in collisions beyond the old 13m broadphase',()=>{
 const entries=[{id:'long-pegs',type:'pegs',s:50,phase:0,params:{rows:[[0],[0],[0],[0],[0]],rowSpacing:10}},COURSE_CONFIG.at(-1)];
 const course=createCourse(entries),race=new RaceSimulation(1,1,3,course),group=courseShapes(0,course)[0],peg=group.shapes[0];
 assert.ok(group.reach>20);race.setWorld(0,peg.wx+.5,peg.s);race.previousX[0]=peg.wx+1;race.previousS[0]=peg.s;race.vx[0]=-7;
 race.resolveObstacles(0);assert.ok(race.vx[0]>0);
});
test('serialized course snapshot preserves component defaults for replay',()=>{
 const original=new RaceSimulation(8,2,27),snapshot=JSON.parse(JSON.stringify(original.course));
 const restored=new RaceSimulation(8,2,27,snapshot);
 for(let i=0;i<180;i++){original.step();restored.step();}
 assert.deepEqual(original.x,restored.x);assert.deepEqual(original.s,restored.s);
});

test('stairway imports reject parameters that prevent alternating steps from passing',()=>{
 const finish=COURSE_CONFIG.at(-1),make=params=>[{id:'stairs',type:'overtime-stairs',s:100,params},finish];
 assert.doesNotThrow(()=>createCourse(make({})));
 assert.throws(()=>createCourse(make({amplitude:.1})),/可通行/);
 assert.throws(()=>createCourse(make({radius:20})),/可通行/);
 assert.throws(()=>createCourse([{id:'stairs',type:'overtime-stairs',s:100,x:2},finish]),/置中/);
});
test('retired hazards are retained in saved documents but skipped by new races',()=>{
 const types=['not-found','node-hole','java-hole','dotnet-hole'];
 const entries=[...types.map((type,i)=>({id:'retired-'+i,type,s:40+i*33,phase:i})),COURSE_CONFIG.at(-1)];
 assert.deepEqual(createCourse(entries).map(o=>o.type),['finish']);
 assert.deepEqual(entries.slice(0,4).map(o=>o.type),types);
});
