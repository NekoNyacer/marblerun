// Edit this list to arrange the track. Each id and phase stays with its obstacle
// when it is moved/reordered. Component defaults live in components/obstacles/.
export const COURSE_CONFIG = [
 {id:'debug-1',s:18,type:'pegs',label:'DEBUG PEGS',phase:0},
 {id:'error-1',s:36,type:'error',label:'500 ERROR',phase:1},
 {id:'requirements',s:52,type:'scope-change',label:'需求變更轉向板',phase:17,params:{speed:.5}},
 {id:'prompt',s:70,type:'gate',label:'Prompt Gate',phase:2},
 {id:'merge-1',s:105,type:'rotor',label:'Merge Conflict',phase:3},
 {id:'router-1',s:126,type:'pegs',label:'PACKET ROUTER',phase:4},
 {id:'rate-1',s:144,type:'rate',label:'429 RATE LIMIT',phase:5},
 {id:'design-handoff',s:164,type:'handoff',label:'設計交付蹺蹺板',phase:18,params:{swing:.64}},
 {id:'credits',s:184,type:'gate',label:'Credits Gate',phase:6},
 {id:'balancer',s:201,type:'pegs',label:'LOAD BALANCER',phase:7},
 {id:'timeout',s:220,type:'pendulum',label:'TIMEOUT',phase:8},
 {id:'review',s:240,type:'code-review',label:'Code Review 分流器',phase:19},
 {id:'hotfix',s:258,type:'error',label:'HOTFIX',phase:9},
 {id:'debug-2',s:277,type:'pegs',label:'DEBUG PEGS',phase:10},
 {id:'merge-2',s:295,type:'rotor',label:'Merge Conflict',phase:11},
 {id:'ux',s:316,type:'ux-flow',label:'UX Flow 卡片迷宮',phase:20,params:{height:1.25}},
 {id:'fallback',s:334,type:'gate',label:'Fallback Gate',phase:12},
 {id:'router-2',s:353,type:'pegs',label:'PACKET ROUTER',phase:13},
 {id:'rate-2',s:376,type:'rate',label:'429 RATE LIMIT',phase:14},
 {id:'deadline',s:393,type:'sprint',label:'Sprint 截止閘門',phase:21,params:{period:9}},
 {id:'final-test',s:406,type:'pendulum',label:'FINAL TEST',phase:15},
 {id:'finish',s:430,type:'finish',label:'DEPLOY SUCCESS',phase:16}
];
