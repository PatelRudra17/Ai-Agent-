import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function TwoFactorSetup({ enabled, onUpdate }) {
  const [step, setStep] = useState('idle'); // idle | qr | verify
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('qr');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return toast.error('Enter 6-digit code');
    setLoading(true);
    try {
      await api.post('/auth/2fa/verify', { code });
      toast.success('2FA enabled!');
      setStep('idle');
      setCode('');
      onUpdate?.(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (disableCode.length !== 6) return toast.error('Enter 6-digit code');
    setLoading(true);
    try {
      await api.post('/auth/2fa/disable', { code: disableCode });
      toast.success('2FA disabled');
      setDisableCode('');
      onUpdate?.(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div className="rounded-2xl p-6" style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">Two-Factor Authentication</h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {enabled ? 'Enabled — your account is secured with TOTP' : 'Add an extra layer of security'}
          </p>
        </div>
        <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold"
          style={{ color: enabled ? '#22c55e' : '#f59e0b', background: enabled ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {!enabled && step === 'idle' && (
        <button onClick={handleSetup} disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
          {loading ? 'Setting up...' : 'Enable 2FA'}
        </button>
      )}

      {!enabled && step === 'qr' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Scan this QR code with Google Authenticator or Authy:
          </p>
          <div className="flex justify-center">
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-xl" />
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Manual Key</p>
            <p className="text-xs font-mono text-white/70 break-all select-all">{secret}</p>
          </div>
          <form onSubmit={handleVerify} className="flex gap-3">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white text-center tracking-[0.3em] font-mono placeholder-white/20 outline-none"
              style={inputStyle}
              autoFocus
            />
            <button type="submit" disabled={loading || code.length !== 6}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}>
              Verify
            </button>
          </form>
        </motion.div>
      )}

      {enabled && (
        <form onSubmit={handleDisable} className="flex gap-3 mt-2">
          <input
            type="text"
            maxLength={6}
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter code to disable"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white text-center tracking-[0.3em] font-mono placeholder-white/20 outline-none"
            style={inputStyle}
          />
          <button type="submit" disabled={loading || disableCode.length !== 6}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}>
            Disable 2FA
          </button>
        </form>
      )}
    </div>
  );
}
