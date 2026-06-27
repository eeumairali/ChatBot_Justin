'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  chatbotId: number;
}

export default function Home() {
  const [chatbotId, setChatbotId] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate stars once, stable across re-renders
  const [stars] = useState<StarData[]>(() =>
    Array.from({ length: 200 }, (_, i) => ({
      id: i,
      left:       Math.random() * 100,
      top:        Math.random() * 100,
      size:       Math.random() * 2.5 + 0.5,
      delay:      Math.random() * 7,
      duration:   Math.random() * 4 + 2,
      brightness: Math.random() * 0.7 + 0.3,
    }))
  );

  const chatbots = [
    { id: 1, name: '🤖 Gemini AI',    description: 'Google Gemini (Cloud)' },
    { id: 2, name: '🧠 Ollama Local', description: 'Local Model'           },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const currentChatMessages = messages.filter(m => m.chatbotId === chatbotId);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const endpoint = chatbotId === 1 ? '/api/chat' : '/api/chat2';
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
      chatbotId,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Failed to get response from server');

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        chatbotId,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure the Python backend is running.`,
        sender: 'bot',
        timestamp: new Date(),
        chatbotId,
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Clear all messages for this chatbot?')) {
      setMessages(prev => prev.filter(m => m.chatbotId !== chatbotId));
    }
  };

  const switchChatbot = (id: number) => {
    setChatbotId(id);
    setShowSettings(false);
  };

  const currentChatbot = chatbots.find(c => c.id === chatbotId);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-2xl border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">💬</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Justin's Multi-ChatBot</h1>
                <p className="text-purple-200 text-sm">{currentChatbot?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-purple-100 transition-all duration-200 border border-purple-500/30 hover:border-purple-500/60"
              >
                <Settings size={18} />
                <span className="hidden sm:inline text-sm font-medium">Chatbot</span>
              </button>
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-200 border border-red-500/30 hover:border-red-500/60"
                title="Clear chat history"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline text-sm font-medium">Clear</span>
              </button>
            </div>
          </div>

          {/* Chatbot Selector */}
          {showSettings && (
            <div className="mt-4 pt-4 border-t border-purple-400/30">
              <p className="text-purple-200 text-sm font-semibold mb-3">Select Chatbot:</p>
              <div className="flex gap-3 flex-wrap">
                {chatbots.map((bot) => (
                  <button
                    key={bot.id}
                    onClick={() => switchChatbot(bot.id)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      chatbotId === bot.id
                        ? 'bg-white/30 border-2 border-white text-white'
                        : 'bg-white/10 border-2 border-white/20 text-purple-200 hover:bg-white/20'
                    }`}
                  >
                    <div className="font-semibold text-sm">{bot.name}</div>
                    <div className="text-xs opacity-75">{bot.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full space-y-4">

            {currentChatMessages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative w-28 h-28 mb-8">
                  <div
                    className="absolute inset-0 rounded-full border border-violet-400/30"
                    style={{ animation: 'orbit-ring 6s linear infinite' }}
                  />
                  <div
                    className="absolute inset-2 rounded-full border border-indigo-300/20"
                    style={{ animation: 'orbit-ring-reverse 10s linear infinite' }}
                  />
                  <div
                    className="absolute inset-4 rounded-full border border-violet-500/15"
                    style={{ animation: 'orbit-ring 14s linear infinite' }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center text-5xl rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)',
                      boxShadow:  '0 0 50px rgba(139,92,246,0.25)',
                    }}
                  >
                    {chatbotId === 1 ? '🤖' : '🧠'}
                  </div>
                </div>

                <h2
                  className="text-3xl font-bold mb-3"
                  style={{
                    background:           'linear-gradient(90deg, #c4b5fd, #818cf8, #a78bfa)',
                    backgroundSize:       '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor:  'transparent',
                    backgroundClip:       'text',
                    animation:            'gradient-title 5s ease infinite',
                  }}
                >
                  Start Chatting
                </h2>
                <p style={{ color: 'rgba(196,181,253,0.45)', fontSize: '0.9rem', maxWidth: '340px', lineHeight: 1.6 }}>
                  Send a message to begin your conversation with {currentChatbot?.description}
                </p>

                <div className="mt-8 flex items-center gap-2.5" style={{ color: 'rgba(167,139,250,0.4)', fontSize: '0.78rem' }}>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'rgba(167,139,250,0.7)', animation: 'orb-pulse 2s ease-in-out infinite' }}
                  />
                  <span>Type a message below</span>
                </div>
              </div>
            ) : (
              currentChatMessages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animation: 'fadeSlideIn 0.35s ease-out' }}
                >
                  {/* Bot avatar */}
                  {message.sender === 'bot' && (
                    <div className="shrink-0 self-end">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                        style={{
                          background: 'radial-gradient(circle at 40% 35%, rgba(167,139,250,0.5), rgba(79,70,229,0.3))',
                          border:     '1px solid rgba(167,139,250,0.3)',
                          boxShadow:  '0 0 14px rgba(139,92,246,0.4)',
                        }}
                      >
                        {chatbotId === 1 ? '🤖' : '🧠'}
                      </div>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3"
                    style={
                      message.sender === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3 mb-4 animate-fadeIn">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                <span className="text-sm">{chatbotId === 1 ? '🤖' : '🧠'}</span>
              </div>
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-600/50">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="flex-shrink-0 border-t border-purple-600/20 bg-gradient-to-b from-slate-800 to-slate-900 backdrop-blur-sm p-4">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything... (Shift+Enter for new line)"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e as any);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  <Send size={20} />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Messages are saved by chatbot | Chatting with: <span className="text-purple-400 font-semibold">{currentChatbot?.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
