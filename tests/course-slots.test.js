import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COURSE_SLOTS,DEPRECATED_MECHANISMS,isSlottedCourse,convertToSlots,slottedCourse} from '../src/course-slots.js';
import {COURSE_CONFIG} from '../src/course-config.js';
import {BUILTIN_COURSES} from '../src/course-library.js';

test('all built-ins use the same fixed positions with a unique finish',()=>{
 assert.equal(BUILTIN_COURSES.length,8);
 for(const track of BUILTIN_COURSES){
  assert.ok(isSlottedCourse(track.obstacles),track.name);
  assert.ok(track.obstacles.every(o=>!DEPRECATED_MECHANISMS.has(o.type)),track.name);
  assert.ok(track.obstacles.length<=COURSE_SLOTS.length+1);
  assert.equal(track.obstacles.at(-1).type,'finish');
 }
});
test('empty slots stay empty in a portable course without adding invisible machinery',()=>{
 const course=slottedCourse(['pegs',null,null,'teapot']);
 assert.equal(course.length,3);assert.equal(course[1].s,COURSE_SLOTS[3]);assert.ok(isSlottedCourse(course));
});
test('legacy conversion preserves the source and creates at most 12 ordered default mechanisms',()=>{
 const source=structuredClone(COURSE_CONFIG),before=structuredClone(source),converted=convertToSlots(source);
 assert.deepEqual(source,before);assert.equal(converted.retained,12);assert.equal(converted.removed,9);
 assert.ok(isSlottedCourse(converted.obstacles));assert.equal(converted.obstacles.length,13);
 assert.ok(converted.obstacles.every((o,i,a)=>!i||o.s>a[i-1].s));
 assert.ok(converted.obstacles.slice(0,-1).every(o=>Object.keys(o.params).length===0));
});
test('conversion retains the order of densely grouped legacy mechanisms',()=>{
 const result=convertToSlots([{type:'pegs',s:100},{type:'gate',s:101},{type:'rotor',s:102}]);
 assert.deepEqual(result.obstacles.slice(0,-1).map(o=>o.type),['pegs','gate','rotor']);
 assert.ok(isSlottedCourse(result.obstacles));
});

test('legacy hazards are retained in the original and explicitly omitted in a converted copy',()=>{
 const source=[{type:'not-found',s:50},{type:'node-hole',s:80},{type:'java-hole',s:100},{type:'dotnet-hole',s:120},{type:'teapot',s:200},{type:'finish',s:430}],before=structuredClone(source);
 const copy=convertToSlots(source);
 assert.deepEqual(source,before);assert.equal(copy.deprecated,4);assert.equal(copy.removed,4);assert.deepEqual(copy.obstacles.map(o=>o.type),['teapot','finish']);
});
