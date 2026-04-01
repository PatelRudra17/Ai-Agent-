import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import AnimatedPieChart from '../components/charts/AnimatedPieChart';
import AnimatedBarChart from '../components/charts/AnimatedBarChart';

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({});
  const [userFilter, setUserFilter] = useState({ search: '', role: '', page: 1 });
  const [auditFilter, setAuditFilter] = useState({ module: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [s, h] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/system/health'),
      ]);
      setStats(s.data);
      setHealth(h.data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userFilter.search) params.set('search', userFilter.search);
      if (userFilter.role) params.set('role', userFilter.role);
      params.set('page', userFilter.page);
      params.set('limit', 15);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setUserPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const fetchAuditLog = async () => {
    try {
      const params = new URLSearchParams();
      if (auditFilter.module) params.set('module', auditFilter.module);
      params.set('page', auditFilter.page);
      params.set('limit', 20);
      const { data } = await api.get(`/admin/audit-log?${params}`);
      setAuditLogs(data.logs);
      setAuditPagination(data.pagination);
    } catch {
      toast.error('Failed to load audit log');
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab, userFilter]);
  useEffect(() => { if (tab === 'audit') fetchAuditLog(); }, [tab, auditFilter]);

  const handleRoleChange = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated');
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      await api.patch(`/admin/users/${userId}/${endpoint}`);
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleExportAudit = async () => {
    try {
      const { data } = await api.get('/admin/audit-log/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleCleanup = async () => {
    if (!confirm('This will remove expired tokens and logs older than 30 days. Continue?')) return;
    try {
      const { data } = await api.delete('/admin/data/cleanup');
      toast.success(`Cleaned: ${data.removed.expiredTokens} tokens, ${data.removed.oldActivityLogs} logs`);
      fetchStats();
    } catch {
      toast.error('Cleanup failed');
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const tabs = ['overview', 'users', 'audit', 'system'];

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>System management & monitoring</p>
          </div>
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors"
                style={tab === t
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }
                  : { ...inputStyle, color: 'rgba(255,255,255,0.5)' }
                }>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users', value: stats.users.total, color: '#8b5cf6' },
                { label: 'Active Users', value: stats.users.active, color: '#22c55e' },
                { label: 'Total Tasks', value: stats.tasks.total, color: '#6366f1' },
                { label: 'Meetings', value: stats.meetings, color: '#06b6d4' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-5" style={cardStyle}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: s.color }}><AnimatedCounter value={s.value} /></p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl p-6" style={cardStyle}>
                <h3 className="font-semibold text-white mb-4">Users by Role</h3>
                <AnimatedPieChart
                  data={stats.users.byRole.map((r) => ({ name: r._id, value: r.count }))}
                  height={240}
                  colors={['#8b5cf6', '#22c55e', '#6366f1']}
                />
              </div>
              <div className="rounded-2xl p-6" style={cardStyle}>
                <h3 className="font-semibold text-white mb-4">Tasks by Status</h3>
                <AnimatedBarChart
                  data={stats.tasks.byStatus.map((s) => ({ name: s._id, count: s.count }))}
                  dataKeys={['count']}
                  xKey="name"
                  height={240}
                />
              </div>
            </div>

            {health && (
              <div className="rounded-2xl p-6" style={cardStyle}>
                <h3 className="font-semibold text-white mb-4">System Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Uptime', value: formatUptime(health.uptime), color: '#22c55e' },
                    { label: 'MongoDB', value: health.mongodb, color: health.mongodb === 'connected' ? '#22c55e' : '#ef4444' },
                    { label: 'Heap Used', value: `${health.memory.heapPercent}%`, color: health.memory.heapPercent > 80 ? '#ef4444' : '#22c55e' },
                    { label: 'Node', value: health.node, color: '#6366f1' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="Search users..."
                value={userFilter.search}
                onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value, page: 1 })}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={inputStyle}
              />
              <select
                value={userFilter.role}
                onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value, page: 1 })}
                className="px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                style={inputStyle}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {['Name', 'Email', 'Role', 'Department', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No users found</td></tr>
                  ) : users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-6 py-4 text-sm font-medium text-white/80">{u.name}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="text-[11px] font-bold rounded-lg px-2 py-1 outline-none"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: 'none' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{u.department || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                          style={{ color: u.isActive ? '#22c55e' : '#ef4444', background: u.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className="text-sm transition-colors"
                          style={{ color: u.isActive ? '#ef4444' : '#22c55e' }}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userPagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: userPagination.pages }, (_, i) => (
                  <button key={i} onClick={() => setUserFilter({ ...userFilter, page: i + 1 })}
                    className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                    style={userFilter.page === i + 1
                      ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }
                      : { ...inputStyle, color: 'rgba(255,255,255,0.5)' }
                    }>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* AUDIT LOG TAB */}
        {tab === 'audit' && (
          <>
            <div className="flex gap-3 mb-6">
              <select
                value={auditFilter.module}
                onChange={(e) => setAuditFilter({ ...auditFilter, module: e.target.value, page: 1 })}
                className="px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                style={inputStyle}
              >
                <option value="">All Modules</option>
                {['auth', 'tasks', 'calls', 'messages', 'meetings', 'reports', 'hr', 'ai', 'users'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button onClick={handleExportAudit}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white ml-auto"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
                Export CSV
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {['Time', 'User', 'Action', 'Module', 'Details'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No audit logs</td></tr>
                  ) : auditLogs.map((l) => {
                    const moduleColors = { auth: '#8b5cf6', tasks: '#22c55e', hr: '#f59e0b', users: '#6366f1', ai: '#06b6d4' };
                    const mColor = moduleColors[l.module] || '#6b7280';
                    return (
                      <tr key={l._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-6 py-4 text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white/80">{l.userId?.name || 'System'}</td>
                        <td className="px-6 py-4 text-sm text-white/60">{l.action}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ color: mColor, background: mColor + '15' }}>{l.module}</span>
                        </td>
                        <td className="px-6 py-4 text-xs max-w-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {l.details ? JSON.stringify(l.details).slice(0, 80) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {auditPagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: Math.min(auditPagination.pages, 10) }, (_, i) => (
                  <button key={i} onClick={() => setAuditFilter({ ...auditFilter, page: i + 1 })}
                    className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                    style={auditFilter.page === i + 1
                      ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }
                      : { ...inputStyle, color: 'rgba(255,255,255,0.5)' }
                    }>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* SYSTEM TAB */}
        {tab === 'system' && health && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Uptime', value: formatUptime(health.uptime), color: '#22c55e' },
                { label: 'MongoDB', value: health.mongodb, color: health.mongodb === 'connected' ? '#22c55e' : '#ef4444' },
                { label: 'Memory (RSS)', value: `${health.memory.rssMB} MB`, color: '#6366f1' },
                { label: 'Heap Usage', value: `${health.memory.heapPercent}%`, color: health.memory.heapPercent > 80 ? '#ef4444' : '#22c55e' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-5" style={cardStyle}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
              <h3 className="font-semibold text-white mb-4">Memory Details</h3>
              <AnimatedBarChart
                data={[
                  { name: 'RSS', value: health.memory.rssMB },
                  { name: 'Heap Used', value: health.memory.heapUsedMB },
                  { name: 'Heap Total', value: health.memory.heapTotalMB },
                ]}
                dataKeys={['value']}
                xKey="name"
                height={200}
              />
            </div>

            <div className="rounded-2xl p-6" style={cardStyle}>
              <h3 className="font-semibold text-white mb-4">System Info</h3>
              <div className="space-y-3">
                {[
                  { label: 'Node.js Version', value: health.node },
                  { label: 'Platform', value: health.platform },
                  { label: 'Process ID', value: health.pid },
                  { label: 'Server Time', value: new Date(health.timestamp).toLocaleString() },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                    <span className="text-sm font-medium text-white/80">{s.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleCleanup}
                className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}>
                Clean Up Old Data
              </button>
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}
