import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import overtime from '../src/components/obstacles/overtime-stairs.js';
import {BOWL_CENTER,STAIR_START,STAIR_DEPTH,STAIR_GEAR_RATIO,STAIR_SLOPE,THROAT_RADIUS,stairHeight,overtimeGeometry} from '../src/overtime-geometry.js';
import {center,elevation} from '../src/track-geometry.js';

function makeView(s,phase=0,params={}){
 const p={...overtime.defaults,...params},o={s,phase},decor=new T.Group();
 const host={
  graphics:T,materials:Object.fromEntries(['green','amber','metal','light','deep','white'].map(key=>[key,new T.MeshBasicMaterial()])),
  mesh(geometry,material,parent){const mesh=new T.Mesh(geometry,material);parent.add(mesh);return mesh;},
  box(w,h,d,material,x,y,z,parent){const mesh=this.mesh(new T.BoxGeometry(w,h,d),material,parent);mesh.position.set(x,y,z);return mesh;},
  cylinder(r,h,material,x,y,z,parent){const mesh=this.mesh(new T.CylinderGeometry(r,r,h,16),material,parent);mesh.position.set(x,y,z);return mesh;}
 };
 const view={o,host,decor,sign(){const face=new T.Object3D(),backing=new T.Object3D();decor.add(face,backing);return {face,backing};}};
 overtime.decorate(view,p);
 return {view,p,g:overtimeGeometry(o,p)};
}

test('rendered stair contact surfaces rise together with the solver while their solid bases stay on the road',()=>{
 for(const s of [50,316])for(const phase of [0,3]){
  const {view,p,g}=makeView(s,phase),initial=view.stairSlabs.map(stair=>new Float32Array(stair.slab.geometry.attributes.position.array));
  let sawLoweredIntake=false;
  for(const t of [0,.37,1.2,2.3,2.6,2.9,3.2]){
   overtime.update(view,t,[],p);
   sawLoweredIntake ||=stairHeight(0,t,phase,p)<0;
   for(const [n,stair] of view.stairSlabs.entries()){
    const positions=stair.slab.geometry.attributes.position.array,step=g.steps[n];
    // The first two triangles are the full-width, sloped physical top.
    for(let i=0;i<18;i+=3){
     const z=-positions[i+2],expected=step.base+stairHeight(n,t,phase,p)-STAIR_SLOPE*(z-step.z);
     assert.ok(Math.abs(positions[i+1]+g.base-expected)<2e-6,'stair top diverges from its contact surface');
     assert.ok(Math.abs(Math.abs(positions[i]-step.x)-9.65)<2e-6);
     assert.ok(Math.abs(Math.abs(z-step.z)-STAIR_DEPTH/2)<2e-6);
    }
    // The bottom faces are fixed below the road, giving each stair real risers.
    for(let i=18;i<36;i+=3){
     assert.equal(positions[i+1],initial[n][i+1]);
     assert.ok(Math.abs(positions[i+1]+g.base-(elevation(s-positions[i+2])-1))<2e-6);
    }
    const bottomByCorner=new Map();
    for(let i=18;i<36;i+=3)bottomByCorner.set(`${positions[i]},${positions[i+2]}`,positions[i+1]);
    for(let i=0;i<18;i+=3)assert.ok(positions[i+1]>bottomByCorner.get(`${positions[i]},${positions[i+2]}`),'lowered stair top must stay above its solid base');
    assert.ok(stair.slab.geometry.attributes.normal.getY(0)>.9,'the top face must point upward');
   }
  }
  assert.ok(sawLoweredIntake,'check a phase where the first stair lowers below road level');
  for(const [n,post] of view.stairPosts.entries())assert.ok(Math.abs(post.geometry.parameters.height-((Math.floor(n/2)+.5)*p.rise+STAIR_GEAR_RATIO*p.amplitude+.35))<1e-10);
 }
});

