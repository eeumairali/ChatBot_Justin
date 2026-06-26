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

interface StarData {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  brightness: number;
}

const SHOOTING_STARS = [
  { top: '12%', left: '5%',  delay: '0s',  duration: '5s'   },
  { top: '45%', left: '8%',  delay: '9s',  duration: '4s'   },
  { top: '72%', left: '15%', delay: '16s', duration: '6s'   },
  { top: '28%', left: '60%', delay: '4s',  duration: '4.5s' },
];

interface NebulaDef {
  w: number; h: number;
  left?: string; right?: string; top?: string; bottom?: string;
  color: string; blur: number; delay: string; dur: string;
}

const NEBULAS: NebulaDef[] = [
  { w: 650, h: 650, left: '-120px', top: '-120px',    color: 'rgba(124,58,237,0.16)',  blur: 70, delay: '0s',  dur: '20s' },
  { w: 550, h: 550, right: '-90px', top: '25%',       color: 'rgba(6,182,212,0.10)',   blur: 90, delay: '5s',  dur: '24s' },
  { w: 750, h: 750, left: '28%',    bottom: '-180px', color: 'rgba(79,70,229,0.12)',   blur: 80, delay: '10s', dur: '28s' },
  { w: 420, h: 420, left: '55%',    top: '15%',       color: 'rgba(167,139,250,0.08)', blur: 55, delay: '2s',  dur: '22s' },
];

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
    <div
      className="relative flex flex-col h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 40% 40%, #0d0028 0%, #00001a 45%, #000009 100%)' }}
    >

      {/* ─── Universe Background (fixed, pointer-events-none) ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">

        {/* Stars */}
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left:      `${star.left}%`,
              top:       `${star.top}%`,
              width:     `${star.size}px`,
              height:    `${star.size}px`,
              opacity:   star.brightness,
              animation: `twinkle ${star.duration}s ease-in-out infinite ${star.delay}s`,
            }}
          />
        ))}

        {/* Nebula blobs */}
        {NEBULAS.map((n, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width:      `${n.w}px`,
              height:     `${n.h}px`,
              left:       n.left   ?? undefined,
              right:      n.right  ?? undefined,
              top:        n.top    ?? undefined,
              bottom:     n.bottom ?? undefined,
              background: `radial-gradient(circle, ${n.color} 0%, transparent 70%)`,
              filter:     `blur(${n.blur}px)`,
              animation:  `float-nebula ${n.dur} ease-in-out infinite ${n.delay}`,
            }}
          />
        ))}

        {/* Shooting stars */}
        {SHOOTING_STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position:     'absolute',
              top:          s.top,
              left:         s.left,
              width:        '140px',
              height:       '1.5px',
              background:   'linear-gradient(to right, transparent, rgba(255,255,255,0.85) 40%, rgba(200,180,255,0.6), transparent)',
              borderRadius: '2px',
              animation:    `shoot ${s.duration} linear infinite ${s.delay}`,
            }}
          />
        ))}
      </div>

      {/* ─── Content Layer ─── */}
      <div className="relative z-10 flex flex-col h-screen">

        {/* Header */}
        <div
          className="shrink-0 border-b"
          style={{
            background:           'rgba(8,0,22,0.75)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor:          'rgba(139,92,246,0.18)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">

              {/* Logo + title */}
              <div className="flex items-center gap-4">
                {/* Avatar with orbit rings */}
                <div className="relative w-14 h-14 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full border border-violet-400/50"
                    style={{ animation: 'orbit-ring 7s linear infinite' }}
                  />
                  <div
                    className="absolute inset-1 rounded-full border border-indigo-300/25"
                    style={{ animation: 'orbit-ring-reverse 11s linear infinite' }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center text-2xl rounded-full"
                    style={{
                      background: 'radial-gradient(circle at 40% 35%, rgba(167,139,250,0.4), rgba(79,70,229,0.25))',
                      animation:  'avatar-breathe 3s ease-in-out infinite',
                    }}
                  >
                    💬
                  </div>
                </div>

                <div>
                  <h1
                    className="text-2xl sm:text-3xl font-bold"
                    style={{
                      background:           'linear-gradient(90deg, #c4b5fd, #818cf8, #a78bfa, #c4b5fd)',
                      backgroundSize:       '250% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor:  'transparent',
                      backgroundClip:       'text',
                      animation:            'gradient-title 5s ease infinite',
                    }}
                  >
                    Justin's Multi-ChatBot
                  </h1>
                  <p style={{ color: 'rgba(196,181,253,0.5)', fontSize: '0.8rem', marginTop: '2px' }}>
                    {currentChatbot?.description}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-violet-200 text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'rgba(139,92,246,0.12)',
                    border:     '1px solid rgba(139,92,246,0.28)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 18px rgba(139,92,246,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">Chatbot</span>
                </button>
                <button
                  onClick={clearChat}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-300 text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'rgba(239,68,68,0.09)',
                    border:     '1px solid rgba(239,68,68,0.22)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 18px rgba(239,68,68,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Chatbot Selector */}
            {showSettings && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(139,92,246,0.18)' }}>
                <p style={{ color: 'rgba(196,181,253,0.45)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Select Chatbot
                </p>
                <div className="flex gap-3 flex-wrap">
                  {chatbots.map(bot => (
                    <button
                      key={bot.id}
                      onClick={() => switchChatbot(bot.id)}
                      className="px-4 py-2.5 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: chatbotId === bot.id ? 'rgba(139,92,246,0.28)' : 'rgba(255,255,255,0.04)',
                        border:     chatbotId === bot.id ? '1px solid rgba(167,139,250,0.65)' : '1px solid rgba(255,255,255,0.09)',
                        boxShadow:  chatbotId === bot.id ? '0 0 22px rgba(139,92,246,0.38), inset 0 0 18px rgba(139,92,246,0.05)' : 'none',
                      }}
                    >
                      <div className="font-semibold text-sm text-white">{bot.name}</div>
                      <div style={{ color: 'rgba(196,181,253,0.5)', fontSize: '0.72rem', marginTop: '2px' }}>{bot.description}</div>
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
                        ? {
                            background:           'linear-gradient(135deg, rgba(124,58,237,0.72), rgba(79,70,229,0.68))',
                            backdropFilter:       'blur(14px)',
                            WebkitBackdropFilter: 'blur(14px)',
                            border:               '1px solid rgba(167,139,250,0.28)',
                            boxShadow:            '0 4px 24px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
                            borderRadius:         '20px 20px 5px 20px',
                          }
                        : {
                            background:           'rgba(255,255,255,0.055)',
                            backdropFilter:       'blur(18px)',
                            WebkitBackdropFilter: 'blur(18px)',
                            border:               '1px solid rgba(255,255,255,0.1)',
                            boxShadow:            '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                            borderRadius:         '20px 20px 20px 5px',
                          }
                    }
                  >
                    {message.sender === 'bot' ? (
                      <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none" style={{ color: '#e5e7eb' }}>
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-white" style={{ wordBreak: 'break-word' }}>{message.text}</p>
                    )}
                    <p
                      className="text-xs mt-2 font-medium"
                      style={{ color: message.sender === 'user' ? 'rgba(221,214,254,0.5)' : 'rgba(156,163,175,0.5)' }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* User avatar */}
                  {message.sender === 'user' && (
                    <div className="shrink-0 self-end">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                        style={{
                          background: 'radial-gradient(circle at 40% 35%, rgba(52,211,153,0.45), rgba(59,130,246,0.3))',
                          border:     '1px solid rgba(52,211,153,0.3)',
                          boxShadow:  '0 0 14px rgba(16,185,129,0.3)',
                        }}
                      >
                        👤
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3 justify-start" style={{ animation: 'fadeSlideIn 0.35s ease-out' }}>
                <div
                  className="shrink-0 self-end w-9 h-9 rounded-full flex items-center justify-center text-base"
                  style={{
                    background: 'radial-gradient(circle at 40% 35%, rgba(167,139,250,0.5), rgba(79,70,229,0.3))',
                    border:     '1px solid rgba(167,139,250,0.3)',
                    boxShadow:  '0 0 14px rgba(139,92,246,0.4)',
                  }}
                >
                  {chatbotId === 1 ? '🤖' : '🧠'}
                </div>
                <div
                  className="px-5 py-4 flex items-center gap-2"
                  style={{
                    background:           'rgba(255,255,255,0.055)',
                    backdropFilter:       'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border:               '1px solid rgba(255,255,255,0.1)',
                    borderRadius:         '20px 20px 20px 5px',
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: 'rgba(167,139,250,0.85)',
                        boxShadow:  '0 0 8px rgba(167,139,250,0.7)',
                        animation:  `orb-pulse 1.5s ease-in-out infinite ${i * 0.22}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div
          className="shrink-0 p-4 border-t"
          style={{
            background:           'rgba(4,0,16,0.82)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor:          'rgba(139,92,246,0.14)',
          }}
        >
          <div className="max-w-6xl mx-auto">
            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-5 py-3 rounded-full text-sm outline-none transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border:     '1px solid rgba(139,92,246,0.24)',
                  color:      '#f5f3ff',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)';
                  e.currentTarget.style.boxShadow   = '0 0 22px rgba(139,92,246,0.28), inset 0 0 18px rgba(139,92,246,0.06)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.24)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
                disabled={loading}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e as any);
                  }
                }}
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 px-6 py-3 rounded-full font-semibold flex items-center gap-2 text-white text-sm transition-all duration-200 hover:scale-105 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  boxShadow:  '0 0 22px rgba(124,58,237,0.45)',
                }}
                onMouseEnter={e => {
                  if (!loading && input.trim()) {
                    e.currentTarget.style.boxShadow = '0 0 38px rgba(124,58,237,0.75), 0 0 65px rgba(79,70,229,0.3)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 0 22px rgba(124,58,237,0.45)';
                }}
              >
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-xs mt-2 text-center" style={{ color: 'rgba(139,92,246,0.35)' }}>
              Chatting with{' '}
              <span style={{ color: 'rgba(167,139,250,0.65)', fontWeight: 600 }}>{currentChatbot?.name}</span>
              {' '}· Messages saved locally
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
