import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      if (data.otp) toast(`Dev OTP: ${data.otp}`, { icon: 'ℹ️', duration: 10000 });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4" style={{ background: '#050510' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #050510 80%)' }} />

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10">
        <div className="rounded-3xl p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.1))' }}>
          <div className="rounded-3xl p-8" style={{ background: 'rgba(10,10,30,0.9)', backdropFilter: 'blur(40px)' }}>

            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 8px 30px rgba(139,92,246,0.4)' }}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-center text-white mb-1">Reset Password</h1>
            <p className="text-center text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}
            </p>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={step >= s ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                    {s}
                  </div>
                  {s < 2 && <div className="w-8 h-0.5 rounded" style={{ background: step > 1 ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleRequestOTP} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none focus:ring-2 focus:ring-violet-500/30" style={inputStyle} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}>
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>OTP Code</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" required maxLength={6}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none focus:ring-2 focus:ring-violet-500/30 tracking-[0.3em] text-center text-lg font-bold" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none focus:ring-2 focus:ring-violet-500/30" style={inputStyle} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-white/30 hover:text-white/50 transition-colors">
                    Back to email
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Remember your password? <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
