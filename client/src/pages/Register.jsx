import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';


const roles = [
  { value: 'admin', label: 'Admin', desc: 'Full system control', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', gradient: 'linear-gradient(135deg, #ef4444, #f97316)', glow: 'rgba(239,68,68,0.25)' },
  { value: 'manager', label: 'Manager', desc: 'Team management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', glow: 'rgba(139,92,246,0.25)' },
  { value: 'employee', label: 'Employee', desc: 'Personal workspace', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', gradient: 'linear-gradient(135deg, #06b6d4, #10b981)', glow: 'rgba(6,182,212,0.25)' },
];

export default function Register() {
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const active = roles.find((r) => r.value === role);
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) return toast.error('Select your role first');
    try {
      await register({ ...form, role });
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4" style={{ background: '#050510' }}>
      {/* Animated gradient background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(236,72,153,0.08) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #050510 80%)' }} />

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10">
        <div className="rounded-3xl p-[1px]" style={{ background: `linear-gradient(135deg, ${active?.glow || 'rgba(6,182,212,0.3)'}, rgba(139,92,246,0.1))` }}>
          <div className="rounded-3xl p-8" style={{ background: 'rgba(10,10,30,0.9)', backdropFilter: 'blur(40px)' }}>

            {/* Logo */}
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: active?.gradient || 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: `0 8px 30px ${active?.glow || 'rgba(6,182,212,0.4)'}`, transition: 'all 0.4s' }}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={active?.icon || 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'} />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-center text-white mb-1">Create Account</h1>
            <p className="text-center text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {role ? `Registering as ${active.label}` : 'Select your role'}
            </p>

            {/* 3 Role Cards */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {roles.map((r) => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className="rounded-xl p-3 text-center transition-all relative"
                  style={{
                    background: role === r.value ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: role === r.value ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: role === r.value ? `0 4px 20px ${r.glow}` : 'none',
                  }}>
                  {role === r.value && <div className="absolute top-0 left-2 right-2 h-[2px] rounded-full" style={{ background: r.gradient }} />}
                  <div className="w-9 h-9 rounded-lg mx-auto mb-1.5 flex items-center justify-center"
                    style={{ background: role === r.value ? r.gradient : 'rgba(255,255,255,0.05)', transition: 'all 0.3s' }}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={r.icon} />
                    </svg>
                  </div>
                  <p className="text-[11px] font-semibold text-white/90">{r.label}</p>
                  <p className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.desc}</p>
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Full Name</label>
                <input name="name" type="text" value={form.name} onChange={update} placeholder="Enter your name" required autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none focus:ring-2 focus:ring-violet-500/30" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Email</label>
                <input name="email" type="email" value={form.email} onChange={update} placeholder="Enter your email" required autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none focus:ring-2 focus:ring-violet-500/30" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Department</label>
                <input name="department" type="text" value={form.department} onChange={update} placeholder="e.g. Engineering" autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none focus:ring-2 focus:ring-violet-500/30" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Password</label>
                <input name="password" type="password" value={form.password} onChange={update} placeholder="Min 6 characters" required autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none focus:ring-2 focus:ring-violet-500/30" style={inputStyle} />
              </div>
              <button type="submit" disabled={isLoading || !role}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 mt-1"
                style={{ background: active?.gradient || 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: `0 8px 25px ${active?.glow || 'rgba(6,182,212,0.3)'}` }}>
                {isLoading ? 'Creating...' : role ? `Create ${active.label} Account` : 'Select a role first'}
              </button>
            </form>

            <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Already have an account? <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
