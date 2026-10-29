# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
Three.js browser application. Implementation choice: Vite, JavaScript, local Web Worker simulation; user asked to compare Three.js and Unity, browser first recommended.
## Users
Company annual banquet host operates the draw; all employees watch on a projected screen.
## Product Purpose
A visually compelling 3D marble race lottery for 1,200–1,500 employees. Excel import and configurable number of winners.
## Capabilities and Constraints
User confirmed race finish order determines winners, no predetermined winners. Equal marble properties and shuffled starting positions. Camera always follows the leading group. All participants continue simulating; only camera-visible marbles render. Current leaders and contenders must be legible. Obstacles should change the race outcome.
## Brand Commitments
User explicitly chose a bright amusement park visual style. Traditional Chinese interface.
## Evidence on Hand
No company identity or real employee list supplied. All initial participant names are clearly labeled demo data.
## Open decisions
Target event computer and projector resolution unknown. The main track uses custom constrained rolling; the staircase and hourglass use a local 3D sphere contact solver. The application is not a general-purpose rigid-body engine. Performance must be measured on the actual event device.

## Confirmed visual and race-event requirements (preview stage)
- Cathay United Bank IT department theme; emerald/white/silver technology amusement arena, digital banyan landmark, ChatGPT conversation gates and Codex terminal-themed machinery. Preview approval still precedes implementation.
- Move race news out of the lower-right sidebar into a horizontal scrolling ticker in the upper portion of the race viewport. Keep foreground marbles and name labels visible. Announcements must describe actual simulation events.
- Expand obstacles around relatable IT incidents: Merge Conflict rotating paddles; 429 Rate Limit timed release; 500 Error piston barriers; Timeout pendulums; Hotfix moving bridges. These are proposed mechanics, to refine during implementation.
- Credits exhausted gate: one gate closes while an alternate fallback gate opens. Visible shared gate state and alternate routing create overtaking; these are fictional game credits, unrelated to real account balances. All participants follow the same shared world rules. Gates need visible warning and a route that avoids trapping marbles.
- Latest user requested these changes on the AI arena preview; continue visual concept iteration, not application implementation, until user confirms.

## Implementation authorization
The user approved the latest concept and explicitly requested implementation, with browser version prioritized. The preview-only limitation is superseded. Initial application is now implemented with Three.js, Web Worker and local SheetJS import/export. Hotfix currently uses piston barriers; all five obstacle mechanics are documented in README.md.

## Collision and track repair v2
User requested collision/visual alignment, higher obstacle contrast, removal of floor/depth intersections, and added pegs. Shared world-space box/cylinder/sphere descriptors now drive rendering and physics; in-lane divider and support contacts are physical; perimeter frames stand outside guard rails. Five peg fields add 100 collidable pegs with rail clearance. Road-conforming geometry and biased decals address clipping/depth artifacts. Snapshot interpolation uses one timeline for machinery and marbles. Existing v1 replay source is retained.

## Modular course v3
User authorized implementation of all five previewed mechanisms and independent components for existing mechanisms. Twelve registered component modules now own defaults, collision, decoration, animation and optional event notices. `src/course-config.js` owns placements and per-instance parameters. New scope-change and UX Flow guides connect to both rails and redirect edge traffic inward. Handoff uses an in-plane oscillating balance arm within the existing constrained model. New records include resolved course snapshots; v1/v2 replay engines remain frozen.

## Browser course library
The user requested track selection, browser editing, localStorage saves and portable JSON import/export, with GitHub Pages static deployment and no backend. Eight immutable built-in tracks plus custom copies are selected through a dedicated course manager. Active course data drives both RaceScene and the simulation Worker; racing/countdown/paused states lock changes. Track files carry a versioned schema and resolved component parameters. Saved race records retain the selected course name and exact active configuration. Relative Vite assets and a Pages workflow support repository subpath hosting.

## Future city visual direction
The user supplied a daylight future-city reference and requested glowing routes and hologram-style icons without a performance regression. Preserve static GitHub Pages hosting, course libraries, current competition rules and obstacle colliders. New visuals use batched skyline/greenery, an emissive road pattern and one hologram atlas; performance comparison uses the same 1280×800, DPR1, 1,500-person starting scene. Final event-device GPU performance remains to be measured on that device.

## Party mechanisms v4
User requested official logo layout repair, single-row race HUD, automatic pinball flippers, HTTP 404 elimination/418 steam, permanent Node.js fill pits, a full-width Java lift pit and .NET overtime hourglass. Simulation now distinguishes permanent losses from temporary holds, reports prize shortfalls, and preserves frozen v1–v3 replay. Course editing uses twelve fixed stations and visual hardware selection; legacy free-position custom tracks require an explicit conversion copy. Original synthesized party music follows race phases and the combined audio toggle.

## Stairway and overtime hourglass v5
The user removed the 404, Node.js, Java and standalone .NET obstacle choices. Existing custom courses and historical race records remain readable. The replacement is a single full-width station: alternating vertically moving steps carry marbles to an elevated approach and overtime hourglass, from which they fall to the original road elevation. Tea now has physical rising barriers, and UX Flow has additional alternating maze cards. The new model retains historical replay engines.

## Physical staircase and hourglass v6
The user reported that the staircase/elevator and hourglass looked animated rather than physical and requested reimplementation. New races use `banyan-constrained-rolling-v6`. This station now integrates sphere position and velocity in three dimensions, with four substeps per fixed 90 Hz race step and gravity of 9.81 m/s². Moving stair contact transfers the surface velocity; solid risers, sloped tops, the narrowing deck, guide walls, stationary upper/lower cones, friction and 3D spatial-hash sphere collisions determine the path. Marbles leave the funnel in free flight and retain momentum through landing. Stage labels are telemetry and do not prescribe positions, orbit durations, queues or release times.

Rendering and contacts share `src/overtime-geometry.js`. The stair transmission ratio is 2.2 and motor acceleration is limited to 4.4 m/s², so the effective period may exceed the requested `period`. The legacy `orbit` parameter controls funnel friction rather than a timed spiral. All racers retain the same physical parameters. The main road keeps constrained rolling; this change does not introduce a full-track rigid-body engine. The complete v5 engine is frozen under `src/legacy/v5/` for historical replays. All 80 regression tests pass, including 1,500 entrants clearing the station and finishing (seed 82, 209.74 simulated seconds), exact 100-entrant reproduction, four legal parameter boundaries, shared geometry and legacy replay. A browser demonstration on the two-station overtime course also completed without script errors. GPU throughput and projection quality still require validation on the event computer.

## Team competition and enclosed hourglass v7
The user requested a larger bowl, smaller single-marble outlet, a covered two-marble-wide longer collector with no bypass, rim retention, and a Teapot depth-fighting correction. The 6.8 m covered chute joins the enclosed bowl; discharge requires a recorded physical throat crossing. A visible moving contact pin disrupts arches at the outlet. Team mode generates equal-sized groups without importing a roster and awards the group with most of the first N finishers; an equal count is broken by the earliest finisher rank. The requested demo is 國、泰、世、華、羊, 100 marbles each, first 20 scored. Team colour, results, history and exports share one scoring implementation. v6 is frozen for replay; new records use v7.
