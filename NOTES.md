# Notes

## Architecture

- `src/app.ts` → registers `pz-root`; `pz-root` sets `.mobile`/`.desktop`, mounts `pz-stage`
  (canvas), `pz-menu` and `pz-menu-button`, and boots the services.
- `src/components/**` — native custom elements (`static WC_IS` + `register_web_component`), one
  folder per component with `name.ts` + `name.css`; DOM built in code via `e`, not markup.
- `src/services/**` — `ImageLoader` (decode/downscale), `ImageStore` (IndexedDB recents),
  `SaveService` (localStorage resume), `GameService` (engine loop + `GameState`), `MenuService`
  (open/close, selection, piece count).
- `src/core/**` — `engine` (loop/inputs/pinch), `board`, `camera`, `debug_hud`, `render`; no DOM-global
  dependencies beyond the canvas context.
- `src/utils/**` — shared helpers (`e`, `register_web_component`, `CallbacksPool`, `debounce`,
  `clamp`, `fullscreen`, `patch`, `try_fn`).
- Communication is via typed `CallbacksPool` subscriptions, not DOM events. Prefer arrow functions.
  Exception: custom-element lifecycle callbacks (`connectedCallback`, `disconnectedCallback`,
  `attributeChangedCallback`) must be prototype methods — arrow class fields are not invoked.

World unit = source-image pixel. `engine.canvas.width/height` are CSS pixels (single source of
truth for camera math); the drawing buffer is scaled by `devicePixelRatio` via the context
transform, so renderers never think about DPR.

## Start menu / storage

`MenuService` lists the most recent images from `ImageStore` (IndexedDB `mini-puzzle/images`,
capped at 5, de-duplicated by name + size). On first run the bundled default image is fetched and
saved so the menu is never empty; nothing is auto-selected — `start game` stays disabled until an
image is picked. The grid is derived from the aspect ratio by `grid_for_count`, which searches
`cols` to minimise `|log(piece_ratio)|` (plus a small term for the piece-count mismatch), keeping
pieces near square.

The recent list is cached in memory and re-emitted on open (no IndexedDB read per open); the game
frame loop is paused while the menu is open, so opening the menu does no rendering work.

The seed image is only stored when the fetch is `ok` and the blob is an image; non-image records are
pruned on init, so a bad asset response can never leave a blank thumbnail.

## Rendering

Each piece is pre-rendered once into its own offscreen canvas (`board.atlas.ts`) including the
connector bleed; the frame loop then only issues `drawImage(bitmap)`. Total atlas pixels are capped
by `ATLAS_BUDGET_PX` (~64 MB RGBA) and uniformly downscaled when exceeded. Edges are drawn as one
batched `Path2D` per piece, and edges joined into the same group are skipped, so connected seams
disappear. `board.atlas.ts` is the reason large photos (4000×6000) stay smooth.

## Connectors

Every interior seam carries exactly one connector, shaped like the reference jigsaw tab: a round knob
traced by two cubic curves. `knob_outline` samples that profile into a polygon, so the clip path,
hit-test and atlas stay polygon-based. Corners therefore have 2 connectors, border pieces 3 and
interior pieces 4, which makes the edges a natural place to start. The two pieces walk the shared
edge in opposite directions, so one gets the tab and the other the matching socket. The geometry
(`board.geometry.ts`) still supports any number of connectors per seam. A connector is one physical
polygon shared by both neighbours. `seam.side` (+1 / -1) chooses which side of the seam line the
connector occupies. On a reversed traversal the whole seam detour is emitted in canonical
order and then reversed as one list, so multi-connector seams never self-intersect.

## Snap / merge

Union-find over piece ids. On pointer release `try_snap` repeatedly merges the dragged group with
any correctly adjacent neighbour group (relative offset within `0.3 × min(pw, ph)`), aligning the
group to the neighbour. A group that sits exactly on its home grid is locked (and is not draggable).
The puzzle is solved when every piece is in one group.

## TODO / limitations

- Ghost target alpha, connector sizes and helper constants are tuned visually, not configurable.
- On-screen controls are limited to the in-game menu button; more controls will be reworked later.
- Union-find scans all pieces per merge (`board.merge`); fine up to a few hundred pieces.
