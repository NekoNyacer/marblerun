import {rectangle,pitMaterial,statusSign,setStatus,outerPosts} from './hazard-visuals.js';
export default {
 type:'java-hole',label:'Java 漏洞 · 全員升降坑',defaults:{depth:8,capacity:12,hold:4,liftTime:1.2},
 build(ctx){outerPosts(ctx,2.3);},
 decorate(view,p){
  rectangle(view,0,0,19.4,p.depth,pitMaterial(view));view.javaPlatform=rectangle(view,0,0,18.8,p.depth-.4,view.host.hazardMaterial,.06);view.javaPlatform.visible=false;
  for(const side of [-1,1]){view.host.box(.28,1.8,p.depth,view.host.materials.metal,side*10.2,.9,0,view.decor);view.host.box(.14,1.6,.14,view.host.materials.light,side*10.05,1,0,view.decor);}
  view.pitSign=statusSign(view,'JAVA 漏洞','集滿彈珠 · 一起升起',-13.5,4.4,7.1);
 },
 update(view,t,shapes,p){const state=view.runtime,phase=state?.phase??'collecting';if(view.javaPlatform){view.javaPlatform.visible=phase==='lifting'||phase==='released'||!!state&&state.filled>=state.capacity;view.javaPlatform.position.y=phase==='lifting'?(state.lift??0)*.35:0;}if(view.pitSign)setStatus(view.pitSign,'JAVA 漏洞',phase==='released'?'修復完成 · 全員通行':phase==='lifting'?'填坑完成 · 全員升起':`${state?.filled??0} / ${state?.capacity??p.capacity} · 一起填坑`);},
 notice(){return {key:'collect',text:'Java 漏洞橫跨整條賽道！集滿彈珠後，升降台會把坑內的大家一起送回賽道。'};}
};
