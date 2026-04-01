import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';
import GlowButton from '../components/ui/GlowButton';
import Breadcrumbs from '../components/ui/Breadcrumbs';

const TABS = ['Tasks', 'Attendance', 'Leaves', 'Performance'];
const roleBadgeColors = { admin: '#ef4444', manager: '#6366f1', employee: '#8b5cf6' };
const statusColors = { pending: '#f59e0b', inprogress: '#6366f1', done: '#10b981', overdue: '#ef4444', cancelled: '#6b7280' };

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tasks');
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${id}`);
      setEmployee(data.user);
    } catch (err) {
      toast.error('Failed to load employee');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab) => {
    setTabLoading(true);
    try {
      if (tab === 'Tasks') {
        const { data } = await api.get(`/tasks/team?assignedTo=${id}&limit=50`);
        setTasks(data.tasks);
      } else if (tab === 'Attendance') {
        const { data } = await api.get(`/hr/attendance/${id}`);
        setAttendance(data.records || []);
      } else if (tab === 'Leaves') {
        const { data } = await api.get(`/hr/leave/balance/${id}`);
        setLeaveBalance(data);
      } else if (tab === 'Performance') {
        const { data } = await api.get(`/analytics/employee/${id}`);
        setAnalytics(data);
      }
    } catch {
      // Silently handle — some endpoints may not return data
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => { fetchEmployee(); }, [id]);
  useEffect(() => { if (employee) fetchTabData(activeTab); }, [activeTab, employee]);

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading employee...</p>
        </div>
      </Layout>
    );
  }

  if (!employee) return null;

  const rc = roleBadgeColors[employee.role] || '#8b5cf6';

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Employees', path: '/employees' }, { label: employee.name }]} />

        {/* Profile Card */}
        <div className="rounded-2xl p-6 mb-6 flex items-center gap-6" style={cardStyle}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {employee.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{employee.name}</h1>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ color: rc, background: rc + '15' }}>{employee.role}</span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ color: employee.isActive ? '#22c55e' : '#6b7280', background: (employee.isActive ? '#22c55e' : '#6b7280') + '15' }}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{employee.email}</p>
            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {employee.department && <span>{employee.department}</span>}
              {employee.phone && <span>{employee.phone}</span>}
              <span>Joined {new Date(employee.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: activeTab === tab ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          {tabLoading ? (
            <p className="text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
          ) : (
            <>
              {/* Tasks Tab */}
              {activeTab === 'Tasks' && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Assigned Tasks ({tasks.length})</h3>
                  {tasks.length === 0 ? (
                    <p className="text-sm py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>No tasks assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => navigate(`/tasks/${t._id}`)}
                          className="rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                          style={{ background: 'rgba(255,255,255,0.02)' }}
                        >
                          <div className="flex-1">
                            <p className="text-sm text-white/80">{t.title}</p>
                            {t.dueDate && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Due: {new Date(t.dueDate).toLocaleDateString()}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ color: statusColors[t.status], background: statusColors[t.status] + '15' }}>{t.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'Attendance' && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Attendance Records</h3>
                  {attendance.length === 0 ? (
                    <p className="text-sm py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>No attendance records</p>
                  ) : (
                    <div className="space-y-2">
                      {attendance.map((a, i) => (
                        <div key={i} className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <span className="text-sm text-white/80">{new Date(a.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <span>In: {a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : '—'}</span>
                            <span>Out: {a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : '—'}</span>
                            <span className="font-semibold" style={{ color: '#a5b4fc' }}>{a.hoursWorked ? `${a.hoursWorked.toFixed(1)}h` : '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leaves Tab */}
              {activeTab === 'Leaves' && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Leave Balance</h3>
                  {leaveBalance ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(leaveBalance.balance || {}).map(([type, val]) => (
                        <div key={type} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1 capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>{type}</p>
                          <p className="text-2xl font-bold" style={{ color: '#a5b4fc' }}>{val}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>remaining</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>No leave data available</p>
                  )}
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'Performance' && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Performance Analytics</h3>
                  {analytics ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Tasks', value: analytics.totalTasks || 0, color: '#fff' },
                        { label: 'Completed', value: analytics.completed || 0, color: '#10b981' },
                        { label: 'In Progress', value: analytics.inProgress || 0, color: '#6366f1' },
                        { label: 'Completion Rate', value: `${analytics.completionRate || 0}%`, color: '#f59e0b' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
                          <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>No performance data available</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
