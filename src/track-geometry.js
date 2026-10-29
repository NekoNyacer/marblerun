import {simSin,simCos} from './deterministic-math.js';
export const WIDTH=20, RADIUS=.38, FINISH=430, STEP=1/90;
export function center(s){return simSin(s/52)*12+simSin(s/24)*2;}
export function centerSlope(s){return simCos(s/52)*12/52+simCos(s/24)*2/24;}
export function elevation(s){return 35-s*.058+simSin(s/45)*.4;}
export function position(s,x=0){return [center(s)+x,elevation(s),-s];}
