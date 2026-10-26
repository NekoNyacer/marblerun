import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {SolidView} from '../src/obstacle-view.js';
import {courseShapes} from '../src/obstacles.js';
import {elevation} from '../src/world.js';
test('the rendered boxes and pegs exactly follow collider footprints and sloping road height',()=>{
 const parent=new T.Group(),material=new T.MeshBasicMaterial();let checked=0;
 for(const group of courseShapes(3.7))for(const shape of group.shapes){
  const view=new SolidView(shape,material,parent),p=view.mesh.geometry.attributes.position.array;
  const c=Math.cos(shape.angle),sn=Math.sin(shape.angle);
  for(let j=0;j<p.length;j+=3){
   const dx=p[j]-shape.wx,ds=-p[j+2]-shape.s,u=dx*c+ds*sn,v=-dx*sn+ds*c;
   if(shape.kind==='box'){assert.ok(Math.abs(u)<=shape.w/2+3e-5);assert.ok(Math.abs(v)<=shape.d/2+3e-5);}
   if(shape.kind==='circle')assert.ok(Math.hypot(dx,ds)<=shape.r+3e-5);
   const base=shape.kind==='sphere'?elevation(shape.s):elevation(-p[j+2]);assert.ok(p[j+1]>=base+shape.y-3e-5,'solid cuts below its shared collider bottom');
  }
  view.mesh.geometry.dispose();checked++;
 }
 assert.ok(checked>100);material.dispose();
});
test('previously exported v1 race seeds still replay with their original engine',async()=>{
 const {RaceSimulation}=await import('../src/legacy/simulation-v1.js');const race=new RaceSimulation(1500,5,20261026);while(!race.done&&race.t<120)race.step();assert.ok(race.done);assert.deepEqual(race.winners.map(w=>w.i),[274,125,554,1033,23]);
});
