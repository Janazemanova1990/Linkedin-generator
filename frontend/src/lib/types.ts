export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AppState {
  step: 1 | 2 | 3 | 4;
  postId: string | null;
  idea: string;
  hooks: string[];
  hookChatHistory: ChatMessage[];
  selectedHook: string | null;
  length: 'Short' | 'Medium' | 'Long' | null;
  clarifyMessages: ChatMessage[];
  clarifyReady: boolean;
  postText: string;
  postChatHistory: ChatMessage[];
  notionUrl: string | null;
}

export type AppAction =
  | { type: 'SET_STEP'; step: AppState['step'] }
  | { type: 'SET_POST_ID'; postId: string }
  | { type: 'SET_IDEA'; idea: string }
  | { type: 'SET_HOOKS'; hooks: string[] }
  | { type: 'ADD_HOOK_CHAT'; message: ChatMessage }
  | { type: 'SET_HOOK_CHAT'; messages: ChatMessage[] }
  | { type: 'SET_SELECTED_HOOK'; hook: string }
  | { type: 'SET_LENGTH'; length: AppState['length'] }
  | { type: 'ADD_CLARIFY_MESSAGE'; message: ChatMessage }
  | { type: 'SET_CLARIFY_READY'; ready: boolean }
  | { type: 'RESET_CLARIFY' }
  | { type: 'SET_POST_TEXT'; postText: string }
  | { type: 'ADD_POST_CHAT'; message: ChatMessage }
  | { type: 'SET_POST_CHAT'; messages: ChatMessage[] }
  | { type: 'SET_NOTION_URL'; url: string }
  | { type: 'RESET' };
