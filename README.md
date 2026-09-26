# mini-puzzle

Client-only jigsaw puzzle. On start a menu lets you pick an image (file picker, drag & drop, or
clipboard paste) and a piece count, then start. The last 5 images are kept in IndexedDB so they can
be reused without picking a file again. No backend; the only network-adjacent asset is the bundled
default image, loaded from the same origin.

## Menu

- recent images: the last 5 used, newest first; click one to select it
- file picker, drag & drop anywhere, or paste from the clipboard
- piece count: `6 / 12 / 24 / 48 / 80 / 120 / 180 / 240 / 320 / 500`. The grid (`cols × rows`) is computed from the image aspect
  ratio so pieces stay as square as possible. A `low-res` hint appears when a piece would be under
  ~130 source pixels; selection is never blocked.
- `start game` builds the puzzle
- `continue` — restores the last in-progress puzzle; shown only when a save exists

## In-game keys

- drag a piece / connected block — primary pointer (mouse, touch, stylus via pointer events)
- drag empty space — pan; mouse wheel — zoom; `-` / `=` — zoom; arrow keys — pan
- `N` — new game, `G` — toggle target ghost, `H` — toggle debug HUD, `C` — center, `F` — fullscreen
- `Esc` — back to the menu
- two-finger pinch — pan & zoom (touch)

Pieces snap together when their relative offset matches the grid within `0.3 × min(piece width,
piece height)`. A connected group locks once it sits on its exact board position and is no longer
draggable; the puzzle is solved when all pieces form one group (the debug HUD shows `solved!`).

## Architecture

Native web components (no framework), mirroring the structure of `jopa-player`.

- `src/app.ts` — entry; imports `styles/global.css` and registers `pz-root`.
- `src/components/**` — custom elements (`pz-root`, `pz-stage`, `pz-menu`, `pz-dropzone`,
  `pz-recent-list`, `pz-piece-counts`, `pz-button`, `pz-menu-button`), each a folder with
  `name.ts` + `name.css`.
- `src/services/**` — stateless-ish services with static methods / singletons: `ImageLoader`,
  `ImageStore` (IndexedDB), `SaveService` (localStorage), `GameService` (owns the engine loop and
  `GameState`), `MenuService` (menu state + typed callback pools).
- `src/core/**` — framework-agnostic game domain: `engine` (loop, inputs, pinch), `board`, `camera`,
  `debug_hud`, `render`.
- `src/utils/**` — `e` hyperscript, `register_web_component`, `CallbacksPool`, `debounce`, `clamp`,
  `fullscreen`, `patch`, `try_fn`.
- `src/types/**` — shared types.

Components communicate through `CallbacksPool` subscriptions (`on_*`), not DOM events. Style rule:
prefer arrow functions.

## Commands

```bash
bun install            # deps (@types/bun + typescript only)
bun run dev [port]     # rebuild on change and serve (default 3000; e.g. `bun run dev 4000`)
bun run build          # production build -> docs/ (single inlined index.html + assets)
bun run check-types    # tsc
bun run format         # prettier
bun test               # bun:test, pure puzzle logic only
```

## Default image

`src/assets/default.jpg` — 2730×4096 (Photo: Rafael Peier / Unsplash), pre-scaled to the 4096 px
long-side cap. On first run it is seeded into IndexedDB so the game is playable immediately. The
source is large enough for every piece count in the menu without the `low-res` hint.

Recommended source image: landscape 16:9 or 3:2, **2560×1440** optimum (1920×1080 minimum, 4096 px
long side maximum — larger images are downscaled). Rule of thumb:
`long side ≈ max(cols, rows) × 320`. Each piece should stay above roughly 130 px per side for a
crisp result.

## Deploy

Builds are committed to the repository — there is no CI. Build locally and push `docs/`:

```bash
bun run check-types
bun run build
git add docs
git commit -m "build: update docs"
git push
```

On GitHub set Settings → Pages → Source to **Deploy from a branch**, branch `master`, folder
`/docs`. The page is served at `https://<user>.github.io/mini-puzzle/`; JS and CSS are inlined and
assets use relative paths, so the project subpath works. `docs/.nojekyll` disables Jekyll.
