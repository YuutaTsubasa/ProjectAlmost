# Project Data Localization Worlds Design

## Target Behavior

Create the first root rebuild data architecture for project-wide static data. The slice introduces a single project data entry point, a localization data category, and the first gameplay-facing data category: worlds.

The data shape should support this conceptual hierarchy:

```text
projectData
  localize
    languages
    references
  worlds
    order
    items
      world01
      world02
      world03
      world04
      world05
      world06
```

The world category should organize the six prototype worlds as six separate root rebuild data modules. World records should reference localized text keys instead of embedding all language strings directly.

## Layer Ownership

- `src/domain/data/`: pure static project data and pure lookup helpers. It has no Svelte, Tauri, DOM, browser storage, timers, random values, or prototype runtime imports.
- `src/domain/data/projectData.ts`: the only public entry point for project-wide data categories in this slice.
- `src/domain/data/localize/`: localization model, locale records, localization references, and pure text resolution.
- `src/domain/data/worlds/`: world model, one module per world, and the world catalog.

The prototype may be used as a source reference only. Root rebuild code must not import from `__prototype__/`.

## Localization Model

Localization is a first-class `projectData` category. It should not be treated as a UI-only helper because world data, stage data, menus, and future settings will all need stable text references.

Supported locales for this slice come from the prototype translation table:

- `en`
- `ja`
- `zhHant`
- `ko`

The localization model should provide:

- `LocaleCode`: union of supported locale codes.
- `LocalizationKey`: stable dotted reference string such as `worlds.world01.title`.
- `LocalizedTextCatalog`: record keyed by locale, then localization key.
- `resolveLocalizedText(localize, locale, key)`: pure function returning the localized string.

If a requested locale is missing a key, the resolver should fall back to English for that key. If English is also missing the key, it should return the key itself. This keeps data consumers deterministic and avoids throwing in early UI slices.

This slice should not implement:

- runtime language switching UI
- string interpolation
- pluralization
- date or number formatting
- template-string parsing such as `&{projectData.localize.worlds.world01_title}`

Typed localization references are preferred over template parsing for now. For example:

```ts
titleRef: 'worlds.world01.title'
subtitleRef: 'worlds.world01.subtitle'
```

Template syntax can be layered on later if a future spec needs content-authored strings with embedded references.

## Project Data Entry

`projectData` should expose the project-wide data categories available in the rebuild:

- `localize`: localization catalog and reference groups.
- `worlds`: world catalog.

The entry point should be explicit about category names so future categories can be added without changing existing imports. Categories that are not yet modeled, such as stages, characters, audio, save schemas, or settings, should not be stubbed as empty runtime objects in this slice.

## World Data Model

Each world record should include stable campaign/catalog fields only:

- `id`: `world01` through `world06`
- `number`: `1` through `6`
- `titleRef`: localization key for the world title
- `subtitleRef`: localization key for the world subtitle
- `theme`: prototype world theme slug
- `symbol`: prototype world symbol
- `stageCount`: `6`
- `stageIds`: six prototype stage IDs belonging to that world
- `assetRefs.stageSelectBackground`: root runtime path planned for the world-select image
- `musicRefs.map`: root runtime path planned for the world map music
- `musicRefs.bgm`: root runtime path planned for regular world gameplay music
- `musicRefs.boss`: root runtime path planned for boss music

The model should not include unlock state, save progress, best times, cleared stage counts, runtime routes, UI selection state, or gameplay stage geometry. Those belong to future application/save/stage slices.

## World Records

The six world modules should use prototype data as the reference source:

