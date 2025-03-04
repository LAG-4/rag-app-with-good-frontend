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
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (uploadedFile: File) => {
    setIsLoading(true);
    setFile(uploadedFile);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setSummary(data.summary);
      setMessages([{
        role: 'assistant',
        content: `I've analyzed your document. Here's a summary:\n\n${data.summary}\n\nFeel free to ask any questions about the content!`
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([{
        role: 'assistant',
        content: 'Sorry, there was an error processing your file. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
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
              <FileUpload onFileUpload={handleFileUpload} />
            </div>

            {summary && (
              <div className="bg-[#242424] rounded-lg shadow-lg p-6 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4 text-white">Document Summary</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{summary}</p>
              </div>
            )}
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
