import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CourseLibrary,BUILTIN_COURSES,COURSE_STORAGE_KEY,MAX_COURSE_FILE_BYTES,MAX_CUSTOM_COURSES} from '../src/course-library.js';

class MemoryStorage {
 values = new Map();
 fail = false;
 getItem(key) { return this.values.get(key) ?? null; }
 setItem(key,value) { if (this.fail) throw new Error('QuotaExceededError');this.values.set(key,String(value)); }
}
const draft = (library,name='測試賽道') => ({name,obstacles:library.selected.obstacles});

test('built-in courses remain immutable and callers receive independent copies',()=>{
 const library=new CourseLibrary(new MemoryStorage());
 assert.equal(library.list().length,BUILTIN_COURSES.length);assert.ok(library.list().every(course=>course.builtin));
 const selected=library.selected;selected.name='changed';selected.obstacles[0].label='changed';
 assert.notEqual(library.selected.name,'changed');assert.notEqual(library.selected.obstacles[0].label,'changed');
 assert.ok(Object.isFrozen(BUILTIN_COURSES[0].obstacles[0].params));
 const custom=library.save({...draft(library),id:BUILTIN_COURSES[0].id});
 assert.equal(custom.builtin,false);assert.notEqual(custom.id,BUILTIN_COURSES[0].id);assert.equal(library.list()[0].name,BUILTIN_COURSES[0].name);
 assert.throws(()=>library.delete(BUILTIN_COURSES[0].id));
});
test('custom tracks and selection survive reload, updates, and deletion atomically',()=>{
 const storage=new MemoryStorage(),library=new CourseLibrary(storage);
 const saved=library.save(draft(library,'  活動賽道  '));assert.equal(saved.name,'活動賽道');
 library.select(saved.id);const restored=new CourseLibrary(storage);
 assert.equal(restored.selectedId,saved.id);assert.deepEqual(restored.selected,saved);
 const edited=restored.save({id:saved.id,...draft(restored,'更新賽道')});assert.equal(edited.id,saved.id);
 assert.equal(new CourseLibrary(storage).selected.name,'更新賽道');
 restored.delete(saved.id);assert.equal(restored.selectedId,BUILTIN_COURSES[0].id);assert.equal(new CourseLibrary(storage).list().length,BUILTIN_COURSES.length);
});
test('export and import transfer resolved parameters and disabled obstacles between browsers',()=>{
 const source=new CourseLibrary(new MemoryStorage()),target=new CourseLibrary(new MemoryStorage());
 const value=draft(source,'跨瀏覽器');value.obstacles[0].enabled=false;value.obstacles.find(o=>o.type==='scope-change').params.speed=.23;
 const saved=source.save(value);const envelope=source.exportCourse(saved.id);
 const imported=target.importCourse(JSON.stringify(envelope));
 assert.equal(imported.name,saved.name);assert.deepEqual(imported.obstacles,saved.obstacles);assert.notEqual(imported.id,saved.id);
 assert.equal(imported.obstacles[0].enabled,false);assert.equal(imported.obstacles.find(o=>o.type==='scope-change').params.speed,.23);
 const duplicate=target.importCourse(JSON.stringify(envelope));assert.notEqual(duplicate.id,imported.id);
 assert.equal(target.list().length,BUILTIN_COURSES.length+2);assert.equal(target.selectedId,BUILTIN_COURSES[0].id);
});
test('invalid, unsupported, malicious, and oversized imports leave storage unchanged',()=>{
 const storage=new MemoryStorage(),library=new CourseLibrary(storage);library.save(draft(library));
 const before=storage.getItem(COURSE_STORAGE_KEY),initial=library.list();
 const valid=()=>library.exportCourse();
 const bad=[];
 let value=valid();value.version=999;bad.push(JSON.stringify(value));
 value=valid();value.course.obstacles[0].type='toString';bad.push(JSON.stringify(value));
 value=valid();value.course.obstacles[0].id=value.course.obstacles[1].id;bad.push(JSON.stringify(value));
 value=valid();value.course.obstacles.at(-1).enabled=false;bad.push(JSON.stringify(value));
 value=valid();value.course.obstacles[0].enabled=false;value.course.obstacles[0].type='missing';bad.push(JSON.stringify(value));
 value=valid();value.course.name=' ';bad.push(JSON.stringify(value));
 value=valid();value.course.owner='unexpected';bad.push(JSON.stringify(value));
 bad.push('{','[]',JSON.stringify({format:'marblerun-course',version:1,course:JSON.parse('{"name":"bad","obstacles":[],"__proto__":{"polluted":true}}')}),' '.repeat(MAX_COURSE_FILE_BYTES+1));
 for(const text of bad){assert.throws(()=>library.importCourse(text));assert.equal(storage.getItem(COURSE_STORAGE_KEY),before);assert.deepEqual(library.list(),initial);}
 assert.equal({}.polluted,undefined);
});
test('failed writes cannot mutate saved tracks, current selection, or deletion state',()=>{
 const storage=new MemoryStorage(),library=new CourseLibrary(storage),saved=library.save(draft(library));
 library.select(saved.id);const initial=library.list(),selectedId=library.selectedId,raw=storage.getItem(COURSE_STORAGE_KEY);
 storage.fail=true;
 for(const action of [()=>library.save(draft(library,'new')),()=>library.save({id:saved.id,...draft(library,'edit')}),()=>library.select(BUILTIN_COURSES[1].id),()=>library.delete(saved.id),()=>library.importCourse(JSON.stringify(library.exportCourse()))]){
  assert.throws(action,/無法儲存/);assert.deepEqual(library.list(),initial);assert.equal(library.selectedId,selectedId);assert.equal(storage.getItem(COURSE_STORAGE_KEY),raw);
 }
});
test('corrupted local entries recover safely without overwriting raw backups',()=>{
 const storage=new MemoryStorage();storage.setItem(COURSE_STORAGE_KEY,'broken JSON');
 const fallback=new CourseLibrary(storage);assert.equal(fallback.list().length,BUILTIN_COURSES.length);assert.ok(fallback.loadWarning);assert.equal(storage.getItem(COURSE_STORAGE_KEY),'broken JSON');
 const library=new CourseLibrary(new MemoryStorage()),saved=library.save(draft(library,'still valid'));
 const raw={version:1,selectedId:'custom-invalid',courses:[saved,{...saved,id:'custom-invalid',obstacles:[]}]};
 storage.setItem(COURSE_STORAGE_KEY,JSON.stringify(raw));const recovered=new CourseLibrary(storage);
 assert.equal(recovered.list().length,BUILTIN_COURSES.length+1);assert.equal(recovered.get(saved.id).name,'still valid');assert.ok(recovered.loadWarning);assert.equal(recovered.selectedId,BUILTIN_COURSES[0].id);
 assert.equal(storage.getItem(COURSE_STORAGE_KEY),JSON.stringify(raw));
});
test('unavailable or denied localStorage keeps built-in export usable with a clear save error',()=>{
 for(const storage of [null,{getItem(){throw new Error('SecurityError');},setItem(){throw new Error('SecurityError');}}]){
  const library=new CourseLibrary(storage);assert.equal(library.list().length,BUILTIN_COURSES.length);assert.ok(library.loadWarning);assert.equal(library.exportCourse().format,'marblerun-course');assert.throws(()=>library.save(draft(library)),/無法儲存/);
 }
});
test('custom-course limit rejects further imports while existing tracks remain editable',()=>{
 const library=new CourseLibrary(new MemoryStorage());let saved;
 for(let i=0;i<MAX_CUSTOM_COURSES;i++)saved=library.save(draft(library,`Course ${i}`));
 const exported=JSON.stringify(library.exportCourse(saved.id));assert.throws(()=>library.importCourse(exported),/最多/);
 assert.equal(library.save({id:saved.id,...draft(library,'最後修改')}).name,'最後修改');assert.equal(library.list().length,MAX_CUSTOM_COURSES+BUILTIN_COURSES.length);
});

