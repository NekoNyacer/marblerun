import {FINISH} from './track-geometry.js';

// Legacy entries remain readable in old saved tracks, but cannot be newly placed.
export const DEPRECATED_MECHANISMS=new Set(['not-found','node-hole','java-hole','dotnet-hole']);

// Hosts compose races by choosing hardware, not by tuning geometry.
export const COURSE_SLOTS=Object.freeze([26,59,92,125,158,191,224,257,290,323,356,389]);
export function slotEntry(type,index){
 return {id:`slot-${String(index+1).padStart(2,'0')}`,type,s:COURSE_SLOTS[index],phase:index*1.37,x:0,params:{}};
}
export function slottedCourse(types){
 return [...types.flatMap((type,index)=>type?[slotEntry(type,index)]:[]),{id:'finish',s:FINISH,type:'finish',label:'DEPLOY SUCCESS',phase:16}];
}
export function isSlottedCourse(entries){
 const occupied=new Set();
 return entries.filter(o=>o.type!=='finish').every(o=>{
  if(!COURSE_SLOTS.includes(o.s)||o.x&&o.x!==0||occupied.has(o.s))return false;
  occupied.add(o.s);return true;
 });
}
export function convertToSlots(entries){
 const disabled=entries.filter(o=>o.type!=='finish'&&o.enabled===false).length;
 const active=entries.filter(o=>o.type!=='finish'&&o.enabled!==false).sort((a,b)=>a.s-b.s);
 const eligible=active.filter(o=>!DEPRECATED_MECHANISMS.has(o.type));
 const deprecated=active.length-eligible.length;
 const retained=eligible.length>COURSE_SLOTS.length?COURSE_SLOTS.map((_,i)=>eligible[Math.round(i*(eligible.length-1)/(COURSE_SLOTS.length-1))]):eligible;
 const result=[];let previous=-1;
 retained.forEach((o,index)=>{
  const desired=COURSE_SLOTS.reduce((best,s,i)=>Math.abs(s-o.s)<Math.abs(COURSE_SLOTS[best]-o.s)?i:best,0);
  const chosen=Math.max(previous+1,Math.min(COURSE_SLOTS.length-(retained.length-index),desired));
  result.push(slotEntry(o.type,chosen));previous=chosen;
 });
 return {obstacles:[...result.sort((a,b)=>a.s-b.s),{id:'finish',s:FINISH,type:'finish',label:'DEPLOY SUCCESS',phase:16}],retained:retained.length,removed:active.length-retained.length,deprecated,disabled};
}

export const MECHANISM_INFO=Object.freeze({
 pegs:{name:'Debug 碰撞柱',group:'impact',description:'錯列碰撞柱打散隊伍，靠彈跳與碰撞重新分流。'},
 gate:{name:'Credits 雙通道',group:'timing',description:'左右交替開門，選對通道與時機才能搶先通過。'},
 rotor:{name:'Merge 旋轉板',group:'impact',description:'旋轉擋板改變前進方向，靠近時可能被反彈。'},
 error:{name:'500 升降障礙',group:'http',description:'伺服器突然出錯！升降路障間歇封路。'},
 rate:{name:'429 流量限制',group:'http',description:'分段閘門輪流放行，領先群也可能遇上塞車。'},
 pendulum:{name:'Timeout 擺錘',group:'impact',description:'左右移動的大撞球，讓領先者重新選擇路線。'},
 'scope-change':{name:'需求變更',group:'timing',description:'兩側導流板把沿護欄行進的彈珠推回中央。'},
 sprint:{name:'Sprint 截止閘',group:'timing',description:'趕上開門時機就能突破；錯過只能等下一次。'},
 'ux-flow':{name:'UX 卡片迷宮',group:'timing',description:'交錯擋板串成多段迷宮，彈珠需要轉向尋找通路。'},
 handoff:{name:'設計交付擺臂',group:'impact',description:'擺動交付板橫掃通道，可能幫忙加速也可能擋路。'},
 'code-review':{name:'Code Review 推板',group:'impact',description:'雙側太空彈珠推板不定期回擊，中央縫隙是通關機會。'},
 'not-found':{name:'404 Not Found',group:'http',danger:'淘汰',description:'走進兩側死路就找不到出口，該彈珠會被淘汰。'},
 teapot:{name:"418 I'm a teapot",group:'http',description:'HTTP 418 的意思是「我是茶壺」！兩組障礙柱會在茶壺前方交替從地面升起。'},
 'overtime-stairs':{name:'樓梯與加班沙漏',group:'challenge',description:'電梯故障，請走樓梯！交錯升降階梯送彈珠到高處，通過碰撞柱後進入加班沙漏旋轉，最後落回賽道。'},
 'node-hole':{name:'Node.js 小漏洞',group:'bug',danger:'填洞犧牲',description:'先掉入的小隊會卡住並填平坑洞，替後面的彈珠鋪路。'},
 'java-hole':{name:'Java 大漏洞',group:'bug',description:'整條賽道都在等修復！坑洞累積足夠彈珠後，全員一起被推回賽道。'},
 'dotnet-hole':{name:'舊版加班沙漏',group:'bug',description:'落入沙漏的彈珠繞著中心旋轉，等待修復後再出發，名次可能大洗牌。'}
});
