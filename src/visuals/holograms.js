import * as T from 'three';
import {elevation,position} from '../track-geometry.js';

// One static atlas is shared by every projected symbol. Canvas work happens
// once, at construction; animation is three shared shader uniforms.
function iconAtlas(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const ctx=canvas.getContext('2d'),tile=256;
 const paths=[
  // Cloud: orchestration / a connected city.
  c=>{c.moveTo(-47,20);c.bezierCurveTo(-73,17,-73,-19,-44,-23);c.bezierCurveTo(-44,-61,16,-65,28,-29);c.bezierCurveTo(68,-38,80,18,45,22);c.lineTo(-47,22);},
  // Shield: an outline icon, never an actual obstacle or game-state indicator.
  c=>{c.moveTo(0,-58);c.lineTo(48,-38);c.lineTo(43,17);c.quadraticCurveTo(30,48,0,62);c.quadraticCurveTo(-30,48,-43,17);c.lineTo(-48,-38);c.closePath();c.moveTo(-24,0);c.lineTo(-5,19);c.lineTo(27,-19);},
  c=>{c.moveTo(-37,36);c.bezierCurveTo(-65,-30,-4,-60,49,-54);c.bezierCurveTo(54,-4,24,53,-37,36);c.moveTo(-47,59);c.quadraticCurveTo(-14,7,29,-30);c.moveTo(-13,12);c.lineTo(-18,-16);c.moveTo(2,-4);c.lineTo(27,-2);},
  c=>{c.moveTo(-57,-39);c.lineTo(57,-39);c.lineTo(57,39);c.lineTo(-57,39);c.closePath();c.moveTo(-57,-13);c.lineTo(57,-13);c.moveTo(-38,18);c.lineTo(-12,18);c.moveTo(19,15);c.lineTo(37,15);},
  c=>{c.moveTo(-24,-34);c.lineTo(-56,0);c.lineTo(-24,34);c.moveTo(24,-34);c.lineTo(56,0);c.lineTo(24,34);c.moveTo(13,-49);c.lineTo(-13,49);}
 ];
 paths.forEach((draw,index)=>{
  ctx.save();ctx.translate((index%4)*tile+tile/2,Math.floor(index/4)*tile+tile/2);
  const fill=ctx.createRadialGradient(0,0,10,0,0,111);fill.addColorStop(0,'rgba(80,255,222,.06)');fill.addColorStop(.7,'rgba(80,255,222,.09)');fill.addColorStop(1,'rgba(80,255,222,0)');ctx.fillStyle=fill;ctx.fillRect(-125,-125,250,250);
  ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='#67ffe3';ctx.shadowBlur=18;ctx.strokeStyle='#aaffec';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(0,0,94,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=7;ctx.strokeStyle='#d7fff4';ctx.lineWidth=5;ctx.beginPath();draw(ctx);ctx.stroke();
  ctx.shadowBlur=0;ctx.lineWidth=2;ctx.strokeStyle='rgba(162,255,232,.55)';
  ctx.beginPath();ctx.arc(0,0,108,-Math.PI*.3,Math.PI*.12);ctx.moveTo(-31,107);ctx.lineTo(31,107);ctx.stroke();
  ctx.restore();
 });
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;
 return texture;
}

const fadeCode=`
 float rangeFade(float s){return 1.0-smoothstep(85.0,155.0,abs(s-uFocusS));}
`;
const iconVertex=`
 attribute float iconIndex;
 uniform float uTime;
 uniform float uFocusS;
 varying vec2 vUv;
 varying float vIcon;
 varying float vFade;
 ${fadeCode}
 void main(){
  vec4 centre=instanceMatrix*vec4(0.0,0.0,0.0,1.0);
  vec4 view=modelViewMatrix*centre;
  vec2 size=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
  view.xy+=position.xy*size;
  view.y+=sin(uTime*.55+iconIndex*1.8-centre.z*.035)*.18;
  vUv=uv;vIcon=iconIndex;vFade=rangeFade(-centre.z);
  gl_Position=projectionMatrix*view;
 }
`;
const iconFragment=`
 uniform sampler2D uAtlas;
 uniform float uTime;
 varying vec2 vUv;
 varying float vIcon;
 varying float vFade;
 void main(){
  vec2 tile=vec2(mod(vIcon,4.0),1.0-floor(vIcon/4.0));
  vec4 symbol=texture2D(uAtlas,(vUv+tile)/vec2(4.0,2.0));
  float scan=.85+.15*sin(vUv.y*190.0-uTime*1.2);
  float pulse=.88+.12*sin(uTime*.7+vIcon);
  float alpha=symbol.a*vFade*scan*pulse;
  if(alpha<.005)discard;
  gl_FragColor=vec4(symbol.rgb*vec3(.72,1.0,.94),alpha*.82);
 }
`;
const projectionVertex=`
 uniform float uFocusS;
 varying vec2 vUv;
 varying float vFade;
 ${fadeCode}
 void main(){
  vec4 centre=instanceMatrix*vec4(0.0,0.0,0.0,1.0);
  vUv=uv;vFade=rangeFade(-centre.z);
  gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);
 }
`;
const beamFragment=`
 uniform float uTime;
 varying vec2 vUv;
 varying float vFade;
 void main(){
  float lines=.7+.3*sin(vUv.y*70.0-uTime*.8);
  float alpha=(.025+.065*pow(vUv.y,2.0))*vFade*lines;
  gl_FragColor=vec4(.28,1.0,.85,alpha);
 }
`;
const ringFragment=`
 uniform float uTime;
 varying vec2 vUv;
 varying float vFade;
 void main(){gl_FragColor=vec4(.42,1.0,.89,vFade*(.34+.08*sin(uTime*.7)));}
`;

function instanced(geometry,material,count,parent){
 const mesh=new T.InstancedMesh(geometry,material,count);mesh.frustumCulled=false;parent.add(mesh);return mesh;
}
function shader(uniforms,vertexShader,fragmentShader){
 return new T.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,side:T.DoubleSide,forceSinglePass:true,toneMapped:false});
}

