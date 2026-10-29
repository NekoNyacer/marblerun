import {elevation} from '../../track-geometry.js';

export default {
 type: 'pegs', label: 'DEBUG PEGS',
 defaults: {rows: [[-8, -4, 0, 4, 8], [-6, -2, 2, 6], [-8, -4, 0, 4, 8], [-8.5, -5.1, -1.7, 1.7, 5.1, 8.5]], rowSpacing: 3.1, radius: .43, height: 1.15},
 build(ctx, p) {
  p.rows.forEach((xs, row) => xs.forEach((x, col) => ctx.trackAdd(`peg${row}-${col}`, 'circle', x, (row - (p.rows.length - 1) / 2) * p.rowSpacing, 0, p.height, {r: p.radius, role: 'peg', materialKey: 'deep'})));
 },
 decorate(view) {
  const {host} = view;
  view.sign(view.o.label, -12, 2.4, 4, 'PEG ZONE');
  host.cylinder(.12, 2.3, host.materials.deep, -12, 1.15, 0, view.decor);
  // Crown geometry stays above marble height; gameplay footprint is the shared peg solid.
  for (const shape of view.shapes) {
   const crown = host.cylinder(shape.r + .05, .12, host.materials.amber, 0, 0, 0, view.group);
   crown.position.set(shape.wx, elevation(shape.s) + shape.h - .05, -shape.s);
  }
 }
};
