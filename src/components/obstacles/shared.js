import {simSin,simHypot} from '../../deterministic-math.js';
import {center} from '../../track-geometry.js';

export const smooth = x => x * x * (3 - 2 * x);
export const liftWave = t => smooth(Math.max(0, Math.min(1, (simSin(t) + .18) / .36)));

// Every component describes its solids here; rendering and physics use the same result.
// x is relative to the obstacle's origin; trackBox/trackAdd follow the road at ds.
export function createShapeBuilder(o, k) {
 const shapes = [], origin = center(o.s) + (o.x ?? 0);
 const add = (id, kind, x, ds, y, h, props = {}) => {
  const shape = {id: `${o.id ?? k}:${id}`, kind, wx: origin + x, s: o.s + ds, y, h, angle: 0, role: 'bar', ...props};
  shape.reach = kind === 'box' ? simHypot(shape.w / 2, shape.d / 2) : shape.r;
  shapes.push(shape);
  return shape;
 };
 const box = (id, x, ds, y, h, w, d, props = {}) => add(id, 'box', x, ds, y, h, {w, d, ...props});
 const post = (id, x, h) => box(id, x, 0, 0, h, .6, .7, {role: 'post'});
 const trackAdd = (id, kind, x, ds, y, h, props = {}) => add(id, kind, x + center(o.s + ds) - center(o.s), ds, y, h, props);
 const trackBox = (id, x, ds, y, h, w, d, props = {}) => trackAdd(id, 'box', x, ds, y, h, {w, d, ...props});
 return {shapes, origin, o, k, add, box, post, trackAdd, trackBox};
}
