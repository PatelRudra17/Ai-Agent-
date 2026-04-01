import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
const features = [
  { title: 'AI Chat', desc: 'Multi-language streaming chat powered by Google Gemini.', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { title: 'Task Management', desc: 'Kanban board with auto-chaining and 3-level escalation.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { title: 'HR Module', desc: 'Leave management, attendance tracking, salary slip PDFs.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { title: 'Real-time Comms', desc: 'Socket.io notifications, WebRTC calls, team chat.', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { title: 'Analytics', desc: 'Interactive charts, team stats, AI morning briefings.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { title: 'Document AI', desc: 'Upload PDF/DOCX, ask AI questions, get summaries.', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
];
const demos = [
  { role: 'Admin', email: 'admin@company.com', pass: 'admin123', color: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
  { role: 'Manager', email: 'manager@company.com', pass: 'manager123', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)' },
  { role: 'Employee', email: 'priya@company.com', pass: 'employee123', color: '#06b6d4', glow: 'rgba(6,182,212,0.2)' },
];
const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
export default function Landing() {
  return (
    <div style={{ background: '#050510' }} className="min-h-screen text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: 'rgba(139,92,246,0.12)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(6,182,212,0.08)' }} />
      </div>
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-5">
        <span className="text-lg font-bold" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Corporate AI</span>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Sign In</Link>
          <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>Get Started</Link>
        </div>
      </nav>
      <section className="relative z-10 text-center px-6 pt-16 pb-24 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>Powered by Google Gemini AI</span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6"><span style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Corporate AI</span><br />Agent</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>AI-powered corporate management. Tasks, HR, analytics, real-time chat, document Q&A.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register" className="px-8 py-3.5 rounded-xl text-sm font-bold text-white hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 8px 30px rgba(99,102,241,0.4)' }}>Get Started Free</Link>
            <Link to="/login" className="px-8 py-3.5 rounded-xl text-sm font-semibold hover:scale-105 transition-transform" style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Sign In</Link>
          </div>
        </motion.div>
      </section>
      <section className="relative z-10 px-6 md:px-16 py-20 max-w-6xl mx-auto">
        <motion.h2 {...fadeUp} className="text-3xl font-bold text-center mb-12">Everything You Need</motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-2xl p-6 hover:scale-[1.02] transition-transform" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="relative z-10 px-6 md:px-16 py-20 max-w-4xl mx-auto">
        <motion.h2 {...fadeUp} className="text-3xl font-bold text-center mb-10">Try It Now</motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {demos.map((d, i) => (
            <motion.div key={d.role} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + d.glow }}>
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-sm font-bold text-white" style={{ background: d.color }}>{d.role[0]}</div>
              <h3 className="font-semibold text-white mb-2">{d.role}</h3>
              <p className="text-xs font-mono mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{d.email}</p>
              <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.pass}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <footer className="relative z-10 text-center py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Built with React + Node.js + Google Gemini AI</p>
      </footer>
    </div>
  );
}
