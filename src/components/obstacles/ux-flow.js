import {center} from '../../track-geometry.js';

function card(ctx,id,x1,s1,x2,s2,p,materialKey){
 const ax=center(ctx.o.s+s1)+x1,bx=center(ctx.o.s+s2)+x2,dx=bx-ax,ds=s2-s1;
 const length=Math.hypot(dx,ds),angle=Math.atan2(ds,dx),x=(ax+bx)/2-ctx.origin,s=(s1+s2)/2;
 const half=(length-p.thickness)/2;
 ctx.box(id,x,s,.04,p.height,length-p.thickness,p.thickness,{angle,role:'ux-card',materialKey});
 for(const side of [-1,1])ctx.add(`${id}-cap${side}`,'circle',x+side*half*Math.cos(angle),s+side*half*Math.sin(angle),.04,p.height,{r:p.thickness/2,role:'ux-card',materialKey});
}

export default {
 type:'ux-flow',label:'UX Flow 卡片迷宮',
 defaults:{wallX:10.7,innerX:2.6,spacing:5.5,guideDepth:3.6,height:1.25,thickness:.7},
 build(ctx,p){
  const d=p.guideDepth/2;
  // Five staggered cards funnel alternating sides inward. Two smaller decision
  // cards add central detours; rail-connected ends close the edge shortcuts.
  for(let row=0;row<5;row++){
   const side=row%2===0?1:-1,at=(row-2)*p.spacing;
   card(ctx,`flow-card-${row}`,side*p.wallX,at-d,side*p.innerX,at+d,p,['deep','green','amber','green','deep'][row]);
  }
  card(ctx,'branch-a',-2.1,-2.9,.5,-1.1,p,'amber');
  card(ctx,'branch-b',2.1,2.6,-.5,4.4,p,'amber');
 },
 decorate(view){
  view.sign('UX FLOW',-12.4,3.3,4.9,view.o.label);
  view.host.cylinder(.13,2.5,view.host.materials.metal,-12.4,1.25,0,view.decor);
 }
};
