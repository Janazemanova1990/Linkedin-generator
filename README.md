# LinkedIn Post Generator

A local tool that helps you write authentic LinkedIn posts in your voice.

**Flow:** Type idea → Claude generates 3 hooks → refine with chat → pick length → generate full post → refine with chat → save to Notion.

---

## Prerequisites

- **Node.js 20+** — check with `node --version`
- **A Notion account** with a database set up (see below)
- **An Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

---

## 1. Notion Setup

### Create the database

Create a new **full-page database** in Notion and add the following properties exactly as named:

| Property Name    | Type          |
|-----------------|---------------|
| `Idea`          | Title         |
| `Status`        | Select        |
| `Hook 1`        | Rich text     |
| `Hook 2`        | Rich text     |
| `Hook 3`        | Rich text     |
| `Selected Hook` | Rich text     |
| `Post Length`   | Select        |
| `Post Text`     | Rich text     |
| `Hook Chat Log` | Rich text     |
| `Post Chat Log` | Rich text     |
| `Design Link`   | URL           |
| `LinkedIn URL`  | URL           |
| `Date Created`  | Created time  |
| `Date Posted`   | Date          |

**Status select options:** `Generating`, `Hook Selection`, `Post Generation`, `Ready for Design`, `Designed`, `Posted`

**Post Length select options:** `Short`, `Medium`, `Long`

### Create a Notion integration

1. Go to [notion.so/profile/integrations](https://www.notion.so/profile/integrations)
2. Click **"New integration"**
3. Give it a name (e.g. "LinkedIn Generator"), select your workspace
4. Copy the **Internal Integration Token** — this is your `NOTION_API_KEY`

### Connect the integration to your database

1. Open your database in Notion
2. Click **"..."** (top right) → **Connections** → find your integration and click **Connect**

### Find your database ID

Open your database in Notion in a browser. The URL looks like:
```
https://www.notion.so/Your-DB-Name-abc123def456...?v=...
```
The database ID is the long alphanumeric string after the last `-` and before the `?`. Copy it — this is your `NOTION_DATABASE_ID`.

---

## 2. Install

```bash
# From the project root:
npm run install-all
cp .env.example .env
```

Then open `.env` and fill in your keys:

```
ANTHROPIC_API_KEY=sk-ant-...
NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=your-database-id-here
PORT=3001
```

---

## 3. Run

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3001](http://localhost:3001)

Both servers start together. Open the frontend in your browser.

---

## 4. Using the app

1. Type a rough idea and click **Generate Hooks**
2. Read the 3 hooks — edit any inline, or use the chat panel to ask Claude to refine them
3. Click **Use This Hook** when you're happy
4. Pick post length (Short / Medium / Long) and click **Generate Post**
5. Edit the post directly or use the chat panel to refine
6. Click **Save & Done**
7. The post is saved to Notion with status **"Ready for Design"**

Your progress saves automatically — refreshing the page won't lose your work.

---

## 5. Editing your voice profile

Open `voice-profile.md` in any text editor and make changes. The changes apply immediately on the next post generation — no server restart needed.

---

## 6. Troubleshooting

**"Couldn't reach the server"**
Make sure the backend is running (`npm run dev` from the project root) and that port 3001 is free.

**Notion errors on startup**
Check that:
- `NOTION_API_KEY` and `NOTION_DATABASE_ID` are correct in `.env`
- The integration is connected to your database (see step 1 above)
- All property names in the database exactly match the table above (names are case-sensitive)

**Claude returns unexpected responses**
Click "Try again". If it keeps happening, check your Anthropic API key and account balance at [console.anthropic.com](https://console.anthropic.com).

**CORS errors in browser console**
The backend has CORS enabled for all origins in dev mode. If you see CORS errors, make sure you're hitting `http://localhost:3001` (not https) and that the backend is actually running.

**Port already in use**
Change `PORT=3001` in `.env` to another port (e.g. 3002). The frontend proxy in `vite.config.ts` points to `http://localhost:3001` — update that too if you change the port.
