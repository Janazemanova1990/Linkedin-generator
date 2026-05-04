import { useState, useEffect } from 'react';
import type { ChatMessage } from '../lib/types';
import { Button } from './ui/Button';
import { ChatPanel } from './ChatPanel';

interface Step2Props {
  hooks: string[];
  chatHistory: ChatMessage[];
  onSelectHook: (hook: string) => Promise<void>;
  onChat: (message: string) => Promise<void>;
  onHooksUpdated: (hooks: string[]) => void;
  loading: boolean;
  chatLoading: boolean;
  error: string | null;
}

const HOOK_SUGGESTIONS = [
  'Make them more direct',
  'Try different angles',
  'Combine 1 and 3',
  'Generate 3 new ones',
];

export function Step2_Hooks({
  hooks,
  chatHistory,
  onSelectHook,
  onChat,
  onHooksUpdated,
  loading,
  chatLoading,
  error,
}: Step2Props) {
  const [editableHooks, setEditableHooks] = useState<string[]>(hooks);
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  useEffect(() => {
    const changed = hooks.some((h, i) => h !== editableHooks[i]);
    if (changed) {
      setEditableHooks(hooks);
      setHighlightedIndex(-1);
      setTimeout(() => setHighlightedIndex(null), 800);
    }
  }, [hooks]);

  const handleSelect = async (index: number) => {
    setSelectingIndex(index);
    await onSelectHook(editableHooks[index]);
    setSelectingIndex(null);
  };

  const handleEditHook = (index: number, value: string) => {
    const updated = [...editableHooks];
    updated[index] = value;
    setEditableHooks(updated);
    onHooksUpdated(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1a1a2e]">Choose your hook</h2>
        <p className="text-sm text-gray-500">Edit any hook inline, then click "Use This Hook".</p>

        {editableHooks.map((hook, i) => (
          <div
            key={i}
            className={`bg-white border rounded-xl p-4 transition-all ${
              highlightedIndex === -1 ? 'border-[#ada2cc] shadow-md' : 'border-gray-200'
            } shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#ada2cc] uppercase tracking-wide">
                Hook {i + 1}
              </span>
            </div>
            <textarea
              value={hook}
              onChange={(e) => handleEditHook(i, e.target.value)}
              rows={3}
              className="w-full resize-none text-sm border-0 p-0 focus:outline-none leading-relaxed text-[#1a1a2e]"
            />
            <div className="mt-3 flex justify-end">
              <Button
                variant="coral"
                onClick={() => handleSelect(i)}
                loading={selectingIndex === i}
                disabled={loading || selectingIndex !== null || !hook.trim()}
              >
                Use This Hook
              </Button>
            </div>
          </div>
        ))}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <ChatPanel
          title="Refine with Claude"
          messages={chatHistory}
          onSend={onChat}
          suggestions={HOOK_SUGGESTIONS}
          loading={chatLoading}
        />
      </div>
    </div>
  );
}
