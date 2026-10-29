import {simSin,simCos,simAtan2,simHypot} from '../../deterministic-math.js';
import {center} from '../../track-geometry.js';

// A wall-connected diagonal has an inward-facing upstream surface: edge traffic
// must merge back into the race instead of finding a new gap behind a guide.
function guide(ctx,id,side,ds,p){
 const a={x:center(ctx.o.s+ds-p.guideDepth/2)+side*p.wallX,s:ds-p.guideDepth/2};
 const b={x:center(ctx.o.s+ds+p.guideDepth/2)+side*p.innerX,s:ds+p.guideDepth/2};
 const dx=b.x-a.x,dz=b.s-a.s;
 ctx.box(id,(a.x+b.x)/2-ctx.origin,ds,.04,p.height,simHypot(dx,dz),p.thickness,{angle:simAtan2(dz,dx),role:'guide',materialKey:'deep'});
}

export default {
 type:'scope-change',label:'需求變更轉向板',
 defaults:{wallX:10.5,innerX:2.7,guideDepth:4,guideSpacing:6,height:.95,thickness:.65,bladeWidth:5.4,swing:.48,speed:.5},
 build(ctx,p,t,phase){
  guide(ctx,'guide-right',1,-p.guideSpacing,p);
  guide(ctx,'guide-left',-1,p.guideSpacing,p);
  const a=t*p.speed+phase*.7;
  ctx.add('pivot','circle',0,0,0,1.9,{r:.4,role:'post',materialKey:'metal'});
  ctx.box('requirement',0,0,.05,p.height,p.bladeWidth,p.thickness,{angle:p.swing*simSin(a),omega:p.swing*p.speed*simCos(a),role:'scope-change',materialKey:'amber'});
 },
 decorate(view){
  view.sign('SCOPE CHANGE',-12.8,3.3,5.3,view.o.label);
  view.host.cylinder(.13,2.5,view.host.materials.metal,-12.8,1.25,0,view.decor);
 }
};
