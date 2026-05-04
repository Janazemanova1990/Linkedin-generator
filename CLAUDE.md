# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all dependencies (root + backend + frontend)
npm run install-all

# Run both servers together (backend on :3002, frontend on :5174)
npm run dev

# Frontend only
npm run dev --prefix frontend

# Backend only
npm run dev --prefix backend

# Frontend type check
cd frontend && npx tsc --noEmit

# Frontend production build
npm run build --prefix frontend
```

## Architecture

Two independent servers, one `.env` file at the project root.

**Backend** (`backend/`) — Node.js + Express, ES modules (`"type": "module"`). Runs via nodemon. All routes live in `server.js`. The `.env` is loaded with an explicit path (`path.resolve(__dirname, '..', '.env')`) because nodemon runs from the `backend/` directory.

**Frontend** (`frontend/`) — Vite + React + TypeScript. Proxies all `/api/*` requests to the backend (configured in `vite.config.ts`). State is managed with `useReducer` in `App.tsx` and persisted to `localStorage` after every dispatch.

**No shared package** — backend and frontend are completely separate npm workspaces. Root `package.json` only holds `concurrently`.

## Key conventions

**Voice profile:** `voice-profile.md` at the project root is read from disk on **every** Claude API call (never cached). This is intentional — Jana can edit it and changes apply immediately without restarting the server. All prompts are assembled in `backend/prompts.js`.

**Claude model:** Always `claude-opus-4-7`. Don't change this.

**JSON from Claude:** Claude sometimes wraps JSON in markdown fences. Always use `extractJson()` in `server.js` before `JSON.parse()`.

**Notion rich text limit:** Each rich text property caps at 2000 chars per block. Long text (chat logs, post text) must go through `splitToBlocks()` in `notion.js` before writing.

**Tailwind v4** — no `tailwind.config.js`. Design tokens (brand colors, font) are defined in `frontend/src/index.css` under `@theme`. Brand colors: purple `#ada2cc`, turquoise `#9fd7d5`, coral `#f89083`/`#e76e50`.

## App flow

4-step wizard: idea input → hook selection (with Claude chat) → full post generation (with Claude chat) → Notion save.

Each step maps to a backend endpoint sequence:
1. `POST /api/posts` → `POST /api/posts/:id/hooks`
2. `POST /api/posts/:id/hooks/chat` (iterative)
3. `POST /api/posts/:id/select-hook` → `POST /api/posts/:id/generate-post`
4. `POST /api/posts/:id/post/chat` (iterative) → `POST /api/posts/:id/finalize`

All endpoints return `{ error: string }` on failure. The Notion page ID (`postId`) is stored in app state and localStorage from step 1 onward — it's the key that ties everything together.
