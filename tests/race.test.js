import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/simulation.js';
import {parseRows} from '../src/participants.js';
import {gateState,shuffled,STEP} from '../src/world.js';
test('Excel headers, identical names, and unique employee IDs',()=>{
 const r=parseRows([['員工編號','姓名','部門'],['001','王小明','IT'],['002','王小明','維運']]);assert.equal(r.entries.length,2);assert.equal(r.duplicateNames,1);assert.equal(r.entries[0].id,'001');
 assert.throws(()=>parseRows([['員編','姓名'],['001','甲'],['001','乙']]),/重複/);assert.throws(()=>parseRows([]),/空的/);
 assert.equal(parseRows([['林柏宇'],['陳怡君']]).entries.length,2);
});
test('shuffle is reproducible, complete and seed dependent',()=>{assert.deepEqual(shuffled(1500,1234),shuffled(1500,1234));assert.equal(new Set(shuffled(1500,1234)).size,1500);assert.notDeepEqual(shuffled(50,1),shuffled(50,2));});
test('gate always has an alternate open route',()=>{for(let t=0;t<30;t+=.2){const a=gateState(t);assert.equal(typeof a.leftClosed,'boolean');assert.ok(a.remaining>=1&&a.remaining<=5);}assert.notEqual(gateState(0).leftClosed,gateState(5).leftClosed);});
test('simulation is reproducible and continues every off-camera entrant',()=>{
 const a=new RaceSimulation(1500,5,713),b=new RaceSimulation(1500,5,713);const before=a.s.slice();
 for(let n=0;n<90;n++){a.step();b.step();}assert.deepEqual(a.s,b.s);assert.deepEqual(a.x,b.x);
 assert.ok(a.s.every((s,i)=>Number.isFinite(s)&&s>before[i]));assert.ok(a.x.every(x=>Math.abs(x)<=10));assert.equal(a.snapshot().data.length,6000);
});
test('1500 entrants complete a five-winner race with unique chronological results',()=>{
 const race=new RaceSimulation(1500,5,20261026),start=performance.now();let n=0;
 while(!race.done&&n<90*240){race.step();n++;}
 assert.ok(race.done,`race stalled at ${race.t.toFixed(1)}s, leader ${Math.max(...race.s).toFixed(1)}m`);assert.equal(race.winners.length,5);assert.equal(new Set(race.winners.map(w=>w.i)).size,5);
 for(let i=1;i<5;i++)assert.ok(race.winners[i].time>=race.winners[i-1].time);
 assert.ok(race.s.every(Number.isFinite));assert.ok(race.x.every(Number.isFinite));
 console.log(JSON.stringify({entrants:1500,simulatedSeconds:+race.t.toFixed(2),computeSeconds:+((performance.now()-start)/1000).toFixed(2),winners:race.winners.map(w=>w.i)}));
});
test('one-person round starts at course center and reaches finish',()=>{
 const race=new RaceSimulation(1,1,99);assert.equal(race.x[0],0);while(!race.done&&race.t<240)race.step();assert.ok(race.done);assert.equal(race.winners[0].i,0);
});
test('full 1500-person winner quota does not leave anyone trapped behind gates',()=>{
 const race=new RaceSimulation(1500,1500,82);while(!race.done&&race.t<240)race.step();assert.ok(race.done);assert.equal(race.winners.length,1500);assert.equal(new Set(race.winners.map(w=>w.i)).size,1500);
});
