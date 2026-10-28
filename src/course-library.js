import {COURSE_CONFIG} from './course-config.js';
import {normalizeCourseEntries} from './course.js';

export const COURSE_STORAGE_KEY = 'banyan-course-library';
export const COURSE_FILE_FORMAT = 'marblerun-course';
export const COURSE_FILE_VERSION = 1;
export const MAX_COURSE_FILE_BYTES = 512 * 1024;
export const MAX_CUSTOM_COURSES = 50;

const clone = value => structuredClone(value);
const bytes = text => new TextEncoder().encode(text).length;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function exactKeys(value, allowed, message) {
 if (!isRecord(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new Error(message);
}
function courseName(name) {
 if (typeof name !== 'string' || !name.trim() || name.trim().length > 60) throw new Error('賽道名稱請填寫 1 到 60 個字。');
 return name.trim();
}
function courseDraft(value) {
 exactKeys(value, ['name','obstacles'], '賽道資料只能包含名稱與機關設定。');
 return {name:courseName(value.name),obstacles:normalizeCourseEntries(value.obstacles)};
}
function deepFreeze(value) {
 for (const child of Object.values(value)) if (child && typeof child === 'object') deepFreeze(child);
 return Object.freeze(value);
}
const newer = new Set(['scope-change','sprint','ux-flow','handoff','code-review']);
const quickIds = new Set(['debug-1','requirements','merge-1','review','deadline','finish']);
export const BUILTIN_COURSES = deepFreeze([
 {id:'builtin-festival',name:'大樹 AI 全機關賽道',obstacles:normalizeCourseEntries(COURSE_CONFIG),updatedAt:null,builtin:true},
 {id:'builtin-classic',name:'經典 IT 賽道',obstacles:normalizeCourseEntries(COURSE_CONFIG.filter(o => !newer.has(o.type))),updatedAt:null,builtin:true},
 {id:'builtin-quick',name:'輕量暖身賽道',obstacles:normalizeCourseEntries(COURSE_CONFIG.filter(o => quickIds.has(o.id))),updatedAt:null,builtin:true}
]);
const builtinIds = new Set(BUILTIN_COURSES.map(course => course.id));
const emptyState = () => ({version:1,selectedId:BUILTIN_COURSES[0].id,courses:[]});

function storedCourse(value) {
 exactKeys(value,['id','name','obstacles','updatedAt','builtin'],'儲存的賽道格式不正確。');
 if (typeof value.id !== 'string' || !value.id.startsWith('custom-') || value.id.length > 100 || builtinIds.has(value.id)) throw new Error('儲存的賽道識別碼不正確。');
 if (value.builtin !== false || typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) throw new Error('儲存的賽道資訊不正確。');
 return {id:value.id,...courseDraft({name:value.name,obstacles:value.obstacles}),updatedAt:value.updatedAt,builtin:false};
}
function newId() {
 return `custom-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
}

// One atomic localStorage value keeps selection and saved tracks in sync.
// State is replaced only after setItem succeeds, including on quota errors.
export class CourseLibrary {
 #storage;
 #state = emptyState();
 loadWarning = '';
 constructor(storage) {
  try {
   this.#storage = storage === undefined ? globalThis.localStorage : storage;
   if (!this.#storage || typeof this.#storage.getItem !== 'function' || typeof this.#storage.setItem !== 'function') throw new Error('unavailable');
   const raw = this.#storage.getItem(COURSE_STORAGE_KEY);
   if (raw === null) return;
   const saved = JSON.parse(raw);
   exactKeys(saved,['version','selectedId','courses'],'賽道資料格式不正確。');
   if (saved.version !== 1 || !Array.isArray(saved.courses) || saved.courses.length > MAX_CUSTOM_COURSES || typeof saved.selectedId !== 'string') throw new Error('version');
   const courses = [],ids = new Set(builtinIds);
   for (const value of saved.courses) {
    try {
     const course = storedCourse(value);
     if (ids.has(course.id)) throw new Error('duplicate');
     ids.add(course.id);courses.push(course);
    } catch {
     this.loadWarning = '部分本機賽道資料無法讀取，已保留其餘可用賽道。';
    }
   }
   const selectedId = ids.has(saved.selectedId) ? saved.selectedId : BUILTIN_COURSES[0].id;
   if (selectedId !== saved.selectedId) this.loadWarning ||= '上次使用的賽道無法讀取，已切回內建賽道。';
   this.#state = {version:1,selectedId,courses};
  } catch {
   this.loadWarning = this.#storage ? '本機賽道資料無法讀取，暫時使用內建賽道；原始資料尚未改寫。' : '此瀏覽器未開放本機儲存，仍可查看內建賽道並匯出設定。';
  }
 }
 get selectedId() { return this.#state.selectedId; }
 get selected() { return this.get(this.selectedId); }
 list() { return clone([...BUILTIN_COURSES,...this.#state.courses]); }
 get(id) {
  const course = [...BUILTIN_COURSES,...this.#state.courses].find(course => course.id === id);
  return course ? clone(course) : null;
 }
 #commit(next) {
  try {
   if (!this.#storage) throw new Error('unavailable');
   this.#storage.setItem(COURSE_STORAGE_KEY,JSON.stringify(next));
  } catch {
   throw new Error('無法儲存賽道，瀏覽器儲存空間可能已滿或未開放。請先匯出 JSON 備份，調整瀏覽器儲存設定後重試。');
  }
  this.#state = next;
  this.loadWarning = '';
 }
 save(value) {
  return this.#save(value,false);
 }
 saveAndSelect(value) {
  return this.#save(value,true);
 }
 #save(value,select) {
  exactKeys(value,['id','name','obstacles'],'儲存賽道的資料格式不正確。');
  const draft = courseDraft({name:value.name,obstacles:value.obstacles});
  const existing = this.#state.courses.find(course => course.id === value.id);
  if (value.id !== undefined && typeof value.id !== 'string') throw new Error('賽道識別碼不正確。');
  if (value.id && !existing && !builtinIds.has(value.id)) throw new Error('找不到要更新的賽道，請另存為新賽道。');
  if (!existing && this.#state.courses.length >= MAX_CUSTOM_COURSES) throw new Error(`最多可儲存 ${MAX_CUSTOM_COURSES} 條自訂賽道，請先匯出並刪除不需要的賽道。`);
  let id = existing?.id ?? newId();
  while (!existing && this.get(id)) id = newId();
  const course = {id,...draft,updatedAt:new Date().toISOString(),builtin:false};
  const courses = existing ? this.#state.courses.map(item => item.id === id ? course : item) : [...this.#state.courses,course];
  this.#commit({...this.#state,courses,selectedId:select?id:this.#state.selectedId});
  return clone(course);
 }
 select(id) {
  const course = this.get(id);
  if (!course) throw new Error('找不到這條賽道，請重新選擇。');
  if (id !== this.selectedId) this.#commit({...this.#state,selectedId:id});
  return course;
 }
 delete(id) {
  if (builtinIds.has(id)) throw new Error('內建賽道會保留，請刪除自訂賽道。');
  if (!this.get(id)) throw new Error('找不到要刪除的賽道。');
  this.#commit({...this.#state,courses:this.#state.courses.filter(course => course.id !== id),selectedId:this.selectedId === id ? BUILTIN_COURSES[0].id : this.selectedId});
  return this.selected;
 }
 exportDraft(value) {
  const envelope = {format:COURSE_FILE_FORMAT,version:COURSE_FILE_VERSION,course:courseDraft(value)};
  if (bytes(JSON.stringify(envelope)) > MAX_COURSE_FILE_BYTES) throw new Error('賽道資料超過 512 KB，請減少機關設定後再匯出。');
  return envelope;
 }
 exportCourse(id = this.selectedId) {
  const course = this.get(id);
  if (!course) throw new Error('找不到要匯出的賽道。');
  return this.exportDraft({name:course.name,obstacles:course.obstacles});
 }
 importCourse(text) {
  if (typeof text !== 'string' || bytes(text) > MAX_COURSE_FILE_BYTES) throw new Error('請選擇 512 KB 以內的賽道 JSON 檔案。');
  let envelope;
  try { envelope = JSON.parse(text); } catch { throw new Error('無法讀取 JSON，請確認檔案完整且格式正確。'); }
  exactKeys(envelope,['format','version','course'],'這不是支援的賽道檔案。');
  if (envelope.format !== COURSE_FILE_FORMAT || envelope.version !== COURSE_FILE_VERSION) throw new Error('不支援此賽道檔案的格式或版本，請使用本遊戲匯出的 JSON。');
  const draft = courseDraft(envelope.course);
  return this.save(draft);
 }
}
