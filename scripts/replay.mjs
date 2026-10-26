import fs from 'node:fs';
import {RaceSimulation} from '../src/simulation.js';
const file=process.argv[2];if(!file){console.error('Usage: node scripts/replay.mjs <race-record.json>');process.exit(1);}
const record=JSON.parse(fs.readFileSync(file,'utf8'));
if(record.model!=='banyan-constrained-rolling-v1')throw new Error('This replay requires banyan-constrained-rolling-v1.');
const race=new RaceSimulation(record.count,record.quota,record.seed);while(!race.done&&race.t<600)race.step();
const actual=race.winners.map(w=>({id:record.participants[w.i].id,time:w.time}));
const verified=actual.length===record.winners.length&&actual.every((a,n)=>a.id===record.winners[n].id&&Math.abs(a.time-record.winners[n].time)<1e-7);
console.log(JSON.stringify({verified,seed:record.seed,actual},null,2));if(!verified)process.exitCode=1;
