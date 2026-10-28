export default {
 type: 'finish', label: 'DEPLOY SUCCESS', defaults: {},
 build(ctx) {[-10.5, 10.5].forEach((x, j) => ctx.box(`post${j}`, x, 0, 0, 7, .8, .8, {role: 'post'}));},
 decorate(view) {
  const {host, decor} = view;
  host.box(21, 1.7, 1, host.materials.deep, 0, 7, 0, decor);
  const sign = host.screen(view.o.label, 15, 1.5, 'FINISH', decor);
  sign.position.set(0, 7, .56);
 }
};
