import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';

function VoiceButton({ onResult }) {
  const [listening, setListening] = useState(false);
  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { toast.error('Voice not supported in this browser'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = localStorage.getItem('language') === 'hi' ? 'hi-IN' : localStorage.getItem('language') === 'gu' ? 'gu-IN' : 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => { const text = e.results[0][0].transcript; onResult(text); };
    recognition.onerror = () => setListening(false);
    recognition.start();
  };
  return (
    <button type="button" onClick={handleVoice} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0"
      style={listening ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.4)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <svg className="w-5 h-5" style={{ color: listening ? '#fff' : 'rgba(255,255,255,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}

let socket;
const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

export default function AIChat() {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEnd = useRef(null);

  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.on('connect', () => { if (user?.id || user?._id) socket.emit('join', user.id || user._id); });
    socket.on('ai_stream', ({ chunk }) => setStreaming((p) => p + chunk));
    socket.on('ai_stream_end', () => setStreaming(''));
    return () => socket?.disconnect();
  }, [user]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);

  const fetchConversations = async () => { try { const { data } = await api.get('/ai/conversations'); setConversations(data.conversations); } catch {} };
  useEffect(() => { fetchConversations(); }, []);

  const loadConversation = async (id) => { try { const { data } = await api.get(`/ai/conversations/${id}`); setActiveConv(data.conversation); setMessages(data.conversation.messages); } catch {} };
  const handleNewChat = () => { setActiveConv(null); setMessages([]); };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((p) => [...p, userMsg]); setInput(''); setLoading(true); setStreaming('');
    try {
      const { data } = await api.post('/ai/chat', { conversationId: activeConv?._id, message: userMsg.content });
      setMessages((p) => [...p, { role: 'assistant', content: data.response }]);
      if (!activeConv) { setActiveConv({ _id: data.conversationId }); fetchConversations(); }
    } catch (err) { toast.error('AI error'); } finally { setLoading(false); setStreaming(''); }
  };

  const handleDeleteConv = async (id) => { try { await api.delete(`/ai/conversations/${id}`); setConversations((p) => p.filter((c) => c._id !== id)); if (activeConv?._id === id) handleNewChat(); } catch {} };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-7rem)] -mx-4 lg:-mx-8 -mb-4 lg:-mb-8 rounded-t-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              className="flex flex-col overflow-hidden shrink-0" style={{ background: 'rgba(10,10,25,0.9)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={handleNewChat} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>+ New Chat</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.map((c) => (
                  <div key={c._id} onClick={() => loadConversation(c._id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-[13px] transition-all ${activeConv?._id === c._id ? 'text-white/90' : 'text-white/40 hover:text-white/60'}`}
                    style={activeConv?._id === c._id ? { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' } : {}}>
                    <span className="truncate flex-1">{c.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteConv(c._id); }} className="text-white/20 hover:text-red-400 ml-2">&times;</button>
                  </div>
                ))}
              </div>
              <div className="p-3 flex gap-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {['en', 'hi', 'gu'].map((lang) => (
                  <button key={lang} onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('language', lang); }}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition-all"
                    style={i18n.language === lang ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 2px 10px rgba(99,102,241,0.3)' } : { color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)' }}>
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat */}
        <div className="flex-1 flex flex-col" style={{ background: 'rgba(8,8,20,0.5)' }}>
          <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(!showSidebar)} className="text-white/30 hover:text-white/60"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
              <div>
                <h2 className="font-semibold text-white text-sm">AI Assistant</h2>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Powered by Google Gemini</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center py-20">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 10px 40px rgba(139,92,246,0.4)' }}>
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </motion.div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Ask me anything in English, Hindi, or Gujarati</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' } : cardStyle}>
                  <span style={msg.role === 'assistant' ? { color: 'rgba(255,255,255,0.8)' } : {}}>{msg.content}</span>
                </div>
              </motion.div>
            ))}
            {(loading || streaming) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap" style={{ ...cardStyle, color: 'rgba(255,255,255,0.8)' }}>
                  {streaming || <span className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#8b5cf6', animationDelay: `${i * 0.15}s` }} />)}</span>}
                </div>
              </motion.div>
            )}
            <div ref={messagesEnd} />
          </div>

          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <form onSubmit={handleSend} className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or use voice..." disabled={loading}
                className="flex-1 px-5 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-2 focus:ring-violet-500/30"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
              {/* Voice input */}
              <VoiceButton onResult={(text) => setInput((p) => p + text)} />
              <button type="submit" disabled={loading || !input.trim()} className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>Send</button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
