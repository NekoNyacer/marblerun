export default {
 type:'handoff',label:'設計交付蹺蹺板',
 // This is an in-plane balance arm, not a jumping/tilting rigid-body surface.
 defaults:{width:13,depth:.75,height:.85,swing:.64,speed:.45,pivotRadius:.55},
 build(ctx,p,t,phase){
  const clock=t*p.speed+phase*.8;
  ctx.add('pivot','circle',0,0,0,2.1,{r:p.pivotRadius,role:'post',materialKey:'metal'});
  ctx.box('balance-arm',0,0,.05,p.height,p.width,p.depth,{angle:p.swing*Math.sin(clock),omega:p.swing*p.speed*Math.cos(clock),role:'handoff',materialKey:'green'});
  // Contrasting end caps are part of the physical arm, never an extra visual
  // footprint outside the collision surface.
 },
 decorate(view){
  view.sign('DESIGN HANDOFF',0,4.1,7.8,view.o.label);
 }
};
