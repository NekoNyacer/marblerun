import './course-manager.css';
import {OBSTACLE_COMPONENTS,getObstacleDefinition} from './components/obstacles/index.js';
import {COURSE_SLOTS,MECHANISM_INFO,isSlottedCourse,convertToSlots,slotEntry} from './course-slots.js';
import {FINISH} from './track-geometry.js';
import {icon} from './icons.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>structuredClone(value);
const types=Object.values(OBSTACLE_COMPONENTS).filter(def=>def.type!=='finish');
const groups=[['all','全部'],['impact','碰撞'],['timing','時機'],['http','HTTP'],['bug','漏洞']];
const infoFor=type=>MECHANISM_INFO[type]??{name:getObstacleDefinition(type).label,group:'impact',description:'在這個固定位置放入機關，改變隊伍通過的順序。'};
function glyph(type){
 const paths={
  empty:'<circle cx="32" cy="24" r="14" stroke-dasharray="3 4"/><path d="M25 24h14m-7-7v14"/>',
  pegs:'<g fill="currentColor" stroke="none"><circle cx="20" cy="12" r="4"/><circle cx="44" cy="12" r="4"/><circle cx="12" cy="27" r="4"/><circle cx="32" cy="27" r="4"/><circle cx="52" cy="27" r="4"/><circle cx="22" cy="41" r="4"/><circle cx="43" cy="41" r="4"/></g>',
  gate:'<path d="M6 7v34m52-34v34M7 25h22m6 0h22M29 8v34"/><path d="m41 10 5 5-5 5m-21 9-5 5 5 5"/>',
  rotor:'<circle cx="32" cy="24" r="4" fill="currentColor"/><path d="m11 9 42 30M13 38 51 10M45 4l8 5-1 9M19 44l-8-5 1-9"/>',
  error:'<path d="M6 36h52M13 35V17h12v18m14 0V7h12v28M14 10l5-5 5 5m16 29 5 5 5-5"/>',
  rate:'<path d="M8 7v34m48-34v34M8 18h16m5 0h11m5 0h11M8 31h11m5 0h16m5 0h11"/><circle cx="32" cy="24" r="5"/>',
  pendulum:'<path d="M10 7h44M32 7l13 26"/><circle cx="47" cy="36" r="8" fill="currentColor" fill-opacity=".2"/><path d="M10 27a28 28 0 0 0 15 15"/>',
  'scope-change':'<path d="M6 7v35m52-35v35M6 14l19 14M58 29 39 40M27 7v13m-5-5 5 5 5-5M35 30v13m-5-5 5 5 5-5"/>',
  sprint:'<path d="M7 10h50M9 10v29m46-29v29M17 10v15m10-15v15m10-15v15m10-15v15M27 34l5 5 5-5m-5-5v10"/>',
  'ux-flow':'<path d="M6 7v35m52-35v35M7 10l25 8M57 24l-25 8M7 37l17 5"/><path d="m36 9 7 3-3 7M28 24l-7 3 3 7"/>',
  handoff:'<path d="M5 38h54M14 10l36 25"/><circle cx="32" cy="23" r="4" fill="currentColor"/><path d="m12 8 9-1m-9 1 1 9m39 20-9 1m9-1-1-9"/>',
  'code-review':'<path d="M5 5v38m54-38v38"/><path d="m9 34 17-16m29 16L38 18" stroke-width="7"/><circle cx="9" cy="34" r="4" fill="currentColor"/><circle cx="55" cy="34" r="4" fill="currentColor"/><path d="M32 7v26m-4-4 4 5 4-5"/>',
  'not-found':'<path d="M5 7v33h15V22m39-15v33H44V22M29 7v34m6-34v34M9 29l7 7m0-7-7 7m39-7 7 7m0-7-7 7"/>',
  teapot:'<path d="M20 20h23v12a11 11 0 0 1-23 0V20Zm4-5h15m-10-4h6M20 23 8 19l6 14h7m22-11h7c9 0 9 13 0 13h-7M26 5l-2 3m12-3-2 3"/>',
  'node-hole':'<ellipse cx="32" cy="25" rx="22" ry="14" fill="currentColor" fill-opacity=".13"/><ellipse cx="32" cy="25" rx="22" ry="14"/><circle cx="26" cy="27" r="5" fill="currentColor"/><circle cx="39" cy="24" r="5" fill="currentColor"/><path d="M32 3v10m-4-4 4 4 4-4"/>',
  'java-hole':'<path d="M6 13h52v23H6z" fill="currentColor" fill-opacity=".13"/><path d="M6 13h52v23H6zM14 28l5-5 5 5m-5-5v17m14-12 5-5 5 5m-5-5v17M13 6h38"/>',
  'dotnet-hole':'<path d="M11 7h42M11 41h42M15 7c0 12 17 10 17 17s-17 6-17 17M49 7c0 12-17 10-17 17s17 6 17 17"/><path d="M21 16c15-8 29 7 7 10m-5-2 5 2-2 5"/>',
 };
 return `<svg class="cm-glyph" viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type]??paths.rotor}</svg>`;
}

