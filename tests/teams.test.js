import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_TEAM_SETUP,createTeams,teamParticipants,rankTeams,validateTeamSetup} from '../src/teams.js';

test('the requested demonstration has five equal hundred-marble teams and consistent colours',()=>{
 const teams=createTeams(DEFAULT_TEAM_SETUP),balls=teamParticipants(DEFAULT_TEAM_SETUP);
 assert.deepEqual(teams.map(t=>t.name),['國','泰','世','華','羊']);
 assert.equal(balls.length,500);assert.equal(new Set(balls.map(b=>b.id)).size,500);
 assert.equal(new Set(teams.map(t=>t.color)).size,5);
 for(const team of teams){const members=balls.filter(b=>b.teamId===team.id);assert.equal(members.length,100);assert.ok(members.every(b=>b.color===team.color&&b.teamName===team.name));}
});
test('twenty scored finishers use team count, then the earliest marble rank to break a tie',()=>{
 const teams=createTeams(DEFAULT_TEAM_SETUP),order=[1,0,0,1,2,3,4,1,2,0,3,4,0,1,2,3,4,0,2,1];
 const standings=rankTeams(teams,order.map((index,i)=>({teamId:teams[index].id,rank:i+1})));
 assert.equal(standings.reduce((sum,t)=>sum+t.count,0),20);
 assert.deepEqual(standings.map(t=>[t.name,t.count,t.bestRank]),[['泰',5,1],['國',5,2],['世',4,5],['華',3,6],['羊',3,7]]);
});
test('a higher count beats the first finisher, and no team scores before the first finish',()=>{
 const teams=createTeams(DEFAULT_TEAM_SETUP);
 assert.ok(rankTeams(teams,[]).every(t=>t.count===0&&t.bestRank===null));
 const standings=rankTeams(teams,[{teamId:teams[0].id,rank:1},{teamId:teams[1].id,rank:2},{teamId:teams[1].id,rank:3}]);
 assert.equal(standings[0].name,'泰');assert.equal(standings[0].count,2);
});
test('team settings reject unequal setup ambiguity, duplicates, impossible quotas and excessive totals',()=>{
 assert.doesNotThrow(()=>validateTeamSetup(DEFAULT_TEAM_SETUP,20));
 for(const [setup,quota] of [[{names:['國'],ballsPerTeam:100},20],[{names:['國','國'],ballsPerTeam:100},20],[{names:['國',''],ballsPerTeam:100},20],[{names:['國','泰'],ballsPerTeam:751},20],[DEFAULT_TEAM_SETUP,501],[DEFAULT_TEAM_SETUP,0],[{names:['國','泰'],ballsPerTeam:1.5},1]])assert.throws(()=>validateTeamSetup(setup,quota));
});
