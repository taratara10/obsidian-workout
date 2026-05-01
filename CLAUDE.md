# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # watch mode — bundles src/main.ts → main.js with inline sourcemaps
npm run build    # type-check then production bundle (minified, no sourcemaps)
npm run lint     # ESLint check
npm version patch|minor|major  # bumps manifest.json, package.json, versions.json
```

There are no automated tests. To verify changes, copy `main.js`, `styles.css`, and `manifest.json` into your vault's `.obsidian/plugins/<plugin-id>/` and reload Obsidian.

## Architecture

This is an Obsidian plugin (personal use, not for distribution) that records workout data as YAML frontmatter in daily `.md` files and renders a custom dashboard UI.

**Entry point** (`src/main.ts`): `WorkoutPlugin` registers the custom view (`workout-dashboard`), the `open-workout-dashboard` command, and the settings tab. On `onLayoutReady` it ensures `dashboardPath` exists, then swaps any already-open Markdown leaf for that file to the custom view. A `file-open` listener performs the same swap for subsequent opens. `FileManager` is rebuilt on every `saveSettings()` so folder-path changes take effect immediately.

**Data layer** (`src/fileManager.ts`): All vault I/O goes through `FileManager`. Workout files live at `workout/YYYY-MM-DD.md` (configurable). The class handles read/write and returns typed `DayWorkout` objects. YAML is parsed via Obsidian's `parseYaml` and serialized manually (not via a library) — `menu` and `comment` are emitted as double-quoted strings with backslash/newline/tab escaped to keep the format predictable.

**View** (`src/views/DashboardView.ts`): `DashboardView` extends `ItemView` and renders the dashboard DOM with Obsidian's `createEl`/`createDiv` API — no framework. Layout: top bar → header → chip board (exercises grouped by `sets` / `emom` / `cardio`) → date-grouped recent-workout list → toast. Tapping a chip opens `ExerciseInputModal` for a new entry; tapping an existing row opens the same modal in edit mode (`initial` set, `onDelete` provided). After save/update/delete the view re-renders and shows a transient toast.

**Modal** (`src/modals/ExerciseInputModal.ts`): One modal serves all exercise types. Branches into `renderSetsForm` (numpad → chip list of per-set reps), `renderEmomForm` (REPS × SETS fields with focus-swap action), `renderCardioForm` (textarea + quick-preset chips), or `renderRoutineForm` (textarea only). The numpad is shared via `renderNumpad`. Footer renders Save/Update + Cancel/Delete depending on `isEditing`.

**Types** (`src/types.ts`): Four exercise types — `sets` (array of per-set reps), `emom` (reps × sets), `cardio` (comment only), `routine` (comment only). `WorkoutEntry` is a discriminated union on `type`.

**Settings** (`src/settings.ts`): Persisted via `plugin.loadData()` / `plugin.saveData()` to `data.json`. Stores the user's exercise menu list, workout folder path, and dashboard file path. The settings tab supports adding (name + type) and deleting menu entries — there is no edit/reorder UI.

**Build**: esbuild bundles `src/main.ts` → `main.js` (CJS, ES2018 target). `obsidian` and all CodeMirror/Lezer packages are marked external.

## Adding a new exercise type

Edit these files in order:

1. **`src/types.ts`** — add the type literal to `ExerciseType`, define a new `XxxWorkoutEntry` interface (at minimum `menu`, `type`, `comment`), and add it to the `WorkoutEntry` union.
2. **`src/views/DashboardView.ts`** — add `{ type: 'xxx', label: 'XXX' }` to `TYPE_GROUPS`. If the type stores data in `comment`, also add it to the two exclusion checks (`ex.type !== 'xxx'` in `renderDateGroup`, and the `cardio || routine` condition in `renderExerciseRow`).
3. **`src/modals/ExerciseInputModal.ts`** — add an `else if` branch in `onOpen`, then implement `renderXxxForm`. Types that only need a text comment can copy `renderRoutineForm` verbatim and adjust the label and save payload.
4. **`src/settings.ts`** — add `.addOption('xxx', 'Xxx — description')` to the type dropdown.
5. **`src/fileManager.ts`** — update `serialize()` only if the new type stores fields beyond `comment`. The existing `else` branch already handles comment-only types.

## Key constraints

- The dashboard file path (`dashboardPath` setting, default `dashboard.md`) is intercepted on `file-open` and its leaf is replaced with the custom view type `workout-dashboard`. The file is auto-created with a placeholder body if missing.
- `isInitializing` flag prevents the `file-open` handler from firing during `onLayoutReady` (the initial swap is done explicitly there instead).
- Exercise menus have no presets — the user must add them in settings before recording workouts. The chip board shows a guidance message when the menu list is empty.
- Same-day writes overwrite the existing file: new entries are appended to the `exercises` array, edits replace by index, deletes splice by index.
- `FileManager` is reconstructed inside `saveSettings()`, so any code holding a long-lived reference to the old instance after a settings change will hit a stale folder path — always read `plugin.fileManager` afresh.
