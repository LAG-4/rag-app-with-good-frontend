'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Chat } from '@/components/Chat';
import { Book } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.summary }]);
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to upload file. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      setMessages(prev => [...prev, { role: 'user', content: message }]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      // Remove the user's message if the request failed
      setMessages(prev => prev.slice(0, -1));
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to send message. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Book className="h-8 w-8 bg-gradient-to-r from-[#02ece9] to-[#70ec00] rounded-lg p-1.5 text-[#1a1a1a]" />
            <h1 className="text-2xl font-bold text-white">Document Analysis Assistant</h1>
          </div>
          <p className="text-gray-300">
            Upload your documents or enter text to get instant summaries and answers to your questions.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <div className="bg-[#242424] rounded-lg shadow-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 text-white">Upload Document</h2>
              <FileUpload onUpload={handleFileUpload} isLoading={isLoading} error={error} />
            </div>
          </div>

          <div className="bg-[#242424] rounded-lg shadow-lg p-6 h-[600px] relative border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-white">Chat</h2>
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
