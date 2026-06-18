# Rebuild Architecture

The rebuild separates decision-making from side effects.

## Layers

### Domain

Path: `src/domain/`

Domain code is the pure core. It owns rules, types, invariants, reducers, calculations, and deterministic state transitions.

Rules:

- no imports from Svelte, Tauri, DOM, Phaser, localStorage, or browser APIs
- no hidden mutable module state
- no timers, random values, or IO
- every exported behavior needs focused tests

### Application

Path: `src/application/`

Application code coordinates domain rules into use cases. It can model routes, screen state, save commands, stage flow, audio policy, and view models.

Rules:

- side effects are injected or performed by adapters
- use discriminated unions for app routes and commands
- keep reducers and transition functions pure when possible

### UI

Paths: `src/`, future `src/ui/`

Svelte owns reactive presentation. Components render state and emit user intents. They should not own gameplay rules or persistence rules.

### Tauri Adapter

Path: `src-tauri/`

Tauri owns desktop shell integration. Rust commands should be thin adapters around explicit application operations. Avoid putting game logic in Rust unless a future spec chooses that boundary.

### Prototype Reference

Path: `__prototype__/`

The prototype is read-only by default. It exists to preserve behavior, assets, and reference docs while the new architecture is built step by step.

## First Vertical Slice Target

After Step 0, build the smallest playable path:

```text
App boot -> Title placeholder -> Stage placeholder -> empty game canvas/screen
```

Gameplay mechanics should be added only after their domain model and adapter boundary are specified.
