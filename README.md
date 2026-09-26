# mini-puzzle

Client-only jigsaw puzzle. Load any image (file picker, drag & drop, or clipboard paste), pick a
grid, drag pieces, and connect them. No backend; the only network-adjacent asset is the bundled
default image, loaded from the same origin.

## Controls

- drag a piece / connected block — primary pointer (mouse, touch, stylus via pointer events)
- drag empty space — pan the camera
- mouse wheel — zoom; `-` / `=` — zoom
- arrow keys — pan
- `N` — new game, `G` — toggle target ghost, `H` — toggle HUD, `C` — center, `F` — fullscreen
- control panel (top-right): image file, piece grid, new game, shuffle, target, center, fit,
  fullscreen, HUD, status

Pieces snap together when their relative offset matches the grid within `0.3 × min(piece width,
piece height)`. A connected group locks once it sits on its exact board position; the puzzle is
solved when all pieces form one group.

## Commands

```bash
bun install            # deps (@types/bun + typescript only)
bun run dev            # rebuild on change and serve http://localhost:3000
bun run build          # production build -> docs/ (single inlined index.html + assets)
bun run check-types    # tsc
bun run format         # prettier
bun test               # bun:test, pure puzzle logic only
```

## Default image

`src/assets/default.png` — 526×526 (Photo: Keagan Henman / Unsplash). The source is small, so the
built-in default only allows grids up to 4×4; larger grids unlock automatically for larger images.

Recommended source image: landscape 16:9 or 3:2, **2560×1440** optimum (1920×1080 minimum, 4096 px
long side maximum — larger images are downscaled). Rule of thumb:
`long side ≈ max(cols, rows) × 320`. Each piece should stay above roughly 130 px per side.

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
