import {disc,ring,pitMaterial,statusSign,setStatus,outerPosts} from './hazard-visuals.js';
export default {
 type:'node-hole',label:'Node.js 漏洞 · 先到填坑',defaults:{radius:1.3,spacing:5,capacity:1},
 build(ctx){outerPosts(ctx);},
 decorate(view,p){view.pitLids=[];view.pitVoids=[];for(const x of [-p.spacing,p.spacing]){view.pitVoids.push(disc(view,x,0,p.radius,pitMaterial(view)));ring(view,x,0,p.radius,view.host.materials.amber);const lid=disc(view,x,0,p.radius*.92,view.host.materials.green,.07);lid.visible=false;view.pitLids.push(lid);}view.pitSign=statusSign(view,'NODE.JS 漏洞','先到填坑 · 後到通行');},
 update(view,t,shapes,p){const state=view.runtime,filled=state?.filled??0;view.pitLids?.forEach((lid,n)=>{const full=!!state?.holes?.[n]?.filled;lid.visible=full;view.pitVoids[n].visible=!full;});if(view.pitSign)setStatus(view.pitSign,'NODE.JS 漏洞',`${filled} / ${state?.capacity??p.capacity*2} 已填補 · 先到填坑`);},
 notice(){return {key:'sacrifice',text:'Node.js 漏洞：先踩中小坑的彈珠會卡住填坑，後來者就能安全通過！'};}
};
