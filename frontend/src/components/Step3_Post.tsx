import { useState } from 'react';
import type { ChatMessage } from '../lib/types';
import { Button } from './ui/Button';
import { ChatPanel } from './ChatPanel';

interface Step3Props {
  selectedHook: string;
  length: 'Short' | 'Medium' | 'Long' | null;
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

  const handleFinalize = async () => {
    setFinalizing(true);
    await onFinalize();
    setFinalizing(false);
  };

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

        {length && !postText && (
          <div className="mt-4">
            <Button
              variant="coral"
              onClick={onGeneratePost}
              loading={loading}
              className="px-6 py-2.5"
            >
              Generate Post
            </Button>
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
      </div>

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
