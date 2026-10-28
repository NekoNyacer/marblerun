const smooth=x=>x*x*(3-2*x);

export function sprintState(t,phase=0,p={}){
 const period=p.period??9,transition=Math.min(p.transition??.4,period/6),beat=period/3;
 const clock=((t+phase*.73)%period+period)%period,lane=Math.floor(clock/beat),elapsed=clock-lane*beat;
 const lifts=[0,0,0];lifts[lane]=1;
 lifts[(lane+2)%3]=1-smooth(Math.min(1,elapsed/transition));
 lifts[(lane+1)%3]=smooth(Math.max(0,Math.min(1,(elapsed-(beat-transition))/transition)));
 return {lane,lifts,remaining:Math.ceil(beat-elapsed),warning:beat-elapsed<(p.warning??.65)};
}

export default {
 type:'sprint',label:'Sprint 截止閘門',
 defaults:{period:9,transition:.4,warning:.65,laneWidth:20/3,barHeight:.7,barDepth:.65,lift:2.1},
 notice(t,phase,p){
  const state=sprintState(t,phase,p),lane=['左','中','右'][state.lane];
  return {key:`${state.lane}-${state.warning}`,text:state.warning?'Sprint 即將截止！留意下一個開放通道。':`Sprint 放行！${lane}側通道開放，錯過就等下一個 Sprint。`};
 },
 build(ctx,p,t,phase){
  const state=sprintState(t,phase,p);
  [-10.5,10.5].forEach((x,j)=>ctx.post(`post${j}`,x,5.1));
  [-p.laneWidth/2,p.laneWidth/2].forEach((x,j)=>ctx.box(`divider${j}`,x,0,0,.65,.3,2.8,{role:'divider',materialKey:'deep'}));
  for(let lane=0;lane<3;lane++){
   ctx.box(`deadline${lane}`,(lane-1)*p.laneWidth,0,.08+p.lift*state.lifts[lane],p.barHeight,p.laneWidth-.24,p.barDepth,{role:'sprint',lane,materialKey:'amber'});
  }
 },
 decorate(view,p){
  const {host}=view,m=host.materials;
  host.box(21.6,.35,.6,m.deep,0,5.1,0,view.decor);
  view.sign('SPRINT DEADLINE',0,5.6,8.2,view.o.label);
  view.sprintSigns=Array.from({length:3},(_,lane)=>{
   const x=(lane-1)*p.laneWidth;
   return {open:view.sign('OPEN',x,3.25,4.8,'GO'),closed:view.sign('WAIT',x,3.25,4.8,'NEXT SPRINT',true)};
  });
 },
 update(view,t,shapes,p){
  const {lifts}=sprintState(t,view.phase??view.k,p);
  view.sprintSigns.forEach((sign,lane)=>{
   const open=lifts[lane]>.4;
   for(const mesh of Object.values(sign.open))mesh.visible=open;
   for(const mesh of Object.values(sign.closed))mesh.visible=!open;
  });
 }
};
