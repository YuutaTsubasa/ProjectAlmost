# Resolution Frame And Title Font Design

## Target Behavior

Add a 16:9 resolution management layer for the rebuilt app so screens keep a stable virtual aspect ratio at any browser or Tauri window size.

The title screen must:

- Render inside a fixed 16:9 frame.
- Fit inside the available viewport using aspect-fit containment.
- Use letterbox or pillarbox space when the viewport is not 16:9.
- Avoid non-uniform scaling, so text, borders, buttons, and panels are not stretched.
- Use the same runtime font files and title font roles as the prototype.

## Layer Ownership

- `src/domain/display/resolution.ts`: pure aspect-fit calculation and constants.
- `src/ui/layout/ResolutionFrame.svelte`: Svelte layout adapter that provides the fixed 16:9 frame.
- `src/App.svelte`: wraps app screens in the resolution frame.
- `src/app.css`: root frame, letterbox background, title frame sizing, and font-face definitions.
- `public/assets/fonts/`: root runtime copies of prototype font assets.

## Architecture Notes

The pure module calculates a 16:9 frame from a container size. CSS performs the live layout using `aspect-ratio`, `min()` and viewport units, but the domain calculation documents and tests the sizing contract.

The app must not use `transform: scaleX(...)`, non-uniform CSS scale, viewport-width font scaling, or independent width/height stretching for the active game frame.

Screens can use container query units inside the 16:9 frame. Because the frame itself remains 16:9, `cqw` and `cqh` stay proportionally consistent.

## Font Decision

Copy these prototype font files into root runtime assets:

- `rajdhani-latin-400.woff2`
- `rajdhani-latin-500.woff2`
- `rajdhani-latin-600.woff2`
- `rajdhani-latin-700.woff2`
- `share-tech-mono-latin-400.woff2`

Define `@font-face` rules in root CSS. Match prototype roles:

- `--body`: `"Rajdhani", "Segoe UI", system-ui, sans-serif`
- `--heading`: `Georgia, "Times New Roman", serif`
- `--mono`: `"Share Tech Mono", monospace`

## Files Expected To Change

- Create `src/domain/display/resolution.test.ts`
- Create `src/domain/display/resolution.ts`
- Create `src/ui/layout/ResolutionFrame.svelte`
- Modify `src/App.svelte`
- Modify `src/app.css`
- Add copied font files under `public/assets/fonts/`

## Tests To Write First

Focused pure-domain tests cover:

- 16:9 container fills exactly.
- Wider-than-16:9 container pillarboxes horizontally.
- Taller-than-16:9 container letterboxes vertically.
- Returned scale is uniform and equals `frameWidth / 1920` and `frameHeight / 1080`.

## Side Effects And Adapters

The only side effects are DOM layout and runtime font loading.

The copied fonts are static assets owned by the root rebuild. Runtime code must not import from `__prototype__`.

## Validation Commands

- `npm run test -- src/domain/display/resolution.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

Also verify in the browser:

- 16:9 viewport: frame fills the viewport.
- Wide viewport: active frame remains 16:9 with side padding.
- Tall viewport: active frame remains 16:9 with top/bottom padding.
- Title menu text and panel proportions remain stable across those viewport shapes.

## Out Of Scope

- No settings for choosing stretch modes.
- No full-screen API.
- No Phaser or gameplay canvas.
- No route transitions.
- No localization changes.
