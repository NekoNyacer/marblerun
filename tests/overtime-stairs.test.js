import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/simulation.js';
import {stairHeight,stairCenter,STAIR_COUNT} from '../src/overtime-motion.js';
import {center,elevation} from '../src/track-geometry.js';
const course=[{id:'stairs',type:'overtime-stairs',s:50,phase:0},{id:'finish',type:'finish',s:430,phase:0}];

test('alternate rising steps carry a contender to the upper walkway, through a spiral, then down to the road',()=>{
 const r=new RaceSimulation(1,1,99,course),item=r.mechanisms.items[0],seenStages=new Set();let previous='',lastS=-Infinity,maxY=0,drops=[],transfers=0;
 while(r.t<50){r.step();const h=item.held[0];if(!h){if(item.seen.has(0))break;continue;}seenStages.add(h.stage);maxY=Math.max(maxY,r.vertical[0]);assert.equal(r.status[0],5);assert.equal(r.mechanisms.potential(),1);
  if(['entry','stairs','transfer','queue','walk'].includes(h.stage)){assert.ok(r.s[0]>=lastS-1e-7,'approach and ascent must move forward');lastS=r.s[0];}
  if(h.stage==='transfer'&&previous!=='transfer'){
   transfers++;const n=h.step,p=item.p,o=item.o,current=elevation(stairCenter(o,n))+stairHeight(n,r.t,o.phase??0,p),next=n+1<STAIR_COUNT?elevation(stairCenter(o,n+1))+stairHeight(n+1,r.t,o.phase??0,p):elevation(o.s-1)+p.rise*STAIR_COUNT;assert.ok(current>next,'the current step must be higher before the ball advances');
  }
  if(h.stage==='drop')drops.push(r.vertical[0]);previous=h.stage;
 }
 assert.equal(transfers,STAIR_COUNT);for(const stage of ['entry','stairs','transfer','queue','walk','orbit','drop'])assert.ok(seenStages.has(stage),stage);assert.ok(maxY>5.9);assert.ok(drops.length>30);assert.ok(drops.every((v,i)=>i===0||v<=drops[i-1]+1e-6),'the fall must descend');assert.equal(r.status[0],0);assert.equal(r.vertical[0],0);
 for(let n=0;n<90*2;n++)r.step();assert.equal(r.status[0],0,'a released marble must not be recaptured');
});

test('lane queues let a full field pass and the simulation is reproducible',()=>{
 const a=new RaceSimulation(100,100,103,course),b=new RaceSimulation(100,100,103,course);while(!a.done&&a.t<180){a.step();b.step();}assert.ok(a.done);assert.equal(a.winners.length,100);assert.deepEqual(a.winners,b.winners);assert.deepEqual(a.status,b.status);assert.deepEqual(a.s,b.s);assert.equal(a.mechanisms.items[0].held.length,0);
});


test('the walkway meters funnel entry and seed controls varied orbital speeds',()=>{
 const r=new RaceSimulation(24,24,220,course),events=[],recorded=new Set();
 for(let i=0;i<24;i++){r.x[i]=-9.2+i*.8;r.s[i]=35.7;r.vs[i]=8;}
 while(r.t<40){r.step();const item=r.mechanisms.items[0],orbit=item.held.filter(h=>h.stage==='orbit');for(const h of orbit)if(!recorded.has(h.i)){recorded.add(h.i);events.push({t:r.t,spin:h.spin});}if(r.steps%9===0){const h=item.held;for(let a=0;a<h.length;a++)for(let b=0;b<a;b++){if(!(h[a].stage==='orbit'&&h[b].stage==='orbit'||h[a].stage==='walk'||h[b].stage==='walk'))continue;const i=h[a].i,j=h[b].i,d=Math.hypot(r.s[i]-r.s[j],r.x[i]+center(r.s[i])-r.x[j]-center(r.s[j]),r.vertical[i]+elevation(r.s[i])-r.vertical[j]-elevation(r.s[j]));assert.ok(d>=.75,`upper course balls overlap: ${d}`);}}}
 assert.equal(events.length,24);for(let i=1;i<events.length;i++)assert.ok(events[i].t-events[i-1].t>=.44,'marbles must be released separately into the funnel');
 assert.ok(new Set(events.map(e=>e.spin.toFixed(3))).size>5,'orbit speeds should differ between marbles');
});
