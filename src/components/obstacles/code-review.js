import {smooth} from './shared.js';
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function reviewStroke(t,side,phase=0,speed=1){
 const clock=t*speed+phase*.19,slot=Math.floor(clock/4.8);
 for(let k=slot-1;k<=slot;k++){
  const key=k*13+phase*7+(side<0?19:47);if(noise(key+5)<.17)continue;
  const age=clock-(k*4.8+.15+noise(key)*2.8);if(age<0||age>.96)continue;
  if(age<.14){const u=age/.14;return {value:smooth(u),velocity:6*u*(1-u)/.14*speed};}
  if(age<.24)return {value:1,velocity:0};
  const u=(age-.24)/.72;return {value:1-smooth(u),velocity:-6*u*(1-u)/.72*speed};
 }return {value:0,velocity:0};
}
export default {
 type:'code-review',label:'Code Review 回擊推板',
 defaults:{armLength:8.8,depth:.85,height:1.05,opening:.25,swing:.88,speed:1,spacing:3.8},
 build(ctx,p,t,phase){for(const side of [-1,1]){
  const pivot=side*9.65,length=Math.max(8.6,p.armLength),stroke=reviewStroke(t,side,phase,p.speed);
  const angle=side*(-Math.min(.38,p.opening)+Math.max(.8,p.swing)*stroke.value),omega=side*Math.max(.8,p.swing)*stroke.velocity;
  const offset=-side*length/2,x=pivot+offset*Math.cos(angle),ds=offset*Math.sin(angle);
  ctx.add(`pivot-${side}`,'circle',pivot,0,0,1.65,{r:.43,role:'post',materialKey:'metal'});
  ctx.box(`flipper-${side}`,x,ds,.04,p.height,length,p.depth,{angle,omega,vx:-offset*Math.sin(angle)*omega,vs:offset*Math.cos(angle)*omega,role:'code-review',materialKey:side<0?'amber':'green'});
 }},
 decorate(view){view.sign('CODE REVIEW',-12.9,3.6,6,'雙側回擊 · 瞄準中央');view.host.cylinder(.13,2.7,view.host.materials.metal,-12.9,1.35,0,view.decor);},
 notice(t,phase,p){return [-1,1].some(side=>reviewStroke(t,side,phase,p.speed).velocity>1)?{key:'flipping',text:'Code Review 推板回擊！走正中央，或抓準回板空檔。'}:null;}
};
