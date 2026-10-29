import {center,elevation} from '../../track-geometry.js';
import {STAIR_COUNT,STAIR_START,STAIR_DEPTH,BOWL_CENTER,stairHeight} from '../../overtime-motion.js';

// All parts belong to one station. Solid collision at the entry and on the
// elevated path is handled by OvertimeMotion, which also controls ball height.
export default {
 type:'overtime-stairs',label:'電梯故障・加班沙漏',
 defaults:{period:2.4,rise:1.05,amplitude:.65,orbit:5,radius:5},
 build(ctx){for(const side of [-1,1])for(const ds of [-14,14])ctx.trackAdd(`boundary-${side}-${ds}`,'circle',side*11.5,ds,0,2,{r:.28,role:'post',materialKey:'metal'});},
 decorate(view,p){
  const {host,decor,o}=view,T=host.graphics,phase=o.phase??0;
  const local=(ds,x=0)=>({x:center(o.s+ds)-center(o.s)+x,y:elevation(o.s+ds)-elevation(o.s),z:-ds});
  view.stairSlabs=[];
  for(let n=0;n<STAIR_COUNT;n++){
   const ds=STAIR_START+(n+.5)*STAIR_DEPTH,loc=local(ds),h=stairHeight(n,0,phase,p);
   const slab=host.box(19.3,.44,STAIR_DEPTH-.08,n%2?host.materials.green:host.materials.amber,loc.x,loc.y+h-.22,loc.z,decor);
   view.stairSlabs.push({slab,n,baseY:loc.y});
   for(const side of [-1,1])host.box(.22,Math.max(.5,(n+.5)*p.rise),.28,host.materials.metal,loc.x+side*9.9,loc.y+Math.max(.5,(n+.5)*p.rise)/2,loc.z,decor);
  }
  const high=p.rise*STAIR_COUNT,deck=local(-1);
  host.box(19.2,.35,4.8,host.materials.deep,deck.x,deck.y+high-.18,deck.z,decor);
  for(const side of [-1,1]){
   host.box(.2,.95,4.8,host.materials.light,deck.x+side*9.5,deck.y+high+.47,deck.z,decor);
   const support=local(0,side*9.3);host.box(.3,high,.3,host.materials.metal,support.x,support.y+high/2,support.z,decor);
  }
  const bowl=local(BOWL_CENTER),top=bowl.y+high;
  const glass=new T.MeshBasicMaterial({color:0x6ef4dd,wireframe:true,transparent:true,opacity:.42,depthWrite:false});
  view.upperFunnel=host.mesh(new T.CylinderGeometry(p.radius,.65,2.3,24,3,true),glass,decor);view.upperFunnel.position.set(bowl.x,top-1.15,bowl.z);
  view.lowerFunnel=host.mesh(new T.CylinderGeometry(.65,2.7,2,24,2,true),glass,decor);view.lowerFunnel.position.set(bowl.x,top-3.3,bowl.z);
  for(const [radius,y,material] of [[p.radius,top,host.materials.light],[.65,top-2.3,host.materials.amber],[2.7,top-4.3,host.materials.light]]){
   const ring=host.mesh(new T.TorusGeometry(radius,.08,5,32),material,decor);ring.rotation.x=Math.PI/2;ring.position.set(bowl.x,y,bowl.z);
  }
  for(const side of [-1,1]){const foot=local(BOWL_CENTER,side*(p.radius+.4));host.box(.24,high,.24,host.materials.metal,foot.x,foot.y+high/2,foot.z,decor);}
  const stairSign=view.sign('電梯故障',-13,5,6,'請走樓梯');stairSign.face.position.z+=12;stairSign.backing.position.z+=12;host.cylinder(.13,4.2,host.materials.metal,-13,2.1,12,decor);
  const sandSign=view.sign('加班沙漏',12.8,high+4,7,'全體員工加班中');sandSign.face.position.z-=BOWL_CENTER;sandSign.backing.position.z-=BOWL_CENTER;host.cylinder(.13,high+3,host.materials.metal,12.8,(high+3)/2,-BOWL_CENTER,decor);
 },
 update(view,t,shapes,p){
  const phase=view.o.phase??0;for(const stair of view.stairSlabs??[])stair.slab.position.y=stair.baseY+stairHeight(stair.n,t,phase,p)-.22;
  if(view.upperFunnel)view.upperFunnel.rotation.y=t*.13;if(view.lowerFunnel)view.lowerFunnel.rotation.y=-t*.1;
 },
 notice(){return {key:'overtime-stairs',text:'電梯故障，請走樓梯！交替升降的階梯帶領彈珠爬高，前方還有加班沙漏。'};}
};
