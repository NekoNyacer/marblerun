import {RaceSimulation} from './simulation.js';
import {STEP} from './world.js';
let race=null,running=false,last=0,acc=0,lastSent=0;
function send(){if(!race)return;const snap=race.snapshot();postMessage({type:'state',courseCount:race.course.length,...snap},[snap.data.buffer]);}
self.onmessage=({data:m})=>{
 if(m.type==='init'){race=new RaceSimulation(m.count,m.quota,m.seed,m.course);running=false;acc=0;send();}
 if(m.type==='run'){running=true;last=performance.now();}
 if(m.type==='pause'){running=false;acc=0;send();}
};
setInterval(()=>{const now=performance.now();if(race&&running){acc+=Math.min((now-last)/1000,.15);let n=0;while(acc>=STEP&&n++<18){race.step();acc-=STEP;if(race.done){running=false;break;}}if(now-lastSent>22||!running){send();lastSent=now;}}last=now;},8);
