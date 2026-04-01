import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import AnimatedAreaChart from '../components/charts/AnimatedAreaChart';
import AnimatedBarChart from '../components/charts/AnimatedBarChart';
import AnimatedPieChart from '../components/charts/AnimatedPieChart';
import AnimatedLineChart from '../components/charts/AnimatedLineChart';
import StatSparkline from '../components/charts/StatSparkline';

export default function Analytics() {
  const [taskStats, setTaskStats] = useState(null);
  const [callStats, setCallStats] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tasks, calls, team] = await Promise.all([
        api.get(`/analytics/tasks?days=${days}`),
        api.get(`/analytics/calls?days=${days}`),
        api.get(`/analytics/team?days=${days}`),
      ]);
      setTaskStats(tasks.data);
      setCallStats(calls.data);
      setTeamStats(team.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [days]);

  if (loading) {
    return <Layout><p className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading analytics...</p></Layout>;
  }

  const statusData = taskStats?.byStatus?.map((s) => ({ name: s._id, value: s.count })) || [];
  const priorityData = taskStats?.byPriority?.map((s) => ({ name: s._id, value: s.count })) || [];
  const dailyCompleted = taskStats?.dailyCompleted?.map((d) => ({ date: d._id.slice(5), tasks: d.count })) || [];
  const dailyCalls = callStats?.dailyCalls?.map((d) => ({ date: d._id.slice(5), calls: d.count })) || [];
  const departmentData = teamStats?.departmentStats?.map((d) => ({ name: d._id || 'N/A', total: d.total, done: d.done })) || [];

  const totalTasks = statusData.reduce((s, d) => s + d.value, 0);
  const completedTasks = statusData.find((d) => d.name === 'done')?.value || 0;

  // Sparkline data from daily completed
  const sparkData = dailyCompleted.slice(-7).map((d) => ({ value: d.tasks }));

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Team performance overview</p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
                style={days === d
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards with Sparklines */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: totalTasks, color: '#ffffff', trend: null },
            { label: 'Completed', value: completedTasks, color: '#22c55e', trend: 'up' },
            { label: 'Meetings', value: teamStats?.meetingCount || 0, color: '#6366f1', trend: null },
            { label: 'Leave Requests', value: teamStats?.leaveCount || 0, color: '#8b5cf6', trend: null },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: s.color }}><AnimatedCounter value={s.value} /></p>
                </div>
                {sparkData.length > 1 && (
                  <StatSparkline data={sparkData} color={s.color} trend={s.trend} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Task Completion */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="font-semibold text-white mb-4">Daily Task Completion</h3>
            <AnimatedAreaChart data={dailyCompleted} dataKeys={['tasks']} xKey="date" />
          </div>

          {/* Task Status Distribution */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="font-semibold text-white mb-4">Task Status Distribution</h3>
            <AnimatedPieChart data={statusData} />
          </div>

          {/* Notification Volume */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="font-semibold text-white mb-4">Notification Volume</h3>
            <AnimatedLineChart data={dailyCalls} dataKeys={['calls']} xKey="date" />
          </div>

          {/* Department Performance */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="font-semibold text-white mb-4">Department Performance</h3>
            <AnimatedBarChart data={departmentData} dataKeys={['total', 'done']} xKey="name" showLegend />
          </div>
        </div>

        {/* Top Performers */}
        {teamStats?.topPerformers?.length > 0 && (
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="font-semibold text-white mb-4">Top Performers</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {teamStats.topPerformers.map((p, i) => {
                const rankColors = ['#eab308', '#9ca3af', '#f97316'];
                const rankColor = rankColors[i] || 'rgba(255,255,255,0.3)';
                return (
                  <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ color: rankColor, background: rankColor + '15' }}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white/80">{p.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.completed} tasks</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Priority Distribution */}
        {priorityData.length > 0 && (
          <div className="rounded-2xl p-6 mt-6" style={cardStyle}>
            <h3 className="font-semibold text-white mb-4">Task Priority Distribution</h3>
            <AnimatedBarChart data={priorityData} dataKeys={['value']} xKey="name" layout="vertical" height={200} />
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
