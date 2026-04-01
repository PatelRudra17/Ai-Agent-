import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';
import ModeToggle from '../components/ui/ModeToggle';

export default function Meetings() {
  const { user } = useAuthStore();
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', attendeeIds: [], scheduledAt: '', duration: 30, agenda: '',
  });

  const [meetingMode, setMeetingMode] = useState('automation');
  const [preBriefs, setPreBriefs] = useState({});
  const [smartSummaries, setSmartSummaries] = useState({});
  const [briefLoading, setBriefLoading] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/meetings');
      setMeetings(data.meetings);
    } catch {
      toast.error('Failed to load meetings');
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

  useEffect(() => { fetchMeetings(); fetchEmployees(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/meetings/create', form);
      toast.success('Meeting created');
      setShowForm(false);
      setForm({ title: '', attendeeIds: [], scheduledAt: '', duration: 30, agenda: '' });
      fetchMeetings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create meeting');
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Meeting cancelled');
      fetchMeetings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const toggleAttendee = (id) => {
    setForm((prev) => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(id)
        ? prev.attendeeIds.filter((a) => a !== id)
        : [...prev.attendeeIds, id],
    }));
  };

  const statusBadgeColors = {
    scheduled: '#6366f1',
    completed: '#22c55e',
    cancelled: '#6b7280',
  };

  const handlePreBrief = async (id) => {
    setBriefLoading((p) => ({ ...p, [id]: true }));
    try {
      const { data } = await api.get(`/meetings/${id}/pre-brief`);
      setPreBriefs((p) => ({ ...p, [id]: data.brief }));
    } catch { toast.error('Pre-brief failed'); }
    setBriefLoading((p) => ({ ...p, [id]: false }));
  };

  const handleSmartSummary = async (id) => {
    setSummaryLoading((p) => ({ ...p, [id]: true }));
    try {
      const { data } = await api.post(`/meetings/${id}/smart-summary`);
      setSmartSummaries((p) => ({ ...p, [id]: data }));
    } catch { toast.error('Smart summary failed'); }
    setSummaryLoading((p) => ({ ...p, [id]: false }));
  };

  const handleCreateTasksFromActions = async (meetingId) => {
    const summary = smartSummaries[meetingId];
    if (!summary?.extracted?.actionItems?.length) return;
    try {
      const { data } = await api.post(`/meetings/${meetingId}/create-tasks-from-actions`, { actionItems: summary.extracted.actionItems });
      toast.success(data.message);
    } catch { toast.error('Failed to create tasks'); }
  };

  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Meetings</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Schedule and manage meetings</p>
          </div>
          <div className="mr-4">
            <ModeToggle mode={meetingMode} onChange={setMeetingMode} />
          </div>
          {isManager && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
            >
              {showForm ? 'Cancel' : '+ Schedule Meeting'}
            </button>
          )}
        </div>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate}
            className="rounded-2xl p-6 mb-6 space-y-4"
            style={cardStyle}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Date & Time</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Duration (min)</label>
                <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} min={15} step={15} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Attendees ({form.attendeeIds.length} selected)</label>
              <div className="rounded-xl max-h-32 overflow-y-auto p-2 space-y-1" style={inputStyle}>
                {employees.map((emp) => (
                  <label key={emp._id} className="flex items-center gap-2 px-2 py-1 hover:bg-white/[0.03] rounded-lg cursor-pointer">
                    <input type="checkbox" checked={form.attendeeIds.includes(emp._id)} onChange={() => toggleAttendee(emp._id)} className="rounded" />
                    <span className="text-sm text-white/70">{emp.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Agenda</label>
              <textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} rows={2} />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
            >
              Create Meeting
            </button>
          </motion.form>
        )}

        {loading ? (
          <p className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
        ) : meetings.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ ...cardStyle, color: 'rgba(255,255,255,0.3)' }}>No meetings yet</div>
        ) : (
          <div className="space-y-4">
            {meetings.map((m) => {
              const badgeColor = statusBadgeColors[m.status] || '#6b7280';
              return (
                <div key={m._id} className="space-y-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 flex items-start justify-between"
                  style={cardStyle}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{m.title}</h3>
                      <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: badgeColor, background: badgeColor + '15' }}>{m.status}</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(m.scheduledAt).toLocaleString()} — {m.duration} min
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Attendees: {m.attendees?.map((a) => a.name).join(', ') || '—'}
                    </p>
                    {m.meetLink && (
                      <a href={m.meetLink} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 mt-1 inline-block transition-colors">
                        Join Google Meet
                      </a>
                    )}
                    {m.agenda && <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Agenda: {m.agenda}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isManager && m.status === 'scheduled' && (
                      <button onClick={() => handleCancel(m._id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                        Cancel
                      </button>
                    )}
                    {/* AI Mode buttons */}
                    {meetingMode === 'ai' && m.status === 'scheduled' && !preBriefs[m._id] && (
                      <button onClick={() => handlePreBrief(m._id)} disabled={briefLoading[m._id]}
                        className="text-[10px] px-3 py-1 rounded-lg font-semibold" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                        {briefLoading[m._id] ? 'Loading...' : 'AI Pre-Brief'}
                      </button>
                    )}
                    {meetingMode === 'ai' && !smartSummaries[m._id] && (
                      <button onClick={() => handleSmartSummary(m._id)} disabled={summaryLoading[m._id]}
                        className="text-[10px] px-3 py-1 rounded-lg font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        {summaryLoading[m._id] ? 'Analyzing...' : 'AI Smart Summary'}
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* AI Pre-Brief Panel */}
                {meetingMode === 'ai' && preBriefs[m._id] && (
                  <div className="rounded-2xl p-4 -mt-2 space-y-2" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">AI Pre-Meeting Brief</p>
                    {preBriefs[m._id].pendingActions?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-white/40 font-semibold">Pending from last meeting:</p>
                        {preBriefs[m._id].pendingActions.map((a, i) => (
                          <p key={i} className="text-[10px] ml-2" style={{ color: a.status === 'done' ? '#22c55e' : a.status === 'overdue' ? '#ef4444' : '#f59e0b' }}>
                            {a.status === 'done' ? '  ' : '  '} {a.item} ({a.owner})
                          </p>
                        ))}
                      </div>
                    )}
                    {preBriefs[m._id].suggestedTopics?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-white/40 font-semibold">Suggested topics:</p>
                        {preBriefs[m._id].suggestedTopics.map((t, i) => <p key={i} className="text-[10px] text-white/50 ml-2">- {t}</p>)}
                      </div>
                    )}
                    {preBriefs[m._id].teamProgress && <p className="text-[10px] text-white/40">{preBriefs[m._id].teamProgress}</p>}
                  </div>
                )}

                {/* AI Smart Summary Panel */}
                {meetingMode === 'ai' && smartSummaries[m._id] && (
                  <div className="rounded-2xl p-4 -mt-2 space-y-2" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">AI Smart Summary</p>
                    {smartSummaries[m._id].summary && <p className="text-[10px] text-white/50">{smartSummaries[m._id].summary}</p>}
                    {smartSummaries[m._id].extracted?.decisions?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-white/40 font-semibold">Decisions:</p>
                        {smartSummaries[m._id].extracted.decisions.map((d, i) => <p key={i} className="text-[10px] text-green-400/70 ml-2">- {d}</p>)}
                      </div>
                    )}
                    {smartSummaries[m._id].extracted?.actionItems?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-white/40 font-semibold">Action Items:</p>
                        {smartSummaries[m._id].extracted.actionItems.map((a, i) => (
                          <p key={i} className="text-[10px] text-yellow-400/70 ml-2">- {a.task} ({a.owner}, {a.deadline})</p>
                        ))}
                        {isManager && (
                          <button onClick={() => handleCreateTasksFromActions(m._id)}
                            className="text-[10px] px-3 py-1 mt-1 rounded-lg font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                            Create Tasks from Actions
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
