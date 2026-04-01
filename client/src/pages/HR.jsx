import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import AnimatedPieChart from '../components/charts/AnimatedPieChart';
import AnimatedBarChart from '../components/charts/AnimatedBarChart';
import ExportButton from '../components/ui/ExportButton';

import ModeToggle from '../components/ui/ModeToggle';

const leaveTypes = ['casual', 'sick', 'annual', 'unpaid'];
const statusBadgeColors = {
  pending: '#eab308',
  approved: '#22c55e',
  rejected: '#ef4444',
};
const riskColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
const checkStatusIcons = { ok: '#22c55e', warning: '#f59e0b', risk: '#ef4444' };

export default function HR() {
  const { user } = useAuthStore();
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const [tab, setTab] = useState('leave');
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [attendance, setAttendance] = useState({ records: [], summary: {} });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'casual', fromDate: '', toDate: '', reason: '' });
  const [todayClock, setTodayClock] = useState(null);
  const [leaveMode, setLeaveMode] = useState('automation');
  const [aiAnalysis, setAiAnalysis] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);

  const fetchMyLeaves = async () => {
    try {
      const { data } = await api.get('/hr/leave/my');
      setMyLeaves(data.leaves);
    } catch {}
  };

  const fetchTeamLeaves = async () => {
    if (!isManager) return;
    try {
      const { data } = await api.get('/hr/leave/team');
      setTeamLeaves(data.leaves);
    } catch {}
  };

  const fetchBalance = async () => {
    const uid = user?.id || user?._id;
    if (!uid) return;
    try {
      const { data } = await api.get(`/hr/leave/balance/${uid}`);
      setBalance(data.balance);
    } catch {}
  };

  const fetchAttendance = async () => {
    const uid = user?.id || user?._id;
    if (!uid) return;
    try {
      const { data } = await api.get(`/hr/attendance/${uid}`);
      setAttendance(data);
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = data.records.find((r) => r.date?.startsWith(today));
      setTodayClock(todayRecord || null);
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    fetchMyLeaves();
    fetchTeamLeaves();
    fetchBalance();
    fetchAttendance();
  }, [user]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/leave/apply', form);
      toast.success('Leave applied');
      setShowForm(false);
      setForm({ type: 'casual', fromDate: '', toDate: '', reason: '' });
      fetchMyLeaves();
      fetchBalance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleLeaveAction = async (id, action, reason = '') => {
    try {
      await api.patch(`/hr/leave/${id}/${action}`, { reason });
      toast.success(`Leave ${action}d`);
      fetchTeamLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleAnalyzeLeave = async (leaveId) => {
    setAnalyzingId(leaveId);
    try {
      const { data } = await api.post(`/hr/leave/${leaveId}/analyze`);
      setAiAnalysis((prev) => ({ ...prev, [leaveId]: data.analysis }));
    } catch {
      toast.error('AI analysis failed');
    }
    setAnalyzingId(null);
  };

  const handleClock = async (type) => {
    try {
      const { data } = await api.post(`/hr/attendance/${type}`);
      toast.success(data.message);
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">HR Module</h1>
            {isManager && (
              <>
                <ExportButton endpoint="/hr/leave/export" filename="leave-records.csv" label="Export Leaves" />
                <ExportButton endpoint="/hr/attendance/export" filename="attendance.csv" label="Export Attendance" />
              </>
            )}
          </div>
          <div className="flex gap-2">
            {['leave', 'attendance', ...(isManager ? ['team'] : [])].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors"
                style={tab === t
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* LEAVE TAB */}
        {tab === 'leave' && (
          <>
            {/* Leave Balance */}
            {balance && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(balance).map(([type, b]) => (
                  <div key={type} className="rounded-2xl p-4" style={cardStyle}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{type}</p>
                    <p className="text-2xl font-bold text-white mt-1"><AnimatedCounter value={b.remaining} /></p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{b.used} used of {b.total}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Leave Balance Chart */}
            {balance && (
              <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
                <h3 className="font-semibold text-white mb-4">Leave Balance Overview</h3>
                <AnimatedPieChart
                  data={Object.entries(balance).map(([type, b]) => ({ name: type, value: b.remaining }))}
                  height={240}
                  colors={['#8b5cf6', '#22c55e', '#eab308', '#ef4444']}
                  innerRadius={45}
                  outerRadius={80}
                />
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">My Leave Requests</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
              >
                {showForm ? 'Cancel' : '+ Apply Leave'}
              </button>
            </div>

            {showForm && (
              <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleApplyLeave} className="rounded-2xl p-6 mb-6 space-y-4" style={cardStyle}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Type</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none" style={inputStyle}>
                      {leaveTypes.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>From</label>
                    <input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>To</label>
                    <input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} required />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Reason</label>
                  <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none" style={inputStyle} rows={2} required />
                </div>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
                  Apply
                </button>
              </motion.form>
            )}

            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Type</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>From</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>To</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Reason</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No leave requests</td></tr>
                  ) : myLeaves.map((l) => {
                    const badgeColor = statusBadgeColors[l.status] || '#6b7280';
                    return (
                      <tr key={l._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-6 py-4 text-sm capitalize text-white/80">{l.type}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(l.fromDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(l.toDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{l.reason}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: badgeColor, background: badgeColor + '15' }}>{l.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ATTENDANCE TAB */}
        {tab === 'attendance' && (
          <>
            <div className="flex gap-4 mb-6">
              <button onClick={() => handleClock('clock-in')} disabled={todayClock?.clockIn}
                className="px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}>
                Clock In
              </button>
              <button onClick={() => handleClock('clock-out')} disabled={!todayClock?.clockIn || todayClock?.clockOut}
                className="px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}>
                Clock Out
              </button>
              {todayClock && (
                <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {todayClock.clockIn && <span>In: {new Date(todayClock.clockIn).toLocaleTimeString()}</span>}
                  {todayClock.clockOut && <span>Out: {new Date(todayClock.clockOut).toLocaleTimeString()}</span>}
                  {todayClock.hoursWorked > 0 && <span>{todayClock.hoursWorked.toFixed(1)}h</span>}
                </div>
              )}
            </div>

            {/* Attendance Chart */}
            {attendance.summary && attendance.summary.present > 0 && (
              <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
                <h3 className="font-semibold text-white mb-4">Attendance Distribution</h3>
                <AnimatedBarChart
                  data={[
                    { name: 'Present', value: attendance.summary.present || 0 },
                    { name: 'Absent', value: attendance.summary.absent || 0 },
                    { name: 'Half Day', value: attendance.summary.halfDay || 0 },
                    { name: 'Leave', value: attendance.summary.leave || 0 },
                  ]}
                  dataKeys={['value']}
                  xKey="name"
                  height={200}
                  colors={[
                    { stroke: '#22c55e', fill: 'rgba(34,197,94,0.3)' },
                  ]}
                />
              </div>
            )}

            {/* Summary */}
            {attendance.summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'Present', value: attendance.summary.present || 0, color: '#22c55e' },
                  { label: 'Absent', value: attendance.summary.absent || 0, color: '#ef4444' },
                  { label: 'Half Day', value: attendance.summary.halfDay || 0, color: '#eab308' },
                  { label: 'Leave', value: attendance.summary.leave || 0, color: '#6366f1' },
                  { label: 'Total Hours', value: attendance.summary.totalHours || 0, color: '#ffffff' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-4 text-center" style={cardStyle}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                    <p className="text-2xl font-bold" style={{ color: s.color }}><AnimatedCounter value={s.value} /></p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Date</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Clock In</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Clock Out</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Hours</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.records?.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No records this month</td></tr>
                  ) : attendance.records?.map((r) => {
                    const attColors = { present: '#22c55e', leave: '#6366f1', 'half-day': '#eab308', absent: '#ef4444' };
                    const attColor = attColors[r.status] || '#ef4444';
                    return (
                      <tr key={r._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-6 py-4 text-sm text-white/80">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '—'}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '—'}</td>
                        <td className="px-6 py-4 text-sm text-white/80">{r.hoursWorked ? r.hoursWorked.toFixed(1) : '—'}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: attColor, background: attColor + '15' }}>{r.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TEAM LEAVE APPROVALS TAB (managers only) */}
        {tab === 'team' && isManager && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Team Leave Requests</h2>
              <ModeToggle mode={leaveMode} onChange={setLeaveMode} />
            </div>
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Employee</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Type</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Dates</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Reason</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamLeaves.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No team leave requests</td></tr>
                  ) : teamLeaves.map((l) => {
                    const badgeColor = statusBadgeColors[l.status] || '#6b7280';
                    const analysis = aiAnalysis[l._id];
                    return (
                      <tr key={l._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-6 py-4 text-sm font-medium text-white/80">{l.employee?.name || '—'}</td>
                        <td className="px-6 py-4 text-sm capitalize text-white/80">{l.type}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {new Date(l.fromDate).toLocaleDateString()} — {new Date(l.toDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{l.reason}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: badgeColor, background: badgeColor + '15' }}>{l.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          {l.status === 'pending' && (
                            <div className="space-y-2">
                              {leaveMode === 'ai' && !analysis && (
                                <button onClick={() => handleAnalyzeLeave(l._id)} disabled={analyzingId === l._id}
                                  className="text-[10px] px-3 py-1 rounded-lg font-semibold transition-all" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                                  {analyzingId === l._id ? 'Analyzing...' : 'AI Analyze'}
                                </button>
                              )}
                              {leaveMode === 'ai' && analysis && (
                                <div className="rounded-lg p-2 space-y-1" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: riskColors[analysis.riskLevel], background: riskColors[analysis.riskLevel] + '15' }}>
                                      {analysis.riskLevel} risk
                                    </span>
                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: analysis.recommendation === 'approve' ? '#22c55e' : '#ef4444', background: (analysis.recommendation === 'approve' ? '#22c55e' : '#ef4444') + '15' }}>
                                      {analysis.recommendation}
                                    </span>
                                  </div>
                                  {analysis.checks?.map((c, i) => (
                                    <p key={i} className="text-[9px]" style={{ color: checkStatusIcons[c.status] }}>{c.label}</p>
                                  ))}
                                  <p className="text-[9px] text-white/40">{analysis.reason}</p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => handleLeaveAction(l._id, 'approve')} className="text-sm transition-colors" style={{ color: '#22c55e' }}>
                                  {analysis?.recommendation === 'approve' ? 'Approve (Recommended)' : 'Approve'}
                                </button>
                                <button onClick={() => handleLeaveAction(l._id, 'reject')} className="text-sm text-red-400 hover:text-red-300 transition-colors">Reject</button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
