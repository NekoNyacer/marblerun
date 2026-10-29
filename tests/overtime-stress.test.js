import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/simulation.js';

const course=params=>[{id:'stairs',type:'overtime-stairs',s:50,phase:0,params},{id:'finish',type:'finish',s:430,phase:0}];

function finishField(count,seed,params,limit){
 const race=new RaceSimulation(count,count,seed,course(params)),item=race.mechanisms.items[0];
 const start=performance.now();
 while(!race.done&&race.t<limit){
  race.step();
  if(race.steps%90===0){
   for(const data of [race.x,race.s,race.vx,race.vs,race.vertical])assert.ok(data.every(Number.isFinite),'all contenders must retain finite physical state');
   for(const h of item.held)assert.ok([h.x,h.z,h.y,h.vx,h.vz,h.vy].every(Number.isFinite),'held spheres must retain finite 3D state');
  }
 }
 const computeSeconds=(performance.now()-start)/1000;
 assert.ok(race.done,`${race.winners.length}/${count} finished at ${race.t.toFixed(2)}s`);
 assert.equal(race.winners.length,count,'the full winner quota must be awarded');
 assert.equal(new Set(race.winners.map(w=>w.i)).size,count,'each entrant must finish exactly once');
 assert.equal(item.seen.size,count,'all entrants must enter the mechanism');
 assert.equal(item.held.length,0,'no sphere may remain trapped after the field finishes');
 for(const data of [race.x,race.s,race.vx,race.vs,race.vertical,race.finish])assert.ok(data.every(Number.isFinite),'the final state must remain finite');
 return {entrants:count,simulatedSeconds:+race.t.toFixed(2),computeSeconds:+computeSeconds.toFixed(2)};
}

test('1500 contenders all pass the physical stairs and funnel without trapped or duplicate finishers',()=>{
 console.log(JSON.stringify({mechanism:'overtime-stairs',...finishField(1500,82,{},420)}));
});

for(const {name,params} of [
 {name:'minimum rise with a requested fast cycle',params:{rise:.6,amplitude:.36,period:1}},
 {name:'minimum rise with maximum travel and a slow cycle',params:{rise:.6,amplitude:.6*1.2,period:8}},
 {name:'maximum rise and travel with a requested fast cycle',params:{rise:1.5,amplitude:1.5*1.2,period:1}},
 {name:'minimum funnel radius and shortest orbit setting',params:{radius:3.5,orbit:1}}
])test(`ten contenders clear ${name}`,()=>{
 finishField(10,103,params,180);
});
