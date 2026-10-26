export const WIDTH=20, RADIUS=.38, FINISH=430, STEP=1/90;
export const PALETTE=['#2876df','#ef5b52','#00a76c','#9c5ad9','#efae26','#13b7c7','#ed83ae','#ed8936'];
export const OBSTACLES=[
 {s:36,type:'error',label:'500 ERROR'},
 {s:70,type:'gate',label:'Prompt Gate'},
 {s:105,type:'rotor',label:'Merge Conflict'},
 {s:144,type:'rate',label:'429 RATE LIMIT'},
 {s:184,type:'gate',label:'Credits Gate'},
 {s:220,type:'pendulum',label:'TIMEOUT'},
 {s:258,type:'error',label:'HOTFIX'},
 {s:295,type:'rotor',label:'Merge Conflict'},
 {s:334,type:'gate',label:'Fallback Gate'},
 {s:376,type:'rate',label:'429 RATE LIMIT'},
 {s:406,type:'pendulum',label:'FINAL TEST'}
];
export function center(s){return Math.sin(s/52)*12+Math.sin(s/24)*2;}
export function elevation(s){return 35-s*.058+Math.sin(s/45)*.4;}
export function position(s,x=0){return [center(s)+x,elevation(s),-s];}
export function gateState(t,index=0){const phase=(t+index*1.7)%10;return {leftClosed:phase<5,warning:phase%5>4.15,remaining:Math.ceil(5-phase%5)};}
export function rotorAngle(t,index=0){return t*.8+index*.9;}
export function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function shuffled(count,seed){const result=Array.from({length:count},(_,i)=>i),random=rng(seed);for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
