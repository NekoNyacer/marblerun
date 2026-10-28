export const WIDTH=20, RADIUS=.38, FINISH=430, STEP=1/90;
export function center(s){return Math.sin(s/52)*12+Math.sin(s/24)*2;}
export function centerSlope(s){return Math.cos(s/52)*12/52+Math.cos(s/24)*2/24;}
export function elevation(s){return 35-s*.058+Math.sin(s/45)*.4;}
export function position(s,x=0){return [center(s)+x,elevation(s),-s];}
