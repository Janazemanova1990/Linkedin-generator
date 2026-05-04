# LinkedIn Post Generator - Build Brief for Claude Code

> **Purpose:** This document contains everything you need to build Jana's LinkedIn post generator app. Read it fully, then build the app step-by-step. Ask Jana questions only when something is genuinely ambiguous - most decisions are already made below.

---

## 1. What We're Building

A local Claude Code app that helps Jana create authentic LinkedIn posts in her voice. Notion is the backend database; the React app is the only UI Jana ever touches.

**Core value:** Posts that sound like Jana (build-in-public, practical, honest), not generic AI slop.

**Non-goals:**
- Auto-posting to LinkedIn (Jana publishes manually)
- Designing visuals (Jana uses Canva separately)
- Scheduling/calendaring (out of scope)

---

## 2. The User Flow (4 Steps)

```
Step 1: Idea Input
  - Jana types a rough idea/topic in a textarea
  - Clicks "Generate Hooks"
  - App creates Notion row, status="Generating"
  - Backend calls Claude API, returns 3 hook options
  - Notion updated with 3 hooks, status="Hook Selection"

Step 2: Hook Selection (with chat)
  - Jana sees 3 hooks
  - Chat panel: she can ask Claude to refine, regenerate, combine, etc.
  - All chat iterations save to Notion (full conversation log)
  - When happy, Jana picks one hook (or edits it inline)
  - Click "Use This Hook" -> proceeds

Step 3: Length + Full Post
  - Jana picks length: Short (80-150 words) / Medium (150-250) / Long (250-400)
  - Backend generates full post using voice profile + selected hook + length
  - Chat panel: Jana can ask Claude to refine the post
  - All iterations save to Notion
  - When happy, click "Save & Done"

Step 4: Saved
  - Notion row finalized: status="Ready for Design", post_text=final
  - Jana sees confirmation + link to Notion row
  - Option to "Start New Post"
```

---

## 3. Tech Stack

