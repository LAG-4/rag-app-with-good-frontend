import { useState } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  onSendMessage: (message: string) => Promise<void>;
  messages: Message[];
  isLoading?: boolean;
}

export function Chat({ onSendMessage, messages, isLoading }: ChatProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setError(null);

    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Chat error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to send message. Please try again.');
      }
      setInput(message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-[72px]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-[#1a1a1a]'
                  : 'bg-[#2a2a2a] text-white'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className}>{children}</code>
                        );
                      },
                      a: ({ children, href }) => (
                        <a href={href} className="text-cyan-400 hover:text-cyan-300 underline">
                          {children}
                        </a>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-4">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-4">{children}</ol>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-500 pl-4 italic my-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <div className="animate-pulse text-white">Thinking...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 text-red-500 rounded-lg p-3 text-sm">
              {error}
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="absolute bottom-4 right-4 left-4">
        <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg border border-gray-700 p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="Ask a question..."
            className="flex-1 px-2 py-1.5 focus:outline-none bg-transparent text-white placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 h-8 w-8 inline-flex items-center justify-center bg-gradient-to-r from-[#02ece9] to-[#70ec00] text-[#1a1a1a] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
} 