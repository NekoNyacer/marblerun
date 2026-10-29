import fs from 'node:fs';
const file=process.argv[2];if(!file){console.error('Usage: node scripts/replay.mjs <race-record.json>');process.exit(1);}
const record=JSON.parse(fs.readFileSync(file,'utf8'));
const modules={'banyan-constrained-rolling-v1':'../src/legacy/simulation-v1.js','banyan-constrained-rolling-v2':'../src/legacy/simulation-v2.js','banyan-constrained-rolling-v3':'../src/legacy/v3/simulation.js','banyan-constrained-rolling-v4':'../src/legacy/v4/simulation.js','banyan-constrained-rolling-v5':'../src/legacy/v5/simulation.js','banyan-constrained-rolling-v6':'../src/legacy/v6/simulation.js','banyan-constrained-rolling-v7':'../src/simulation.js'};
if(!modules[record.model])throw new Error('Unsupported race model.');
const {RaceSimulation}=await import(modules[record.model]);
const race=new RaceSimulation(record.count,record.quota,record.seed,record.course);const limit=Math.max(600,Number.isFinite(record.elapsed)?record.elapsed+1:0);while(!race.done&&race.t<limit)race.step();
const actual=race.winners.map(w=>({id:record.participants[w.i].id,time:w.time}));
const verified=actual.length===record.winners.length&&actual.every((a,n)=>a.id===record.winners[n].id&&Math.abs(a.time-record.winners[n].time)<1e-7);
console.log(JSON.stringify({verified,seed:record.seed,actual},null,2));if(!verified)process.exitCode=1;
