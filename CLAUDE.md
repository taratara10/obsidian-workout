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

**Entry point**: `src/main.ts` — `WorkoutPlugin` registers the custom view, intercepts `dashboard.md` opens to swap them to the rich UI, and bootstraps `FileManager`.

**Data layer** (`src/fileManager.ts`): All vault I/O goes through `FileManager`. Workout files live at `workout/YYYY-MM-DD.md` (configurable). The class handles read/write/serialize and returns typed `DayWorkout` objects. YAML is serialized manually (not via a library) to keep the output format consistent.

**View** (`src/views/DashboardView.ts`): `DashboardView` extends `ItemView` and renders the full dashboard DOM using Obsidian's `createEl`/`createDiv` API — no framework. The add flow chains two modals: `ExerciseSelectModal` → `ExerciseInputModal`.

**Types** (`src/types.ts`): Three exercise types — `sets` (array of per-set reps), `emom` (reps × sets), `cardio` (comment only). `WorkoutEntry` is a discriminated union on `type`.

**Settings** (`src/settings.ts`): Persisted via `plugin.loadData()`/`saveData()` to `data.json`. Stores the user's exercise menu list, workout folder path, and dashboard file path.

**Build**: esbuild bundles `src/main.ts` → `main.js` (CJS, ES2018 target). `obsidian` and all CodeMirror/Lezer packages are marked external.

## Key constraints

- The dashboard file path (`dashboardPath` setting, default `dashboard.md`) is intercepted on `file-open` and its leaf is replaced with the custom view type `workout-dashboard`.
- `isInitializing` flag prevents the `file-open` handler from firing during `onLayoutReady`.
- Exercise menus have no presets — the user must add them in settings before recording workouts.
