import gate from './gate.js';
import rotor from './rotor.js';
import rate from './rate.js';
import error from './error.js';
import pendulum from './pendulum.js';
import pegs from './pegs.js';
import finish from './finish.js';
import scopeChange from './scope-change.js';
import sprint from './sprint.js';
import uxFlow from './ux-flow.js';
import handoff from './handoff.js';
import codeReview from './code-review.js';
import overtimeStairs from './overtime-stairs.js';
import notFound from './not-found.js';
import teapot from './teapot.js';
import nodeHole from './node-hole.js';
import javaHole from './java-hole.js';
import dotnetHole from './dotnet-hole.js';

export const OBSTACLE_COMPONENTS = Object.freeze(Object.fromEntries([gate, rotor, rate, error, pendulum, pegs, finish, scopeChange, sprint, uxFlow, handoff, codeReview, overtimeStairs, notFound, teapot, nodeHole, javaHole, dotnetHole].map(def => [def.type, def])));

export function getObstacleDefinition(type) {
 const def = Object.hasOwn(OBSTACLE_COMPONENTS,type) ? OBSTACLE_COMPONENTS[type] : null;
 if (!def) throw new Error(`未知機關類型：${type}`);
 return def;
}

export function resolveObstacle(o) {
 const def = getObstacleDefinition(o.type);
 return {def, params: {...def.defaults, ...o.params}};
}
