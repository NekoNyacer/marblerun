import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {FINISH,WIDTH,position,elevation} from '../track-geometry.js';

// Decorative road geometry only. The simulation keeps its original track.
function batch(parent,geometry,material,poses){
 const mesh=new T.InstancedMesh(geometry,material,poses.length),dummy=new T.Object3D();
 poses.forEach((pose,i)=>{dummy.position.set(...pose.p);dummy.scale.set(...pose.scale);dummy.rotation.set(0,pose.angle??0,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
 mesh.computeBoundingSphere();parent.add(mesh);return mesh;
}

export function createCircuitTrack(host){
 const group=new T.Group();group.name='Circuit track';host.scene.add(group);
 const vertices=[],indices=[],uv=[],start=-75,end=FINISH+20,segments=400;
 for(let i=0;i<=segments;i++){
  const s=start+(end-start)*i/segments;
  for(const x of [-WIDTH/2,WIDTH/2]){vertices.push(...position(s,x));uv.push(x/WIDTH+.5,s);}
  if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 const time={value:0};
 const road=new T.MeshLambertMaterial({color:0x395a64,side:T.DoubleSide});
 road.onBeforeCompile=shader=>{
  shader.uniforms.uCircuitTime=time;
  shader.vertexShader='varying vec2 vCircuit;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvCircuit=uv;');
  shader.fragmentShader='uniform float uCircuitTime; varying vec2 vCircuit;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float x=vCircuit.x;
   float edge=min(abs(x-.025),abs(x-.975));
   float lane=min(abs(x-.18),abs(x-.82));
   float centre=abs(x-.5);
   float core=1.-smoothstep(.0017,.004,lane);
   float shoulder=1.-smoothstep(.002,.005,edge);
   float halo=(1.-smoothstep(.004,.021,lane))*.19;
   float progress=fract(vCircuit.y*.038-uCircuitTime*.22);
   float pulse=smoothstep(.56,.83,progress)*(1.-smoothstep(.94,1.,progress));
   float dashed=(1.-smoothstep(.001,.0025,centre))*step(.5,fract(vCircuit.y*.13));
   float cross=1.-smoothstep(.02,.06,abs(fract(vCircuit.y*.025)-.5));
   float junction=cross*(1.-smoothstep(.02,.11,min(abs(x-.18),abs(x-.82))));
   totalEmissiveRadiance+=vec3(.08,.82,.72)*(core*(.55+pulse*.9)+halo+shoulder*.55+junction*.22);
   totalEmissiveRadiance+=vec3(.65,.84,.72)*dashed*.24;
  `);
 };
 const surface=new T.Mesh(geometry,road);group.add(surface);
 const posts=[],panes=[],ribs=[],columns=[];
 for(const x of [-10.2,10.2]){
  const pts=[];for(let s=start;s<=end;s+=2){const p=position(s,x);p[1]+=.65;pts.push(new T.Vector3(...p));}
  group.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),400,.18,6,false),host.materials.metal));
  const lights=pts.map(p=>p.clone().add(new T.Vector3(0,.65,0)));
  group.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(lights),400,.055,5,false),host.materials.light));
  for(let s=start;s<end;s+=6){
   const p=position(s,x),a=position(s,x),b=position(s+6,x);
   posts.push({p:[p[0],p[1]+.68,p[2]],scale:[.22,1.45,.22]});
   panes.push({p:[(a[0]+b[0])/2,(a[1]+b[1])/2+.65,(a[2]+b[2])/2],scale:[.055,1.1,Math.hypot(b[0]-a[0],6)],angle:-Math.atan2(b[0]-a[0],6)});
  }
 }
 for(let s=-65;s<end;s+=15){
  const p=position(s);ribs.push({p:[p[0],p[1]-.55,p[2]],scale:[21.2,.65,1.1]});
  for(const x of [-8,8])columns.push({p:[p[0]+x,p[1]-5,p[2]],scale:[.35,9,.35]});
 }
 batch(group,new T.BoxGeometry(1,1,1),host.materials.metal,posts);
 batch(group,new T.BoxGeometry(1,1,1),host.materials.glass,panes);
 batch(group,new T.BoxGeometry(1,1,1),host.materials.deep,ribs);
 batch(group,new T.CylinderGeometry(1,1,1,8),host.materials.metal,columns);
 return {group,road,update(t){time.value=t;},dispose(){group.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();});road.dispose();group.removeFromParent();}};
}

export function createFinishMarkings(host){
 const tiles=[[],[]];
 for(let j=0;j<20;j++)for(let k=0;k<2;k++){
  const points=[],s=FINISH+k-.5,x=-9.5+j;
  for(const [u,v] of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]){const p=position(s+v,x+u);p[1]=elevation(s+v)+.025;points.push(...p);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex([0,1,2,1,3,2]);g.computeVertexNormals();tiles[(j+k)%2].push(g);
 }
 tiles.forEach((pieces,i)=>{
  const geometry=mergeGeometries(pieces),material=new T.MeshBasicMaterial({color:i?0xf1f9e7:0x174a49,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  host.scene.add(new T.Mesh(geometry,material));pieces.forEach(g=>g.dispose());
 });
}
