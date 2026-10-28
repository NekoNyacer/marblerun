import {smooth} from './shared.js';

export function gateState(t, index = 0, {period = 10, switchDuration = .4, warningLead = .85} = {}) {
 const phase = (t + index * 1.7) % period, half = period / 2;
 const leftLift = phase < half - switchDuration ? 0 : phase < half ? smooth((phase - half + switchDuration) / switchDuration) : phase < period - switchDuration ? 1 : 1 - smooth((phase - period + switchDuration) / switchDuration);
 return {leftClosed: leftLift < .31, rightClosed: 1 - leftLift < .31, leftLift, rightLift: 1 - leftLift, warning: phase % half > half - warningLead, remaining: Math.ceil(half - phase % half)};
}

export default {
 type: 'gate', label: 'Credits Gate',
 defaults: {period: 10, switchDuration: .4, warningLead: .85, laneX: 5, barWidth: 9.1, lift: 2.1, dividerLength: 5},
 notice(t,phase,p) {
  const g=gateState(t,phase,p);
  return {key:`${g.leftClosed}-${g.warning}`,text:g.warning?'通道即將切換！請留意閘門燈號，備援路線準備開放。':g.leftClosed?'Credits 用盡！左側主通道關閉，右側 Fallback 閘門開放。':'Credits 已補充！左側主通道恢復，右側備援閘門關閉。'};
 },
 build(ctx, p, t, phase) {
  [-10.5, 0, 10.5].forEach((x, j) => ctx.post(`post${j}`, x, 5.8));
  ctx.box('divider', 0, 0, 0, .65, .55, p.dividerLength, {role: 'divider'});
  const state = gateState(t, phase, p);
  [-p.laneX, p.laneX].forEach((x, j) => ctx.box(`bar${j}`, x, 0, .1 + p.lift * (j ? state.rightLift : state.leftLift), .55, p.barWidth, .55, {role: 'gate', lane: j, materialKey: 'hazard'}));
 },
 decorate(view, p) {
  const {host, decor} = view;
  host.box(21.6, .4, .7, host.materials.deep, 0, 5.8, 0, decor);
  view.sign('ChatGPT', 0, 5.8, 6.3, view.o.label);
  view.gateSigns = [0, 1].map(j => {
   const x = j ? p.laneX : -p.laneX;
   return {closed: view.sign(j ? 'FALLBACK' : 'CREDITS 0', x, 3.8, 7, 'CLOSED', true), open: view.sign(j ? 'FALLBACK' : 'CREDITS OK', x, 3.8, 7, 'OPEN')};
  });
 },
 update(view, t, shapes, p) {
  const state = gateState(t, view.phase, p);
  view.gateSigns.forEach((sign, j) => {
   const closed = j ? state.rightClosed : state.leftClosed;
   sign.closed.face.visible = sign.closed.backing.visible = closed;
   sign.open.face.visible = sign.open.backing.visible = !closed;
  });
 }
};
