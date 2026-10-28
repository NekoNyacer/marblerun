import * as T from 'three';
import {ObstacleView} from './obstacle-view.js';
import {createCourse} from './course.js';
import {projectVisualBall,courseShapes} from './obstacles.js';
import {createCircuitTrack,createFinishMarkings} from './visuals/circuit-track.js';
import {FutureCity} from './visuals/future-city.js';
import {HologramNetwork} from './visuals/holograms.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {WIDTH,RADIUS,FINISH,OBSTACLES,PALETTE,position,center,elevation} from './world.js';
const green=0x00894f,deep=0x075a40,ivory=0xf1f4e9,cyan=0x57d5c5;
export class RaceScene{
 constructor(container,onStats,course=OBSTACLES){
  this.graphics={MeshBasicMaterial:T.MeshBasicMaterial,BufferGeometry:T.BufferGeometry,Float32BufferAttribute:T.Float32BufferAttribute,SphereGeometry:T.SphereGeometry,TorusGeometry:T.TorusGeometry,IcosahedronGeometry:T.IcosahedronGeometry,CylinderGeometry:T.CylinderGeometry};
  this.container=container;this.onStats=onStats;this.scene=new T.Scene();this.scene.background=this.makeSky();this.scene.fog=new T.Fog('#b5dcd4',100,250);this.reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(container.clientWidth,container.clientHeight);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;container.appendChild(this.renderer.domElement);
  this.camera=new T.PerspectiveCamera(48,container.clientWidth/container.clientHeight,.35,280);
  this.scene.add(new T.HemisphereLight(0xffffff,0x91b6a3,1.35));const sun=new T.DirectionalLight(0xfff2d7,2.25);sun.position.set(-20,50,15);this.scene.add(sun);
  const pmrem=new T.PMREMGenerator(this.renderer),environment=new RoomEnvironment();this.environment=pmrem.fromScene(environment,.04);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.4;environment.dispose();pmrem.dispose();
  const fill=new T.DirectionalLight(0x8bdee1,1.1);fill.position.set(30,15,-30);this.scene.add(fill);
  this.materials={white:new T.MeshStandardMaterial({color:ivory,roughness:.42,metalness:.12}),green:new T.MeshStandardMaterial({color:green,roughness:.32,metalness:.38}),deep:new T.MeshStandardMaterial({color:deep,roughness:.4,metalness:.25}),metal:new T.MeshStandardMaterial({color:0x456e76,roughness:.26,metalness:.7}),light:new T.MeshBasicMaterial({color:0xa4fff0,toneMapped:false}),glass:new T.MeshStandardMaterial({color:0xa4eee5,roughness:.2,metalness:.2,transparent:true,opacity:.17,depthWrite:false}),amber:new T.MeshStandardMaterial({color:0xe9a226,roughness:.55,metalness:.1})};
  this.makeCourse();this.obstacles=[];this.setCourse(course);this.makeEnvironment();this.makeFinish();
  const marbleMat=new T.MeshStandardMaterial({color:0xffffff,roughness:.22,metalness:.2});
  marbleMat.onBeforeCompile=(shader)=>{shader.vertexShader='varying vec3 vMarblePos;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMarblePos=position;');shader.fragmentShader='varying vec3 vMarblePos;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ribbon=sin(atan(vMarblePos.z,vMarblePos.x)*3.0+vMarblePos.y*11.0);\nfloat stripe=smoothstep(0.65,0.8,ribbon);\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.97),stripe*0.92);');};
  this.balls=new T.InstancedMesh(new T.SphereGeometry(RADIUS,16,10),marbleMat,1500);this.balls.instanceMatrix.setUsage(T.DynamicDrawUsage);this.balls.frustumCulled=false;this.balls.count=0;this.scene.add(this.balls);
  this.shadows=new T.InstancedMesh(new T.CircleGeometry(RADIUS*1.4,14),new T.MeshBasicMaterial({color:0x3a6951,transparent:true,opacity:.16,depthWrite:false}),1500);this.shadows.frustumCulled=false;this.shadows.count=0;this.scene.add(this.shadows);
  this.dummy=new T.Object3D();this.v=new T.Vector3();this.look=new T.Vector3();this.target=new T.Vector3();this.frustum=new T.Frustum();this.matrix=new T.Matrix4();this.color=new T.Color();this.sphere=new T.Sphere(new T.Vector3(),RADIUS*1.8);this.focusS=5;this.cameraReady=false;this.view='chase';this.displayData=null;this.targetData=null;
  this.labels=[];for(let i=0;i<5;i++){const el=document.createElement('div');el.className='racer-label';el.hidden=true;container.appendChild(el);this.labels.push(el);}
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
 }
 mesh(geometry,mat,parent=this.scene){const m=new T.Mesh(geometry,mat);parent.add(m);return m;}
 box(w,h,d,mat,x=0,y=0,z=0,parent=this.scene){const m=this.mesh(new T.BoxGeometry(w,h,d),mat,parent);m.position.set(x,y,z);return m;}
 cylinder(r,h,mat,x=0,y=0,z=0,parent=this.scene){const m=this.mesh(new T.CylinderGeometry(r,r,h,16),mat,parent);m.position.set(x,y,z);return m;}
 beam(a,b,r,mat,parent=this.scene){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),dir=bb.clone().sub(aa);const m=this.cylinder(r,dir.length(),mat,0,0,0,parent);m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return m;}
 screen(text,w=5,h=1.5,sub='',parent=this.scene,warning=false){const c=document.createElement('canvas');c.width=768;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=warning?'#742e2b':'#103d33';ctx.fillRect(0,0,768,256);ctx.strokeStyle=warning?'#ff9a7c':'#81e9be';ctx.lineWidth=5;ctx.strokeRect(5,5,758,246);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f5fff9';ctx.font=`600 ${sub?74:80}px Outfit, sans-serif`;ctx.fillText(text,384,sub?90:130,725);if(sub){ctx.fillStyle=warning?'#ffb7a4':'#f7c65d';ctx.font='500 48px Outfit, sans-serif';ctx.fillText(sub,384,184,725);}const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const m=this.mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture}),parent);return m;}
 makeSky(){
  const canvas=document.createElement('canvas');canvas.width=2;canvas.height=128;
  const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,128);
  gradient.addColorStop(0,'#57acd0');gradient.addColorStop(.53,'#a0d5d9');gradient.addColorStop(1,'#d9e8cd');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,2,128);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
 }
 makeCourse(){this.circuitTrack=createCircuitTrack(this);}
 setCourse(entries){
  const course=createCourse(entries),shared=new Set([...Object.values(this.materials),this.hazardMaterial]);
  const materials=new Set();
  for(const obstacle of this.obstacles??[]){
   this.scene.remove(obstacle.group);
   obstacle.group.traverse(object=>{
    object.geometry?.dispose();
    for(const material of Array.isArray(object.material)?object.material:[object.material])if(material&&!shared.has(material))materials.add(material);
   });
  }
  for(const material of materials){material.map?.dispose();material.dispose();}
  this.course=course;this.obstacles=[];course.forEach((o,k)=>this.makeObstacle(o,k));
  this.frames=[];this.displayData=null;this.targetData=null;this.displayT=0;this.cameraReady=false;this.focusS=5;this.focusX=0;this.focusHeight=0;
 }
 makeObstacle(o,k){const view=new ObstacleView(this,o,k);this.obstacles.push({s:o.s,view,group:view.group});}
 makeEnvironment(){this.city=new FutureCity(this.scene);this.holograms=new HologramNetwork(this.scene);}
 makeFinish(){createFinishMarkings(this);}
 setState(data,t,participants,ranking,winners,effects={}){
  if(!this.displayData||this.displayData.length!==data.length||t===0){this.displayData=new Float32Array(data);this.frames=[];}
  this.frames??=[];if(this.frames.at(-1)?.t===t)this.frames.pop();this.frames.push({data,t,vertical:effects.vertical});if(this.frames.length>8)this.frames.shift();this.lastStateAt=performance.now();this.targetData=data;this.t=t;this.participants=participants;this.ranking=ranking;this.winnerIds=new Set(winners.map(w=>w.i));this.racerStatus=effects.status;this.mechanismStates=new Map((effects.mechanismStates??[]).map(value=>[value.id,value]));
 }
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
 quality(value){
  this.renderer.setPixelRatio(value==='high'?Math.min(devicePixelRatio,2):value==='low'?1:Math.min(devicePixelRatio,1.5));
  if(this.ballDetail!==value){const segments=value==='high'?[18,12]:value==='low'?[12,8]:[16,10];this.balls.geometry.dispose();this.balls.geometry=new T.SphereGeometry(RADIUS,...segments);this.ballDetail=value;}
  this.city?.setQuality(value);this.holograms?.setQuality(value);this.resize();
 }
 update(dt,clock){
  if(!this.targetData||!this.displayData)return;
  const latest=this.frames.at(-1);this.displayT=Math.max(this.frames[0].t,Math.min(latest.t,latest.t+(performance.now()-this.lastStateAt)/1000-.055));
  let lower=this.frames[0],upper=latest;for(const frame of this.frames){if(frame.t<=this.displayT)lower=frame;if(frame.t>=this.displayT){upper=frame;break;}}
  const alpha=upper.t>lower.t?(this.displayT-lower.t)/(upper.t-lower.t):0;for(let j=0;j<this.displayData.length;j++)this.displayData[j]=lower.data[j]+(upper.data[j]-lower.data[j])*alpha;
  const frameGroups=this.updateObstacles(this.displayT);
  const visualTime=this.reducedMotion?0:clock;this.circuitTrack.update(visualTime);this.city.update(visualTime,this.focusS);this.holograms.update(visualTime,this.focusS);
  const data=this.displayData,rank=this.ranking||[],verticalAt=i=>(lower.vertical?.[i]??0)*(1-alpha)+(upper.vertical?.[i]??0)*alpha;let leader=rank.find(i=>!this.winnerIds.has(i));if(leader===undefined)leader=rank[0]||0;
  const leaderS=Math.max(0,data[leader*4+1]);this.focusS+=(leaderS-this.focusS)*(this.cameraReady?1-Math.exp(-dt*2.5):1);
  const group=rank.filter(i=>!this.winnerIds.has(i)&&data[i*4+1]>leaderS-20).slice(0,8);
  const groupX=group.reduce((total,i)=>total+data[i*4],0)/(group.length||1);this.focusX??=groupX;this.focusX+=(groupX-this.focusX)*(1-Math.exp(-dt*2));
  const height=Math.max(0,verticalAt(leader));this.focusHeight??=height;this.focusHeight+=(height-this.focusHeight)*(this.cameraReady?1-Math.exp(-dt*2.5):1);const p=position(this.focusS),lp=position(Math.min(FINISH+6,this.focusS+2));p[1]+=this.focusHeight;lp[1]+=this.focusHeight;
  if(this.view==='wide'){this.target.set(p[0]+15,p[1]+27,p[2]+27);this.look.set(lp[0],lp[1],lp[2]-8);}else if(this.racerStatus?.[leader]===5){this.target.set(p[0]+this.focusX*.65+12,p[1]+16,p[2]+15);this.look.set(lp[0]+this.focusX*.7,lp[1]+.7,lp[2]-2);}else{this.target.set(p[0]+this.focusX*.65+4,p[1]+11,p[2]+18.5);this.look.set(lp[0]+this.focusX*.7,lp[1]+1.1,lp[2]-2.5);}
  this.camera.position.lerp(this.target,this.cameraReady?1-Math.exp(-dt*3):1);this.camera.lookAt(this.look);this.cameraReady=true;
  this.camera.updateMatrixWorld();this.matrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.matrix);
  let visible=0;const dummy=this.dummy;
  for(let i=0;i<data.length/4;i++){
   if(this.racerStatus?.[i]===1)continue;let x=data[i*4],s=data[i*4+1];if(s<this.focusS-45||s>this.focusS+110)continue;const corrected=(this.racerStatus?.[i]??0)===0?projectVisualBall(center(s)+x,s,frameGroups):{wx:center(s)+x,s};s=corrected.s;x=corrected.wx-center(s);data[i*4]=x;data[i*4+1]=s;
   const p=position(s,x),vertical=verticalAt(i);this.sphere.center.set(p[0],p[1]+RADIUS+vertical,p[2]);if(!this.frustum.intersectsSphere(this.sphere))continue;
   dummy.position.copy(this.sphere.center);dummy.rotation.set(-s/RADIUS,x/RADIUS,0);dummy.scale.setScalar(1);dummy.updateMatrix();this.balls.setMatrixAt(visible,dummy.matrix);this.color.set(PALETTE[i%PALETTE.length]);this.balls.setColorAt(visible,this.color);
   dummy.position.y=p[1]+.035;dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar((this.racerStatus?.[i]??0)>1?0:1);dummy.updateMatrix();this.shadows.setMatrixAt(visible,dummy.matrix);visible++;
  }
  this.balls.count=visible;this.shadows.count=visible;this.balls.instanceMatrix.needsUpdate=true;this.shadows.instanceMatrix.needsUpdate=true;if(this.balls.instanceColor)this.balls.instanceColor.needsUpdate=true;
  
  const w=this.container.clientWidth,h=this.container.clientHeight,rects=[];
  for(let n=0;n<this.labels.length;n++){
   const el=this.labels[n],i=rank[n];if(i===undefined){el.hidden=true;continue;}const s=data[i*4+1],p=position(s,data[i*4]);this.v.set(p[0],p[1]+1.25+verticalAt(i),p[2]).project(this.camera);const xx=(this.v.x*.5+.5)*w,yy=(-this.v.y*.5+.5)*h;const overlap=rects.some(r=>Math.abs(r.x-xx)<115&&Math.abs(r.y-yy)<48);
   const hidden=this.v.z>1||this.v.z<0||xx<60||xx>w-60||yy<80||yy>h-65||overlap;el.hidden=hidden;if(hidden)continue;rects.push({x:xx,y:yy});el.style.left=xx+'px';el.style.top=yy+'px';el.style.setProperty('--racer',PALETTE[i%PALETTE.length]);el.textContent=`${n+1} ${this.participants[i]?.name||''}`;
  }
  this.renderer.render(this.scene,this.camera);this.onStats?.(visible);
 }
 updateObstacles(t){
  const poses=courseShapes(t,this.course),groups=[];
  this.obstacles.forEach((obstacle,k)=>{const pose=poses[k];obstacle.group.visible=Math.abs(obstacle.s-this.focusS)<130+pose.reach;if(obstacle.group.visible){obstacle.view.runtime=this.mechanismStates?.get(pose.o.id);obstacle.view.update(t,pose.shapes);groups.push(pose);}});
  return groups;
 }
 dispose(){
  this.resizeObserver.disconnect();this.city.dispose();this.holograms.dispose();this.circuitTrack.dispose();this.scene.background?.dispose();this.environment.dispose();
  const geometries=new Set(),materials=new Set(),textures=new Set();this.scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);if(m.map)textures.add(m.map);}});
  Object.values(this.materials).forEach(m=>materials.add(m));if(this.hazardMaterial){materials.add(this.hazardMaterial);textures.add(this.hazardMaterial.map);}
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t?.dispose());materials.forEach(m=>m.dispose());this.labels.forEach(el=>el.remove());this.renderer.dispose();this.renderer.domElement.remove();
 }
}