**Frontend:**
- Vite + React + TypeScript
- Tailwind CSS (already familiar to Jana from NextFem AI website)
- DM Sans font (Jana's brand font)
- Brand colors: purple `#ada2cc`, turquoise `#9fd7d5`, coral `#f89083`/`#e76e50`

**Backend:**
- Node.js + Express (ES modules, `"type": "module"`)
- `@anthropic-ai/sdk` for Claude API
- `@notionhq/client` for Notion API
- `dotenv` for env vars
- `cors` for frontend-backend comms

**Why a backend:** API keys (Anthropic, Notion) MUST NOT be exposed in the browser. The Express backend is a thin proxy that holds keys and forwards requests.

**Why not Next.js:** Overkill for this. Vite + Express is faster to set up and clearer to maintain.

---

## 4. Folder Structure

```
linkedin-generator/
├── README.md                    # Setup instructions for Jana
├── voice-profile.md             # Jana's voice (loaded by backend on every API call)
├── .env.example                 # Template for env vars
├── .gitignore                   # node_modules, .env, etc.
├── package.json                 # Root scripts: "dev" runs both frontend + backend
│
├── backend/
│   ├── package.json
│   ├── server.js                # Express server, all API routes
│   ├── prompts.js               # System prompts for hook gen, post gen, chat
│   └── notion.js                # Notion read/write helpers
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── public/
    └── src/
        ├── main.tsx
        ├── App.tsx              # Main 4-step wizard, manages state
        ├── index.css            # Tailwind imports, DM Sans font
        ├── lib/
        │   ├── api.ts           # Fetch wrappers for backend endpoints
        │   └── types.ts         # TypeScript interfaces
        └── components/
            ├── Step1_Idea.tsx
            ├── Step2_Hooks.tsx          # Hook list + chat panel
            ├── Step3_Post.tsx           # Post editor + chat panel + length picker
            ├── Step4_Done.tsx
            ├── ChatPanel.tsx            # Reusable chat UI for steps 2 & 3
            ├── ProgressBar.tsx
            └── ui/                      # Small UI primitives (Button, Textarea, etc.)
```

**Top-level `package.json`:** Use `concurrently` to run both servers with `npm run dev`:
```json
"scripts": {
  "dev": "concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\"",
  "install-all": "npm install && npm install --prefix backend && npm install --prefix frontend"
}
```

---

## 5. Notion Database Schema

Jana will create this database in Notion before running the app. Document this in the README.

**Database Properties:**

| Property Name      | Type          | Notes                                                                |
|--------------------|---------------|----------------------------------------------------------------------|
| `Idea`             | Title         | The seed idea Jana typed                                             |
| `Status`           | Select        | Options: Generating, Hook Selection, Post Generation, Ready for Design, Designed, Posted |
| `Hook 1`           | Rich text     | First generated hook                                                 |
| `Hook 2`           | Rich text     | Second generated hook                                                |
| `Hook 3`           | Rich text     | Third generated hook                                                 |
| `Selected Hook`    | Rich text     | Final hook Jana picked (after editing/chatting)                      |
| `Post Length`      | Select        | Options: Short, Medium, Long                                         |
| `Post Text`        | Rich text     | Final polished post                                                  |
| `Hook Chat Log`    | Rich text     | Full conversation while iterating on hooks (JSON or markdown)        |
| `Post Chat Log`    | Rich text     | Full conversation while iterating on the post                        |
| `Design Link`      | URL           | Jana adds manually after Canva                                       |
| `LinkedIn URL`     | URL           | Jana adds manually after publishing                                  |
| `Date Created`     | Created time  | Auto                                                                 |
| `Date Posted`      | Date          | Jana fills manually                                                  |

**Note on Notion's rich text limit:** Each rich text property has a 2000-character limit per "block." If chat logs get long, split into multiple blocks (Notion SDK handles arrays).

---

## 6. Environment Variables

`.env.example` (copy to `.env` and fill in):

```bash
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Notion
NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=...

# Server
PORT=3001
```

The frontend hits `http://localhost:3001` for all API calls. Configure Vite proxy or use direct fetch with CORS enabled on backend.

---

## 7. Backend API Endpoints

All endpoints return JSON. Errors return `{ error: string }` with appropriate HTTP status.

### `POST /api/posts`
Create a new post row in Notion with the initial idea.

**Request:**
```json
{ "idea": "AI tools for project managers" }
```

**Response:**
```json
{ "id": "notion-page-id", "idea": "..." }
```

**Behavior:** Creates Notion row with `Idea`, `Status="Generating"`, `Date Created` auto-set.

---

### `POST /api/posts/:id/hooks`
Generate 3 hooks for an existing post.

**Request body:** (none needed; idea is fetched from Notion by ID)

**Response:**
```json
{ "hooks": ["Hook 1 text", "Hook 2 text", "Hook 3 text"] }
```

**Behavior:**
1. Fetch the idea from Notion (by `id`)
2. Call Claude API with hook generation prompt (see Section 8)
3. Update Notion row with Hook 1/2/3 and Status="Hook Selection"
4. Return hooks

---

### `POST /api/posts/:id/hooks/chat`
Iterate on hooks via chat.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Make hook 2 more direct" }
  ],
  "currentHooks": ["...", "...", "..."]
}
```

**Response:**
```json
{
  "reply": "Here are the updated hooks...",
  "updatedHooks": ["...", "...", "..."]
}
```

**Behavior:**
1. Fetch idea from Notion
2. Build conversation: voice profile + idea + current hooks + chat history
3. Call Claude API with hook chat prompt
4. Parse response: extract reply text + updated hooks (Claude returns structured JSON)
5. Append to Hook Chat Log in Notion
6. Update Hook 1/2/3 in Notion if hooks changed
7. Return reply + updated hooks

---

### `POST /api/posts/:id/select-hook`
Lock in the selected hook.

**Request:**
```json
{ "selectedHook": "Final hook text (possibly edited)" }
```

**Response:** `{ "ok": true }`

**Behavior:** Update Notion: `Selected Hook`, `Status="Post Generation"`.

---

### `POST /api/posts/:id/generate-post`
Generate the full post.

**Request:**
```json
{ "length": "Short" | "Medium" | "Long" }
```

**Response:**
```json
{ "postText": "Full post text here..." }
```

**Behavior:**
1. Fetch idea + selected hook from Notion
2. Call Claude API with post generation prompt + length parameter
3. Update Notion: `Post Length`, `Post Text`
4. Return post text

---

### `POST /api/posts/:id/post/chat`
Iterate on the full post via chat.

**Request:**
```json
{
  "messages": [{ "role": "user", "content": "Make it more personal" }],
  "currentPost": "Current post text"
}
```

**Response:**
```json
{
  "reply": "Here's the updated version...",
  "updatedPost": "Updated post text"
}
```

**Behavior:** Same pattern as hook chat. Append to Post Chat Log, update Post Text.

---

### `POST /api/posts/:id/finalize`
Mark post as ready.

**Request:**
```json
{ "postText": "Final post text (possibly edited inline)" }
```

**Response:**
```json
{ "ok": true, "notionUrl": "https://notion.so/..." }
```

**Behavior:** Update Notion: `Post Text`, `Status="Ready for Design"`. Return Notion page URL.

---

## 8. Claude API Prompts

**IMPORTANT:** Every Claude API call must:
1. Load `voice-profile.md` from disk (read fresh each call so edits take effect immediately)
2. Inject it into the system prompt
3. Use model `claude-opus-4-7`

### Hook Generation Prompt

**System prompt:**
```
You are helping Jana write authentic LinkedIn hooks. You MUST follow her voice profile exactly.

