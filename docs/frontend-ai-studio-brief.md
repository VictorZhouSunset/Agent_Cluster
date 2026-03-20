# Frontend Architecture And Information Structure

Use this as a short design brief for refreshing the dashboard frontend.

## Tech and implementation shape

- Frontend stack: React + TypeScript + Vite
- UI approach: custom in-project components, mostly inline styles
- No external UI component library such as MUI or Ant Design
- Markdown preview uses `react-markdown`
- Data comes from an internal dashboard API through a typed `apiClient`
- Current app is a single-page app with local React state, not a router-based multi-page app

## Top-level structure

- `App`
  - owns the currently selected section
  - switches the main screen content
- `AppShell`
  - left sidebar navigation
  - right main content area

Current top-level sections:

1. Overview
2. Sessions
3. Skills
4. Files

## Information structure

### 1. Overview

Purpose: quick operational summary.

Content blocks:
- Health summary
- Node list
- Agent list

This page is read-only.

### 2. Sessions

Purpose: browse sessions and inspect session content.

Layout:
- left column: session list
- right column: selected session detail

Content in detail area:
- session title
- session status
- message list

This page is read-only.

### 3. Skills

Purpose: browse and edit allowlisted skill markdown files.

Layout:
- node selector
- left column: skill list
- right column: selected skill content

Editor behavior:
- default state is rendered Markdown preview
- `Edit` switches to textarea editing
- `Save` persists changes
- `Cancel` exits edit mode without saving

### 4. Files

Purpose: browse and edit allowlisted workspace markdown files such as `AGENTS.md`.

Layout:
- node selector
- left column: file list
- right column: selected file content

Editor behavior:
- default state is rendered Markdown preview
- `Edit` switches to textarea editing
- `Save` persists changes
- `Cancel` exits edit mode without saving

## Shared frontend building blocks

- `AppShell`: dashboard shell and navigation
- `OverviewScreen`: overview page
- `SessionsScreen`: session browser
- `NodeScopedDocumentsScreen`: wraps editable content with node selection
- `EditableDocumentsScreen`: shared list/detail document workspace
- `DocumentEditor`: shared preview/edit/save editor used by both Skills and Files

## Current UX character

- Functional and minimal
- Sidebar + content-panel layout
- Utility styling, little visual hierarchy
- Good structural clarity, but not yet a polished product UI

## Constraints for redesign

- Keep the same 4 main sections
- Keep the same basic data model and workflows
- Do not expose raw internal/OpenClaw details directly in the UI
- Skills and Files should continue sharing one common editor pattern
- The editor area must stay within its card/container width
- Needs to work on desktop first, but should not break on smaller screens

## Design goal

Redesign the frontend to feel like a modern operational dashboard for an AI agent cluster:

- clearer hierarchy
- stronger visual identity
- better scanning of system status
- better readability for sessions and markdown content
- better editing experience for Skills and Files
- still simple enough to implement in the current React codebase
