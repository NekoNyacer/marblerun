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

Desktop uses a fixed header, expansive scene, 305px standings panel, and bottom control strip. Above 1600px the standings panel grows to 355px. Below 760px the scene stacks above standings and controls stay visible at the bottom. The ticker occupies the upper scene; name flags and foreground racing remain unobstructed.

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
