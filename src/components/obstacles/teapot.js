import {rectangle,statusSign,outerPosts} from './hazard-visuals.js';
export default {
 type:'teapot',label:"418 I'm a teapot 茶壺蒸汽",defaults:{period:4.7,pulse:.32,strength:11,width:18,depth:3},
 build(ctx){outerPosts(ctx,2);},
 decorate(view,p){
  const {host,decor}=view,T=host.graphics,mat=host.materials.amber;const body=host.mesh(new T.SphereGeometry(1.35,16,10),mat,decor);body.position.set(-12.8,2,0);body.scale.set(1,.82,1);
  host.cylinder(.95,.18,host.materials.deep,-12.8,3.05,0,decor);host.cylinder(.25,.28,mat,-12.8,3.25,0,decor);
  const handle=host.mesh(new T.TorusGeometry(.95,.16,6,16,Math.PI*1.7),host.materials.deep,decor);handle.position.set(-14.15,2.2,0);handle.rotation.z=.15;
  host.beam([-11.8,2.1,0],[-10.3,3.1,0],.25,mat,decor);host.beam([-10.3,3.1,0],[-9.9,3.8,0],.22,mat,decor);
  view.steam=[];const steamMat=new T.MeshBasicMaterial({color:0xd7fff7,transparent:true,opacity:.1,depthWrite:false});for(let i=0;i<3;i++){const puff=host.mesh(new T.IcosahedronGeometry(.46,0),steamMat,decor);puff.position.set(-9.85+i*.45,4+i*.62,0);view.steam.push(puff);}
  const glow=new T.MeshBasicMaterial({color:0x7af4db,transparent:true,opacity:.16,depthWrite:false});view.steamLane=rectangle(view,0,0,p.width,p.depth,glow,.055);
  statusSign(view,"418 I'M A TEAPOT",'我是茶壺，拒絕煮咖啡',-13.5,6.6,7.8);
 },
 update(view,t,shapes,p){const steaming=view.runtime?view.runtime.phase==='steaming':(t+(view.phase??0)*.23)%p.period<p.pulse;view.steam?.forEach((puff,n)=>{puff.visible=steaming;puff.position.y=4+n*.62+Math.sin(t*7+n)*.17;});if(view.steamLane)view.steamLane.material.opacity=steaming?.4:.045;},
 notice(t,phase,p){return (t+phase*.23)%p.period<p.pulse?{key:'steam',text:"418 I'm a teapot！這個 HTTP 彩蛋代表「我是茶壺」：茶壺噴出蒸汽，把彈珠往回吹！"}:null;}
};
