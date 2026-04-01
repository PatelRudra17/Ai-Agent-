import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const allActions = [
  // Admin only
  { label: 'Manage Users', path: '/admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', roles: ['admin'] },
  { label: 'Audit Log', path: '/admin', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', gradient: 'linear-gradient(135deg, #f97316, #ea580c)', roles: ['admin'] },
  // Admin + Manager
  { label: 'Create Task', path: '/tasks', icon: 'M12 4v16m8-8H4', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', roles: ['admin', 'manager'] },
  { label: 'View Team', path: '/employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', roles: ['admin', 'manager'] },
  { label: 'Schedule Call', path: '/calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', roles: ['admin', 'manager'] },
  { label: 'Send Message', path: '/messages', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)', roles: ['admin', 'manager'] },
  { label: 'View Reports', path: '/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)', roles: ['admin', 'manager'] },
  { label: 'Analytics', path: '/analytics', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', roles: ['admin', 'manager'] },
  // All roles
  { label: 'Schedule Meeting', path: '/meetings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', roles: ['admin', 'manager', 'employee'] },
  { label: 'AI Chat', path: '/ai-chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', gradient: 'linear-gradient(135deg, #10b981, #059669)', roles: ['admin', 'manager', 'employee'] },
  { label: 'Apply Leave', path: '/hr', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', roles: ['admin', 'manager', 'employee'] },
  { label: 'My Documents', path: '/documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', gradient: 'linear-gradient(135deg, #64748b, #475569)', roles: ['admin', 'manager', 'employee'] },
];

export default function QuickActionsWidget() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || 'employee';

  const actions = allActions.filter((a) => a.roles.includes(role)).slice(0, 6);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <motion.button key={a.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate(a.path)}
            className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-colors hover:bg-white/[0.02]"
            style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: a.gradient }}>
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
              </svg>
            </div>
            <span className="text-[11px] font-medium text-white/70">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
