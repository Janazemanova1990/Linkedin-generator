import React from 'react';

interface ProgressBarProps {
  step: 1 | 2 | 3 | 4;
  onNavigate: (step: 1 | 2 | 3 | 4) => void;
  canNavigate: (step: 1 | 2 | 3 | 4) => boolean;
}

const STEPS = [
  { n: 1 as const, label: 'Idea' },
  { n: 2 as const, label: 'Hooks' },
  { n: 3 as const, label: 'Post' },
  { n: 4 as const, label: 'Done' },
];

export function ProgressBar({ step, onNavigate, canNavigate }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map(({ n, label }, i) => {
        const isActive = step === n;
        const isCompleted = step > n;
        const isClickable = canNavigate(n) && n < step;

        return (
          <React.Fragment key={n}>
            <button
              onClick={() => isClickable && onNavigate(n)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1 px-3 transition-all ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#ada2cc] text-white shadow-md scale-110'
                    : isCompleted
                    ? 'bg-[#9fd7d5] text-[#1a1a2e]'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : n}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-[#ada2cc]' : isCompleted ? 'text-[#1a1a2e]' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-12 mt-[-14px] ${isCompleted ? 'bg-[#9fd7d5]' : 'bg-gray-200'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