| Module | ID | Title | Subtitle | Theme | Symbol | Stage IDs |
| --- | --- | --- | --- | --- | --- | --- |
| `world01.ts` | `world01` | White Palace | A radiant kingdom above the clouds. | `palace` | `♜` | `1-1` ... `1-6` |
| `world02.ts` | `world02` | Emerald Sanctuary | Ancient ruins reclaimed by the living forest. | `forest` | `♧` | `2-1` ... `2-6` |
| `world03.ts` | `world03` | Cerulean Depths | A drowned realm beneath the endless tide. | `ocean` | `≈` | `3-1` ... `3-6` |
| `world04.ts` | `world04` | Frostveil Peaks | Frozen fortresses beyond the mountain storm. | `snow` | `△` | `4-1` ... `4-6` |
| `world05.ts` | `world05` | Emberfall Caldera | A shattered forge at the heart of the volcano. | `volcano` | `◇` | `5-1` ... `5-6` |
| `world06.ts` | `world06` | Abyssal Hollow | The final descent into the demonic abyss. | `abyss` | `✦` | `6-1` ... `6-6` |

The localization catalog should include title and subtitle strings for these worlds in English, Japanese, Traditional Chinese, and Korean, based on the prototype `i18n.ts` values.

## Asset And Music References

This slice defines reference strings, not runtime asset copies. Asset paths should point at the intended root runtime paths:

- `/assets/maps/white_palace_stage_select.webp`
- `/assets/maps/emerald_sanctuary_stage_select.webp`
- `/assets/maps/cerulean_depths_stage_select.webp`
- `/assets/maps/frostveil_peaks_stage_select.webp`
- `/assets/maps/emberfall_caldera_stage_select.webp`
- `/assets/maps/abyssal_hollow_stage_select.webp`

Music refs should point at the intended root runtime paths:

- `/assets/audio/world01_map.mp3`, `/assets/audio/world01_bgm.mp3`, `/assets/audio/world01_boss.mp3`
- same pattern through `world06`

The actual asset-copy pipeline remains out of scope. A future asset/data integration slice can copy or generate runtime assets under root `public/`.

## Tests To Write First

Focused tests should be written and watched fail before production code:

- `projectData` exposes exactly `localize` and `worlds` categories.
- `worlds.order` contains `world01` through `world06` in order.
- `worlds.items` references all six world modules by ID.
- each world has six stage IDs matching its world number.
- each world has title/subtitle localization refs.
- `resolveLocalizedText` returns localized title/subtitle values for supported locales.
- `resolveLocalizedText` falls back to English when a locale key is missing.
- `resolveLocalizedText` returns the key itself when the key is missing everywhere.

## Files Expected To Change During Implementation

- Add `src/domain/data/projectData.test.ts`
- Add `src/domain/data/projectData.ts`
- Add `src/domain/data/localize/localize.test.ts`
- Add `src/domain/data/localize/localize.ts`
- Add `src/domain/data/worlds/worldTypes.ts`
- Add `src/domain/data/worlds/world01.ts`
- Add `src/domain/data/worlds/world02.ts`
- Add `src/domain/data/worlds/world03.ts`
- Add `src/domain/data/worlds/world04.ts`
- Add `src/domain/data/worlds/world05.ts`
- Add `src/domain/data/worlds/world06.ts`
- Add `src/domain/data/worlds/worldCatalog.test.ts`
- Add `src/domain/data/worlds/worldCatalog.ts`

## Validation Commands

- `npm run test -- src/domain/data/localize/localize.test.ts`
- `npm run test -- src/domain/data/worlds/worldCatalog.test.ts`
- `npm run test -- src/domain/data/projectData.test.ts`
- `npm run test`
- `npm run check`
- `git diff --check`

`npm run build` is not required for the expected pure domain-data implementation. If implementation touches build configuration, UI imports, asset bundling behavior, or any runtime import path consumed by the app shell, then `npm run build` becomes required before completion.

## Out Of Scope

- Rendering localized text in Svelte UI.
- Runtime language switching.
- Persisting preferred language.
- Stage data model.
- Character data model.
- Save data model.
- Audio playback integration.
- Asset-copy pipeline from `__prototype__/public/` to root `public/`.
- Template reference parser such as `&{...}`.
- Importing runtime code or data modules from `__prototype__/`.
