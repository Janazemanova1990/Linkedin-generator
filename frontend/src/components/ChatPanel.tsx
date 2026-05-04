import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '../lib/types';
import { Button } from './ui/Button';

interface ChatPanelProps {
  title: string;
  messages: ChatMessage[];
  onSend: (message: string) => Promise<void>;
  suggestions: string[];
  loading?: boolean;
}

export function ChatPanel({ title, messages, onSend, suggestions, loading }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-[#1a1a2e]">{title}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '400px' }}>
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Ask Claude to refine, regenerate, or combine options.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#ada2cc]/20 text-[#1a1a2e] rounded-br-sm'
                  : 'bg-gray-100 text-[#1a1a2e] rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-100 space-y-2">
        <div className="flex flex-wrap gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => !loading && onSend(s)}
              disabled={loading}
              className="text-xs px-2 py-1 bg-[#ada2cc]/15 hover:bg-[#ada2cc]/30 text-[#6b5fa8] rounded-full transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claude..."
            rows={2}
            disabled={loading}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#ada2cc] disabled:opacity-50"
          />
          <Button
            variant="coral"
            onClick={handleSend}
            loading={loading}
            disabled={!input.trim()}
            className="self-end"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
