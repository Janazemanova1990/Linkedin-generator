import { useState } from 'react';
import { Button } from './ui/Button';

interface Step1Props {
  idea: string;
  onIdeaChange: (idea: string) => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function Step1_Idea({ idea, onIdeaChange, onSubmit, loading, error }: Step1Props) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onSubmit();
    setRetrying(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-[#1a1a2e] mb-2">What do you want to post about?</h1>
        <p className="text-gray-500 text-sm">Type a rough idea - you'll refine it with Claude.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <textarea
          value={idea}
          onChange={(e) => onIdeaChange(e.target.value)}
          placeholder="Type your rough idea or topic. Don't overthink it - 'n8n automation', 'why I quit hospitality', 'AI for non-technical women' all work."
          rows={5}
          disabled={loading}
          className="w-full resize-none text-base border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#ada2cc] transition-colors disabled:opacity-50 leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey && idea.trim()) onSubmit();
          }}
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">⌘+Enter to generate</p>
          <Button
            variant="coral"
            onClick={onSubmit}
            loading={loading}
            disabled={!idea.trim()}
            className="px-6 py-2.5 text-base"
          >
            Generate Hooks
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="mt-2 text-xs text-red-500 underline hover:no-underline cursor-pointer"
            >
              {retrying ? 'Retrying...' : 'Try again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
