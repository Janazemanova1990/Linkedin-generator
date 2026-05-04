import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_ID = process.env.NOTION_DATABASE_ID;

export function splitToBlocks(text) {
  if (!text) return [{ type: 'text', text: { content: '' } }];
  const chunks = [];
  for (let i = 0; i < text.length; i += 2000) {
    chunks.push({ type: 'text', text: { content: text.slice(i, i + 2000) } });
  }
  return chunks;
}

export async function createPost(idea) {
  const page = await notion.pages.create({
    parent: { database_id: DB_ID },
    properties: {
      Idea: { title: [{ text: { content: idea } }] },
      Status: { select: { name: 'Generating' } },
    },
  });
  return { id: page.id, idea };
}

export async function getPost(id) {
  const page = await notion.pages.retrieve({ page_id: id });
  const props = page.properties;

  function getRichText(prop) {
    return prop?.rich_text?.map((b) => b.plain_text).join('') ?? '';
  }
  function getTitle(prop) {
    return prop?.title?.map((b) => b.plain_text).join('') ?? '';
  }

  return {
    id: page.id,
    url: page.url,
    idea: getTitle(props['Idea']),
    hook1: getRichText(props['Hook 1']),
    hook2: getRichText(props['Hook 2']),
    hook3: getRichText(props['Hook 3']),
    selectedHook: getRichText(props['Selected Hook']),
    postText: getRichText(props['Post Text']),
    status: props['Status']?.select?.name ?? '',
    postLength: props['Post Length']?.select?.name ?? '',
    hookChatLog: getRichText(props['Hook Chat Log']),
    postChatLog: getRichText(props['Post Chat Log']),
  };
}

export async function updatePost(id, updates) {
  const properties = {};

  if (updates.status !== undefined) {
    properties['Status'] = { select: { name: updates.status } };
  }
  if (updates.hook1 !== undefined) {
    properties['Hook 1'] = { rich_text: splitToBlocks(updates.hook1) };
  }
  if (updates.hook2 !== undefined) {
    properties['Hook 2'] = { rich_text: splitToBlocks(updates.hook2) };
  }
  if (updates.hook3 !== undefined) {
    properties['Hook 3'] = { rich_text: splitToBlocks(updates.hook3) };
  }
  if (updates.selectedHook !== undefined) {
    properties['Selected Hook'] = { rich_text: splitToBlocks(updates.selectedHook) };
  }
  if (updates.postLength !== undefined) {
    properties['Post Length'] = { select: { name: updates.postLength } };
  }
  if (updates.postText !== undefined) {
    properties['Post Text'] = { rich_text: splitToBlocks(updates.postText) };
  }
  if (updates.hookChatLog !== undefined) {
    properties['Hook Chat Log'] = { rich_text: splitToBlocks(updates.hookChatLog) };
  }
  if (updates.postChatLog !== undefined) {
    properties['Post Chat Log'] = { rich_text: splitToBlocks(updates.postChatLog) };
  }

  await notion.pages.update({ page_id: id, properties });
}

export async function testConnection() {
  await notion.databases.retrieve({ database_id: DB_ID });
  console.log('Notion connection OK');
}
