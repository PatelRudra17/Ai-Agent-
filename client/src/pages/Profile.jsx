import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';

export default function Profile() {
  const { user, fetchUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', department: '', preferredLanguage: 'en' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setProfile(data.user);
      setForm({ name: data.user.name, phone: data.user.phone || '', department: data.user.department || '', preferredLanguage: data.user.preferredLanguage || 'en' });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await api.patch(`/users/${profile._id}`, form);
      toast.success('Profile updated');
      setEditing(false);
      fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords don\'t match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPw(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  if (!profile) return <Layout><p className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p></Layout>;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

        <div className="max-w-2xl space-y-6">
          {/* Avatar + Info */}
          <div className="rounded-2xl p-6 flex items-center gap-6" style={cardStyle}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
              {profile.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>{profile.email}</p>
              <span className="inline-block mt-1 rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: '#8b5cf6', background: '#8b5cf615' }}>
                {profile.role}
              </span>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Details</h3>
              <button onClick={() => setEditing(!editing)} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Department</label>
                  <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Language</label>
                  <select value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none" style={inputStyle}>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="gu">Gujarati</option>
                  </select>
                </div>
                <button onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
                  Save
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  ['Email', profile.email],
                  ['Phone', profile.phone || 'Not set'],
                  ['Department', profile.department || 'Not set'],
                  ['Language', profile.preferredLanguage === 'hi' ? 'Hindi' : profile.preferredLanguage === 'gu' ? 'Gujarati' : 'English'],
                  ['Joined', new Date(profile.createdAt).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                    <span className="text-sm text-white/80 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Password</h3>
              <button onClick={() => setShowPw(!showPw)} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                {showPw ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            {showPw && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <input type="password" placeholder="Current password" value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} required />
                <input type="password" placeholder="New password (min 6 chars)" value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} required minLength={6} />
                <input type="password" placeholder="Confirm new password" value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} required />
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
                  Change Password
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
