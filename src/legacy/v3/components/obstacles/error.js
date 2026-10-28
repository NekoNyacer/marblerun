import {liftWave} from './shared.js';

export default {
 type: 'error', label: '500 ERROR',
 defaults: {count: 3, spacing: 6, speed: 1.25, phaseSpacing: 2, width: 3.3, lift: 1.7},
 build(ctx, p, t, phase) {
  for (let j = 0; j < p.count; j++) ctx.box(`piston${j}`, (j - (p.count - 1) / 2) * p.spacing, 0, .08 + p.lift * (1 - liftWave(t * p.speed + j * p.phaseSpacing + phase)), .72, p.width, .75, {role: 'error', materialKey: 'hazard'});
 },
 decorate(view) {view.sign(view.o.label, -11.8, 2.4, 4.5, 'BUG DETECTED');}
};
