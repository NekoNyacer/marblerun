import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {simSin,simCos,simAtan2,simHypot} from '../src/deterministic-math.js';

test('physics math exactly matches vectors captured in the actual browser runtime',()=>{
 const browser=JSON.parse(fs.readFileSync(new URL('./fixtures/deterministic-trig.json',import.meta.url),'utf8'));
 let seed=1234567;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const expected of browser){const x=(next()-.5)*1000,y=(next()-.5)*20,z=(next()-.5)*40;assert.deepEqual([simSin(x),simCos(x),simAtan2(y,x),simHypot(x,y,z)],expected);}
});
test('shared physics math preserves angle quadrants and numerical accuracy',()=>{
 for(let x=-1000;x<=1000;x+=.73){assert.ok(Math.abs(simSin(x)-Math.sin(x))<1e-12);assert.ok(Math.abs(simCos(x)-Math.cos(x))<1e-12);assert.ok(Math.abs(simAtan2(x,.37)-Math.atan2(x,.37))<1e-14);}
 for(const [y,x] of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]])assert.ok(Math.abs(simAtan2(y,x)-Math.atan2(y,x))<1e-14);
 assert.equal(simHypot(3,4),5);assert.equal(simHypot(2,3,6),7);assert.ok(Object.is(simAtan2(-0,1),-0));
});
