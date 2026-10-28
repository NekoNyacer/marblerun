export default {
 type: 'pendulum', label: 'TIMEOUT',
 defaults: {amplitude: 7, speed: 1.3, radius: 1.05},
 build(ctx, p, t, phase) {
  [-10.5, 10.5].forEach((x, j) => ctx.post(`post${j}`, x, 7));
  ctx.add('head', 'sphere', Math.sin(t * p.speed + phase) * p.amplitude, 0, .04, p.radius * 2, {r: p.radius, vx: Math.cos(t * p.speed + phase) * p.amplitude * p.speed, role: 'pendulum', materialKey: 'amber'});
 },
 decorate(view) {
  const {host, decor} = view;
  host.box(21.6, .4, .7, host.materials.deep, 0, 7, 0, decor);
  view.sign(view.o.label, 0, 7.65, 6, 'RETRY...');
  view.rod = host.cylinder(.1, 4.75, host.materials.metal, 0, 4.5, 0, decor);
 },
 update(view, t, shapes) {view.rod.position.x = shapes.find(s => s.role === 'pendulum').wx - view.decor.position.x;}
};
