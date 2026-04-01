import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ recipientId: '', message: '', scheduledAt: '' });

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/calls');
      setCalls(data.calls);
    } catch {
      toast.error('Failed to load calls');
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

  useEffect(() => { fetchCalls(); fetchEmployees(); }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/calls/schedule', form);
      toast.success('Call notification scheduled!');
      setShowForm(false);
      setForm({ recipientId: '', message: '', scheduledAt: '' });
      fetchCalls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.patch(`/calls/${id}/cancel`);
      toast.success('Call cancelled');
      fetchCalls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const statusBadgeColors = {
    pending: '#eab308',
    notifying: '#6366f1',
    notified: '#22c55e',
    failed: '#ef4444',
    cancelled: '#6b7280',
  };

  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Call Reminders</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Schedule notifications instead of actual calls (free)</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
          >
            {showForm ? 'Cancel' : '+ Schedule Call'}
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
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Recipient</label>
                <select
                  value={form.recipientId}
                  onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={inputStyle}
                  required
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                  ))}
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
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={inputStyle}
                rows={3}
                placeholder="What should the notification say?"
                required
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
            >
              Schedule Notification
            </button>
          </motion.form>
        )}

        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Recipient</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Message</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Scheduled</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</td></tr>
              ) : calls.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No calls scheduled</td></tr>
              ) : (
                calls.map((call) => {
                  const badgeColor = statusBadgeColors[call.status] || '#6b7280';
                  return (
                    <tr key={call._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-6 py-4 text-sm font-medium text-white/80">
                        {call.recipient?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{call.message}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(call.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: badgeColor, background: badgeColor + '15' }}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {call.status === 'pending' && (
                          <button onClick={() => handleCancel(call._id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
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
