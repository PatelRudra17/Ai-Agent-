import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';

const typeColors = {
  task_assigned: '#6366f1', task_completed: '#22c55e', task_overdue: '#ef4444',
  leave_approved: '#22c55e', leave_rejected: '#ef4444', leave_applied: '#f59e0b',
  meeting_reminder: '#06b6d4', meeting_created: '#8b5cf6',
  message_received: '#10b981', system_alert: '#f97316', role_changed: '#8b5cf6',
};

const typeLinks = {
  task_assigned: '/tasks', task_completed: '/tasks', task_overdue: '/tasks',
  leave_approved: '/hr', leave_rejected: '/hr', leave_applied: '/hr',
  meeting_reminder: '/meetings', meeting_created: '/meetings',
  message_received: '/messages', role_changed: '/settings',
};

const filterTabs = [
  { key: '', label: 'All' },
  { key: 'task', label: 'Tasks' },
  { key: 'leave', label: 'HR' },
  { key: 'meeting', label: 'Meetings' },
  { key: 'system', label: 'System' },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter) params.set('type', filter);
      const { data } = await api.get(`/notifications?${params}`);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [page, filter]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
  };

  const handleClick = async (notif) => {
    // Mark as read
    if (!notif.read) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) => prev.map((n) => n._id === notif._id ? { ...n, read: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    // Navigate to relevant page
    const link = notif.link || typeLinks[notif.type];
    if (link) navigate(link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  // Group notifications by date
  const grouped = {};
  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let key;
    if (date.toDateString() === today.toDateString()) key = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(n);
  });

  // Filter notifications that match the tab
  const filteredNotifs = filter
    ? notifications.filter((n) => n.type?.startsWith(filter))
    : notifications;

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ ...cardStyle, color: 'rgba(255,255,255,0.5)' }}>
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {filterTabs.map((t) => (
            <button key={t.key} onClick={() => { setFilter(t.key); setPage(1); }}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
              style={filter === t.key
                ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }
                : { ...cardStyle, color: 'rgba(255,255,255,0.5)' }
              }>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
        ) : filteredNotifs.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={cardStyle}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <svg className="w-8 h-8" style={{ color: 'rgba(139,92,246,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>No notifications</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{date}</p>
                <div className="space-y-2">
                  {items.filter((n) => !filter || n.type?.startsWith(filter)).map((n, i) => {
                    const color = typeColors[n.type] || '#8b5cf6';
                    return (
                      <motion.div key={n._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                        onClick={() => handleClick(n)}
                        className={`rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/[0.02] ${!n.read ? 'ring-1 ring-violet-500/20' : ''}`}
                        style={{ background: !n.read ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90">{n.title}</p>
                          {n.body && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{n.body}</p>}
                          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button onClick={(e) => handleDelete(e, n._id)}
                          className="text-white/20 hover:text-red-400 transition-colors shrink-0 mt-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                style={page === i + 1
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }
                  : { ...cardStyle, color: 'rgba(255,255,255,0.5)' }
                }>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
