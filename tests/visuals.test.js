import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {FutureCity} from '../src/visuals/future-city.js';
import {createCircuitTrack} from '../src/visuals/circuit-track.js';

test('future city remains within its static batch and triangle budgets without extra lights',()=>{
 const scene=new T.Scene(),city=new FutureCity(scene);let lights=0;
 city.group.traverse(object=>{if(object.isLight)lights++;});
 assert.ok(city.stats.drawCalls<=12);assert.ok(city.stats.triangles<=40000);assert.equal(lights,0);
 const versions=city.batches.map(mesh=>mesh.instanceMatrix.version);
 for(let t=0;t<100;t++)city.update(t,t*4);
 assert.deepEqual(city.batches.map(mesh=>mesh.instanceMatrix.version),versions,'static city must not upload instance data every frame');
 city.setQuality('low');assert.equal(city.clouds.visible,false);assert.equal(city.accents.visible,false);
 city.setQuality('auto');assert.equal(city.clouds.visible,true);city.dispose();assert.equal(scene.children.length,0);
});
test('the whole circuit uses at most nine draws and frees its own geometry on teardown',()=>{
 const scene=new T.Scene(),shared=new T.MeshBasicMaterial(),host={scene,materials:{metal:shared,light:shared,glass:shared,deep:shared}};
 const circuit=createCircuitTrack(host);assert.ok(circuit.group.children.length<=9);
 const geos=circuit.group.children.map(mesh=>mesh.geometry),disposed=new Set();geos.forEach(g=>g.addEventListener('dispose',()=>disposed.add(g)));
 let sharedDisposed=false;shared.addEventListener('dispose',()=>sharedDisposed=true);
 circuit.update(12);circuit.dispose();assert.equal(disposed.size,new Set(geos).size);assert.equal(sharedDisposed,false);assert.equal(scene.children.length,0);shared.dispose();
});
