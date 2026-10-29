import {statusSign,rectangle,pitMaterial} from './hazard-visuals.js';
export default {
 type:'not-found',label:'404 Not Found 死路淘汰',defaults:{pocketX:7.2,pocketWidth:4.6,depth:6,height:1},
 build(ctx,p){for(const side of [-1,1]){
  ctx.trackBox(`backstop${side}`,side*p.pocketX,p.depth/2,.02,p.height,p.pocketWidth,.55,{role:'404-wall',materialKey:'hazard'});
  ctx.trackBox(`divider${side}`,side*(p.pocketX-p.pocketWidth/2),p.depth*.2,.02,p.height,.38,p.depth*.6,{role:'404-wall',materialKey:'amber'});
 }},
 decorate(view,p){
  const mat=pitMaterial(view);for(const side of [-1,1]){rectangle(view,side*p.pocketX,0,p.pocketWidth,p.depth,mat);view.sign('404',side*p.pocketX,2.4,3,'NOT FOUND · 淘汰',true);view.host.cylinder(.12,1.7,view.host.materials.metal,side*p.pocketX,.85,-p.depth/2,view.decor);}
  statusSign(view,'404 NOT FOUND','誤入兩側死路將淘汰',-13.4,4,7,true);
 },
 notice(){return {key:'dead-end',text:'404 Not Found：兩側是死路！誤入的彈珠將淘汰，中央通道可通過。'};}
};
