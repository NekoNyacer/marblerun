export const TEAM_COLORS=['#dc4841','#2676d2','#079664','#b16dd1','#e5a51c','#04a4b1','#e4629b','#dc7424','#5367bf','#819c27','#ad536a','#317e86','#7958a0','#a27625','#377144','#ba3b91'];
export const DEFAULT_TEAM_SETUP={names:['國','泰','世','華','羊'],ballsPerTeam:100};

export function validateTeamSetup(setup,quota){
 if(!setup||!Array.isArray(setup.names)||setup.names.length<2||setup.names.length>TEAM_COLORS.length)throw new Error('請設定 2 到 16 個組別。');
 const names=setup.names.map(name=>String(name??'').trim());
 if(names.some(name=>!name||name.length>30))throw new Error('每組都需要名稱，最多 30 個字。');
 if(new Set(names).size!==names.length)throw new Error('組別名稱不能重複，請使用不同名稱。');
 const ballsPerTeam=Number(setup.ballsPerTeam),total=names.length*ballsPerTeam;
 if(!Number.isInteger(ballsPerTeam)||ballsPerTeam<1||total>1500)throw new Error(`每組彈珠數需為正整數，${names.length} 組每組最多 ${Math.floor(1500/names.length)} 顆。`);
 if(quota!==undefined&&(!Number.isInteger(quota)||quota<1||quota>total))throw new Error(`計分顆數需為 1 到 ${total} 的整數。`);
 return {names,ballsPerTeam};
}
export function createTeams(setup){
 const valid=validateTeamSetup(setup);
 return valid.names.map((name,index)=>({id:`team-${index+1}`,name,color:TEAM_COLORS[index],index,balls:valid.ballsPerTeam}));
}
export function teamParticipants(setup){
 const teams=createTeams(setup),participants=[];
 for(let n=1;n<=teams[0].balls;n++)for(const team of teams)participants.push({id:`${team.id}-${n}`,name:`${team.name} ${n} 號`,dept:team.name,teamId:team.id,teamName:team.name,teamIndex:team.index,color:team.color,ballNumber:n});
 return participants;
}
// Only finishers count. Equal totals are decided by that team's earliest rank.
export function rankTeams(teams,finishers){
 const results=teams.map(team=>({...team,count:0,bestRank:null,ranks:[]})),byId=new Map(results.map(team=>[team.id,team]));
 finishers.forEach((finisher,index)=>{const team=byId.get(finisher.teamId);if(!team)return;const rank=finisher.rank??index+1;team.count++;team.ranks.push(rank);team.bestRank=team.bestRank===null?rank:Math.min(team.bestRank,rank);});
 return results.sort((a,b)=>b.count-a.count||(a.bestRank??Infinity)-(b.bestRank??Infinity)||a.index-b.index).map((team,index)=>({...team,rank:index+1}));
}