export function mountCourseManager({library,onApply,onMessage=()=>{},isLocked=()=>false}){
 const dialog=document.createElement('dialog');dialog.id='course-dialog';dialog.className='course-manager';dialog.setAttribute('aria-labelledby','cm-title');
 dialog.innerHTML=`
  <div class="dialog-header"><div><h2 id="cm-title">選一條賽道，組一場好戲</h2><p class="cm-subtitle">點選路線上的位置，再挑選機關。每一站的位置都已安排好。</p></div><button type="button" class="dialog-close" data-cm="close" aria-label="關閉賽道管理">${icon('close')}</button></div>
  <div class="cm-confirm" role="alert" hidden><p></p><div><button type="button" class="btn" data-cm="keep">保留編輯</button><button type="button" class="btn" data-cm="confirm">放棄變更並繼續</button></div></div>
  <div class="cm-body">
   <aside class="cm-library"><label for="cm-catalog">選擇賽道</label><select id="cm-catalog" size="8" aria-label="選擇已儲存的賽道"></select><p>內建賽道可直接比賽，也能另存成自己的版本。</p><button type="button" class="btn" data-cm="import">${icon('upload')}匯入賽道 JSON</button><input id="cm-file" type="file" accept=".json,application/json" hidden aria-label="匯入賽道 JSON"><button type="button" class="small-link cm-delete" data-cm="delete">刪除此個人賽道</button><p class="cm-storage-note">賽道保留在此瀏覽器。匯出 JSON，即可備份或帶到另一台電腦。</p></aside>
   <section class="cm-editor" aria-label="視覺化賽道編輯器">
    <div class="cm-name-row"><div class="field"><label for="cm-name">賽道名稱</label><input id="cm-name" maxlength="60" required autocomplete="off"></div><span id="cm-draft-state" role="status"></span></div>
    <div class="cm-track-summary"><p id="cm-summary"></p><p id="cm-risk"></p></div>
    <div id="cm-legacy" class="cm-legacy" hidden><div><strong>這條賽道使用自由位置</strong><p>原本的配置可以直接使用、備份。建立固定位置副本後，就能用下方的視覺化方式編輯。</p></div><button type="button" class="btn" data-cm="convert">建立固定位置副本</button></div>
    <div class="cm-workbench"><div class="cm-route-wrap"><div class="cm-map-heading"><h3>賽道路線</h3><span>起點 → 終點</span></div><div id="cm-route" class="cm-route"></div></div><section id="cm-palette" class="cm-palette" aria-label="選擇機關"></section></div>
   </section>
  </div>
  <div class="cm-feedback"><p id="cm-error" role="alert" hidden></p><p id="cm-message" role="status" hidden></p></div>
  <div class="dialog-footer"><button type="button" class="btn" data-cm="export">${icon('download')}匯出 JSON</button><button type="button" class="btn" data-cm="copy">另存新賽道</button><button type="button" class="btn btn-primary" data-cm="apply">使用賽道</button></div>`;
 document.body.appendChild(dialog);
 const $=selector=>dialog.querySelector(selector),mobile=window.matchMedia('(max-width:760px)');
 const resizeCatalog=()=>{$('#cm-catalog').size=mobile.matches?1:8;};resizeCatalog();mobile.addEventListener('change',resizeCatalog);
 let source=null,draft=null,baseline='',pending=null,selectedSlot=0,filter='all';
 const snapshot=()=>JSON.stringify(draft),dirty=()=>draft&&snapshot()!==baseline;
 const fixed=()=>isSlottedCourse(draft.obstacles);
 const slotObstacle=index=>draft.obstacles.find(o=>o.type!=='finish'&&o.s===COURSE_SLOTS[index]&&o.enabled!==false);
 const locked=()=>{if(!isLocked())return false;error('本場比賽已開始，請先重新準備，再切換賽道。');return true;};
 function error(text){$('#cm-error').textContent=text;$('#cm-error').hidden=false;$('#cm-message').hidden=true;}
 function message(text){$('#cm-message').textContent=text;$('#cm-message').hidden=false;$('#cm-error').hidden=true;}
 function clearFeedback(){$('#cm-error').hidden=true;$('#cm-message').hidden=true;}
 function hideConfirmation(){pending=null;$('.cm-confirm').hidden=true;}
 function ask(action,text,confirmLabel='放棄變更並繼續',keepLabel='保留編輯'){
  pending=action;$('.cm-confirm p').textContent=text;$('.cm-confirm').hidden=false;$('[data-cm="confirm"]').textContent=confirmLabel;$('[data-cm="keep"]').textContent=keepLabel;$('[data-cm="keep"]').focus();
 }
 function guarded(action,what){if(dirty())ask(action,`尚有未儲存的變更。要放棄變更並${what}嗎？`);else action();}
 function catalog(){
  $('#cm-catalog').innerHTML=[true,false].map(builtin=>`<optgroup label="${builtin?'內建主題賽道':'我的賽道'}">${library.list().filter(t=>t.builtin===builtin).map(t=>`<option value="${escape(t.id)}">${escape(t.name)}${t.id===library.selectedId?'（使用中）':''}</option>`).join('')}</optgroup>`).join('');
  if(source)$('#cm-catalog').value=source.id;
 }
 function load(track){
  if(!track)throw new Error('找不到這條賽道，請重新選擇。');
  source=clone(track);draft={name:track.name,obstacles:clone(track.obstacles)};baseline=snapshot();selectedSlot=0;filter='all';hideConfirmation();clearFeedback();render();
 }
 function mark(){
  const changed=dirty(),active=draft.obstacles.filter(o=>o.type!=='finish'&&o.enabled!==false),risky=active.filter(o=>['not-found','node-hole'].includes(o.type)).length;
  $('#cm-draft-state').textContent=changed?'尚未儲存':source.builtin?'內建範本':'已儲存';$('#cm-draft-state').classList.toggle('cm-unsaved',!!changed);$('[data-cm="apply"]').textContent=changed?'儲存並使用':'使用賽道';
  $('#cm-summary').textContent=`${active.length} 個機關${fixed()?` / ${COURSE_SLOTS.length} 個固定位置`:''} · 全長 ${FINISH}`;
  $('#cm-risk').textContent=risky?`${risky} 站含淘汰或填洞犧牲`:'所有機關都保留通關機會';$('#cm-risk').classList.toggle('cm-has-risk',!!risky);
 }
 function renderRoute(){
  if(!fixed()){
   $('#cm-route').className='cm-route cm-route-legacy';$('#cm-route').innerHTML=`<div class="cm-route-end">起跑</div>${draft.obstacles.filter(o=>o.type!=='finish').map(o=>`<div class="cm-legacy-stop${o.enabled===false?' cm-empty':''}">${glyph(o.type)}<span><strong>${escape(o.label||infoFor(o.type).name)}</strong><small>位置 ${escape(o.s)}${o.enabled===false?' · 已停用':''}</small></span></div>`).join('')}<div class="cm-route-end">Deploy 終點</div>`;return;
  }
  $('#cm-route').className='cm-route';$('#cm-route').innerHTML=`<div class="cm-route-end"><span class="cm-start-dot"></span>起跑</div><ol>${COURSE_SLOTS.map((s,index)=>{
   const o=slotObstacle(index),info=o?infoFor(o.type):null;
   return `<li><button type="button" class="cm-stop${selectedSlot===index?' cm-selected':''}${o?'':' cm-empty'}" data-slot="${index}" aria-pressed="${selectedSlot===index}" aria-label="位置 ${index+1}：${escape(info?.name??'空白直線')}"><span class="cm-stop-number">${String(index+1).padStart(2,'0')}</span>${glyph(o?.type??'empty')}<span class="cm-stop-label">${escape(info?.name??'空白直線')}${info?.danger?`<small>${escape(info.danger)}</small>`:''}</span></button></li>`;
  }).join('')}</ol><div class="cm-route-end cm-finish-dot">${icon('check')}Deploy 終點</div>`;
 }
 function renderPalette(){
  if(!fixed()){$('#cm-palette').innerHTML=`<div class="cm-legacy-explanation">${glyph('gate')}<h3>保留原配置，隨時可開賽</h3><p>這是先前儲存的自由位置賽道。建立固定位置副本後，可點選每一站來更換機關。</p><p>副本最多保留 12 個機關，並使用各機關的預設設定；原賽道會完整保留。</p></div>`;return;}
  const selected=slotObstacle(selectedSlot),info=selected?infoFor(selected.type):{name:'空白直線',description:'留下一段衝刺空間，讓剛闖關的隊伍重新集結。'};
  $('#cm-palette').innerHTML=`<div class="cm-selected-detail"><div class="cm-detail-icon">${glyph(selected?.type??'empty')}</div><div><span>位置 ${String(selectedSlot+1).padStart(2,'0')}</span><h3>${escape(info.name)}</h3></div><p>${escape(info.description)}</p>${info.danger?`<strong class="cm-danger-note">${escape(info.danger==='淘汰'?'進入死路的彈珠會淘汰':'先落坑的彈珠會永久留在坑內')}</strong>`:''}</div><div class="cm-palette-heading"><h4>這一站放什麼？</h4><div class="cm-filter" aria-label="篩選機關">${groups.map(([key,label])=>`<button type="button" data-filter="${key}" aria-pressed="${filter===key}">${label}</button>`).join('')}</div></div><div class="cm-type-list">${filter==='all'?`<button type="button" class="cm-type${!selected?' cm-type-selected':''}" data-type="empty" aria-pressed="${!selected}">${glyph('empty')}<span>空白直線</span>${!selected?icon('check'):''}</button>`:''}${types.filter(def=>filter==='all'||infoFor(def.type).group===filter).map(def=>{
    const info=infoFor(def.type),active=selected?.type===def.type;
    return `<button type="button" class="cm-type${active?' cm-type-selected':''}" data-type="${escape(def.type)}" aria-pressed="${active}">${glyph(def.type)}<span>${escape(info.name)}${info.danger?`<small>${escape(info.danger)}</small>`:''}</span>${active?icon('check'):''}</button>`;
   }).join('')}</div><p class="cm-edit-hint">點選機關立即替換。位置、大小與運作方式已設定好，按「儲存並使用」套用本場賽事。</p>`;
 }
 function render(){catalog();$('#cm-name').value=draft.name;$('[data-cm="delete"]').hidden=!!source.builtin;$('#cm-legacy').hidden=fixed();renderRoute();renderPalette();mark();}
 function downloadDraft(){
  const exported=library.exportDraft(clone(draft)),blob=new Blob([JSON.stringify(exported,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${draft.name.trim().replace(/[\\/:*?"<>|]/g,'-')||'marblerun'}-賽道.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('已匯出目前賽道。到另一個瀏覽器匯入 JSON，即可繼續使用。');
 }
 function execute(action){try{clearFeedback();action();}catch(e){error(e.message||'操作失敗，請稍後重試。');}}
 function close(){if(dialog.open)guarded(()=>dialog.close(),'關閉賽道管理');}
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',hideConfirmation);
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();return;}
  const button=event.target.closest('button');if(!button)return;
  execute(()=>{
   const action=button.dataset.cm;
   if(action==='close'){close();return;}if(action==='keep'){hideConfirmation();return;}if(action==='confirm'){const task=pending;hideConfirmation();task?.();return;}if(action==='export'){downloadDraft();return;}if(locked())return;
   if(button.dataset.slot!==undefined){selectedSlot=Number(button.dataset.slot);renderRoute();renderPalette();if(mobile.matches)$('#cm-palette').scrollIntoView({block:'start'});return;}
   if(button.dataset.filter){filter=button.dataset.filter;renderPalette();return;}
   if(button.dataset.type){
    if(!fixed())return;const type=button.dataset.type,s=COURSE_SLOTS[selectedSlot];if((slotObstacle(selectedSlot)?.type??'empty')===type)return;draft.obstacles=draft.obstacles.filter(o=>o.type==='finish'||o.s!==s);if(type!=='empty')draft.obstacles.push(slotEntry(type,selectedSlot));draft.obstacles.sort((a,b)=>a.s-b.s);renderRoute();renderPalette();mark();return;
   }
   if(action==='convert'){
    const conversion=convertToSlots(draft.obstacles);
    ask(()=>{const saved=library.save({name:`${draft.name}・固定位置版`.slice(0,60),obstacles:conversion.obstacles});load(saved);message('已建立固定位置副本，原賽道完整保留。現在可點選路線更換機關。');},`將建立新副本：保留 ${conversion.retained} 個機關${conversion.removed?`，略過另外 ${conversion.removed} 個`:''}，安排到固定位置並使用機關預設設定。原賽道不會被覆寫。`,'建立副本','保留原配置');return;
   }
   if(action==='import'){guarded(()=>$('#cm-file').click(),'匯入其他賽道');return;}
   if(action==='copy'){const saved=library.save(clone(draft));load(saved);message('已另存為個人賽道。按「使用賽道」切換本場。');onMessage('已另存新的個人賽道。');return;}
   if(action==='apply'){const selected=dirty()?library.saveAndSelect({...clone(draft),id:source.id}):library.select(source.id);onApply(selected);load(selected);dialog.close();onMessage(`已切換至「${selected.name}」。`);return;}
   if(action==='delete'){
    if(source.builtin)return;const id=source.id,name=source.name;
    ask(()=>{const active=library.selectedId===id;library.delete(id);if(active)onApply(library.selected);load(library.selected);message(`已刪除「${name}」。`);},`刪除個人賽道「${name}」？${dirty()?'未儲存的變更也會放棄。':''}如需備份，請先匯出 JSON。`,'刪除此賽道','保留賽道');
   }
  });
 });
 $('#cm-route').addEventListener('keydown',event=>{
  if(!fixed()||!['ArrowDown','ArrowUp'].includes(event.key))return;event.preventDefault();selectedSlot=(selectedSlot+(event.key==='ArrowDown'?1:-1)+COURSE_SLOTS.length)%COURSE_SLOTS.length;renderRoute();renderPalette();$(`[data-slot="${selectedSlot}"]`).focus();
 });
 $('#cm-name').addEventListener('input',event=>{draft.name=event.target.value;mark();});
 $('#cm-catalog').addEventListener('change',event=>{const id=event.target.value;event.target.value=source.id;if(locked())return;guarded(()=>execute(()=>load(library.get(id))),'切換賽道');});
 $('#cm-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file||locked())return;
  try{if(file.size>512*1024)throw new Error('賽道檔案需小於 512 KB。');const text=await file.text();if(locked())return;const imported=library.importCourse(text);load(imported);message('匯入完成，已保留完整配置。按「使用賽道」切換本場。');onMessage('賽道已匯入此瀏覽器。');}catch(e){error(e.message||'無法匯入這個賽道檔案。');}
 });
 return {open(){if(locked()){onMessage('比賽進行期間無法切換賽道，請先重新準備賽事。');return;}load(library.selected);if(!dialog.open)dialog.showModal();$('#cm-catalog').focus();},close,refresh(){if(!dialog.open)source=null;else catalog();}};
}
