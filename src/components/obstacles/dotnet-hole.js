import {center} from '../../track-geometry.js';
import {disc,ring,pitMaterial,statusSign,setStatus} from './hazard-visuals.js';
export default {
 type:'dotnet-hole',label:'.NET 漏洞 · 加班沙漏',defaults:{radius:7.6,hold:5,releaseInterval:.22},
 build(ctx,p){for(const side of [-1,1]){const ds=-p.radius-1.5,a={x:center(ctx.o.s+ds-2)+side*10.6,s:ds-2},b={x:center(ctx.o.s+ds+2)+side*5.8,s:ds+2},dx=b.x-a.x,dz=b.s-a.s;ctx.box(`funnel-guide${side}`,(a.x+b.x)/2-ctx.origin,ds,.02,.85,Math.hypot(dx,dz),.5,{angle:Math.atan2(dz,dx),role:'guide',materialKey:'deep'});}},
 decorate(view,p){
  const {host,decor}=view,T=host.graphics;disc(view,0,0,p.radius,pitMaterial(view));ring(view,0,0,p.radius,host.materials.amber,.08,.13);ring(view,0,0,1.15,host.materials.light,.1,.12);
  const funnelMat=new T.MeshBasicMaterial({color:0x57d5c5,wireframe:true,transparent:true,opacity:.22,depthWrite:false});view.funnel=host.mesh(new T.CylinderGeometry(p.radius,1.15,2.5,24,3,true),funnelMat,decor);view.funnel.position.y=2.95;view.lowerFunnel=host.mesh(new T.CylinderGeometry(1.15,p.radius*.7,1.6,24,2,true),funnelMat,decor);view.lowerFunnel.position.y=.9;
  const waist=host.mesh(new T.TorusGeometry(1.15,.07,4,24),host.materials.amber,decor);waist.rotation.x=Math.PI/2;waist.position.y=1.7;
  const top=host.mesh(new T.TorusGeometry(p.radius,.06,4,40),host.materials.light,decor);top.rotation.x=Math.PI/2;top.position.y=4.2;
  view.pitSign=statusSign(view,'.NET 漏洞','發現漏洞，全體員工加班修復漏洞中',-14,5,9);
 },
 update(view,t){if(view.funnel)view.funnel.rotation.y=t*.16;if(view.lowerFunnel)view.lowerFunnel.rotation.y=-t*.12;if(view.pitSign)setStatus(view.pitSign,'.NET 漏洞',view.runtime?.count?`${view.runtime.count} 人加班中 · 旋轉等待修復`:'發現漏洞，全體員工加班修復漏洞中');},
 notice(){return {key:'overtime',text:'.NET 漏洞：發現漏洞，全體員工加班修復漏洞中！彈珠繞著沙漏旋轉，修復後分批放行。'};}
};
