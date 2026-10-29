import {smooth} from './shared.js';

export default {
 type: 'rate', label: '429 RATE LIMIT',
 defaults: {period: 3.8, closedDuration: 2, transition: .2, laneCount: 4, laneSpacing: 5, barWidth: 4.05, phaseSpacing: .65, lift: 2.1},
 build(ctx, p, t, offset) {
  [-10.5, 10.5].forEach((x, j) => ctx.post(`post${j}`, x, 4.3));
  for (let j = 0; j < p.laneCount; j++) {
   const phase = (t + j * p.phaseSpacing + offset) % p.period;
   const raised = phase < p.closedDuration ? 1 : phase < p.closedDuration + p.transition ? 1 - smooth((phase - p.closedDuration) / p.transition) : phase < p.period - p.transition ? 0 : smooth((phase - p.period + p.transition) / p.transition);
   ctx.box(`bar${j}`, (j - (p.laneCount - 1) / 2) * p.laneSpacing, 0, .08 + p.lift * (1 - raised), .6, p.barWidth, .65, {role: 'rate', materialKey: 'hazard'});
  }
 },
 decorate(view) {
  view.host.box(21.6, .4, .7, view.host.materials.deep, 0, 4.3, 0, view.decor);
  view.sign(view.o.label, 0, 4.3, 8, 'PLEASE RETRY');
 }
};
