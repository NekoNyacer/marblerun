export function parseRows(rows){
 const nonempty=rows.filter(r=>r.some(v=>String(v??'').trim()));if(!nonempty.length)throw new Error('這份工作表是空的，請加入姓名後重新匯入。');
 const header=nonempty[0].map(v=>String(v??'').replace(/^\uFEFF/,'').trim());
 const find=(terms)=>header.findIndex(s=>terms.some(t=>s.toLowerCase()===t.toLowerCase()));
 let nameCol=find(['姓名','名字','員工姓名','同仁姓名','name','full name']),idCol=find(['員工編號','員編','工號','id','employee id']),deptCol=find(['部門','單位','department','dept']);
 const hasHeader=nameCol>=0;if(!hasHeader){nameCol=0;idCol=-1;deptCol=-1;}
 const entries=[],ids=new Set();let duplicateNames=0;const names=new Set();
 for(let n=hasHeader?1:0;n<nonempty.length;n++){
  const r=nonempty[n],name=String(r[nameCol]??'').trim();if(!name)continue;if(name.length>60)throw new Error(`第 ${n+1} 列姓名超過 60 字，請檢查姓名欄位。`);
  const id=idCol>=0?String(r[idCol]??'').trim():'';if(id&&ids.has(id))throw new Error(`員工編號「${id}」重複，請先修正名單。`);if(id)ids.add(id);
  if(names.has(name))duplicateNames++;names.add(name);entries.push({id:id||`P${String(entries.length+1).padStart(4,'0')}`,name,dept:deptCol>=0?String(r[deptCol]??'').trim():''});
 }
 if(!entries.length)throw new Error('找不到姓名，請使用「姓名」欄位，或將姓名放在第一欄。');
 if(entries.length>1500)throw new Error(`這份名單有 ${entries.length} 人，目前單場支援上限為 1,500 人。`);
 return {entries,duplicateNames};
}
export function demoParticipants(count=1500){
 const surnames=['林','陳','王','李','張','黃','吳','劉','蔡','楊','許','鄭','謝','郭','洪','曾','邱','廖','賴','徐'];const first=['柏','怡','冠','佳','哲','品','承','雅','宇','子','思','宥','昱','家','詠'];const last=['宇','君','廷','蓉','維','瑄','翰','婷','安','恩','軒','晴','傑'];
 const known=['林柏宇','陳怡君','王冠廷','李佳蓉','張哲維','黃品瑄','吳承翰','劉雅婷'];
 return Array.from({length:count},(_,i)=>({id:`IT${String(i+1).padStart(4,'0')}`,name:known[i]||surnames[i%surnames.length]+first[Math.floor(i/surnames.length)%first.length]+last[Math.floor(i/(surnames.length*first.length))%last.length],dept:['資訊開發','系統維運','數位金融','資訊安全'][i%4]}));
}
