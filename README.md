# Workout Dashboard

An Obsidian plugin (personal use) that records workout data as YAML frontmatter in daily `.md` files and renders a custom dashboard UI.

## Features

- Custom dashboard view with exercises grouped by type (Sets / EMOM / Cardio)
- Tap a chip to log a new entry; tap an existing row to edit or delete it
- Workout data stored as YAML frontmatter in `workout/YYYY-MM-DD.md`
- Recent workout history displayed below the chip board
- Settings tab to manage your exercise menu and folder paths

## Exercise types

| Type | Input | Storage |
|------|-------|---------|
| **Sets** | Numpad → per-set reps via chip list | Array of reps per set |
| **EMOM** | Reps × Sets fields | `reps` and `sets` integers |
| **Cardio** | Free-text comment + quick presets | Comment string |

## Setup

1. Clone this repo into your vault's `.obsidian/plugins/workout-dashboard/`
2. Run `npm i` then `npm run build`
3. Enable the plugin in Obsidian settings
4. Open the plugin settings and add at least one exercise (name + type)
5. Use the command **Open Workout Dashboard** or click the ribbon icon

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Workout folder | `workout` | Folder where daily workout files are saved |
| Dashboard file | `workout/dashboard.md` | File intercepted and displayed as the custom view |

Exercises must be added via settings before they appear on the dashboard. There are no built-in presets.

## Development

```bash
npm run dev    # watch mode — bundles src/main.ts → main.js with sourcemaps
npm run build  # type-check + production bundle
npm run lint   # ESLint check
```

To test changes: copy `main.js`, `styles.css`, and `manifest.json` into your vault's `.obsidian/plugins/workout-dashboard/` and reload Obsidian.

## Data format

Each daily file uses YAML frontmatter:

```yaml
---
date: 2026-04-30
exercises:
  - menu: "Pull-ups"
    type: sets
    sets: [10, 8, 6]
    comment: ""
  - menu: "Row"
    type: emom
    reps: 12
    sets: 5
    comment: ""
  - menu: "Run"
    type: cardio
    comment: "5km easy"
---
```
