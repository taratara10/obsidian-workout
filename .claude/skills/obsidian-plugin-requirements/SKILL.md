---
name: obsidian-plugin-requirements
description: >
  Conducts a structured interview to define requirements for a personal-use Obsidian plugin (not for distribution).
  Use this skill whenever the user wants to build, plan, or brainstorm an Obsidian plugin for their own vault — even if they say "I'm thinking of making a plugin", "I want to add a feature to Obsidian", or "how should I spec out my Obsidian plugin". The skill asks targeted questions to uncover the user's workflow pain, clarifies desired behavior, and produces a clean requirements.md document scoped to personal use.
---

# Obsidian Plugin Requirements Interview

Your job is to help the user define requirements for a personal-use Obsidian plugin through a focused interview. The user won't be distributing this plugin — they just want it to solve their own workflow problem. This means you can skip concerns like i18n, complex error messages for end-users, or broad compatibility, and focus on what will actually make their day-to-day use of Obsidian better.

## How to run the interview

Work through the stages below in order, but be conversational. Ask one question at a time (or a small cluster of tightly related ones). Don't dump all questions at once. Adapt based on what the user says — if they answer something before you ask, move on.

When enough information has been gathered to write the document, tell the user you'll now draft the requirements, then produce it.

---

## Stage 1 — Understand the problem

Start here. The goal is to understand *why* the user wants the plugin, not what it does yet.

- What workflow problem are you trying to solve? (What's annoying, slow, or impossible right now?)
- When does this problem come up — daily, weekly, during specific tasks?
- How do you handle it today (workaround or nothing)?

Listen for the root frustration. Sometimes the user comes in with a solution in mind ("I want a sidebar"), but the real need is different. If their description sounds like a solution, gently probe: "What would that let you do that you can't do now?"

---

## Stage 2 — Define the goal

Once you understand the pain, clarify what "solved" looks like.

- What would the plugin do for you in plain terms?
- How would you trigger or use it? (keyboard shortcut, ribbon button, command palette, automatic on open, etc.)
- How often would you use it, and in what context (specific notes, specific folders, any note)?

---

## Stage 3 — Map the features

Break down the core functionality. Keep it concrete.

- What are the 1–3 most important things the plugin must do? (core features)
- Are there secondary features that would be nice but aren't critical?
- What data does the plugin need to read or write? (note content, frontmatter/metadata, file names, folder structure, tags, external data?)
- Does anything need to persist across sessions? (settings, state, history)

---

## Stage 4 — UI and interaction model

For personal-use plugins, the UI can be minimal — but it still needs to feel natural in Obsidian.

Ask only what's relevant given what's been described so far:

- Does the plugin need its own view/panel, or does it act on the current note?
- Does it need a settings page, or are defaults fine for personal use?
- Should it show any modals or notifications?
- Should it add anything to the ribbon (left sidebar icons)?
- Are there specific commands to register in the command palette?

---

## Stage 5 — Constraints and out-of-scope

Help the user be explicit about what's *not* included — this prevents scope creep later.

- Are there things that seem related but you explicitly don't want this plugin to do?
- Any Obsidian-specific constraints? (mobile support needed? Sync-friendly? Specific theme compatibility?)
- Since this is personal use only: no need to worry about other users' setups, localization, or plugin marketplace guidelines — confirm this scope with the user.

---

## Stage 6 — Produce the requirements document

Once stages 1–5 are complete, write the requirements document. Save it to `requirements.md` in the current directory (or a path the user specifies). Use the template below.

Tell the user: "I'll now write the requirements document based on what we discussed."

### Template

```markdown
# [Plugin Name] — Requirements

## Overview
[One paragraph: what the plugin does and why it exists]

## Problem Statement
[The workflow pain this solves, in concrete terms]

## Scope
- **User**: Personal use only (single vault, single user)
- **Distribution**: Not intended for public release
- [Any other scope notes from the interview]

## Functional Requirements

### Core Features
- [FR-01] ...
- [FR-02] ...

### UI Components
- **Commands**: [list commands registered in the command palette]
- **Ribbon**: [ribbon buttons, if any]
- **Views / Panels**: [custom views, if any]
- **Modals**: [modals or dialogs, if any]
- **Settings Tab**: [settings the user can configure, or "None — defaults hardcoded"]

### Data Access
- **Reads**: [what vault data the plugin reads]
- **Writes**: [what vault data the plugin modifies or creates]
- **Persistence**: [settings, local storage, or state that persists across sessions]

## Non-Functional Requirements
- [NFR-01] Personal use: no need for i18n or multi-user error handling
- [NFR-02] [Obsidian version / mobile / sync constraints if any]
- [NFR-03] [Any performance or reliability notes]

## Out of Scope
- [Things explicitly excluded]

## Open Questions
- [Anything unresolved from the interview that might need a decision later]
```

Number each requirement (`FR-01`, `FR-02`, etc.) so they can be referenced during development. Keep each requirement a single sentence stating what the system shall do — not how it should be implemented.

---

## Tips for a good interview

- **Stay functional, not technical.** The user doesn't need to know about Obsidian's API. Translate their answers into functional requirements yourself. Don't ask "do you need to use the MetadataCache?" — ask "does the plugin need to read frontmatter or tags?"
- **Watch for scope creep.** If the user starts listing features that go beyond their original pain point, gently ask: "Is that part of the core need, or a nice-to-have for later?"
- **Personal use means simpler.** Remind yourself (not the user, unless relevant) that there's no need to handle edge cases for other people's setups. The requirements can be opinionated and specific to their workflow.
- **End clearly.** When you have enough to write the document, don't keep asking questions. Say you're ready to draft, confirm, and produce it.
