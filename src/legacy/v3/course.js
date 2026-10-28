import {FINISH} from './track-geometry.js';
import {resolveObstacle} from './components/obstacles/index.js';

export const MAX_COURSE_OBSTACLES=128;
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fields=new Set(['id','s','type','label','phase','enabled','x','params']);

// Validate disabled entries too, so saved/imported drafts remain safe to enable.
// Resolve defaults into the document to keep exported tracks portable.
export function normalizeCourseEntries(entries) {
 if (!Array.isArray(entries)||!entries.length||entries.length>MAX_COURSE_OBSTACLES) throw new Error(`賽道需包含 1 到 ${MAX_COURSE_OBSTACLES} 個機關。`);
 const ids=new Set();
 const course=entries.map(input=>{
  if (!isObject(input)) throw new Error('每個機關都必須是設定物件。');
  if (Object.keys(input).some(key=>!fields.has(key))) throw new Error(`${input.id??'機關'}：包含未知欄位。`);
  const o={...input,phase:input.phase??0};
  if (typeof o.id!=='string'||!o.id.trim()||o.id.length>120||ids.has(o.id)) throw new Error(`機關 id 必須唯一且不超過 120 字：${o.id}`);
  ids.add(o.id);
  if (o.enabled!==undefined&&typeof o.enabled!=='boolean') throw new Error(`${o.id}：enabled 必須是 true 或 false。`);
  if (!Number.isFinite(o.s)||o.s<0||o.s>FINISH) throw new Error(`${o.id}：位置需在 0 到 ${FINISH} 之間。`);
  if (o.x!==undefined&&(!Number.isFinite(o.x)||Math.abs(o.x)>20)) throw new Error(`${o.id}：x 必須在 -20 到 20 之間。`);
  if (!Number.isFinite(o.phase)||o.phase<0||o.phase>1000000) throw new Error(`${o.id}：phase 必須是 0 到 1000000 的數字。`);
  if (o.label!==undefined&&(typeof o.label!=='string'||o.label.length>80)) throw new Error(`${o.id}：機關名稱最多 80 字。`);
  if (o.params!==undefined&&!isObject(o.params)) throw new Error(`${o.id}：params 必須是參數物件。`);
  const {def,params}=resolveObstacle(o);
  for (const [key,value] of Object.entries(params)) {
   if (!Object.hasOwn(def.defaults,key)) throw new Error(`${o.id}：未知參數 ${key}`);
   if (typeof def.defaults[key]==='number'&&(!Number.isFinite(value)||value<=0||value>1000)) throw new Error(`${o.id}：${key} 必須大於 0 且不超過 1000。`);
  }
  if ('rows' in params&&(!Array.isArray(params.rows)||!params.rows.length||params.rows.length>16||params.rows.some(row=>!Array.isArray(row)||row.length>24||row.some(x=>!Number.isFinite(x)||Math.abs(x)>20))||params.rows.flat().length>256)) throw new Error(`${o.id}：rows 最多 16 列、每列 24 個座標、合計 256 個；座標範圍 -20 到 20。`);
  for (const key of ['count','laneCount']) if (params[key]!==undefined&&(!Number.isInteger(params[key])||params[key]>64)) throw new Error(`${o.id}：${key} 必須是 1 到 64 的整數。`);
  if (o.type==='gate'&&params.switchDuration>=params.period/2) throw new Error(`${o.id}：閘門切換時間必須短於半個週期。`);
  if (o.type==='rate'&&params.closedDuration+2*params.transition>=params.period) throw new Error(`${o.id}：週期需保留完整開放時間。`);
  if (o.type==='ux-flow'&&params.thickness>=5) throw new Error(`${o.id}：卡片厚度必須小於 5。`);
  if ((o.type==='sprint'&&params.lift<=.7)||(o.type==='gate'&&params.lift<=.66)) throw new Error(`${o.id}：升起高度不足以放行彈珠。`);
  if (['scope-change','ux-flow'].includes(o.type)&&(o.x||params.wallX<10.5||params.innerX>=8)) throw new Error(`${o.id}：導流板必須接住護欄，且保留內側出口；x 請保持 0。`);
  return {...o,label:o.label?.trim()||def.label,params:structuredClone(params)};
 }).sort((a,b)=>a.s-b.s);
 const finishes=course.filter(o=>o.type==='finish');
 if (finishes.length!==1||finishes[0].enabled===false||finishes[0].s!==FINISH) throw new Error(`賽道必須在 ${FINISH} 有唯一且啟用的終點。`);
 return course;
}
export function createCourse(entries) {
 return normalizeCourseEntries(entries).filter(o=>o.enabled!==false);
}
