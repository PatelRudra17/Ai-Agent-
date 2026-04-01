import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';
import AnimatedCounter from '../components/ui/AnimatedCounter';

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      const { data } = await api.get('/users', { params });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const roleBadge = (role) => {
    const colors = { admin: '#ef4444', manager: '#6366f1', employee: '#8b5cf6' };
    const c = colors[role] || '#8b5cf6';
    return (
      <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: c, background: c + '15' }}>
        {role}
      </span>
    );
  };

  const statusBadge = (isActive) => {
    const c = isActive ? '#22c55e' : '#6b7280';
    return (
      <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ color: c, background: c + '15' }}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Employees</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <AnimatedCounter value={pagination.total || 0} /> total
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-72 px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          />
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Name</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Email</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Role</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Department</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No employees found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} onClick={() => navigate(`/employees/${u._id}`)} className="hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-6 py-4 text-sm font-medium text-white/80">{u.name}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
                    <td className="px-6 py-4">{roleBadge(u.role)}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{u.department || '—'}</td>
                    <td className="px-6 py-4">{statusBadge(u.isActive)}</td>
                    <td className="px-6 py-4">
                      {u.isActive && (
                        <button onClick={() => handleDeactivate(u._id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm text-white/50 hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Page {page} of {pagination.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="text-sm text-white/50 hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
