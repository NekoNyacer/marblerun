import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {MODEL_VERSION} from '../src/legacy/v5/world.js';

test('v5 overtime records replay with their frozen engine after the physics upgrade',()=>{
 assert.equal(MODEL_VERSION,'banyan-constrained-rolling-v5');
 const result=spawnSync(process.execPath,[
  fileURLToPath(new URL('../scripts/replay.mjs',import.meta.url)),
  fileURLToPath(new URL('./fixtures/replay-v5-overtime.json',import.meta.url))
 ],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);
 const replay=JSON.parse(result.stdout);
 assert.equal(replay.verified,true);
 assert.deepEqual(replay.actual,[
  {id:'legacy-0',time:55.99568854423463},
  {id:'legacy-1',time:56.811575699520446},
  {id:'legacy-5',time:57.98292820385588}
 ]);
});
