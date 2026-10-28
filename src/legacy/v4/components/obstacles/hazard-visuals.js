import {position} from '../../track-geometry.js';
export const pitMaterial=view=>new view.host.graphics.MeshBasicMaterial({color:0x072f37,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
export function disc(view,x,ds,r,material,y=.045){
 const T=view.host.graphics,positions=[],segments=32,add=(u,v)=>{const p=position(view.o.s+ds+v,(view.o.x??0)+x+u);positions.push(p[0],p[1]+y,p[2]);};
 add(0,0);for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;add(Math.cos(a)*r,Math.sin(a)*r);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const indices=[];for(let i=1;i<=segments;i++)indices.push(0,i,i+1);g.setIndex(indices);g.computeVertexNormals();return view.host.mesh(g,material,view.group);
}
export function rectangle(view,x,ds,w,d,material,y=.05){
 const T=view.host.graphics,vertices=[];for(const [u,v] of [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){const p=position(view.o.s+ds+v,(view.o.x??0)+x+u);vertices.push(p[0],p[1]+y,p[2]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex([0,1,2,1,3,2]);g.computeVertexNormals();return view.host.mesh(g,material,view.group);
}
export function ring(view,x,ds,r,material,y=.075,tube=.06){
 const T=view.host.graphics,positions=[],segments=40;
 for(let i=0;i<segments;i++){const a=i/segments*2*Math.PI,b=(i+1)/segments*2*Math.PI;for(const [angle,rr] of [[a,r-tube],[a,r+tube],[b,r-tube],[b,r+tube]]){const p=position(view.o.s+ds+Math.sin(angle)*rr,(view.o.x??0)+x+Math.cos(angle)*rr);positions.push(p[0],p[1]+y,p[2]);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const ids=[];for(let i=0;i<segments;i++){const j=i*4;ids.push(j,j+1,j+2,j+1,j+3,j+2);}g.setIndex(ids);g.computeVertexNormals();return view.host.mesh(g,material,view.group);
}
export function statusSign(view,title,sub,x=-13,y=4,w=6.4,warning=false){const sign=view.sign(title,x,y,w,sub,warning);view.host.cylinder(.13,y-1,view.host.materials.metal,x,(y-1)/2,0,view.decor);return sign;}
export function setStatus(sign,title,sub,warning=false){
 if(sign.lastSub===sub)return;sign.lastSub=sub;const map=sign.face.material.map,c=map.image,ctx=c.getContext('2d');ctx.fillStyle=warning?'#742e2b':'#103d33';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle=warning?'#ff9a7c':'#81e9be';ctx.lineWidth=5;ctx.strokeRect(5,5,c.width-10,c.height-10);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f5fff9';ctx.font='600 74px Outfit, sans-serif';ctx.fillText(title,c.width/2,90,c.width-43);ctx.fillStyle=warning?'#ffb7a4':'#f7c65d';ctx.font='500 44px Outfit, sans-serif';ctx.fillText(sub,c.width/2,184,c.width-43);map.needsUpdate=true;
}
export function outerPosts(ctx,height=1.7){for(const side of [-1,1])ctx.add(`post${side}`,'circle',side*11.5,0,0,height,{r:.28,role:'post',materialKey:'metal'});}
