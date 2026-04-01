import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const typeIcons = {
  task_assigned: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
  task_completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  leave_applied: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  meeting_created: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857',
};

const typeColors = {
  task_assigned: '#6366f1', task_completed: '#22c55e', task_overdue: '#ef4444',
  leave_applied: '#f59e0b', leave_approved: '#22c55e',
  meeting_created: '#06b6d4', system_alert: '#f97316',
};

export default function ActivityFeed({ limit = 10 }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/notifications?limit=${limit}`);
        setActivities(data.notifications || []);
      } catch {}
    };
    fetch();
  }, [limit]);

  if (!activities.length) return null;

  return (
    <div className="space-y-1">
      {activities.map((a, i) => {
        const color = typeColors[a.type] || '#8b5cf6';
        const icon = typeIcons[a.type] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        return (
          <motion.div
            key={a._id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: color + '15' }}>
              <svg className="w-3.5 h-3.5" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{a.title}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {new Date(a.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
