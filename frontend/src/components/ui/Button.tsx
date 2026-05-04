import React from 'react';

type Variant = 'coral' | 'turquoise' | 'ghost' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  coral: 'bg-[#e76e50] hover:bg-[#d45e42] text-white',
  turquoise: 'bg-[#9fd7d5] hover:bg-[#8bc9c7] text-[#1a1a2e]',
  ghost: 'bg-transparent hover:bg-gray-100 text-[#1a1a2e]',
  outline: 'border border-[#ada2cc] hover:bg-[#ada2cc]/10 text-[#1a1a2e]',
};

export function Button({ variant = 'coral', loading, children, disabled, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
