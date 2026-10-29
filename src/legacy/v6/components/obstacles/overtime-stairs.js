import {center,elevation} from '../../track-geometry.js';
import {STAIR_START,STAIR_DEPTH,STAIR_GEAR_RATIO,BOWL_CENTER,STAIR_SLOPE,THROAT_RADIUS,stairHeight,overtimeGeometry} from '../../overtime-geometry.js';

// Hardware uses the same stationary world frame and dimensions as the contact
// solver. Only the stair tops move; their solid risers always extend to the road.
function prismVertices(top,bottom){
 const vertices=[...top,...bottom],indices=[0,1,2,0,2,3,4,6,5,4,7,6];
 for(let a=0;a<4;a++){const b=(a+1)%4;indices.push(a,b+4,b,a,a+4,b+4);}
 return {positions:indices.flatMap(i=>vertices[i]),topIndices:indices.flatMap((i,n)=>i<4?[n*3+1]:[])};
}
function prism(host,top,bottom,material,parent){
 const T=host.graphics,{positions,topIndices}=prismVertices(top,bottom);
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.computeVertexNormals();
 const mesh=host.mesh(geometry,material,parent);
 mesh.frustumCulled=false;
 return {mesh,topIndices};
}

export default {
 type:'overtime-stairs',label:'電梯故障・加班沙漏',
 defaults:{period:2.4,rise:1.05,amplitude:.65,orbit:5,radius:5},
 build(ctx){for(const side of [-1,1])for(const ds of [-14,14])ctx.trackAdd(`boundary-${side}-${ds}`,'circle',side*11.5,ds,0,2,{r:.28,role:'post',materialKey:'metal'});},
 decorate(view,p){
  const {host,decor,o}=view,T=host.graphics,g=overtimeGeometry(o,p);
  view.overtimeGeometry=g;
  view.stairSlabs=[];view.stairPosts=[];
  for(const step of g.steps){
   const {n,z,x}=step,corners=[[-9.65,-STAIR_DEPTH/2],[9.65,-STAIR_DEPTH/2],[9.65,STAIR_DEPTH/2],[-9.65,STAIR_DEPTH/2]];
   const top=corners.map(([u,v])=>[x+u,step.base-g.base-STAIR_SLOPE*v,-z-v]);
   const bottom=corners.map(([u,v])=>[x+u,elevation(o.s+z+v)-g.base-1,-z-v]);
   const {mesh:slab,topIndices}=prism(host,top,bottom,n%2?host.materials.green:host.materials.amber,decor);
   const basePositions=new Float32Array(slab.geometry.attributes.position.array);
   view.stairSlabs.push({slab,n,topIndices,basePositions});
   for(const side of [-1,1]){
    const height=(n+.5)*p.rise+STAIR_GEAR_RATIO*p.amplitude+.35;
    view.stairPosts.push(host.box(.22,height,.28,host.materials.metal,x+side*9.95,step.base-g.base+height/2,-z,decor));
   }
  }
  // Curved, finite-height side walls match the ascent contacts. Each side's
  // segments and cap are batched into two draws rather than separate panels.
  const guardGlass=new T.MeshBasicMaterial({color:0x9aede2,transparent:true,opacity:.13,depthWrite:false,side:2});
  view.stairGuards=[];view.stairGuardCaps=[];
  const segments=Math.ceil((g.deckStart-STAIR_START)/.9);
  for(const side of [-1,1]){
   const panels=[],caps=[];
   for(let n=0;n<segments;n++){
    const z0=STAIR_START+(g.deckStart-STAIR_START)*n/segments,z1=STAIR_START+(g.deckStart-STAIR_START)*(n+1)/segments;
    const x0=center(o.s+z0)-g.originX+side*9.65,x1=center(o.s+z1)-g.originX+side*9.65;
    const footprint=[[x0+Math.min(0,side*.18),z0],[x0+Math.max(0,side*.18),z0],[x1+Math.max(0,side*.18),z1],[x1+Math.min(0,side*.18),z1]];
    const top=footprint.map(([x,z])=>[x,g.high+3,-z]);
    const bottom=footprint.map(([x,z])=>[x,elevation(o.s+z)-g.base-.2,-z]);
    panels.push(...prismVertices(top,bottom).positions);
    caps.push(...prismVertices(top,top.map(([x,y,z])=>[x,y-.08,z])).positions);
   }
   const batch=(vertices,material)=>{
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    return host.mesh(geometry,material,decor);
   };
   view.stairGuards.push({side,mesh:batch(panels,guardGlass)});
   view.stairGuardCaps.push(batch(caps,host.materials.light));
  }
  const [left,right]=g.guides,deckCorners=[[left[0],left[1]],[right[0],right[1]],[right[2],right[3]],[left[2],left[3]]];
  const deckTop=deckCorners.map(([x,z])=>[x,g.deckY(z)-g.base,-z]);
  view.deck=prism(host,deckTop,deckTop.map(([x,y,z])=>[x,y-.35,z]),host.materials.deep,decor).mesh;
  view.guideRails=[];
  for(const [x1,z1,x2,z2] of g.guides){
   const length=Math.hypot(x2-x1,z2-z1),nx=-(z2-z1)/length*.09,nz=(x2-x1)/length*.09;
   const footprint=[[x1+nx,z1+nz],[x1-nx,z1-nz],[x2-nx,z2-nz],[x2+nx,z2+nz]];
   const bottom=footprint.map(([x,z])=>[x,g.deckY(z)-g.base,-z]);
   const top=bottom.map(([x,y,z])=>[x,y+1.05,z]);
   view.guideRails.push(prism(host,top,bottom,host.materials.white,decor).mesh);
  }
  for(const [x,z] of deckCorners){
   const ground=elevation(o.s+z)-g.base,height=g.deckY(z)-g.base-ground-.35;
   host.box(.25,height,.25,host.materials.metal,x,ground+height/2,-z,decor);
  }
  // Double-sided translucent shells expose the real stationary cone surfaces.
  const glass=new T.MeshBasicMaterial({color:0x6ef4dd,transparent:true,opacity:.22,depthWrite:false,side:2});
  view.upperFunnel=host.mesh(new T.CylinderGeometry(p.radius,THROAT_RADIUS,g.lipY-g.throatY,48,1,true),glass,decor);
  view.upperFunnel.position.set(g.bowlX,(g.lipY+g.throatY)/2-g.base,-BOWL_CENTER);
  view.lowerFunnel=host.mesh(new T.CylinderGeometry(THROAT_RADIUS,2.7,g.throatY-g.exitY,48,1,true),glass,decor);
  view.lowerFunnel.position.set(g.bowlX,(g.throatY+g.exitY)/2-g.base,-BOWL_CENTER);
  for(const [radius,y,material] of [[p.radius,g.lipY,host.materials.light],[THROAT_RADIUS,g.throatY,host.materials.amber],[2.7,g.exitY,host.materials.light]]){
   const ring=host.mesh(new T.TorusGeometry(radius,.08,5,48),material,decor);ring.rotation.x=Math.PI/2;ring.position.set(g.bowlX,y-g.base,-BOWL_CENTER);
  }
  for(const side of [-1,1]){
   const ground=elevation(o.s+BOWL_CENTER)-g.base,height=g.lipY-g.base-ground;
   host.box(.24,height,.24,host.materials.metal,g.bowlX+side*(p.radius+.4),ground+height/2,-BOWL_CENTER,decor);
  }
  const stairSign=view.sign('電梯故障',-13,5,6,'請走樓梯');stairSign.face.position.z+=12;stairSign.backing.position.z+=12;host.cylinder(.13,4.2,host.materials.metal,-13,2.1,12,decor);
  const sandSign=view.sign('加班沙漏',12.8,g.lipY-g.base+4,7,'重力旋流・自由落體');sandSign.face.position.z-=BOWL_CENTER;sandSign.backing.position.z-=BOWL_CENTER;host.cylinder(.13,g.lipY-g.base+3,host.materials.metal,12.8,(g.lipY-g.base+3)/2,-BOWL_CENTER,decor);
  this.update(view,0,[],p);
 },
 update(view,t,shapes,p){
  const phase=view.o.phase??0;
  for(const stair of view.stairSlabs??[]){
   const h=stairHeight(stair.n,t,phase,p),positions=stair.slab.geometry.attributes.position;
   for(const i of stair.topIndices)positions.array[i]=stair.basePositions[i]+h;
   positions.needsUpdate=true;
  }
 },
 notice(){return {key:'overtime-stairs',text:'電梯故障，請走樓梯！交替升降的階梯帶領彈珠爬高，前方還有加班沙漏。'};}
};
