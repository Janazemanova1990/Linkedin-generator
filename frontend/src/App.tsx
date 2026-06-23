import { useReducer, useEffect, useState } from 'react';
import type { AppState, AppAction } from './lib/types';
import { api } from './lib/api';
import { ProgressBar } from './components/ProgressBar';
import { Step1_Idea } from './components/Step1_Idea';
import { Step2_Hooks } from './components/Step2_Hooks';
import { Step3_Post } from './components/Step3_Post';
import { Step4_Done } from './components/Step4_Done';

const STORAGE_KEY = 'linkedin-generator-state';

const initialState: AppState = {
  step: 1,
  postId: null,
  idea: '',
  hooks: [],
  hookChatHistory: [],
  selectedHook: null,
  length: null,
  clarifyMessages: [],
  clarifyReady: false,
  postText: '',
  postChatHistory: [],
  notionUrl: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step };
    case 'SET_POST_ID': return { ...state, postId: action.postId };
    case 'SET_IDEA': return { ...state, idea: action.idea };
    case 'SET_HOOKS': return { ...state, hooks: action.hooks };
    case 'ADD_HOOK_CHAT': return { ...state, hookChatHistory: [...state.hookChatHistory, action.message] };
    case 'SET_HOOK_CHAT': return { ...state, hookChatHistory: action.messages };
    case 'SET_SELECTED_HOOK': return { ...state, selectedHook: action.hook };
    case 'SET_LENGTH': return { ...state, length: action.length };
    case 'ADD_CLARIFY_MESSAGE': return { ...state, clarifyMessages: [...state.clarifyMessages, action.message] };
    case 'SET_CLARIFY_READY': return { ...state, clarifyReady: action.ready };
    case 'RESET_CLARIFY': return { ...state, clarifyMessages: [], clarifyReady: false };
    case 'SET_POST_TEXT': return { ...state, postText: action.postText };
    case 'ADD_POST_CHAT': return { ...state, postChatHistory: [...state.postChatHistory, action.message] };
    case 'SET_POST_CHAT': return { ...state, postChatHistory: action.messages };
    case 'SET_NOTION_URL': return { ...state, notionUrl: action.url };
    case 'RESET': return initialState;
    default: return state;
  }
}

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...initialState, ...JSON.parse(saved) };
  } catch {}
  return initialState;
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function clearError() {
    setError(null);
  }

  const handleGenerateHooks = async () => {
    if (loading) return;
    clearError();
    setLoading(true);
    try {
      const { id } = await api.createPost(state.idea);
      dispatch({ type: 'SET_POST_ID', postId: id });
      const { hooks } = await api.generateHooks(id);
      dispatch({ type: 'SET_HOOKS', hooks });
      dispatch({ type: 'SET_STEP', step: 2 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg.toLowerCase().includes('fetch') ? "Couldn't reach the server - is the backend running?" : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleHookChat = async (message: string) => {
    if (chatLoading || !state.postId) return;
    dispatch({ type: 'ADD_HOOK_CHAT', message: { role: 'user', content: message } });
    setChatLoading(true);
    try {
      const allMessages = [...state.hookChatHistory, { role: 'user' as const, content: message }];
      const { reply, updatedHooks } = await api.chatHooks(state.postId, allMessages, state.hooks);
      dispatch({ type: 'ADD_HOOK_CHAT', message: { role: 'assistant', content: reply } });
      dispatch({ type: 'SET_HOOKS', hooks: updatedHooks });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Claude returned an unexpected response - try again.';
      dispatch({ type: 'ADD_HOOK_CHAT', message: { role: 'assistant', content: `Error: ${msg}` } });
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectHook = async (hook: string) => {
    if (!state.postId) return;
    clearError();
    setLoading(true);
    try {
      await api.selectHook(state.postId, hook);
      dispatch({ type: 'SET_SELECTED_HOOK', hook });
      dispatch({ type: 'RESET_CLARIFY' });
      dispatch({ type: 'SET_STEP', step: 3 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClarify = async (userMessage: string) => {
    if (clarifyLoading || !state.postId || !state.selectedHook) return;
    const userMsg = { role: 'user' as const, content: userMessage };
    // For the initial trigger we don't show a user bubble, but we still need to send it
    const isInitial = userMessage === '__init__';
    if (!isInitial) {
      dispatch({ type: 'ADD_CLARIFY_MESSAGE', message: userMsg });
    }
    setClarifyLoading(true);
    try {
      const allMessages = isInitial
        ? []
        : [...state.clarifyMessages, userMsg];
      const { question, ready } = await api.clarify(
        state.postId,
        allMessages,
        state.idea,
        state.selectedHook,
      );
      dispatch({ type: 'ADD_CLARIFY_MESSAGE', message: { role: 'assistant', content: question } });
      if (ready) {
        dispatch({ type: 'SET_CLARIFY_READY', ready: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Claude returned an unexpected response - try again.';
      dispatch({ type: 'ADD_CLARIFY_MESSAGE', message: { role: 'assistant', content: `Error: ${msg}` } });
    } finally {
      setClarifyLoading(false);
    }
  };

  const handleGeneratePost = async () => {
    if (loading || !state.postId || !state.length) return;
    clearError();
    setLoading(true);
    try {
      // Collect user answers from the clarify chat
      const clarifyingDetails = state.clarifyMessages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' | ');
      const { postText } = await api.generatePost(
        state.postId,
        state.length,
        clarifyingDetails || undefined,
      );
      dispatch({ type: 'SET_POST_TEXT', postText });
      dispatch({ type: 'SET_POST_CHAT', messages: [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg.toLowerCase().includes('quota') ? 'Anthropic quota exceeded - check your billing at console.anthropic.com' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePostChat = async (message: string) => {
    if (chatLoading || !state.postId) return;
    dispatch({ type: 'ADD_POST_CHAT', message: { role: 'user', content: message } });
    setChatLoading(true);
    try {
      const allMessages = [...state.postChatHistory, { role: 'user' as const, content: message }];
      const { reply, updatedPost } = await api.chatPost(state.postId, allMessages, state.postText);
      dispatch({ type: 'ADD_POST_CHAT', message: { role: 'assistant', content: reply } });
      dispatch({ type: 'SET_POST_TEXT', postText: updatedPost });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Claude returned an unexpected response - try again.';
      dispatch({ type: 'ADD_POST_CHAT', message: { role: 'assistant', content: `Error: ${msg}` } });
    } finally {
      setChatLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!state.postId) return;
    clearError();
    try {
      const { notionUrl } = await api.finalizePost(state.postId, state.postText);
      dispatch({ type: 'SET_NOTION_URL', url: notionUrl });
      dispatch({ type: 'SET_STEP', step: 4 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    }
  };

  const handleNavigate = (step: 1 | 2 | 3 | 4) => {
    if (step < state.step) {
      const ok = window.confirm('Go back? Any unsaved changes in the current step will be lost.');
      if (ok) dispatch({ type: 'SET_STEP', step });
    }
  };

  const canNavigate = (step: 1 | 2 | 3 | 4) => step < state.step;

  const handleReset = () => {
    if (window.confirm('Start a new post? This will clear all current progress.')) {
      dispatch({ type: 'RESET' });
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9fb]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#1a1a2e]">LinkedIn Post Generator</h1>
          <p className="text-sm text-gray-400 mt-1">Your voice. Your posts.</p>
        </div>

        <ProgressBar step={state.step} onNavigate={handleNavigate} canNavigate={canNavigate} />

        <div className="mt-6">
          {state.step === 1 && (
            <Step1_Idea
              idea={state.idea}
              onIdeaChange={(idea) => dispatch({ type: 'SET_IDEA', idea })}
              onSubmit={handleGenerateHooks}
              loading={loading}
              error={error}
            />
          )}
          {state.step === 2 && (
            <Step2_Hooks
              hooks={state.hooks}
              chatHistory={state.hookChatHistory}
              onSelectHook={handleSelectHook}
              onChat={handleHookChat}
              onHooksUpdated={(hooks) => dispatch({ type: 'SET_HOOKS', hooks })}
              loading={loading}
              chatLoading={chatLoading}
              error={error}
            />
          )}
          {state.step === 3 && state.selectedHook && (
            <Step3_Post
              selectedHook={state.selectedHook}
              length={state.length}
              clarifyMessages={state.clarifyMessages}
              clarifyReady={state.clarifyReady}
              onClarify={handleClarify}
              clarifyLoading={clarifyLoading}
              postText={state.postText}
              chatHistory={state.postChatHistory}
              onLengthChange={(length) => dispatch({ type: 'SET_LENGTH', length })}
              onGeneratePost={handleGeneratePost}
              onPostTextChange={(postText) => dispatch({ type: 'SET_POST_TEXT', postText })}
              onChat={handlePostChat}
              onFinalize={handleFinalize}
              onEditHook={() => dispatch({ type: 'SET_STEP', step: 2 })}
              loading={loading}
              chatLoading={chatLoading}
              error={error}
            />
          )}
          {state.step === 4 && state.selectedHook && (
            <Step4_Done
              idea={state.idea}
              selectedHook={state.selectedHook}
              postText={state.postText}
              notionUrl={state.notionUrl}
              onStartNew={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
