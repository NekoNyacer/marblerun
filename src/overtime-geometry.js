import {center,elevation} from './track-geometry.js';

// Shared by the contact solver and the rendered hardware. Coordinates are
// metres in a stationary world frame: x across the track, z downstream, y up.
export const STAIR_COUNT=6, STAIR_START=-14, STAIR_DEPTH=1.8, BOWL_CENTER=6.2;
export const STAIR_GEAR_RATIO=2.2, STAIR_SLOPE=.35, DECK_SLOPE=.18, THROAT_RADIUS=.9, BOWL_DEPTH=2.3, LOWER_DEPTH=2;
export const stairCenter=(o,n)=>o.s+STAIR_START+(n+.5)*STAIR_DEPTH;
// The crank amplifies actuator travel. A motor acceleration limit keeps a
// requested fast cycle from throwing every load off on the downstroke.
export const stairPeriod=p=>Math.max(p.period,Math.PI*2*Math.sqrt(p.amplitude*STAIR_GEAR_RATIO/4.4));
export const stairWave=(t,phase,p)=>Math.sin((t+phase*.23)*Math.PI*2/stairPeriod(p));
export const stairHeight=(n,t,phase,p)=>Math.max(n===0?-.35:.04,(n+.5)*p.rise+(n%2?-1:1)*(p.amplitude*STAIR_GEAR_RATIO)*stairWave(t,phase,p));
export function stairVelocity(n,t,phase,p){
 const raw=(n+.5)*p.rise+(n%2?-1:1)*p.amplitude*STAIR_GEAR_RATIO*stairWave(t,phase,p);
 return raw<=(n===0?-.35:.04)?0:(n%2?-1:1)*p.amplitude*STAIR_GEAR_RATIO*Math.PI*2/stairPeriod(p)*Math.cos((t+phase*.23)*Math.PI*2/stairPeriod(p));
}
export function overtimeGeometry(o,p){
 const base=elevation(o.s),high=p.rise*STAIR_COUNT,bowlX=center(o.s+BOWL_CENTER)-center(o.s),entryOffset=p.radius*.48,entryX=bowlX+entryOffset;
 const lipS=BOWL_CENTER-Math.sqrt(p.radius*p.radius-entryOffset*entryOffset),deckStart=STAIR_START+STAIR_COUNT*STAIR_DEPTH;
 const lipY=base+high-1,depthScale=Math.min(1,(high-1-.8)/(BOWL_DEPTH+LOWER_DEPTH));
 const deckY=z=>lipY+DECK_SLOPE*(lipS-z);
 return {originX:center(o.s),base,high,entryX,lipS,lipY,deckStart,deckY,
  bowlX,bowlS:BOWL_CENTER,
  throatY:lipY-BOWL_DEPTH*depthScale,exitY:lipY-(BOWL_DEPTH+LOWER_DEPTH)*depthScale,
  guides:[[-9.65,deckStart,entryX-1.2,lipS],[9.65,deckStart,entryX+1.2,lipS]],
  steps:Array.from({length:STAIR_COUNT},(_,n)=>({n,z:STAIR_START+(n+.5)*STAIR_DEPTH,x:center(stairCenter(o,n))-center(o.s),base:elevation(stairCenter(o,n))}))};
}
