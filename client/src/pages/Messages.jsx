import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';
import ModeToggle from '../components/ui/ModeToggle';
import Skeleton from '../components/ui/Skeleton';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    recipientIds: [],
    channel: 'email',
    subject: '',
    body: '',
    scheduledAt: '',
  });
  const [msgMode, setMsgMode] = useState('automation');
  const [roughNotes, setRoughNotes] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages');
      setMessages(data.messages);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/users?limit=100');
      setEmployees(data.users);
    } catch {}
  };

  useEffect(() => { fetchMessages(); fetchEmployees(); }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/messages/schedule', form);
      toast.success('Message scheduled!');
      setShowForm(false);
      setForm({ recipientIds: [], channel: 'email', subject: '', body: '', scheduledAt: '' });
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.delete(`/messages/${id}`);
      toast.success('Message cancelled');
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleAIDraft = async () => {
    if (!roughNotes.trim()) { toast.error('Enter rough notes first'); return; }
    setDraftLoading(true);
    try {
      const { data } = await api.post('/ai/draft-email', { notes: roughNotes });
      const draft = data.draft || '';
      // Parse subject and body from AI output
      const subjectMatch = draft.match(/Subject:\s*(.+)/i);
      const bodyStart = draft.indexOf('---');
      if (subjectMatch) setForm((f) => ({ ...f, subject: subjectMatch[1].trim() }));
      setForm((f) => ({ ...f, body: bodyStart > -1 ? draft.substring(bodyStart + 3).trim() : draft }));
      toast.success('AI draft generated');
    } catch { toast.error('AI draft failed'); }
    setDraftLoading(false);
  };

  const toggleRecipient = (id) => {
    setForm((prev) => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(id)
        ? prev.recipientIds.filter((r) => r !== id)
        : [...prev.recipientIds, id],
    }));
  };

  const statusBadgeColors = {
    pending: '#eab308',
    sent: '#22c55e',
    failed: '#ef4444',
    cancelled: '#6b7280',
  };

  const channelLabels = {
    email: 'Email',
    whatsapp: 'WhatsApp',
    'in-app': 'In-App',
    slack: 'Slack',
  };

  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Schedule messages via Email, WhatsApp, In-App, or Slack</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
          >
            {showForm ? 'Cancel' : '+ Schedule Message'}
          </button>
        </div>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSchedule}
            className="rounded-2xl p-6 mb-6 space-y-4"
            style={cardStyle}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Channel</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={inputStyle}
                >
                  <option value="email">Email (Gmail - Free)</option>
                  <option value="in-app">In-App Notification (Free)</option>
                  <option value="whatsapp">WhatsApp (whatsapp-web.js)</option>
                  <option value="slack">Slack</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Scheduled At</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Recipients ({form.recipientIds.length} selected)
              </label>
              <div className="rounded-xl max-h-40 overflow-y-auto p-2 space-y-1" style={inputStyle}>
                {employees.map((emp) => (
                  <label key={emp._id} className="flex items-center gap-2 px-2 py-1 hover:bg-white/[0.03] rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.recipientIds.includes(emp._id)}
                      onChange={() => toggleRecipient(emp._id)}
                      className="rounded"
                    />
                    <span className="text-sm text-white/70">{emp.name}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{emp.email}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.channel === 'email' && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={inputStyle}
                  placeholder="Email subject"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Message Body</label>
                <ModeToggle size="small" mode={msgMode} onChange={setMsgMode} />
              </div>

              {msgMode === 'ai' && (
                <div className="mb-3 space-y-2">
                  <textarea
                    value={roughNotes}
                    onChange={(e) => setRoughNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ ...inputStyle, borderColor: 'rgba(139,92,246,0.2)' }}
                    rows={2}
                    placeholder="Type rough notes... e.g., 'tell team meeting moved to thursday, budget review added'"
                  />
                  <button type="button" onClick={handleAIDraft} disabled={draftLoading}
                    className="text-xs px-4 py-2 rounded-xl font-semibold transition-all"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                    {draftLoading ? 'AI Drafting...' : 'AI Draft Message'}
                  </button>
                </div>
              )}

              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={inputStyle}
                rows={4}
                placeholder={msgMode === 'ai' ? 'AI-generated message will appear here. You can edit it.' : 'Type your message...'}
                required
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
            >
              Schedule Message
            </button>
          </motion.form>
        )}

        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Channel</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Recipients</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Message</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Scheduled</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4"><Skeleton className="h-10 w-full mb-2" count={3} /></td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No messages scheduled yet. Click "+ Schedule Message" to get started.</td></tr>
              ) : (
                messages.map((msg) => {
                  const channelColor = '#6366f1';
                  const statusColor = statusBadgeColors[msg.status] || '#6b7280';
                  return (
                    <tr key={msg._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-6 py-4">
                        <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ color: channelColor, background: channelColor + '15' }}>
                          {channelLabels[msg.channel] || msg.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {msg.recipients?.map((r) => r.name).join(', ') || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {msg.subject ? `${msg.subject}: ` : ''}{msg.body}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(msg.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: statusColor, background: statusColor + '15' }}>
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {msg.status === 'pending' && (
                          <button onClick={() => handleCancel(msg._id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </Layout>
  );
}
