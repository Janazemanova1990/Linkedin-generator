import type { ChatMessage } from './types';

const BASE = '/api';

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

export const api = {
  createPost: (idea: string) =>
    post<{ id: string; idea: string }>('/posts', { idea }),

  generateHooks: (id: string) =>
    post<{ hooks: string[] }>(`/posts/${id}/hooks`),

  chatHooks: (id: string, messages: ChatMessage[], currentHooks: string[]) =>
    post<{ reply: string; updatedHooks: string[] }>(`/posts/${id}/hooks/chat`, {
      messages,
      currentHooks,
    }),

  selectHook: (id: string, selectedHook: string) =>
    post<{ ok: boolean }>(`/posts/${id}/select-hook`, { selectedHook }),

  generatePost: (id: string, length: 'Short' | 'Medium' | 'Long') =>
    post<{ postText: string }>(`/posts/${id}/generate-post`, { length }),

  chatPost: (id: string, messages: ChatMessage[], currentPost: string) =>
    post<{ reply: string; updatedPost: string }>(`/posts/${id}/post/chat`, {
      messages,
      currentPost,
    }),

  finalizePost: (id: string, postText: string) =>
    post<{ ok: boolean; notionUrl: string }>(`/posts/${id}/finalize`, { postText }),
};
