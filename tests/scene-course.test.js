import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RaceScene} from '../src/scene.js';
import {createCourse} from '../src/course.js';
const finish={id:'finish',type:'finish',s:430,phase:0};

test('course switching disposes old geometry and private sign materials, retaining shared materials',()=>{
 const shared=new T.MeshBasicMaterial(),sign=new T.MeshBasicMaterial({map:new T.Texture()}),geometry=new T.BoxGeometry(1,1,1),group=new T.Group(),scene=new T.Scene();
 group.add(new T.Mesh(geometry,sign),new T.Mesh(new T.BoxGeometry(1,1,1),shared));scene.add(group);
 let geometryDisposed=false,signDisposed=false,textureDisposed=false,sharedDisposed=false;
 geometry.addEventListener('dispose',()=>geometryDisposed=true);sign.addEventListener('dispose',()=>signDisposed=true);sign.map.addEventListener('dispose',()=>textureDisposed=true);shared.addEventListener('dispose',()=>sharedDisposed=true);
 const host={scene,materials:{deep:shared},obstacles:[{group}],makeObstacle(o,k){this.obstacles.push({s:o.s,k});}};
 RaceScene.prototype.setCourse.call(host,[finish]);
 assert.equal(scene.children.includes(group),false);assert.ok(geometryDisposed&&signDisposed&&textureDisposed);assert.equal(sharedDisposed,false);assert.equal(host.course.length,1);assert.equal(host.obstacles.length,1);assert.equal(host.targetData,null);
});
test('large editable obstacles stay visible when their collider extends into the camera region',()=>{
 const course=createCourse([{id:'long',type:'rotor',s:300,phase:0,params:{length:400}},finish]);let updates=0;
 const host={course,focusS:0,obstacles:course.map(o=>({s:o.s,group:{visible:false},view:{update(t,shapes){assert.ok(shapes.length);updates++;}}}))};
 const groups=RaceScene.prototype.updateObstacles.call(host,0);
 assert.equal(host.obstacles[0].group.visible,true);assert.equal(host.obstacles[1].group.visible,false);assert.equal(updates,1);assert.equal(groups[0].o.id,'long');
});
