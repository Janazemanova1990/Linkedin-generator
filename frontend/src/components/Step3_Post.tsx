import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../lib/types';
import { Button } from './ui/Button';
import { ChatPanel } from './ChatPanel';

interface Step3Props {
  selectedHook: string;
  length: 'Short' | 'Medium' | 'Long' | null;
  clarifyMessages: ChatMessage[];
  clarifyReady: boolean;
  onClarify: (message: string) => Promise<void>;
  clarifyLoading: boolean;
  postText: string;
  chatHistory: ChatMessage[];
  onLengthChange: (length: 'Short' | 'Medium' | 'Long') => void;
  onGeneratePost: () => Promise<void>;
  onPostTextChange: (text: string) => void;
  onChat: (message: string) => Promise<void>;
  onFinalize: () => Promise<void>;
  onEditHook: () => void;
  loading: boolean;
  chatLoading: boolean;
  error: string | null;
}

const LENGTHS = [
  { value: 'Short' as const, label: 'Short', words: '80-150 words', desc: 'Quick take' },
  { value: 'Medium' as const, label: 'Medium', words: '150-250 words', desc: 'One story' },
  { value: 'Long' as const, label: 'Long', words: '250-400 words', desc: 'Deep post' },
];

const POST_SUGGESTIONS = ['Make it shorter', 'More personal', 'Stronger ending', 'Less formal'];

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function Step3_Post({
  selectedHook,
  length,
  clarifyMessages,
  clarifyReady,
  onClarify,
  clarifyLoading,
  postText,
  chatHistory,
  onLengthChange,
  onGeneratePost,
  onPostTextChange,
  onChat,
  onFinalize,
  onEditHook,
  loading,
  chatLoading,
  error,
}: Step3Props) {
  const [finalizing, setFinalizing] = useState(false);
  const [clarifyInput, setClarifyInput] = useState('');
  // track whether we already fired the initial clarify call for this length selection
  const initFiredRef = useRef(false);

  // Auto-trigger first clarify question when length is picked and no messages yet
  useEffect(() => {
    if (length && clarifyMessages.length === 0 && !clarifyLoading && !initFiredRef.current) {
      initFiredRef.current = true;
      onClarify('__init__');
    }
    // Reset the ref if length changes (user picks a different length)
    if (!length) {
      initFiredRef.current = false;
    }
  }, [length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinalize = async () => {
    setFinalizing(true);
    await onFinalize();
    setFinalizing(false);
  };

  const handleClarifySend = async () => {
    const msg = clarifyInput.trim();
    if (!msg || clarifyLoading) return;
    setClarifyInput('');
    await onClarify(msg);
  };

  const handleClarifyKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleClarifySend();
    }
  };

  // Generate is enabled once the user has given at least one answer OR clarify is marked ready
  const userAnswerCount = clarifyMessages.filter((m) => m.role === 'user').length;
  const canGenerate = length && (clarifyReady || userAnswerCount > 0);

  const words = wordCount(postText);
  const chars = postText.length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <span className="text-xs font-semibold text-[#ada2cc] uppercase tracking-wide">Selected Hook</span>
          <p className="text-sm text-[#1a1a2e] mt-1 leading-relaxed">{selectedHook}</p>
        </div>
        <button
          onClick={onEditHook}
          className="text-xs text-gray-400 hover:text-[#ada2cc] transition-colors cursor-pointer shrink-0"
          title="Go back to edit hook"
        >
          ✏️ Edit
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">How long should this post be?</h2>
        <div className="grid grid-cols-3 gap-3">
          {LENGTHS.map(({ value, label, words: w, desc }) => (
            <button
              key={value}
              onClick={() => onLengthChange(value)}
              className={`border rounded-xl p-3 text-left transition-all cursor-pointer ${
                length === value
                  ? 'border-[#ada2cc] bg-[#ada2cc]/10 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-sm text-[#1a1a2e]">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{w}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Clarify chat - shown after length is selected, before post is generated */}
      {length && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#9fd7d5] uppercase tracking-wide">Quick question before we generate</span>
            {clarifyReady && (
              <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Ready</span>
            )}
          </div>

          {/* Messages */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {clarifyMessages.length === 0 && clarifyLoading && (
              <div className="flex justify-start">
                <div className="bg-[#f3f1fa] text-[#1a1a2e] text-sm rounded-xl px-3 py-2 max-w-[85%]">
                  <span className="animate-pulse text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
            {clarifyMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`text-sm rounded-xl px-3 py-2 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-[#ada2cc] text-white'
                      : 'bg-[#f3f1fa] text-[#1a1a2e]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {clarifyMessages.length > 0 && clarifyLoading && (
              <div className="flex justify-start">
                <div className="bg-[#f3f1fa] text-[#1a1a2e] text-sm rounded-xl px-3 py-2">
                  <span className="animate-pulse text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          {!clarifyReady && (
            <div className="flex gap-2">
              <input
                type="text"
                value={clarifyInput}
                onChange={(e) => setClarifyInput(e.target.value)}
                onKeyDown={handleClarifyKey}
                placeholder="Your answer..."
                disabled={clarifyLoading}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#9fd7d5] transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleClarifySend}
                disabled={!clarifyInput.trim() || clarifyLoading}
                className="text-sm px-3 py-2 bg-[#9fd7d5] text-white rounded-lg hover:bg-[#8ecac8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generate button */}
      {length && !postText && (
        <div>
          <Button
            variant="coral"
            onClick={onGeneratePost}
            loading={loading}
            disabled={!canGenerate}
            className="px-6 py-2.5"
          >
            Generate Post
          </Button>
          {!canGenerate && (
            <p className="text-xs text-gray-400 mt-2">Answer the question above to unlock generation</p>
          )}
        </div>
      )}
      {length && postText && (
        <div className="mt-3">
          <Button
            variant="outline"
            onClick={onGeneratePost}
            loading={loading}
            className="text-sm"
          >
            Regenerate
          </Button>
        </div>
      )}

      {postText && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[#1a1a2e]">Your post</h2>
            <textarea
              value={postText}
              onChange={(e) => onPostTextChange(e.target.value)}
              rows={16}
              className="w-full resize-none text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ada2cc] transition-colors leading-relaxed font-mono"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {words} words · {chars} characters
              </span>
              <Button
                variant="turquoise"
                onClick={handleFinalize}
                loading={finalizing}
                className="px-6"
              >
                Save & Done
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <ChatPanel
              title="Refine with Claude"
              messages={chatHistory}
              onSend={onChat}
              suggestions={POST_SUGGESTIONS}
              loading={chatLoading}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