<voice_profile>
{contents of voice-profile.md}
</voice_profile>

Generate exactly 3 distinct hook options for the idea below. Each hook should:
- Be 1-2 sentences max
- Open in a way Jana actually opens posts (real moment, stuck point, build-in-public observation)
- Avoid every phrase in her "Bad openers" list
- Avoid em-dashes and semicolons (use hyphens and periods)
- Sound like a person, not a brand

Return ONLY a JSON object with this shape:
{ "hooks": ["hook 1 text", "hook 2 text", "hook 3 text"] }

No other text. No markdown. Just the JSON.
```

**User message:**
```
Idea: {idea}
```

### Hook Chat Prompt

**System prompt:** Same voice profile injection. Then:
```
Jana is iterating on her LinkedIn hooks. The current 3 hooks are:

1. {hook1}
2. {hook2}
3. {hook3}

She'll ask you to refine, replace, combine, or regenerate them. Respond conversationally about your reasoning, then return the updated set of 3 hooks.

Return your response as JSON:
{
  "reply": "Your conversational response (2-4 sentences)",
  "hooks": ["updated hook 1", "updated hook 2", "updated hook 3"]
}
```

### Post Generation Prompt

**System prompt:**
```
{voice profile}

Write a complete LinkedIn post for Jana using the hook below. Length target: {length} ({wordRange} words).

