# Notes

## Architecture

- `src/engine` — canvas loop, DPR handling, pointer/keyboard inputs. Knows nothing about puzzles.
- `src/game/game.ts` — composition root and frame pipeline.
- `src/game/game.session.ts` — new game / reshuffle / set image; camera fit.
- `src/game/entities/board` — `board.ts` (model + union-find), `board.seams.ts` (connector
  generation), `board.geometry.ts` (piece polygon + hit-test), `board.groups.ts` (snap/merge/lock),
  `board.renderer.ts`, `board.layout.ts` (grid options + resolution clamp).
- `src/game/entities/image` — file/drop/paste loading, downscale, target-ghost renderer.
- `src/game/entities/controls`, `hud`, `camera`, `misc`.

World unit = source-image pixel. `engine.canvas.width/height` are CSS pixels (single source of
truth for camera math); the drawing buffer is scaled by `devicePixelRatio` via the context
transform, so renderers never think about DPR.

## Connectors

Every interior seam owns 0..3 primitive connectors (`rect` | `tri`). A connector is one physical
polygon shared by both neighbours: the two pieces walk the shared edge in opposite directions, so
one gets a bump and the other a matching dent. No owner or winding bookkeeping is needed.
`seam.side` (+1 / -1) chooses which side of the seam line the connector occupies, randomising
bump/dent per seam.

`piece_polygon` emits connectors in board coordinates and subtracts the piece origin at the end.
Border edges stay flat. The renderer clips each piece to its polygon and draws the source image
expanded by `max_connector_depth`, so connector areas show the neighbouring image content and no
seam gap appears.

## Snap / merge

Union-find over piece ids. On pointer release `try_snap` repeatedly merges the dragged group with
any correctly adjacent neighbour group (relative offset within `0.3 × min(pw, ph)`), aligning the
group to the neighbour. A group that sits exactly on its home grid is locked (and is not draggable).
The puzzle is solved when every piece is in one group.

## TODO / limitations

- The default image is only 526×526, so default grids are capped at 4×4 (`MIN_PIECE_PX = 130`).
- No pinch-to-zoom gesture yet (single pointer only).
- No persistence: a reload starts a new puzzle.
- Ghost target alpha and connector sizes are tuned visually, not configurable.
