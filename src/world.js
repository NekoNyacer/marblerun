import {COURSE_CONFIG} from './course-config.js';
import {createCourse} from './course.js';
export {WIDTH,RADIUS,FINISH,STEP,center,centerSlope,elevation,position} from './track-geometry.js';
export {gateState} from './components/obstacles/gate.js';
export {rotorAngle} from './components/obstacles/rotor.js';
export const MODEL_VERSION='banyan-constrained-rolling-v5';
export const PALETTE=['#2876df','#ef5b52','#00a76c','#9c5ad9','#efae26','#13b7c7','#ed83ae','#ed8936'];
export const OBSTACLES=createCourse(COURSE_CONFIG);
export function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function shuffled(count,seed){const result=Array.from({length:count},(_,i)=>i),random=rng(seed);for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
