import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/simulation.js';
import {BUILTIN_COURSES} from '../src/course-library.js';
import {DEFAULT_TEAM_SETUP,createTeams,teamParticipants,rankTeams} from '../src/teams.js';

const course=params=>[{id:'stairs',type:'overtime-stairs',s:50,phase:0,params},{id:'finish',type:'finish',s:430,phase:0}];

function finishField(count,seed,params,limit,quota=count){
 const race=new RaceSimulation(count,quota,seed,course(params)),item=race.mechanisms.items[0];
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
 assert.equal(race.winners.length,quota,'the requested winner quota must be awarded');
 assert.equal(new Set(race.winners.map(w=>w.i)).size,quota,'each entrant must finish exactly once');
 assert.ok(item.seen.size>=quota,'every winning entrant must enter the mechanism');
 assert.ok(race.winners.every(w=>item.motion.passedThroat.has(w.i)),'all winning marbles must physically cross the central outlet');
 if(quota===count)assert.equal(item.held.length,0,'no sphere may remain trapped after the field finishes');
 for(const data of [race.x,race.s,race.vx,race.vs,race.vertical,race.finish])assert.ok(data.every(Number.isFinite),'the final state must remain finite');
 return {entrants:count,simulatedSeconds:+race.t.toFixed(2),computeSeconds:+computeSeconds.toFixed(2)};
}

test('1500 contenders keep finite state and award five places through the small physical outlet',()=>{
 console.log(JSON.stringify({mechanism:'overtime-stairs',...finishField(1500,82,{},600,5)}));
});

for(const {name,params} of [
 {name:'minimum rise with a requested fast cycle',params:{rise:.6,amplitude:.36,period:1}},
 {name:'minimum rise with maximum travel and a slow cycle',params:{rise:.6,amplitude:.6*1.2,period:8}},
 {name:'maximum rise and travel with a requested fast cycle',params:{rise:1.5,amplitude:1.5*1.2,period:1}},
 {name:'minimum funnel radius and shortest orbit setting',params:{radius:3.5,orbit:1}}
])test(`ten contenders clear ${name}`,()=>{
 finishField(10,103,params,480);
});

test('the five-team, 500-marble demonstration awards exactly twenty places on the default course',()=>{
 const entrants=teamParticipants(DEFAULT_TEAM_SETUP),r=new RaceSimulation(entrants.length,20,20261029,BUILTIN_COURSES[0].obstacles),start=performance.now();
 while(!r.done&&r.t<600)r.step();
 assert.ok(r.done,`only ${r.winners.length}/20 finished at ${r.t}`);assert.equal(r.winners.length,20);
 const standings=rankTeams(createTeams(DEFAULT_TEAM_SETUP),r.winners.map((w,n)=>({...entrants[w.i],rank:n+1})));
 assert.equal(standings.reduce((sum,t)=>sum+t.count,0),20);
 for(const station of r.mechanisms.items.filter(item=>item.o.type==='overtime-stairs'))assert.ok(r.winners.every(w=>station.motion.passedThroat.has(w.i)),'all scoring balls must exit through every hourglass throat');
 console.log(JSON.stringify({mode:'team',entrants:500,scored:20,simulatedSeconds:r.t,computeSeconds:(performance.now()-start)/1000,standings:standings.map(t=>({name:t.name,count:t.count,bestRank:t.bestRank}))}));
});
