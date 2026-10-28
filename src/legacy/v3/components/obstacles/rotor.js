export function rotorAngle(t, index = 0, {speed = .8} = {}) {return t * speed + index * .9;}

export default {
 type: 'rotor', label: 'Merge Conflict',
 defaults: {length: 15, speed: .8, thickness: .6},
 build(ctx, p, t, phase) {
  ctx.add('base', 'circle', 0, 0, 0, .4, {r: .95, role: 'base'});
  ctx.add('axle', 'circle', 0, 0, .4, 2.7, {r: .48, role: 'post'});
  ctx.box('blade', 0, 0, .12, .65, p.length, p.thickness, {angle: rotorAngle(t, phase, p), omega: p.speed, role: 'rotor', materialKey: 'hazard'});
 },
 decorate(view) {view.sign('>_ Codex', 0, 3.7, 4.5, view.o.label);}
};