test('finite-height glass ascent walls follow both curved rail bounds and join without gaps',()=>{
 for(const s of [50,316]){
  const {view,g}=makeView(s);
  assert.equal(view.stairGuards.length,2);
  assert.equal(view.stairGuardCaps.length,2);
  for(const {side,mesh} of view.stairGuards){
   const vertices=mesh.geometry.attributes.position.array;
   let minZ=Infinity,maxZ=-Infinity;
   for(let i=0;i<vertices.length;i+=3){
    const x=vertices[i],y=vertices[i+1],z=-vertices[i+2],inner=center(s+z)-g.originX+side*9.65;
    minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
    const outward=(x-inner)*side;
    assert.ok(Math.abs(outward)<2e-6||Math.abs(outward-.18)<2e-6,'glass wall must start exactly at the physical rail bound');
    assert.ok(Math.abs(y-(g.high+3))<2e-6||Math.abs(y-(elevation(s+z)-g.base-.2))<2e-6,'glass wall must share the finite physical height');
   }
   assert.ok(Math.abs(minZ-STAIR_START)<2e-6);
   assert.ok(Math.abs(maxZ-g.deckStart)<2e-6);
   // Each segment contributes 36 vertices, with coincident joins on both faces.
   const segments=vertices.length/108;
   for(let n=1;n<segments;n++){
    const previous=vertices.subarray((n-1)*108,n*108),current=vertices.subarray(n*108,(n+1)*108);
    assert.equal(previous[6],current[3]);assert.equal(previous[8],current[5]);
    assert.equal(previous[15],current[0]);assert.equal(previous[17],current[2]);
   }
   assert.equal(mesh.material.transparent,true);
  }
 }
});

test('the tapered deck and guide walls use the physical approach endpoints and slope',()=>{
 const {view,g}=makeView(50),deck=view.deck.geometry.attributes.position.array;
 for(let i=0;i<18;i+=3)assert.ok(Math.abs(deck[i+1]+g.base-g.deckY(-deck[i+2]))<2e-6);
 assert.equal(view.guideRails.length,g.guides.length);
 for(const [n,rail] of view.guideRails.entries()){
  const vertices=rail.geometry.attributes.position.array,[x1,z1,x2,z2]=g.guides[n];
  for(let i=0;i<18;i+=3){
   const x=vertices[i],z=-vertices[i+2],distance=Math.abs((z2-z1)*(x-x1)-(x2-x1)*(z-z1))/Math.hypot(x2-x1,z2-z1);
   assert.ok(Math.abs(distance-.09)<2e-6,'guide mesh must share the contact wall centerline and thickness');
   assert.ok(Math.abs(vertices[i+1]+g.base-g.deckY(z)-1.05)<2e-6);
  }
  assert.ok(rail.geometry.attributes.normal.getY(0)>.9);
 }
});

test('stationary hourglass shells connect at the physical throat and match its lip and exit heights',()=>{
 for(const radius of [3.5,5,5.5])for(const rise of [.6,1.05]){
  const {view,p,g}=makeView(316,7,{radius,rise}),upper=view.upperFunnel,lower=view.lowerFunnel;
  assert.equal(upper.geometry.parameters.radiusTop,p.radius);
  assert.equal(upper.geometry.parameters.radiusBottom,THROAT_RADIUS);
  assert.equal(lower.geometry.parameters.radiusTop,THROAT_RADIUS);
  assert.equal(lower.geometry.parameters.radiusBottom,2.7);
  for(const [mesh,top,bottom] of [[upper,g.lipY,g.throatY],[lower,g.throatY,g.exitY]]){
   assert.equal(mesh.position.x,g.bowlX);
   assert.equal(mesh.position.z,-BOWL_CENTER);
   assert.ok(Math.abs(mesh.position.y+g.base+mesh.geometry.parameters.height/2-top)<1e-10);
   assert.ok(Math.abs(mesh.position.y+g.base-mesh.geometry.parameters.height/2-bottom)<1e-10);
   assert.equal(mesh.material.wireframe,false);
  }
  overtime.update(view,17.3,[],p);
  assert.equal(upper.rotation.y,0);
  assert.equal(lower.rotation.y,0);
 }
});