export class HologramNetwork{
 constructor(scene,{start=-45,end=430}={}){
  this.scene=scene;this.group=new T.Group();this.group.name='Hologram city network';this.group.userData.visualOnly=true;scene.add(this.group);
  const stations=[];
  for(let s=start+18,index=0;s<=end;s+=26,index++)stations.push({s,x:(index%2?1:-1)*(11.7+(index%3)*.05),icon:index%5});
  this.atlas=iconAtlas();
  this.uniforms={uTime:{value:0},uFocusS:{value:0},uAtlas:{value:this.atlas}};
  const count=stations.length;
  const iconGeometry=new T.PlaneGeometry(1,1);iconGeometry.setAttribute('iconIndex',new T.InstancedBufferAttribute(new Float32Array(stations.map(station=>station.icon)),1));
  this.icons=instanced(iconGeometry,shader(this.uniforms,iconVertex,iconFragment),count,this.group);
  const cone=new T.ConeGeometry(1.5,3.4,12,1,true);cone.rotateZ(Math.PI);
  this.beams=instanced(cone,shader(this.uniforms,projectionVertex,beamFragment),count,this.group);
  const ring=new T.RingGeometry(1.05,1.12,24);ring.rotateX(-Math.PI/2);
  this.rings=instanced(ring,shader(this.uniforms,projectionVertex,ringFragment),count*2,this.group);
  const dummy=new T.Object3D();
  stations.forEach((station,index)=>{
   const p=position(station.s,station.x),base=elevation(station.s)+.5;
   dummy.position.set(p[0],base+4.3,p[2]);dummy.rotation.set(0,0,0);dummy.scale.set(3,3,1);dummy.updateMatrix();this.icons.setMatrixAt(index,dummy.matrix);
   dummy.position.y=base+1.7;dummy.scale.set(1,1,1);dummy.updateMatrix();this.beams.setMatrixAt(index,dummy.matrix);
   dummy.position.y=base+.04;dummy.scale.set(1,1,1);dummy.updateMatrix();this.rings.setMatrixAt(index*2,dummy.matrix);
   dummy.position.y=base+.055;dummy.scale.set(1.3,1,1.3);dummy.updateMatrix();this.rings.setMatrixAt(index*2+1,dummy.matrix);
  });
  for(const mesh of [this.icons,this.beams,this.rings])mesh.instanceMatrix.needsUpdate=true;
  this.stats={stations:count,drawCalls:3,triangles:[this.icons,this.beams,this.rings].reduce((sum,mesh)=>sum+mesh.geometry.index.count/3*mesh.count,0),atlasPixels:1024*512};
 }
 update(time,focusS){
  this.uniforms.uTime.value=Number.isFinite(time)?time:0;
  this.uniforms.uFocusS.value=Number.isFinite(focusS)?focusS:0;
 }
 setQuality(value){this.beams.visible=value!=='low';this.rings.visible=value!=='low';}
 dispose(){
  this.scene.remove(this.group);
  this.group.traverse(object=>{if(object.isInstancedMesh)object.dispose();object.geometry?.dispose();object.material?.dispose();});
  this.atlas.dispose();
 }
}
