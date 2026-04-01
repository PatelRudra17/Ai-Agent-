import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const statusColors = { pending: '#f59e0b', inprogress: '#6366f1', done: '#22c55e', overdue: '#ef4444' };

export default function TasksWidget() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/tasks/my');
        setTasks(data.tasks.slice(0, 5));
      } catch {}
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Recent Tasks</h3>
        <button onClick={() => navigate('/tasks')} className="text-[10px] font-medium" style={{ color: '#8b5cf6' }}>View All</button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>No tasks</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <motion.div key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-white/[0.02]"
              style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">{t.title}</p>
                {t.dueDate && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Due: {new Date(t.dueDate).toLocaleDateString()}</p>}
              </div>
              <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold capitalize shrink-0 ml-2"
                style={{ color: statusColors[t.status] || '#6b7280', background: (statusColors[t.status] || '#6b7280') + '15' }}>
                {t.status}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
