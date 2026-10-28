export default {
 type:'code-review',label:'Code Review 分流器',
 defaults:{armLength:5.5,depth:.65,height:.85,opening:.68,swing:.35,speed:.55,spacing:3.8},
 build(ctx,p,t,phase){
  const clock=t*p.speed+phase*.7;
  // Two short, opposed fork stages. Each arm rotates around its outer post,
  // so the descriptor includes both angular and centre velocity.
  for(let stage=0;stage<2;stage++)for(const side of [-1,1]){
   const ds=(stage-.5)*p.spacing*2,px=side*5.2;
   const sign=stage? -1:1;
   const angle=side*(p.opening+sign*p.swing*Math.sin(clock));
   const omega=side*sign*p.swing*p.speed*Math.cos(clock);
   const half=p.armLength/2,offset=-side*half;
   const x=px+offset*Math.cos(angle),s=ds+offset*Math.sin(angle);
   ctx.add(`pivot${stage}-${side}`,'circle',px,ds,0,1.8,{r:.35,role:'post',materialKey:'metal'});
   ctx.box(`review${stage}-${side}`,x,s,.04,p.height,p.armLength,p.depth,{angle,omega,vx:-offset*Math.sin(angle)*omega,vs:offset*Math.cos(angle)*omega,role:'code-review',materialKey:stage?'amber':'deep'});
  }
 },
 decorate(view){
  view.sign('CODE REVIEW',-12.5,3.4,5.8,view.o.label);
  view.host.cylinder(.13,2.5,view.host.materials.metal,-12.5,1.25,0,view.decor);
 }
};
