import { Button } from './ui/Button';

interface Step4Props {
  idea: string;
  selectedHook: string;
  postText: string;
  notionUrl: string | null;
  onStartNew: () => void;
}

export function Step4_Done({ idea, selectedHook, postText, notionUrl, onStartNew }: Step4Props) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-2xl font-semibold text-[#1a1a2e] mb-1">Post saved to Notion</h1>
        <p className="text-gray-500 text-sm">Status is "Ready for Design" - go do your Canva magic.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Idea</span>
          <p className="text-sm text-[#1a1a2e] mt-1">{idea}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-[#ada2cc] uppercase tracking-wide">Hook</span>
          <p className="text-sm text-[#1a1a2e] mt-1 italic">{selectedHook}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Final Post</span>
          <pre className="text-sm text-[#1a1a2e] mt-1 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
            {postText}
          </pre>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="coral" onClick={onStartNew} className="px-6">
          Start New Post
        </Button>
        {notionUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(notionUrl, '_blank')}
            className="px-6"
          >
            Open in Notion
          </Button>
        )}
      </div>
    </div>
  );
}
