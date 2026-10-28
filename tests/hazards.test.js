import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/simulation.js';
import {RaceSimulation as LegacyV3} from '../src/legacy/v3/simulation.js';
import {RaceSimulation as LegacyV4} from '../src/legacy/v4/simulation.js';
import {BALL_STATUS} from '../src/mechanism-runtime.js';
import {obstacleShapes,contactFor} from '../src/obstacles.js';

const track=(type,params={})=>[{id:'hazard',type,s:100,phase:0,params},{id:'finish',type:'finish',s:430,phase:0}];
const place=(race,i,x,s)=>{race.x[i]=x;race.s[i]=s;race.vx[i]=0;race.vs[i]=1;};
function run(race,seconds=160){while(!race.done&&race.t<seconds)race.step();return race;}

test('v4 replay: 404 eliminates side-pocket entrants permanently but leaves the center route open',()=>{
 const side=new LegacyV4(1,1,1,track('not-found'));place(side,0,7.2,102);side.mechanisms.detect(0);side.step();
 assert.equal(side.status[0],BALL_STATUS.ELIMINATED);assert.equal(side.winners.length,0);assert.equal(side.done,true);assert.equal(side.shortfall,true);assert.match(side.snapshot().eliminated[0].reason,/404/);
 const center=new LegacyV4(1,1,1,track('not-found'));place(center,0,0,95);run(center);assert.equal(center.winners.length,1);assert.equal(center.status[0],BALL_STATUS.ACTIVE);
});

test('v4 replay: a Node.js pit traps its first entrant, becomes filled, and lets followers pass',()=>{
 const r=new LegacyV4(3,3,7,track('node-hole'));place(r,0,-5,100);r.mechanisms.detect(0);place(r,1,-5,100);r.mechanisms.detect(1);place(r,2,5,100);r.mechanisms.detect(2);
 assert.deepEqual([...r.status],[2,0,2]);assert.equal(r.snapshot().mechanismStates[0].filled,2);assert.ok(r.snapshot().mechanismStates[0].holes.every(h=>h.filled));assert.equal(r.snapshot().eliminated.length,0);
 place(r,1,0,429.9);r.vs[1]=15;run(r,10);assert.equal(r.winners.length,1);assert.equal(r.shortfall,true);assert.equal(r.done,true);
});

test('v4 replay: Java pit lowers its fill target after losses/finishers, lifts everyone, then stays open',()=>{
 const r=new LegacyV4(4,4,82,track('java-hole'));
 r.finish[0]=1;r.s[0]=430;r.winners.push({i:0,time:1});r.status[1]=1;
 for(const i of [2,3]){place(r,i,i-2.5,100);r.mechanisms.detect(i);}
 assert.deepEqual([...r.status],[0,1,3,3]);
 while(r.t<3)r.step();assert.equal(r.snapshot().mechanismStates[0].capacity,2);assert.equal(r.snapshot().mechanismStates[0].phase,'collecting');
 while(r.t<4.6)r.step();assert.equal(r.snapshot().mechanismStates[0].phase,'lifting');assert.ok(r.vertical[2]>0);
 while(r.t<6)r.step();assert.equal(r.snapshot().mechanismStates[0].phase,'released');assert.equal(r.status[2],0);assert.equal(r.status[3],0);
 place(r,2,0,100);r.mechanisms.detect(2);assert.equal(r.status[2],0,'repaired deck must not capture a second time');
 run(r);assert.equal(r.done,true);assert.equal(r.shortfall,true);assert.equal(r.winners.length,3);
});

test('v4 replay: Java full-width pit is escapable by a single entrant',()=>{
 const r=new LegacyV4(1,1,23,track('java-hole'));place(r,0,0,95);run(r);assert.equal(r.winners.length,1);assert.equal(r.snapshot().mechanismStates[0].phase,'released');
});

test('v4 replay: vortex orbit/release is deterministic, finite, and can reverse entry order',()=>{
 let foundReversal=false;
 for(let seed=1;seed<=10;seed++){
  const a=new LegacyV4(2,2,seed,track('dotnet-hole')),b=new LegacyV4(2,2,seed,track('dotnet-hole'));
  for(const race of [a,b])for(let i=0;i<2;i++){place(race,i,i?2:-2,100);race.mechanisms.detect(i);}
  const held=a.mechanisms.items[0].held;if(held[0].releaseAt>held[1].releaseAt)foundReversal=true;
  for(let n=0;n<1200;n++){a.step();b.step();}
  assert.deepEqual(a.snapshot().data,b.snapshot().data);assert.deepEqual(a.status,b.status);assert.ok(a.status.every(status=>status===0));
  assert.ok(a.s.every(s=>s>106));
 }
 assert.equal(foundReversal,true);
});

test('418 barriers rise from below the road, alternate lanes and physically stop marbles',()=>{
 const entry=track('teapot')[0],bars=t=>obstacleShapes(entry,0,t).filter(s=>s.role==='teapot-obstacle');
 const down=bars(0),first=bars(.9),second=bars(3.25);
 assert.equal(first.length,5);
 for(let i=0;i<5;i++){
  assert.equal(contactFor(down[i],down[i].wx,down[i].s),null,'retracted bar still collides');
  assert.equal(!!contactFor(first[i],first[i].wx,first[i].s),i%2===0);
  assert.equal(!!contactFor(second[i],second[i].wx,second[i].s),i%2===1);
 }
 const shape=first[0],race=new RaceSimulation(1,1,4,track('teapot'));
 const s=shape.s-shape.d/2-.2;race.setWorld(0,shape.wx,s);race.previousX[0]=shape.wx;race.previousS[0]=s-.2;race.vs[0]=7;
 race.resolveObstacles(0,[{o:entry,shapes:[shape],reach:8}]);assert.ok(race.vs[0]<0,'raised bar must reverse a real approaching marble');
});

test('important state transitions displace contact chatter in the bounded event queue',()=>{
 const r=new RaceSimulation(1,1,3,track('teapot'));for(let i=0;i<30;i++)r.emit({type:'hit',i:0});r.emit({type:'java-release',count:12});assert.equal(r.events.length,30);assert.equal(r.events.at(-1).type,'java-release');
});

test('frozen v3 replay preserves the old component geometry and exact winning times',()=>{
 const r=run(new LegacyV3(40,3,20261026),240);
 assert.deepEqual(r.winners,[{i:20,time:84.12003567418165},{i:6,time:86.03408487149294},{i:36,time:90.12003566208443}]);
});
