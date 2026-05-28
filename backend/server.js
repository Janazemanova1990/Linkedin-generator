import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import {
  createPost,
  getPost,
  updatePost,
  testConnection,
} from './notion.js';
import {
  hookSystemPrompt,
  hookChatSystemPrompt,
  postSystemPrompt,
  postChatSystemPrompt,
  WORD_RANGES,
} from './prompts.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function loadVoiceProfile() {
  const filePath = path.resolve(__dirname, '..', 'voice-profile.md');
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    console.warn('voice-profile.md not found - continuing without voice context');
    return '';
  }
}

function extractJson(text) {
  const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim();
  return JSON.parse(cleaned);
}

function appendChatLog(existing, messages) {
  const newEntries = messages
    .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
    .join('\n\n');
  return existing ? `${existing}\n\n---\n\n${newEntries}` : newEntries;
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// POST /api/posts - create new post row
app.post('/api/posts', async (req, res) => {
  const { idea } = req.body;
  if (!idea?.trim()) return res.status(400).json({ error: 'idea is required' });
  try {
    const post = await createPost(idea.trim());
    res.json(post);
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/hooks - generate 3 hooks
app.post('/api/posts/:id/hooks', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await getPost(id);
    const voiceProfile = loadVoiceProfile();

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: hookSystemPrompt(voiceProfile),
      messages: [{ role: 'user', content: `Idea: ${post.idea}` }],
    });

    const parsed = extractJson(response.content[0].text);
    const hooks = parsed.hooks;

    await updatePost(id, {
      hook1: hooks[0],
      hook2: hooks[1],
      hook3: hooks[2],
      status: 'Hook Selection',
    });

    res.json({ hooks });
  } catch (err) {
    console.error('generateHooks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/hooks/chat - iterate on hooks
app.post('/api/posts/:id/hooks/chat', async (req, res) => {
  const { id } = req.params;
  const { messages, currentHooks } = req.body;

  if (!messages?.length || !currentHooks?.length) {
    return res.status(400).json({ error: 'messages and currentHooks are required' });
  }

  try {
    const post = await getPost(id);
    const voiceProfile = loadVoiceProfile();

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: hookChatSystemPrompt(voiceProfile, currentHooks[0], currentHooks[1], currentHooks[2]),
      messages,
    });

    const parsed = extractJson(response.content[0].text);
    const { reply, hooks: updatedHooks } = parsed;

    const newLog = appendChatLog(post.hookChatLog, [
      ...messages,
      { role: 'assistant', content: reply },
    ]);

    await updatePost(id, {
      hook1: updatedHooks[0],
      hook2: updatedHooks[1],
      hook3: updatedHooks[2],
      hookChatLog: newLog,
    });

    res.json({ reply, updatedHooks });
  } catch (err) {
    console.error('hookChat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/select-hook - lock in selected hook
app.post('/api/posts/:id/select-hook', async (req, res) => {
  const { id } = req.params;
  const { selectedHook } = req.body;
  if (!selectedHook?.trim()) return res.status(400).json({ error: 'selectedHook is required' });
  try {
    await updatePost(id, {
      selectedHook: selectedHook.trim(),
      status: 'Post Generation',
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('selectHook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/generate-post - generate full post
app.post('/api/posts/:id/generate-post', async (req, res) => {
  const { id } = req.params;
  const { length } = req.body;
  if (!['Short', 'Medium', 'Long'].includes(length)) {
    return res.status(400).json({ error: 'length must be Short, Medium, or Long' });
  }
  try {
    const post = await getPost(id);
    const voiceProfile = loadVoiceProfile();
    const wordRange = WORD_RANGES[length];

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      system: postSystemPrompt(voiceProfile, length, wordRange),
      messages: [
        {
          role: 'user',
          content: `Hook: ${post.selectedHook}\nIdea/topic: ${post.idea}\nLength: ${length} (${wordRange} words)`,
        },
      ],
    });

    const postText = response.content[0].text.trim();

    await updatePost(id, {
      postText,
      postLength: length,
    });

    res.json({ postText });
  } catch (err) {
    console.error('generatePost error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/post/chat - iterate on post
app.post('/api/posts/:id/post/chat', async (req, res) => {
  const { id } = req.params;
  const { messages, currentPost } = req.body;

  if (!messages?.length || !currentPost) {
    return res.status(400).json({ error: 'messages and currentPost are required' });
  }

  try {
    const post = await getPost(id);
    const voiceProfile = loadVoiceProfile();

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      system: postChatSystemPrompt(voiceProfile, currentPost),
      messages,
    });

    const parsed = extractJson(response.content[0].text);
    const { reply, post: updatedPost } = parsed;

    const newLog = appendChatLog(post.postChatLog, [
      ...messages,
      { role: 'assistant', content: reply },
    ]);

    await updatePost(id, {
      postText: updatedPost,
      postChatLog: newLog,
    });

    res.json({ reply, updatedPost });
  } catch (err) {
    console.error('postChat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/finalize - mark ready for design
app.post('/api/posts/:id/finalize', async (req, res) => {
  const { id } = req.params;
  const { postText } = req.body;
  if (!postText?.trim()) return res.status(400).json({ error: 'postText is required' });
  try {
    await updatePost(id, {
      postText: postText.trim(),
      status: 'Ready for Design',
    });
    const post = await getPost(id);
    res.json({ ok: true, notionUrl: post.url });
  } catch (err) {
    console.error('finalize error:', err);
    res.status(500).json({ error: err.message });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
      try {
        await testConnection();
      } catch (err) {
        console.warn('Notion connection test failed:', err.message);
      }
    }
  });
}

export default app;
