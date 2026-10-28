import './course-manager.css';
import {OBSTACLE_COMPONENTS,getObstacleDefinition} from './components/obstacles/index.js';
import {FINISH} from './track-geometry.js';
import {icon} from './icons.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>structuredClone(value);
const uid=()=>globalThis.crypto?.randomUUID?.()??`obstacle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const types=Object.values(OBSTACLE_COMPONENTS).filter(def=>def.type!=='finish');

// Browser-only editor. The library owns persistence and validation; this module
// keeps an independent draft so invalid/unsaved edits never alter a live race.
export function mountCourseManager({library,onApply,onMessage=()=>{},isLocked=()=>false}) {
 const dialog=document.createElement('dialog');dialog.id='course-dialog';dialog.className='course-manager';dialog.setAttribute('aria-labelledby','cm-title');
 dialog.innerHTML=`
  <div class="dialog-header"><div><h2 id="cm-title">賽道管理</h2><p class="cm-subtitle">選擇賽道，或編輯機關後儲存自己的版本。</p></div><button type="button" class="dialog-close" data-cm="close" aria-label="關閉賽道管理">${icon('close')}</button></div>
  <div class="cm-confirm" role="alert" hidden><p></p><div><button type="button" class="btn" data-cm="keep">保留編輯</button><button type="button" class="btn" data-cm="confirm">放棄變更並繼續</button></div></div>
  <div class="cm-body">
   <aside class="cm-library"><label for="cm-catalog">已儲存的賽道</label><select id="cm-catalog" size="8" aria-label="選擇已儲存的賽道"></select><p>內建賽道可作為範本，修改後會儲存為個人賽道。</p><button type="button" class="btn" data-cm="import">${icon('upload')}匯入賽道 JSON</button><input id="cm-file" type="file" accept=".json,application/json" hidden aria-label="匯入賽道 JSON"><button type="button" class="small-link cm-delete" data-cm="delete">刪除此個人賽道</button><p class="cm-storage-note">個人賽道保留在此瀏覽器。匯出 JSON 即可備份，或帶到其他瀏覽器。</p></aside>
   <section class="cm-editor" aria-label="賽道編輯器">
    <div class="cm-name-row"><div class="field"><label for="cm-name">賽道名稱</label><input id="cm-name" maxlength="60" required autocomplete="off"></div><span id="cm-draft-state" role="status"></span></div>
    <div class="cm-obstacle-heading"><div><h3>賽道機關</h3><p id="cm-summary"></p></div><button type="button" class="small-link" data-cm="sort">依位置排序</button></div>
    <div class="cm-add"><label class="cm-sr" for="cm-add-type">新增機關類型</label><select id="cm-add-type">${types.map(def=>`<option value="${escape(def.type)}">${escape(def.label)}</option>`).join('')}</select><button type="button" class="btn" data-cm="add">新增機關</button></div>
    <p class="cm-edit-hint">展開機關可調整位置與參數。賽道依位置排序，終點固定在 ${FINISH}；請為機關之間保留通道。</p>
    <div id="cm-obstacles" class="cm-obstacles"></div>
   </section>
  </div>
  <div class="cm-feedback"><p id="cm-error" role="alert" hidden></p><p id="cm-message" role="status" hidden></p></div>
  <div class="dialog-footer"><button type="button" class="btn" data-cm="export">${icon('download')}匯出 JSON</button><button type="button" class="btn" data-cm="copy">另存新賽道</button><button type="button" class="btn btn-primary" data-cm="apply">使用賽道</button></div>`;
 document.body.appendChild(dialog);
 const $=selector=>dialog.querySelector(selector);
 const mobileLayout=window.matchMedia('(max-width:760px)');
 const resizeCatalog=()=>{$('#cm-catalog').size=mobileLayout.matches?1:8;};
 resizeCatalog();mobileLayout.addEventListener('change',resizeCatalog);
 let source=null,draft=null,baseline='',pending=null,openIds=new Set();
 const snapshot=()=>JSON.stringify(draft);
 const dirty=()=>draft&&snapshot()!==baseline;
 const locked=()=>{if(!isLocked())return false;error('本場比賽已開始，請先結束或重新準備，再切換賽道。');return true;};
 function error(message){$('#cm-error').textContent=message;$('#cm-error').hidden=false;$('#cm-message').hidden=true;}
 function message(text){$('#cm-message').textContent=text;$('#cm-message').hidden=false;$('#cm-error').hidden=true;}
 function clearFeedback(){$('#cm-error').hidden=true;$('#cm-message').hidden=true;}
 function hideConfirmation(){pending=null;$('.cm-confirm').hidden=true;}
 function ask(action,text,confirmLabel='放棄變更並繼續',keepLabel='保留編輯') {
  pending=action;$('.cm-confirm p').textContent=text;$('.cm-confirm').hidden=false;
  $('[data-cm="confirm"]').textContent=confirmLabel;$('[data-cm="keep"]').textContent=keepLabel;
  $('[data-cm="keep"]').focus();
 }
 function guarded(action,what){if(dirty())ask(action,`尚有未儲存的賽道變更。要放棄變更並${what}嗎？`);else action();}
 function catalog(){
  const tracks=library.list();
  $('#cm-catalog').innerHTML=[true,false].map(builtin=>`<optgroup label="${builtin?'內建賽道':'個人賽道'}">${tracks.filter(track=>track.builtin===builtin).map(track=>`<option value="${escape(track.id)}">${escape(track.name)}${track.id===library.selectedId?'（使用中）':''}</option>`).join('')}</optgroup>`).join('');
  if(source)$('#cm-catalog').value=source.id;
 }
 function load(track){
  if(!track)throw new Error('找不到這條賽道，請重新選擇。');
  source=clone(track);draft={name:track.name,obstacles:track.obstacles.map(o=>({...clone(o),paramsText:JSON.stringify(o.params??{},null,2)}))};
  baseline=snapshot();openIds.clear();hideConfirmation();clearFeedback();render();
 }
 function mark(){
  const changed=dirty();$('#cm-draft-state').textContent=changed?'尚未儲存':source?.builtin?'內建範本':'已儲存';
  $('#cm-draft-state').classList.toggle('cm-unsaved',!!changed);
  $('[data-cm="apply"]').textContent=changed?'儲存並使用':'使用賽道';
  const enabled=draft.obstacles.filter(o=>o.enabled!==false&&o.type!=='finish').length;
  $('#cm-summary').textContent=`${enabled} 個啟用機關 · 全長 ${FINISH} · 修改不會影響已完成的賽事紀錄`;
 }
 function render(){
  catalog();$('#cm-name').value=draft.name;$('[data-cm="delete"]').hidden=!!source.builtin;
  $('#cm-obstacles').innerHTML=draft.obstacles.map((o,index)=>{
   const finish=o.type==='finish',def=getObstacleDefinition(o.type),attached=['scope-change','ux-flow'].includes(o.type);
   return `<details class="cm-obstacle${o.enabled===false?' cm-disabled':''}" data-row="${index}" ${openIds.has(o.id)?'open':''}><summary><strong>${escape(o.label||def.label)}</strong><span>${escape(o.s)} / ${FINISH}</span><small>${escape(def.label)}</small></summary><div class="cm-row-content">
    <div class="cm-row-fields"><label>機關類型<select data-field="type" ${finish?'disabled':''}>${(finish?[def]:types).map(d=>`<option value="${escape(d.type)}" ${d.type===o.type?'selected':''}>${escape(d.label)}</option>`).join('')}</select></label><label>位置<input data-field="s" type="number" min="0" max="${FINISH}" step="0.1" value="${escape(o.s)}" ${finish?'disabled':''}></label><label class="cm-label-field">顯示名稱<input data-field="label" maxlength="80" value="${escape(o.label||def.label)}"></label><label class="cm-enabled"><input data-field="enabled" type="checkbox" ${o.enabled!==false?'checked':''} ${finish?'disabled':''}>啟用機關</label></div>
    <details class="cm-advanced"><summary>進階參數</summary><div class="cm-phase-row"><label>動畫相位<input data-field="phase" type="number" min="0" step="0.1" value="${escape(o.phase??0)}"></label><label>橫向偏移<input data-field="x" type="number" step="0.1" value="${escape(o.x??0)}" ${attached||finish?'disabled':''}></label></div><label>機關參數 JSON<textarea data-field="paramsText" rows="6" spellcheck="false" aria-label="${escape(o.label||def.label)}的機關參數 JSON">${escape(o.paramsText)}</textarea></label><p>只需填入要調整的參數；空物件 <code>{}</code> 使用預設值。<button type="button" class="small-link" data-action="defaults">填入預設參數</button></p></details>
    <div class="cm-row-actions"><span>${finish?'終點固定，保留唯一一個。':attached?'導流板需銜接護欄，橫向偏移固定為 0。':'位置變更後，使用賽道時會自動排序。'}</span>${finish?'':`<button type="button" class="small-link" data-action="duplicate">複製</button><button type="button" class="small-link cm-delete" data-action="remove">移除</button>`}</div>
   </div></details>`;
  }).join('');mark();
 }
 function compiledDraft(){
  const obstacles=draft.obstacles.map((o,index)=>{
   const {paramsText,...entry}=clone(o);let params;
   try{params=JSON.parse(paramsText);}catch{throw new Error(`第 ${index+1} 個機關「${o.label}」的參數 JSON 格式有誤。`);}
   if(!params||typeof params!=='object'||Array.isArray(params))throw new Error(`「${o.label}」的參數必須是 JSON 物件，例如 {}。`);
   return {...entry,params};
  });
  return {name:draft.name,obstacles};
 }
 function downloadDraft(){
  const exported=library.exportDraft(compiledDraft()),blob=new Blob([JSON.stringify(exported,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${draft.name.trim().replace(/[\\/:*?"<>|]/g,'-')||'marblerun'}-賽道.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('已匯出目前編輯中的賽道。可在其他瀏覽器使用「匯入賽道 JSON」。');
 }
 function nextPhase(){return Math.max(0,...draft.obstacles.map(o=>Number(o.phase)||0))+1;}
 function nextPosition(){
  const positions=[0,...draft.obstacles.filter(o=>o.type!=='finish').map(o=>Number(o.s)||0),FINISH].sort((a,b)=>a-b);let best=[0,0];
  for(let i=1;i<positions.length;i++)if(positions[i]-positions[i-1]>best[1]-best[0])best=[positions[i-1],positions[i]];
  return Math.round((best[0]+best[1])/2*10)/10;
 }
 function execute(action){try{clearFeedback();action();}catch(e){error(e.message||'操作失敗，請稍後重試。');}}
 function close(){if(dialog.open)guarded(()=>dialog.close(),'關閉賽道管理');}
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',()=>hideConfirmation());
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();return;}
  const button=event.target.closest('button');if(!button)return;
  const action=button.dataset.cm,rowAction=button.dataset.action;
  execute(()=>{
   if(action==='close'){close();return;}
   if(action==='keep'){hideConfirmation();return;}
   if(action==='confirm'){const task=pending;hideConfirmation();task?.();return;}
   if(action==='export'){downloadDraft();return;}
   if(locked())return;
   if(action==='import'){guarded(()=>$('#cm-file').click(),'匯入其他賽道');return;}
   if(action==='sort'){draft.obstacles.sort((a,b)=>Number(a.s)-Number(b.s));render();return;}
   if(action==='add'){
    if(draft.obstacles.length>=128)throw new Error('每條賽道最多可放置 128 個機關。');
    const type=$('#cm-add-type').value,def=getObstacleDefinition(type),o={id:uid(),type,s:nextPosition(),label:def.label,phase:nextPhase(),enabled:true,paramsText:'{}'};draft.obstacles.push(o);openIds.add(o.id);render();$('#cm-obstacles').lastElementChild.scrollIntoView({block:'nearest'});return;
   }
   if(action==='copy'){const saved=library.save(compiledDraft());load(saved);message('已另存為新的個人賽道。按「使用賽道」切換本場。');onMessage('已另存新的個人賽道。');return;}
   if(action==='apply'){
    const selected=dirty()?library.saveAndSelect({...compiledDraft(),id:source.id}):library.select(source.id);
    onApply(selected);load(selected);dialog.close();onMessage(`已切換至「${selected.name}」。`);return;
   }
   if(action==='delete'){
    if(source.builtin)return;
    const id=source.id,name=source.name;
    ask(()=>{const active=library.selectedId===id;library.delete(id);if(active)onApply(library.selected);load(library.selected);message(`已刪除「${name}」。`);},`確定刪除個人賽道「${name}」？${dirty()?'未儲存的變更也會一併放棄。':''}如需保留，請先匯出 JSON。`,'刪除此賽道','保留賽道');return;
   }
   if(rowAction){
    const index=Number(button.closest('[data-row]').dataset.row),o=draft.obstacles[index];if(!o)return;
    if(rowAction==='defaults'){o.paramsText=JSON.stringify(getObstacleDefinition(o.type).defaults,null,2);openIds.add(o.id);render();const row=$(`[data-row="${index}"]`);row.querySelector('.cm-advanced').open=true;return;}
    if(o.type==='finish')return;
    if(rowAction==='remove'){draft.obstacles.splice(index,1);render();return;}
    if(rowAction==='duplicate'){
     if(draft.obstacles.length>=128)throw new Error('每條賽道最多可放置 128 個機關。');
     const duplicate={...clone(o),id:uid(),s:Math.min(FINISH-1,Number(o.s)+8),phase:nextPhase(),label:`${o.label} 副本`.slice(0,80)};draft.obstacles.splice(index+1,0,duplicate);openIds.add(duplicate.id);render();return;
    }
   }
  });
 });
 $('#cm-name').addEventListener('input',event=>{draft.name=event.target.value;mark();});
 $('#cm-catalog').addEventListener('change',event=>{
  const id=event.target.value;event.target.value=source.id;if(locked())return;
  guarded(()=>execute(()=>load(library.get(id))),'切換編輯中的賽道');
 });
 $('#cm-obstacles').addEventListener('toggle',event=>{
  const element=event.target;if(!element.matches('details[data-row]'))return;
  const o=draft.obstacles[Number(element.dataset.row)];if(o){if(element.open)openIds.add(o.id);else openIds.delete(o.id);}
 },true);
 $('#cm-obstacles').addEventListener('input',event=>{
  const field=event.target.dataset.field;if(!field||field==='type')return;
  const row=event.target.closest('[data-row]'),o=draft.obstacles[Number(row.dataset.row)];
  if(field==='enabled'){o.enabled=event.target.checked;row.classList.toggle('cm-disabled',!o.enabled);}
  else if(['s','phase','x'].includes(field))o[field]=event.target.value===''?'':Number(event.target.value);
  else o[field]=event.target.value;
  if(field==='label')row.querySelector('summary strong').textContent=o.label||getObstacleDefinition(o.type).label;
  if(field==='s')row.querySelector('summary span').textContent=`${o.s} / ${FINISH}`;
  mark();
 });
 $('#cm-obstacles').addEventListener('change',event=>{
  if(event.target.dataset.field!=='type')return;
  const o=draft.obstacles[Number(event.target.closest('[data-row]').dataset.row)],type=event.target.value,def=getObstacleDefinition(type);
  o.type=type;o.label=def.label;o.params={};o.paramsText='{}';o.x=0;openIds.add(o.id);render();
 });
 $('#cm-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file||locked())return;
  try{
   if(file.size>512*1024)throw new Error('賽道檔案需小於 512 KB。');
   const text=await file.text();if(locked())return;
   const imported=library.importCourse(text);load(imported);message('匯入完成並已儲存。按「使用賽道」切換本場。');onMessage('賽道已匯入此瀏覽器。');
  }catch(e){error(e.message||'無法匯入這個賽道檔案。');}
 });
 return {
  open(){if(locked()){onMessage('比賽進行期間無法切換賽道，請先重新準備賽事。');return;}load(library.selected);if(!dialog.open)dialog.showModal();$('#cm-catalog').focus();},
  close,
  refresh(){if(!dialog.open)source=null;else catalog();}
 };
}
