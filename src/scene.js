import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {WIDTH,RADIUS,FINISH,OBSTACLES,PALETTE,position,center,elevation,gateState,rotorAngle} from './world.js';
const green=0x00894f,deep=0x075a40,ivory=0xf1f4e9,cyan=0x57d5c5;
export class RaceScene{
 constructor(container,onStats){
  this.container=container;this.onStats=onStats;this.scene=new T.Scene();this.scene.background=new T.Color('#dceee7');this.scene.fog=new T.Fog('#dceee7',75,225);
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(container.clientWidth,container.clientHeight);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;container.appendChild(this.renderer.domElement);
  this.camera=new T.PerspectiveCamera(48,container.clientWidth/container.clientHeight,.1,250);
  this.scene.add(new T.HemisphereLight(0xffffff,0x829b82,1.65));const sun=new T.DirectionalLight(0xfff8df,3.1);sun.position.set(-20,50,15);this.scene.add(sun);
  const pmrem=new T.PMREMGenerator(this.renderer),environment=new RoomEnvironment();this.environment=pmrem.fromScene(environment,.04);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.4;environment.dispose();pmrem.dispose();
  const fill=new T.DirectionalLight(0x8bdee1,1.1);fill.position.set(30,15,-30);this.scene.add(fill);
  this.materials={white:new T.MeshStandardMaterial({color:ivory,roughness:.42,metalness:.12}),green:new T.MeshStandardMaterial({color:green,roughness:.32,metalness:.38}),deep:new T.MeshStandardMaterial({color:deep,roughness:.4,metalness:.25}),metal:new T.MeshStandardMaterial({color:0xd1e3dc,roughness:.26,metalness:.7}),light:new T.MeshStandardMaterial({color:cyan,emissive:cyan,emissiveIntensity:.75}),glass:new T.MeshStandardMaterial({color:0xb6e9e2,roughness:.2,metalness:.2,transparent:true,opacity:.25,depthWrite:false}),amber:new T.MeshStandardMaterial({color:0xfbc14c,emissive:0xe6a51b,emissiveIntensity:.3})};
  this.makeCourse();this.obstacles=[];OBSTACLES.forEach((o,k)=>this.makeObstacle(o,k));this.makeEnvironment();this.makeFinish();
  const marbleMat=new T.MeshStandardMaterial({color:0xffffff,roughness:.22,metalness:.2});
  marbleMat.onBeforeCompile=(shader)=>{shader.vertexShader='varying vec3 vMarblePos;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMarblePos=position;');shader.fragmentShader='varying vec3 vMarblePos;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ribbon=sin(atan(vMarblePos.z,vMarblePos.x)*3.0+vMarblePos.y*11.0);\nfloat stripe=smoothstep(0.65,0.8,ribbon);\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.97),stripe*0.92);');};
  this.balls=new T.InstancedMesh(new T.SphereGeometry(RADIUS,18,12),marbleMat,1500);this.balls.instanceMatrix.setUsage(T.DynamicDrawUsage);this.balls.frustumCulled=false;this.balls.count=0;this.scene.add(this.balls);
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
 makeCourse(){
  const verts=[],indices=[],start=-75,end=FINISH+20,segments=400;for(let i=0;i<=segments;i++){const s=start+(end-start)*i/segments;for(const x of [-WIDTH/2,WIDTH/2])verts.push(...position(s,x));if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();this.mesh(geo,new T.MeshStandardMaterial({color:ivory,roughness:.55,metalness:.08,side:T.DoubleSide}));
  for(const x of [-10.2,10.2]){
   const pts=[];for(let s=start;s<=end;s+=2){const p=position(s,x);p[1]+=.65;pts.push(new T.Vector3(...p));}const path=new T.CatmullRomCurve3(pts);this.mesh(new T.TubeGeometry(path,400,.22,8,false),this.materials.green);
   const lightPts=pts.map(p=>p.clone().add(new T.Vector3(0,.65,0)));this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(lightPts),400,.06,5,false),this.materials.light);
   for(let s=start;s<end;s+=6){const p=position(s,x);this.box(.24,1.45,.24,this.materials.metal,p[0],p[1]+.68,p[2]);const a=position(s,x),b=position(s+6,x);const pane=this.box(.055,1.1,Math.hypot(b[0]-a[0],6),this.materials.glass,(a[0]+b[0])/2,(a[1]+b[1])/2+.65,(a[2]+b[2])/2);pane.rotation.y=-Math.atan2(b[0]-a[0],6);}
  }
  // Structural ribs and columns give the elevated circuit physical scale.
  for(let s=-65;s<end;s+=15){const p=position(s);this.box(21.2,.65,1.1,this.materials.deep,p[0],p[1]-.55,p[2]);for(const x of [-8,8]){this.cylinder(.35,9,this.materials.metal,p[0]+x,p[1]-5,p[2]);}}
  for(let s=-60;s<FINISH;s+=10){const p=position(s);this.box(.1,.025,2,this.materials.light,p[0],p[1]+.02,p[2]);}
 }
 makeObstacle(o,k){
  const g=new T.Group();g.position.set(...position(o.s));this.scene.add(g);const m=this.materials,record={...o,k,group:g,moving:[]};
  if(o.type==='rotor'){
   this.cylinder(1.05,.65,m.metal,0,.33,0,g);this.cylinder(.6,2.8,m.green,0,1.45,0,g);const spin=new T.Group();g.add(spin);spin.position.y=.65;this.box(15,.6,.46,m.green,0,0,0,spin);for(const x of [-5,5])this.box(1.2,.04,.48,m.light,x,.32,0,spin);
   this.box(4.7,2.3,.45,m.white,0,3.35,0,g);const sign=this.screen('>_ Codex',4.4,2,'Merge Conflict',g);sign.position.set(0,3.35,.25);record.spin=spin;
  }else if(o.type==='gate'){
   for(const x of [-10,0,10])this.box(.45,4.1,.55,m.green,x,2,0,g);this.box(20.6,.45,.65,m.white,0,4.1,0,g);
   const title=this.screen('ChatGPT',7,1.3,'Prompt Gate',g);title.position.set(0,5,0);
   for(let j=0;j<2;j++){
    const x=j===0?-5:5,pivot=new T.Group();pivot.position.set(j===0?-9.8:.3,.7,0);g.add(pivot);this.box(9.2,.45,.45,m.white,4.6,0,0,pivot);for(let h=0;h<4;h++)this.box(.65,.47,.48,m.green,1.2+h*2,0,0,pivot);
    const closed=this.screen(j===0?'CREDITS 0':'FALLBACK',7,1.3,j===0?'CLOSED':'OPEN',g,j===0);closed.position.set(x,3,0.05);const open=this.screen(j===0?'CREDITS OK':'FALLBACK',7,1.3,j===0?'OPEN':'CLOSED',g,j===1);open.position.set(x,3,.06);record.moving.push({pivot,closed,open});
   }
   this.box(.35,.5,5,m.green,0,.25,0,g);
  }else if(o.type==='error'){
   for(let j=0;j<3;j++){const group=new T.Group();group.position.x=(j-1)*6;g.add(group);this.box(3.3,.6,.6,m.white,0,.35,0,group);this.box(2.8,.08,.65,m.amber,0,.7,0,group);this.cylinder(.18,.7,m.metal,0,-.35,0,group);record.moving.push(group);}
   const sign=this.screen(o.label,5,1.5,'BUG DETECTED',g);sign.position.set(-8,2,1);this.cylinder(.28,.4,m.amber,-8,3,1,g);
  }else if(o.type==='rate'){
   for(let j=0;j<4;j++){const group=new T.Group();group.position.x=-8+j*5;g.add(group);this.box(4,.5,.5,m.green,0,.3,0,group);this.box(.6,.55,.52,m.amber,0,.3,0,group);record.moving.push(group);}
   this.box(.4,4,.5,m.metal,-9,2,0,g);this.box(.4,4,.5,m.metal,9,2,0,g);this.box(18,.4,.6,m.white,0,4,0,g);const sign=this.screen(o.label,8,1.5,'PLEASE RETRY',g);sign.position.set(0,4,0.35);
  }else{
   this.box(.4,7,.6,m.metal,-9,3.5,0,g);this.box(.4,7,.6,m.metal,9,3.5,0,g);this.box(18,.4,.6,m.green,0,7,0,g);
   const swing=new T.Group();g.add(swing);const head=this.mesh(new T.SphereGeometry(1.15,16,12),m.green,swing);head.position.y=.7;this.cylinder(.12,6,m.metal,0,3.8,0,swing);record.swing=swing;const sign=this.screen(o.label,6,1.2,'RETRY...',g);sign.position.set(0,7.6,.1);
  }
  this.obstacles.push(record);
 }
 makeEnvironment(){
  const m=this.materials;const floor=this.mesh(new T.PlaneGeometry(1600,1600),new T.MeshStandardMaterial({color:0x9fbea4,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.set(0,-3,-200);
  for(let j=0;j<3;j++)this.makeTree(j===0?27:-28,j===0?100:170+j*95,j===0?1:.8);
  for(let s=-45;s<440;s+=27)for(const side of [-1,1]){
   const p=position(s,side*(26+(s%4)*2)),height=5+(s%7);this.box(4.5,height,4.5,m.white,p[0],p[1]-5,p[2]);this.box(3.6,.22,3.7,m.green,p[0],p[1]-5+height/2,p[2]);
   for(let j=0;j<4;j++)this.box(2.7,.2,.05,j===1?m.light:m.deep,p[0],p[1]-6+j*.8,p[2]+2.28);
   this.cylinder(3,.4,m.green,p[0],p[1]-5-height/2-.1,p[2]);
  }
 }
 makeTree(x,s,scale){
  const g=new T.Group();g.position.set(...position(s,x));g.position.y-=3;g.scale.setScalar(scale);this.scene.add(g);const m=this.materials;
  this.cylinder(8,.8,m.white,0,-.4,0,g);this.cylinder(6.5,.22,m.green,0,.12,0,g);this.cylinder(.9,13,m.metal,0,6,0,g);
  for(let k=0;k<6;k++){const a=k*Math.PI/3,xx=Math.cos(a)*7,zz=Math.sin(a)*7;this.beam([0,4,0],[xx,12,zz],.2,m.white,g);this.beam([0,4,0],[xx*.9,12.2,zz*.9],.055,m.light,g);}
  [9,7.5,5.5].forEach((r,i)=>{const canopy=this.mesh(new T.SphereGeometry(r,24,12),new T.MeshStandardMaterial({color:[0x007b46,0x20a85b,0x80c746][i],roughness:.35,metalness:.25}),g);canopy.scale.set(1,.12,.72);canopy.position.y=12+i*1.6;const ring=this.mesh(new T.TorusGeometry(r,.055,6,50),m.light,g);ring.rotation.x=Math.PI/2;ring.scale.y=.72;ring.position.y=12+i*1.6;});
 }
 makeFinish(){
  const g=new T.Group();g.position.set(...position(FINISH));this.scene.add(g);const m=this.materials;for(const x of [-10,10])this.box(.8,7,.8,m.green,x,3.5,0,g);this.box(21,1.7,1,m.white,0,7,0,g);const sign=this.screen('DEPLOY SUCCESS',15,1.5,'FINISH',g);sign.position.set(0,7,.6);
  for(let j=0;j<20;j++)for(let k=0;k<2;k++)this.box(1,.03,1,(j+k)%2?m.deep:m.white,-9.5+j,.025,k-.5,g);
 }
 setState(data,t,participants,ranking,winners){if(!this.displayData||this.displayData.length!==data.length)this.displayData=new Float32Array(data);this.targetData=data;this.t=t;this.participants=participants;this.ranking=ranking;this.winnerIds=new Set(winners.map(w=>w.i));}
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
 quality(value){this.renderer.setPixelRatio(value==='high'?Math.min(devicePixelRatio,2):value==='low'?1:Math.min(devicePixelRatio,1.5));this.resize();}
 update(dt,clock){
  if(!this.targetData||!this.displayData)return;
  const blend=1-Math.exp(-dt*22);for(let j=0;j<this.displayData.length;j++)this.displayData[j]+=(this.targetData[j]-this.displayData[j])*blend;
  const data=this.displayData,rank=this.ranking||[];let leader=rank.find(i=>!this.winnerIds.has(i));if(leader===undefined)leader=rank[0]||0;
  const leaderS=Math.max(0,data[leader*4+1]);this.focusS+=(leaderS-this.focusS)*(this.cameraReady?1-Math.exp(-dt*2.5):1);
  const group=rank.filter(i=>!this.winnerIds.has(i)&&data[i*4+1]>leaderS-20).slice(0,8);
  const groupX=group.reduce((total,i)=>total+data[i*4],0)/(group.length||1);this.focusX??=groupX;this.focusX+=(groupX-this.focusX)*(1-Math.exp(-dt*2));
  const p=position(this.focusS),lp=position(Math.min(FINISH+6,this.focusS+2));
  if(this.view==='wide'){this.target.set(p[0]+15,p[1]+27,p[2]+27);this.look.set(lp[0],lp[1],lp[2]-8);}else{this.target.set(p[0]+this.focusX*.65+4,p[1]+10.5,p[2]+15.5);this.look.set(lp[0]+this.focusX*.7,lp[1]+.6,lp[2]);}
  this.camera.position.lerp(this.target,this.cameraReady?1-Math.exp(-dt*3):1);this.camera.lookAt(this.look);this.cameraReady=true;
  this.camera.updateMatrixWorld();this.matrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.matrix);
  let visible=0;const dummy=this.dummy;
  for(let i=0;i<data.length/4;i++){
   const x=data[i*4],s=data[i*4+1];if(s<this.focusS-45||s>this.focusS+110)continue;
   const p=position(s,x);this.sphere.center.set(p[0],p[1]+RADIUS,p[2]);if(!this.frustum.intersectsSphere(this.sphere))continue;
   dummy.position.copy(this.sphere.center);dummy.rotation.set(-s/RADIUS,x/RADIUS,0);dummy.scale.setScalar(1);dummy.updateMatrix();this.balls.setMatrixAt(visible,dummy.matrix);this.color.set(PALETTE[i%PALETTE.length]);this.balls.setColorAt(visible,this.color);
   dummy.position.y=p[1]+.035;dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(1,.8,1);dummy.updateMatrix();this.shadows.setMatrixAt(visible,dummy.matrix);visible++;
  }
  this.balls.count=visible;this.shadows.count=visible;this.balls.instanceMatrix.needsUpdate=true;this.shadows.instanceMatrix.needsUpdate=true;if(this.balls.instanceColor)this.balls.instanceColor.needsUpdate=true;
  this.displayT??=this.t||0;this.displayT+=((this.t||0)-this.displayT)*blend;this.updateObstacles(this.displayT);
  const w=this.container.clientWidth,h=this.container.clientHeight,rects=[];
  for(let n=0;n<this.labels.length;n++){
   const el=this.labels[n],i=rank[n];if(i===undefined){el.hidden=true;continue;}const s=data[i*4+1],p=position(s,data[i*4]);this.v.set(p[0],p[1]+1.25,p[2]).project(this.camera);const xx=(this.v.x*.5+.5)*w,yy=(-this.v.y*.5+.5)*h;const overlap=rects.some(r=>Math.abs(r.x-xx)<115&&Math.abs(r.y-yy)<48);
   const hidden=this.v.z>1||this.v.z<0||xx<60||xx>w-60||yy<145||yy>h-65||overlap;el.hidden=hidden;if(hidden)continue;rects.push({x:xx,y:yy});el.style.left=xx+'px';el.style.top=yy+'px';el.style.setProperty('--racer',PALETTE[i%PALETTE.length]);el.textContent=`${n+1} ${this.participants[i]?.name||''}`;
  }
  this.renderer.render(this.scene,this.camera);this.onStats?.(visible);
 }
 updateObstacles(t){for(const o of this.obstacles){o.group.visible=Math.abs(o.s-this.focusS)<130;if(!o.group.visible)continue;
  if(o.spin)o.spin.rotation.y=rotorAngle(t,o.k);
  if(o.type==='gate'){const state=gateState(t,o.k);o.moving.forEach((part,j)=>{const closed=j===0?state.leftClosed:!state.leftClosed;part.pivot.rotation.z=closed?0:Math.PI*.45;part.closed.visible=j===0?closed:!closed;part.open.visible=!part.closed.visible;});}
  if(o.type==='error')o.moving.forEach((g,j)=>g.position.y=Math.sin(t*1.25+j*2+o.k)>.05?0:-1.2);
  if(o.type==='rate')o.moving.forEach((g,j)=>g.position.y=(t+j*.65+o.k)%3.8<2.2?0:-1.1);
  if(o.swing)o.swing.position.x=Math.sin(t*1.3+o.k)*7;
 }}
 dispose(){this.resizeObserver.disconnect();this.renderer.dispose();}
}
