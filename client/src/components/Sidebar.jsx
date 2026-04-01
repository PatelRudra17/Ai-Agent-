import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';

const navSections = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1', roles: ['admin', 'manager', 'employee'] },
      { path: '/tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', roles: ['admin', 'manager', 'employee'] },
      { path: '/ai-chat', label: 'AI Chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', roles: ['admin', 'manager', 'employee'] },
      { path: '/chat', label: 'Team Chat', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8zM7 4h8a2 2 0 012 2v2H7a2 2 0 00-2 2v4H3a2 2 0 01-2-2V6a2 2 0 012-2z', roles: ['admin', 'manager', 'employee'] },
    ],
  },
  {
    label: 'Team Management',
    roles: ['admin', 'manager'],
    items: [
      { path: '/employees', label: 'Employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', roles: ['admin', 'manager'] },
      { path: '/calls', label: 'Calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', roles: ['admin', 'manager'] },
      { path: '/messages', label: 'Messages', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', roles: ['admin', 'manager'] },
      { path: '/reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['admin', 'manager'] },
      { path: '/analytics', label: 'Analytics', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', roles: ['admin', 'manager'] },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { path: '/documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', roles: ['admin', 'manager', 'employee'] },
      { path: '/meetings', label: 'Meetings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', roles: ['admin', 'manager', 'employee'] },
      { path: '/hr', label: 'HR', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', roles: ['admin', 'manager', 'employee'] },
    ],
  },
  {
    label: 'Admin',
    roles: ['admin'],
    items: [
      { path: '/admin', label: 'Admin Panel', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', roles: ['admin'] },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', roles: ['admin', 'manager', 'employee'] },
      { path: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', roles: ['admin', 'manager', 'employee'] },
      { path: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z M15 12a3 3 0 11-6 0 3 3 0 016 0z', roles: ['admin', 'manager', 'employee'] },
    ],
  },
];

const roleColors = {
  admin: { gradient: 'linear-gradient(135deg, #ef4444, #f97316)', bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  manager: { gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
  employee: { gradient: 'linear-gradient(135deg, #06b6d4, #10b981)', bg: 'rgba(6,182,212,0.15)', color: '#22d3ee' },
};

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuthStore();
  const role = user?.role || 'employee';
  const rc = roleColors[role] || roleColors.employee;

  return (
    <aside className="w-[260px] h-screen flex flex-col relative sticky top-0"
      style={{ background: 'rgba(15,15,30,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Sidebar glow */}
      <div className="absolute top-0 right-0 w-[1px] h-full"
        style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.3), transparent 30%, transparent 70%, rgba(6,182,212,0.2))' }} />

      {/* Logo */}
      <div className="px-5 py-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: rc.gradient, boxShadow: `0 4px 16px ${rc.bg}` }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Corporate AI</h1>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
              style={{ background: rc.bg, color: rc.color }}>
              {role}
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* User card */}
      <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: rc.gradient }}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navSections.map((section) => {
          // Hide entire section if role doesn't match section-level role filter
          if (section.roles && !section.roles.includes(role)) return null;
          // Filter items by role
          const items = section.items.filter((item) => item.roles.includes(role));
          if (items.length === 0) return null;

          return (
            <div key={section.label} className="mb-2">
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {section.label}
              </p>
              {items.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={onClose}
                  className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 relative ${
                    isActive ? 'text-white font-medium' : 'text-white/40 hover:text-white/70'
                  }`}
                  style={({ isActive }) => isActive ? {
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))',
                    border: '1px solid rgba(139,92,246,0.15)',
                    boxShadow: '0 2px 12px rgba(139,92,246,0.1)',
                  } : {}}>
                  <svg className="w-[18px] h-[18px] transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </motion.button>
      </div>
    </aside>
  );
}
