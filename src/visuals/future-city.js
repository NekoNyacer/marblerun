import * as T from 'three';
import {center,elevation,position} from '../track-geometry.js';

// The whole city uses ten static batches. Windows are a material pattern, never
// separate meshes; no scene lights, shadow maps or postprocessing are added.
const palette={ivory:0xe5eee5,silver:0xc5dddb,glass:0x9fc9ca,leaf:0x43966b,mint:0x8bd1a1};
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const mix=(a,b,t)=>a+(b-a)*t;

function facadeMaterial(){
 const material=new T.MeshLambertMaterial({color:0xffffff});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCityPoint;\nvarying vec3 vCityNormal;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCityPoint=(instanceMatrix*vec4(position,1.0)).xyz;\nvCityNormal=normal;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCityPoint;\nvarying vec3 vCityNormal;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float along=mix(vCityPoint.x,vCityPoint.z,step(0.5,abs(vCityNormal.x)));
   vec2 cell=fract(vec2(along*0.43,vCityPoint.y*0.31));
   float panes=step(0.13,cell.x)*step(cell.x,0.85)*step(0.21,cell.y)*step(cell.y,0.76);
   panes*=1.0-step(0.5,abs(vCityNormal.y));
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.38,0.67,0.70),panes*0.63);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   totalEmissiveRadiance+=vec3(0.027,0.095,0.084)*panes;
  `);
 };
 material.customProgramCacheKey=()=> 'future-city-facades-v1';
 return material;
}

export class FutureCity{
 constructor(scene,{start=-75,end=450}={}){
  this.group=new T.Group();this.group.name='future-city';scene.add(this.group);
  this.geometries=new Set();this.materials=new Set();this.batches=[];this.disposed=false;
  const random=seeded(0x51f09a),box=new T.BoxGeometry(1,1,1),taper=new T.CylinderGeometry(.6,1,1,4,1),leaf=new T.IcosahedronGeometry(1,0),trunk=new T.CylinderGeometry(.65,1,1,7,1),cloud=new T.SphereGeometry(1,12,8),disc=new T.CylinderGeometry(1,1,1,20,1);
  [box,taper,leaf,trunk,cloud,disc].forEach(g=>this.geometries.add(g));
  const facade=facadeMaterial(),stone=new T.MeshLambertMaterial({color:0xffffff}),foliage=new T.MeshLambertMaterial({color:0xffffff}),bark=new T.MeshLambertMaterial({color:0x68877b}),light=new T.MeshBasicMaterial({color:0xb2fff1,toneMapped:false}),cloudMat=new T.MeshLambertMaterial({color:0xfff9e8});
  [facade,stone,foliage,bark,light,cloudMat].forEach(m=>this.materials.add(m));
  const towers=[],spires=[],crowns=[],gardens=[],trees=[],trunks=[],accents=[],clouds=[],plazas=[];
  const add=(list,x,y,z,sx,sy,sz,color=0xffffff,rotation=0)=>list.push({x,y,z,sx,sy,sz,color,rotation});
  // Two layers of skyline remain visible beyond the racetrack's near gardens.
  for(let s=start-5;s<=end+95;s+=35){
   for(const side of [-1,1]){
    const ds=s+(random()-.5)*18,near=side*(53+random()*15),far=side*(92+random()*29);
    for(const [row,x] of [[0,near],[1,far]]){
     const width=mix(7.5,12.5,random()),depth=mix(8,13,random()),height=mix(row?53:36,row?92:73,random()),wx=center(ds)+x,base=-3;
     const color=[palette.ivory,palette.silver,palette.glass][Math.floor(random()*3)];
     if(row===1&&random()>.48){
      add(spires,wx,base+height/2,-ds,width*.65,height,depth*.65,color,Math.PI/4);
      add(crowns,wx,base+height+.35,-ds,width*.6,.65,depth*.6,palette.ivory,Math.PI/4);
     }else{
      add(towers,wx,base+height/2,-ds,width,height,depth,color);
      const shoulder=height*.12;
      add(crowns,wx,base+height+shoulder/2,-ds,width*.68,shoulder,depth*.7,palette.ivory);
      add(gardens,wx,base+height+shoulder+.16,-ds,width*.65,.3,depth*.65,0x6cac80);
     }
     // Facade edge lights are opaque, thin strips, batched into one draw call.
     for(const edge of [-1,1])add(accents,wx+edge*width*.43,base+height*.52,-ds+depth*.505,.085,height*.9,.075);
     add(accents,wx,base+height*.13,-ds+depth*.51,width*.92,.1,.08);
    }
   }
  }
  // Hanging pocket parks soften the city at the same level as the race.
  for(let s=start+9;s<end;s+=40){
   for(const side of [-1,1]){
    const ds=s+side*7,wx=center(ds)+side*(29+random()*8),top=elevation(ds)-5.4;
    add(towers,wx,(top-3)/2,-ds,13.5,top+3,12.5,palette.ivory);
    add(gardens,wx,top+.45,-ds,15.5,.9,14.5,palette.ivory);
    add(gardens,wx,top+.96,-ds,13.5,.14,12.5,0x90bf8f);
    add(plazas,wx+side*2,top+1.06,-ds-1,3.5,.1,3.5,0xd8e6cd);
    add(accents,wx,top+.95,-ds+7.28,15,.08,.08);
    for(let j=0;j<3;j++){
     const tx=wx+(j-1)*4.1,tz=-ds+(j===1?-3.6:2.5),height=5.3+random()*2.9;
     add(trunks,tx,top+1+height*.36,tz,.36,height*.72,.36);
     const colors=[0x2f8d62,0x6dbb7b,0x9acf85];
     for(let k=0;k<3;k++){
      const angle=k*Math.PI*2/3+j*.5,spread=1.1+random()*.4;
      add(trees,tx+Math.cos(angle)*spread,top+1+height*.76+k*.35,tz+Math.sin(angle)*spread,2.1+random()*.7,2.4+random()*.7,2+random()*.7,colors[(k+j)%3],random()*Math.PI);
     }
    }
   }
  }
  // Soft distant cloud banks use low-segment opaque spheres instead of alpha
  // particle stacks. They contribute no transparent sorting or blending cost.
  for(let j=0;j<7;j++){
   const ds=start+40+j*88,wx=center(ds)+(j%2?1:-1)*(84+random()*38),y=91+random()*14;
   for(let k=0;k<4;k++)add(clouds,wx+(k-1.5)*12,y+(k===1?6:0),-ds,16+random()*8,7+random()*4,10+random()*5);
  }
  this.towers=this.batch(box,facade,towers,'city-towers');
  this.batch(taper,facade,spires,'city-tapered-towers');
  this.batch(box,stone,crowns,'city-rooftop-terraces');
  this.batch(box,stone,gardens,'city-pocket-parks');
  this.foliage=this.batch(leaf,foliage,trees,'city-tree-canopies');
  this.batch(trunk,bark,trunks,'city-tree-trunks');
  this.accents=this.batch(box,light,accents,'city-luminous-edges');
  this.clouds=this.batch(cloud,cloudMat,clouds,'city-cloud-banks');
  this.batch(disc,stone,plazas,'city-park-plazas');
  const groundGeo=new T.PlaneGeometry(1600,1600),groundMat=new T.MeshBasicMaterial({color:0xa7c8af});this.geometries.add(groundGeo);this.materials.add(groundMat);
  const ground=new T.Mesh(groundGeo,groundMat);ground.name='city-ground';ground.rotation.x=-Math.PI/2;ground.position.set(0,-3.2,-200);this.group.add(ground);
  this.stats={drawCalls:this.group.children.length,triangles:this.group.children.reduce((sum,mesh)=>sum+(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*(mesh.isInstancedMesh?mesh.count:1),0)};
 }
 batch(geometry,material,records,name){
  const mesh=new T.InstancedMesh(geometry,material,records.length),dummy=new T.Object3D(),color=new T.Color();mesh.name=name;
  records.forEach((record,index)=>{dummy.position.set(record.x,record.y,record.z);dummy.rotation.set(0,record.rotation,0);dummy.scale.set(record.sx,record.sy,record.sz);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.setHex(record.color));});
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();this.group.add(mesh);this.batches.push(mesh);return mesh;
 }
 update(){/* Static instance buffers intentionally stay unchanged during races. */}
 setQuality(value){
  // The silhouettes and tree density remain stable; low quality omits only
  // distant clouds and decorative facade light strips.
  this.clouds.visible=value!=='low';this.accents.visible=value!=='low';
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.group.removeFromParent();this.batches.forEach(mesh=>mesh.dispose());
  for(const geometry of this.geometries)geometry.dispose();for(const material of this.materials)material.dispose();
 }
}
