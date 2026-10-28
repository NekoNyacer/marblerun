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
  card(ctx,'entry-card',p.wallX,-p.spacing-d,p.innerX,-p.spacing+d,p,'deep');
  card(ctx,'exit-card',-p.wallX,p.spacing-d,-p.innerX,p.spacing+d,p,'green');
  // The middle card leaves two generous overtaking gaps. Rounded ends share
  // their cylinder geometry with collision, rather than being visual padding.
  card(ctx,'decision-card',-2.6,-1.2,2.6,1.2,p,'amber');
 },
 decorate(view){
  view.sign('UX FLOW',-12.4,3.3,4.9,view.o.label);
  view.host.cylinder(.13,2.5,view.host.materials.metal,-12.4,1.25,0,view.decor);
 }
};
