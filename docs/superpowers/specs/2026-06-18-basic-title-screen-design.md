# Basic Title Screen Design

## Target Behavior

When the rebuilt app boots, it should render a basic title screen instead of the Step 0 placeholder panel.

The title screen shows:

- Product title: `Project Almost`
- Subtitle: `A new rebuild begins`
- Primary intent button: `Start`
- Small build label: `Tauri v2 + Svelte`

The `Start` button is a visible affordance only in this slice. It may emit a local UI intent later, but it must not navigate to a stage, open a menu, touch save data, or start audio.

## Layer Ownership

- `src/domain/app/`: owns pure app-flow state and the initial screen decision.
- `src/ui/title/`: owns reactive Svelte presentation for the title screen.
- `src/App.svelte`: adapts the app-flow state to the matching Svelte component.
- `src/app.css`: owns the basic visual treatment.

## Architecture Notes

The first app route is represented as a discriminated union, even though there is only one screen today. That keeps future screen transitions explicit and testable.

Domain code must remain pure: no Svelte, DOM, Tauri, storage, timers, audio, assets, or prototype imports.

The UI may render static copy for this slice, but later user-facing strings should move through the localization system once it exists.

## Files Expected To Change

- Create `src/domain/app/appFlow.test.ts`
- Create `src/domain/app/appFlow.ts`
- Create `src/ui/title/TitleScreen.svelte`
- Modify `src/App.svelte`
- Modify `src/app.css`

## Tests To Write First

Add a focused domain test proving that `createInitialAppState()` returns a title screen state:

```ts
expect(createInitialAppState()).toEqual({
  screen: { type: 'title' },
})
```

Run the focused test before implementation and confirm it fails because `appFlow` does not exist yet. Then implement the smallest domain code that passes.

## Side Effects And Adapters

The only side effect is Svelte rendering. The domain model only returns immutable app-flow state.

`App.svelte` is the adapter from app-flow state to Svelte components.

## Validation Commands

- `npm run test -- src/domain/app/appFlow.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `git diff --check`

## Out Of Scope

- No stage screen.
- No title menu.
- No settings screen.
- No route transitions.
- No audio.
- No save data.
- No imported prototype runtime code.
- No generated or migrated assets.
