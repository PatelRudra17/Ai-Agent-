import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import Layout from '../components/Layout';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import StatSparkline from '../components/charts/StatSparkline';
import AnimatedBarChart from '../components/charts/AnimatedBarChart';
import TasksWidget from '../components/widgets/TasksWidget';
import MeetingsWidget from '../components/widgets/MeetingsWidget';
import ActivityWidget from '../components/widgets/ActivityWidget';
import CalendarWidget from '../components/widgets/CalendarWidget';
import QuickActionsWidget from '../components/widgets/QuickActionsWidget';
import AIInsightsWidget from '../components/widgets/AIInsightsWidget';

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ totalUsers: 0, myTasks: 0, pending: 0, meetings: 0, teamTasks: 0, teamDone: 0, teamOverdue: 0, leaves: 0, reports: 0 });
  const [weeklyTasks, setWeeklyTasks] = useState([]);

  const role = user?.role || 'employee';
  const isAdmin = role === 'admin';
  const isManager = role === 'admin' || role === 'manager';

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        // All roles: own tasks
        const { data: t } = await api.get('/tasks/my');
        setStats((s) => ({ ...s, myTasks: t.tasks.length, pending: t.tasks.filter((x) => x.status === 'pending').length }));

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const tasksByDay = days.map((d) => ({ day: d, count: 0 }));
        t.tasks.forEach((task) => {
          if (task.status === 'done' && task.completedAt) {
            const dayIdx = new Date(task.completedAt).getDay();
            const mapped = dayIdx === 0 ? 6 : dayIdx - 1;
            if (tasksByDay[mapped]) tasksByDay[mapped].count++;
          }
        });
        setWeeklyTasks(tasksByDay);
      } catch {}

      try {
        const { data } = await api.get('/meetings');
        const today = new Date().toDateString();
        setStats((s) => ({ ...s, meetings: data.meetings.filter((m) => new Date(m.scheduledAt).toDateString() === today).length }));
      } catch {}

      // Manager/Admin: team stats
      if (isManager) {
        try {
          const { data } = await api.get('/users?limit=1');
          setStats((s) => ({ ...s, totalUsers: data.pagination?.total || 0 }));
        } catch {}
        try {
          const { data } = await api.get('/tasks/dashboard');
          setStats((s) => ({
            ...s,
            teamTasks: data.stats?.total || 0,
            teamDone: data.stats?.done || 0,
            teamOverdue: data.stats?.overdue || 0,
          }));
        } catch {}
        try {
          const { data } = await api.get('/hr/leave/team?limit=1');
          setStats((s) => ({ ...s, leaves: data.pagination?.total || 0 }));
        } catch {}
      }

      // Admin: system stats
      if (isAdmin) {
        try {
          const { data } = await api.get('/admin/stats');
          setStats((s) => ({ ...s, reports: data.stats?.reports || 0 }));
        } catch {}
      }
    };
    load();
  }, [user]);

  const sparkTasks = [{ value: 2 }, { value: 3 }, { value: 1 }, { value: 4 }, { value: stats.myTasks || 1 }];
  const sparkPending = [{ value: 3 }, { value: 2 }, { value: 4 }, { value: 1 }, { value: stats.pending || 1 }];

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  // --- Build stat cards based on role ---
  const getCards = () => {
    if (isAdmin) {
      return [
        { title: 'Total Users', value: stats.totalUsers, gradient: 'linear-gradient(135deg, #ef4444, #f97316)', shadow: 'rgba(239,68,68,0.3)', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
        { title: 'Team Tasks', value: stats.teamTasks, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', shadow: 'rgba(99,102,241,0.3)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { title: 'Completed', value: stats.teamDone, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { title: 'Overdue', value: stats.teamOverdue, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239,68,68,0.3)', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { title: 'Leave Requests', value: stats.leaves, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { title: 'Meetings Today', value: stats.meetings, gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)', shadow: 'rgba(139,92,246,0.3)', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
      ];
    }
    if (role === 'manager') {
      return [
        { title: 'Team Members', value: stats.totalUsers, gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', shadow: 'rgba(139,92,246,0.3)', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
        { title: 'Team Tasks', value: stats.teamTasks, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', shadow: 'rgba(99,102,241,0.3)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', spark: sparkTasks, color: '#6366f1' },
        { title: 'Overdue', value: stats.teamOverdue, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239,68,68,0.3)', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { title: 'Leave Requests', value: stats.leaves, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { title: 'Meetings Today', value: stats.meetings, gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)', shadow: 'rgba(139,92,246,0.3)', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
      ];
    }
    // Employee
    return [
      { title: 'My Tasks', value: stats.myTasks, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', spark: sparkTasks, color: '#10b981' },
      { title: 'Pending', value: stats.pending, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', spark: sparkPending, color: '#f59e0b', trend: 'down' },
      { title: 'Meetings Today', value: stats.meetings, gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)', shadow: 'rgba(139,92,246,0.3)', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ];
  };

  const cards = getCards();

  const roleConfig = {
    admin: { badge: 'Admin', color: '#f87171', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.2)', desc: 'Full system access — manage users, view audit logs, monitor everything' },
    manager: { badge: 'Manager', color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.2)', desc: 'Manage your team — assign tasks, schedule calls & meetings, view reports' },
    employee: { badge: 'Employee', color: '#22d3ee', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.2)', desc: 'Your workspace — complete tasks, chat with AI, manage HR & attendance' },
  };
  const rc = roleConfig[role] || roleConfig.employee;

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white">
            Welcome back, <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name || 'User'}</span>
          </motion.h1>
          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
            className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider"
            style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
            {rc.badge}
          </motion.span>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {rc.desc}
        </motion.p>
      </div>

      {/* Stats Cards */}
      <motion.div variants={stagger} initial="initial" animate="animate"
        className={`grid gap-4 mb-8 ${cards.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : cards.length <= 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
        {cards.map((card) => (
          <motion.div key={card.title} variants={fadeUp}
            className="rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
            style={cardStyle}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20" style={{ background: card.gradient }} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.title}</p>
                <p className="text-3xl font-bold text-white mt-2"><AnimatedCounter end={card.value} /></p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.gradient, boxShadow: `0 4px 16px ${card.shadow}` }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                {card.spark && <StatSparkline data={card.spark} color={card.color} trend={card.trend} width={60} height={24} />}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* --- ADMIN LAYOUT --- */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <AIInsightsWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <QuickActionsWidget />
            </motion.div>
          </div>
          {/* Col 2 */}
          <div className="space-y-6">
            {weeklyTasks.some((d) => d.count > 0) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl p-6" style={cardStyle}>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Tasks Completed This Week</h2>
                <AnimatedBarChart data={weeklyTasks} dataKeys={['count']} xKey="day" height={180} />
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <TasksWidget />
            </motion.div>
          </div>
          {/* Col 3 */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <MeetingsWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <ActivityWidget />
            </motion.div>
          </div>
        </div>
      )}

      {/* --- MANAGER LAYOUT --- */}
      {!isAdmin && role === 'manager' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-6">
            {weeklyTasks.some((d) => d.count > 0) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl p-6" style={cardStyle}>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Tasks Completed This Week</h2>
                <AnimatedBarChart data={weeklyTasks} dataKeys={['count']} xKey="day" height={180} />
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <TasksWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <QuickActionsWidget />
            </motion.div>
          </div>
          {/* Right */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <MeetingsWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <AIInsightsWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <CalendarWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <ActivityWidget />
            </motion.div>
          </div>
        </div>
      )}

      {/* --- EMPLOYEE LAYOUT --- */}
      {role === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-6">
            {weeklyTasks.some((d) => d.count > 0) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl p-6" style={cardStyle}>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>My Tasks This Week</h2>
                <AnimatedBarChart data={weeklyTasks} dataKeys={['count']} xKey="day" height={180} />
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <TasksWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <QuickActionsWidget />
            </motion.div>
          </div>
          {/* Right */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <MeetingsWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <CalendarWidget />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl p-6" style={cardStyle}>
              <ActivityWidget />
            </motion.div>
          </div>
        </div>
      )}
    </Layout>
  );
}
