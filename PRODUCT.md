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
Target event computer and projector resolution unknown. First implementation is a custom constrained rolling simulation, not a general-purpose rigid-body engine. Performance must be measured on the actual event device.

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