test('non-elimination built-in courses complete a normal prize quota using their own configuration',async()=>{
 const {RaceSimulation}=await import('../src/simulation.js');
 for(const track of BUILTIN_COURSES.filter(track=>!track.obstacles.some(o=>['not-found','node-hole'].includes(o.type)))){
  const race=new RaceSimulation(40,5,123,track.obstacles);
  while(!race.done&&race.t<240)race.step();
  assert.ok(race.done,`${track.name}: stalled at ${race.t}`);
  assert.equal(race.winners.length,5);
 }
});

test('save-and-use commits the track and selection together, or leaves both unchanged',()=>{
 const storage=new MemoryStorage(),library=new CourseLibrary(storage);let writes=0;
 const original=storage.setItem.bind(storage);storage.setItem=(...args)=>{writes++;original(...args);};
 const selected=library.saveAndSelect({...draft(library,'一筆寫入'),id:BUILTIN_COURSES[0].id});
 assert.equal(writes,1);assert.equal(library.selectedId,selected.id);assert.equal(new CourseLibrary(storage).selectedId,selected.id);
 const before=storage.getItem(COURSE_STORAGE_KEY),tracks=library.list();storage.fail=true;
 assert.throws(()=>library.saveAndSelect(draft(library,'不能留下半成品')),/無法儲存/);
 assert.equal(storage.getItem(COURSE_STORAGE_KEY),before);assert.deepEqual(library.list(),tracks);assert.equal(library.selectedId,selected.id);
});
