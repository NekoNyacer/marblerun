import {rectangle,statusSign,outerPosts} from './hazard-visuals.js';
import {smooth} from './shared.js';

// Two alternating groups leave wide open lanes. Every bar starts completely
// below the road and follows the same height curve in physics and rendering.
export function teapotState(t,phase=0,p={}){
 const period=p.period??4.7,half=period/2,clock=((t+phase*.23)%period+period)%period;
 const group=Math.floor(clock/half),u=(clock-group*half)/half;
 const height=u<.2?smooth(u/.2):u<.7?1:u<.88?1-smooth((u-.7)/.18):0;
 return {group,height,lifts:[group===0?height:0,group===1?height:0]};
}
export default {
 type:'teapot',label:"418 I'm a teapot 升降茶壺",defaults:{period:4.7,pulse:.32,strength:11,width:18,depth:3},
 build(ctx,p,t,phase){
  outerPosts(ctx,2);const state=teapotState(t,phase,p),spacing=p.width/5;
  for(let lane=0;lane<5;lane++){
   const rise=state.lifts[lane%2],y=-1.05+rise*1.13;
   ctx.trackBox(`cup-${lane}`,(lane-2)*spacing,0,y,1.05,spacing-.2,.9,{role:'teapot-obstacle',materialKey:lane%2?'green':'amber'});
  }
 },
 decorate(view,p){
  const {host,decor}=view,T=host.graphics,mat=host.materials.amber;const body=host.mesh(new T.SphereGeometry(1.35,16,10),mat,decor);body.position.set(-12.8,2,0);body.scale.set(1,.82,1);
  host.cylinder(.95,.18,host.materials.deep,-12.8,3.05,0,decor);host.cylinder(.25,.28,mat,-12.8,3.25,0,decor);
  const handle=host.mesh(new T.TorusGeometry(.95,.16,6,16,Math.PI*1.7),host.materials.deep,decor);handle.position.set(-14.15,2.2,0);handle.rotation.z=.15;
  host.beam([-11.8,2.1,0],[-10.3,3.1,0],.25,mat,decor);host.beam([-10.3,3.1,0],[-9.9,3.8,0],.22,mat,decor);
  view.steam=[];const steamMat=new T.MeshBasicMaterial({color:0xd7fff7,transparent:true,opacity:.1,depthWrite:false});for(let i=0;i<3;i++){const puff=host.mesh(new T.IcosahedronGeometry(.46,0),steamMat,decor);puff.position.set(-9.85+i*.45,4+i*.62,0);view.steam.push(puff);}
  const glow=new T.MeshBasicMaterial({color:0x7af4db,transparent:true,opacity:.16,depthWrite:false});view.steamLane=rectangle(view,0,0,p.width,p.depth,glow,.055);
  statusSign(view,"418 I'M A TEAPOT",'我是茶壺 · 注意升降障礙',-13.5,6.6,7.8);
 },
 update(view,t,shapes,p){const rising=teapotState(t,view.phase??0,p).height>.1;view.steam?.forEach((puff,n)=>{puff.visible=rising;puff.position.y=4+n*.62+Math.sin(t*7+n)*.17;});if(view.steamLane)view.steamLane.material.opacity=rising?.23:.045;},
 notice(t,phase,p){const state=teapotState(t,phase,p);return state.height>.1?{key:`rise-${state.group}`,text:"418 I'm a teapot！我是茶壺：障礙柱從地面升起，留意交替開放的通道！"}:null;}
};