The post should:
- Open with the exact hook provided (or very close to it - small adjustments are okay if needed for flow)
- Body: build-in-public energy. Specific tools, real moments, honest reflection. Not a framework lecture.
- Close: a real question or reflection - never "drop your thoughts below"
- 3-5 hashtags (one of: #AI #ProjectManagement #Automation #WomenInTech #NextfemAI #DigitalNomad - use only relevant ones)
- 0-2 emojis MAX, only if they add meaning
- NO em-dashes, NO semicolons
- NO corporate jargon (full hate list is in the voice profile)

Return ONLY the post text. No preamble, no explanation, no JSON wrapper.
```

**User message:**
```
Hook: {selectedHook}
Idea/topic: {idea}
Length: {length} ({wordRange} words)
```

**Length word ranges:**
- Short: 80-150 words
- Medium: 150-250 words
- Long: 250-400 words

### Post Chat Prompt

**System prompt:** Voice profile + post chat instructions:
```
Jana is iterating on her LinkedIn post. Current draft:

<current_post>
{currentPost}
</current_post>

She'll ask for changes. Respond conversationally about your reasoning (2-4 sentences), then return the full updated post.

Return as JSON:
{
  "reply": "Your conversational response",
  "post": "Full updated post text"
}
```

---

## 9. Frontend UI Specifications

### Design Tokens (Tailwind config)

```js
// tailwind.config.js
extend: {
  colors: {
    'jana-purple': '#ada2cc',
    'jana-turquoise': '#9fd7d5',
    'jana-coral': '#f89083',
    'jana-coral-dark': '#e76e50',
  },
  fontFamily: {
    sans: ['DM Sans', 'system-ui', 'sans-serif'],
  },
}
```

Add DM Sans via Google Fonts in `index.html`.

### Layout

- Single-column, max-width 800px, centered
- Generous whitespace
- Soft pastels (purple/turquoise as accents, not dominant backgrounds)
- White or very-light cards with subtle borders
- No gradients, no heavy shadows - clean and calm

### Step 1: Idea Input

- Big textarea (min height ~120px) with placeholder: "Type your rough idea or topic. Don't overthink it - 'n8n automation', 'why I quit hospitality', 'AI for non-technical women' all work."
- Single button: "Generate Hooks" (coral background, white text, rounded)
- Loading state: button disabled, shows spinner + "Thinking..."
- Error state: red text below button if API fails, with retry option

### Step 2: Hook Selection

Layout: two-column on desktop (hooks left, chat right), stacked on mobile.

**Hooks column:**
- 3 hook cards stacked vertically
- Each card: hook number, hook text in editable textarea, "Use This Hook" button
- The textarea is editable inline - if Jana edits a hook directly, that becomes the version saved when she clicks "Use This Hook"
- Subtle border, padding, rounded corners

**Chat column:**
- Title: "Refine with Claude"
- Message list (scrollable, max-height ~400px)
  - User messages: right-aligned, light purple background
  - Claude messages: left-aligned, light gray background
- Input textarea at bottom + "Send" button
- Suggested prompts as chips above input: "Make them more direct", "Try different angles", "Combine 1 and 3", "Generate 3 new ones"
- When Claude updates hooks, the hook cards on the left update with a brief highlight animation

### Step 3: Full Post

**Top section:**
- Show selected hook in a small "locked-in" card (with edit pencil to go back if needed)
- Length picker: 3 buttons (Short / Medium / Long) with word counts under each
- "Generate Post" button appears once length is selected
- After first generation, length picker stays visible for regeneration

**Main section:**
- Two-column layout (post editor left, chat right)

**Post editor:**
- Big textarea (min ~400px height), monospace-ish font for clarity
- Character + word count below
- "Save & Done" button (turquoise) to finalize
- Inline edits are preserved - the textarea is the source of truth on save

**Chat column:**
- Same as Step 2 but for post iterations
- Suggested prompts: "Make it shorter", "More personal", "Stronger ending", "Less formal"

### Step 4: Done

- Big checkmark / success state
- "Your post is saved to Notion" message
- Show: idea, selected hook, final post (read-only preview)
- Two buttons: "Start New Post" (primary) and "Open in Notion" (secondary, opens Notion URL in new tab)

### Progress Bar

Top of every step: 4 dots/segments showing where you are. Clicking a previous step lets you go back (with a confirmation if data would be lost).

### Loading & Error States

- Every API call shows loading state on the triggering button
- Errors show inline (red text near the action that failed) with a retry button
- Network errors: friendly message ("Couldn't reach the server - is the backend running?")
- API quota errors: clear message about Anthropic billing

---

## 10. State Management

Use React's built-in `useState` and `useReducer` - no Redux/Zustand needed for an app this size.

**App-level state shape:**
```ts
interface AppState {
  step: 1 | 2 | 3 | 4;
  postId: string | null;          // Notion page ID, set after step 1
  idea: string;
  hooks: string[];                 // 3 hooks
  hookChatHistory: ChatMessage[];
  selectedHook: string | null;
  length: 'Short' | 'Medium' | 'Long' | null;
  postText: string;
  postChatHistory: ChatMessage[];
  notionUrl: string | null;        // set after step 4
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

Persist to `localStorage` after every state change so a refresh doesn't lose work. Clear on "Start New Post".

---

## 11. Voice Profile Loading

The backend reads `voice-profile.md` from disk on **every** API call (don't cache). This is intentional: when Jana edits the voice profile, changes take effect on the next post without restarting the server.

```js
// backend/server.js
import fs from 'fs';
import path from 'path';

function loadVoiceProfile() {
  const filePath = path.resolve(__dirname, '..', 'voice-profile.md');
  return fs.readFileSync(filePath, 'utf-8');
}
```

---

## 12. README.md Contents

The README should walk Jana through setup. Include:

1. **Prerequisites:** Node.js 20+, a Notion account, an Anthropic API key
2. **Notion setup:**
   - How to create the database (with screenshot or table of properties)
   - How to create a Notion integration at https://www.notion.so/profile/integrations
   - How to share the database with the integration ("..." menu -> Connections)
   - How to find the database ID (from the URL)
3. **Anthropic API key:** Link to console.anthropic.com to get one
4. **Install:**
   ```bash
   npm run install-all
   cp .env.example .env
   # Edit .env with your keys
   ```
5. **Run:**
   ```bash
   npm run dev
   ```
   Frontend opens at `http://localhost:5173`, backend at `http://localhost:3001`.
6. **Editing your voice profile:** Just edit `voice-profile.md` - changes apply immediately on next generation.
7. **Troubleshooting:** Common issues (CORS, missing env vars, Notion permissions).

---

## 13. Build Order (Suggested)

1. Scaffold folders + `package.json` files (root, backend, frontend)
2. Backend: env config + Express boilerplate + Notion connection test
3. Backend: implement `POST /api/posts` (create row), test with curl
4. Backend: implement hook generation endpoint
5. Frontend: Vite + React + Tailwind scaffold
6. Frontend: Step 1 (idea input) wired to backend
7. Frontend: Step 2 (hooks display, no chat yet)
8. Backend: hook chat endpoint
9. Frontend: chat panel for hooks
10. Frontend + Backend: Step 3 (length picker, post generation, post chat)
11. Frontend: Step 4 (done state)
12. Polish: loading states, errors, localStorage persistence
13. Write README

Test each step end-to-end before moving on. Don't build everything then debug.

---

## 14. Things to Watch Out For

- **Notion rich text 2000-char limit per block:** When saving long chat logs or post text, split into an array of rich text blocks if needed. The Notion SDK accepts arrays.
- **JSON parsing from Claude:** Claude sometimes wraps JSON in markdown code fences. Strip those before parsing. Use a tolerant parser:
  ```js
  function extractJson(text) {
    const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim();
    return JSON.parse(cleaned);
  }
  ```
- **CORS:** Set `app.use(cors())` permissively for local dev. For production, restrict origins.
- **Race conditions:** If Jana clicks "Generate Hooks" twice fast, you could create two Notion rows. Disable the button while a request is in flight.
- **Empty/malformed responses from Claude:** Handle gracefully. Show "Claude returned an unexpected response - try again." Don't crash.
- **Voice profile not found:** If `voice-profile.md` is missing, log a warning and continue with no voice context (still works, just generic). Don't crash the server.
- **localStorage state on refresh:** Restore step + postId, but re-fetch any data from Notion to make sure it's current.

---

## 15. Out of Scope (Don't Build These)

- User authentication (single-user app, runs locally)
- Multi-user/team features
- Auto-posting to LinkedIn
- Image/design generation
- Scheduling
- Analytics
- Mobile app

---

## 16. Once Built: How Jana Uses It

1. Open terminal, navigate to project, run `npm run dev`
2. Browser opens to `http://localhost:5173`
3. Type an idea -> click Generate
4. Pick/refine a hook (chat with Claude as needed)
5. Pick length -> generate post
6. Refine post (chat with Claude as needed)
7. Click "Save & Done"
8. Open Notion -> see the post saved with status "Ready for Design"
9. Manually do Canva design (if needed)
10. Manually post to LinkedIn

Total time per post: ~10-15 minutes.

---

## 17. Voice Profile (Already Written)

The file `voice-profile.md` already exists at the project root. Read it carefully - it's the most important context for generating posts that don't sound like AI.

Key rules to enforce in EVERY generation:
- NO em-dashes (use hyphens)
- NO semicolons (use periods or commas)
- NO corporate jargon (full list in voice profile)
- NO bad openers ("Let me share...", "I'm excited to...", "Here are X ways...")
- Hashtag format: #NextfemAI (lowercase 'f')
- Build-in-public energy, not thought-leader

---

**End of brief. Build it well. Ask Jana only when something is genuinely unclear.**
