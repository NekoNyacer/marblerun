---
name: 大樹 AI 競速場
description: 明亮的綠色未來城市，結合銀白天際線、空中花園、光流賽道與全像圖標。
colors:
  primary: "#00894f"
  primary-deep: "#0a503a"
  ink: "#163c32"
  muted: "#62766c"
  surface: "#ffffff"
  neutral-bg: "#f6f8f3"
  line: "#dfe6dc"
  amber: "#b77815"
typography:
  title:
    fontFamily: "Noto Sans TC Variable, sans-serif"
    fontSize: "22px"
    fontWeight: 750
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Noto Sans TC Variable, sans-serif"
    fontSize: "14px"
    fontWeight: 450
    lineHeight: 1.5
  number:
    fontFamily: "Outfit, sans-serif"
    fontSize: "24px"
    fontWeight: 600
rounded:
  control: "8px"
  dialog: "16px"
spacing:
  tight: "8px"
  normal: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
---
## Overview

**Creative North Star: "在綠色未來城市中競速"**

The latest user reference is a bright solarpunk city: blue sky, silver/ivory towers, lush terraces, luminous paths and floating projection icons. The race remains the focal plane; the surrounding city adds depth and variety. Existing green/white operation UI, upper ticker and legible machinery retain their function and identity.

## Colors

Emerald carries actions and course hardware; forest green anchors text and displays. Silver and ivory separate the course from the pale garden atmosphere. Amber denotes warnings and the prize cutoff. Racer colors remain diverse to support identification.

## Typography

Self-hosted Noto Sans TC Variable handles Traditional Chinese UI and participant names. Self-hosted Outfit handles time, ranks, and numbers. Participant names remain the primary leaderboard text; employee IDs and departments distinguish people sharing a name.

## Layout

Desktop uses a fixed header, expansive scene, 305px standings panel, and bottom control strip. Above 1600px the standings panel grows to 355px. Below 760px the scene stacks above standings and controls stay visible at the bottom. The ticker, race status/timer and course name share one compact upper-scene row. The brand is one official SVG image, preserving its internal text layout at every width. Name flags and foreground racing remain unobstructed.

## Elevation & Depth

Scene depth comes from perspective, directional lighting, soft contact discs, reflective marble materials, acrylic rails, and atmospheric fog. UI panels remain flat and pale. Dialog and preparation overlays use diffuse downward shadows.

Gameplay solids use deep green silhouettes and amber hazard stripes against a muted road surface. Support columns stand outside the rail, with a physical central divider inside the gate. Geometry conforms to the road height. Road decals use an explicit depth bias; hazard bands are material textures instead of overlapping box faces. Peg crowns sit above marble height with separated surfaces.

## Shapes

Controls have restrained rounding; larger dialogs and the preparation overlay use a softer corner. Course mechanics use coherent cylindrical pivots, rectangular terminal screens, and continuous guard rails. The city uses varied stepped and tapered towers, leafy rooftop gardens and circular projection stations. Clear off-track silhouettes frame the racers.

## Components

The ticker has a fixed green label and a moving single-line event message, respecting reduced-motion settings. The standings use aligned ranks, marble swatches, identity, and estimated gaps, with a fine dashed prize cutoff. The primary control switches between start, pause, resume, and results. Settings lock draw parameters during a race. Import and results use focused dialogs.

## Do's and Don'ts

- Do preserve the bright green IT identity and legibility on a projector.
- Do describe real simulation events in race news.
- Do keep visible mechanics synchronized with collision state.
- Do use equal ball parameters and random starting placement.
- Don't replace the game with a static concept image.
- Don't use AI themed scenery to imply AI chooses winners.
- Don't claim final event-machine performance from a development-device measurement.

## Future city rendering budget

The road is one surface with UV-driven cyan light lanes and flowing highlights; it adds no bloom or full-screen compositing pass. Rails, glass panes, support columns and finish markings use shared/merged batches. The ten-batch city uses window material patterns instead of window meshes and vertex-lit diffuse materials for skyline/foliage. Holograms use one static 1024×512 icon atlas and three instanced draws: billboards, projection cones and base rings. There are no additional dynamic lights, shadows or particle simulations.

Pictograms depict decorative cloud, leaf, shield, card and code services, not live race state. They sit outside the racing surface and below the upper ticker. Decorative motion updates shared uniforms; reduced-motion preference freezes it. Low quality retains road lights and icons while omitting distant cloud/edge accents and projection cones/rings. Marble tessellation follows quality without changing ball radius or physics.

## Visual course composition and hazard states

The course manager shows twelve fixed stations with miniature mechanism diagrams and a focused selection palette. Hosts choose hardware or an empty straight, not geometry values. Existing free-position tracks stay playable until the host explicitly creates a fixed-position copy. Retired hazards in an older saved course are identified before a race and skipped without changing the saved file.

Amber side pinball flippers sweep upstream at staggered, irregular times. The 418 teapot raises physical barriers and UX Flow uses staggered cards. The elevated staircase and hourglass communicate actual Worker height and motion; marbles in that mechanism remain contenders.

Original locally synthesized 140 BPM party music accompanies countdown, racing and a short finish cadence. The combined music/effects button starts muted and requires a user gesture; pause, hidden tabs and reset stop scheduled music.

## Stairway and overtime hourglass
One fixed station contains a full-width alternating lift staircase, a narrowing raised walkway and an elevated hourglass. Amber and green stair tops slope downstream, with solid risers extending to road level. Their moving tops transfer velocity on contact. The raised deck and guide walls converge at the bowl approach. Both translucent funnel shells remain stationary and meet at the physical throat; the upper lip, throat and lower outlet heights come from the same geometry used by the contact solver. Camera and name tags follow the racer's actual simulated height.

The v6 station uses four 3D sphere-contact substeps per fixed 90 Hz race step, with gravity of 9.81 m/s², contact friction and 3D spatial-hash ball collisions. Marbles may lose surface contact, bounce and fall while retaining momentum; a stage label only reports the current region. No timed spiral or path animation positions a marble. Shared geometry applies a 2.2 stair transmission ratio and a 4.4 m/s² motor acceleration limit; hardware motion uses the resulting effective period. The saved `orbit` value now tunes cone friction instead of setting time in the bowl. This local solver supplements the main road's constrained rolling model.

Existing saved legacy obstacle courses remain available with a clear warning; retired mechanisms are excluded from new choices. New race records use v6, while the frozen v5 source preserves the original guided-motion replay. Automated geometry tests compare moving tops, fixed riser bases, approach walls and funnel junctions against the shared physical dimensions. The 80 passing regression tests include 1,500-entrant station completion, 100-entrant deterministic reproduction and parameter extremes. A browser run on the two-station overtime course completed without script errors; GPU performance remains specific to the event computer.
