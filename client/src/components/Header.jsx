import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useNotificationStore from '../store/notificationStore';
import SearchBar from './SearchBar';

export default function Header({ onToggleSidebar }) {
  const { notifications, unreadCount, markAllRead } = useNotificationStore();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="h-[60px] flex items-center justify-between px-6 sticky top-0 z-20"
      style={{ background: 'rgba(15,15,30,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      <button onClick={onToggleSidebar} className="lg:hidden transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <div className="flex-1 flex justify-center">
        <SearchBar />
      </div>

      <div className="relative">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-all"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              style={{ background: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        <AnimatePresence>
          {showNotifs && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-30"
              style={{ background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-semibold text-white">Notifications</span>
                <button onClick={() => setShowNotifs(false)} className="text-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>&times;</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No notifications</p>
                ) : notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
