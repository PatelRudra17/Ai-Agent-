import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const typeIcons = { employee: '👤', task: '📋', meeting: '📅', document: '📄' };
const cardStyle = { background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' };

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true); } if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`); setResults(data.results); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result) => { navigate(result.link); setOpen(false); setQuery(''); };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
        style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        Search... <kbd className="text-[10px] px-1.5 py-0.5 rounded ml-2" style={{ background: 'rgba(255,255,255,0.06)' }}>Ctrl+K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)}>
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden" style={cardStyle} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <svg className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks, employees, meetings..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30" />
                <kbd onClick={() => setOpen(false)} className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer" style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}>ESC</kbd>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading && <p className="px-4 py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Searching...</p>}
                {!loading && query.length >= 2 && results.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No results for "{query}"</p>
                )}
                {results.map((r) => (
                  <div key={r.id} onClick={() => handleSelect(r)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span className="text-lg">{typeIcons[r.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{r.title}</p>
                      <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg capitalize" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}>{r.type}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
