import { useEffect, useState } from 'react';
import api from '../../services/api';
import ModeToggle from '../ui/ModeToggle';

const priorityStyles = {
  urgent: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', dot: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  info: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', dot: '#6366f1' },
};

export default function AIInsightsWidget() {
  const [mode, setMode] = useState('automation');
  const [insights, setInsights] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);

  // Automation mode: basic stats
  useEffect(() => {
    const fetchBasic = async () => {
      const cached = localStorage.getItem('ai_insights');
      const cacheTime = localStorage.getItem('ai_insights_time');
      const now = Date.now();

      if (cached && cacheTime && now - parseInt(cacheTime) < 24 * 60 * 60 * 1000) {
        setInsights(JSON.parse(cached));
        return;
      }

      try {
        const { data } = await api.get('/analytics/tasks?days=7');
        const totalTasks = data.byStatus?.reduce((s, d) => s + d.count, 0) || 0;
        const completed = data.byStatus?.find((s) => s._id === 'done')?.count || 0;
        const overdue = data.byStatus?.find((s) => s._id === 'overdue')?.count || 0;
        const rate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

        const summary = {
          completionRate: rate,
          totalTasks,
          completed,
          overdue,
          tip: rate >= 80 ? 'Great pace! Team is performing well.' :
               rate >= 50 ? 'Steady progress. Consider prioritizing overdue tasks.' :
               'Several tasks need attention. Focus on high-priority items.',
        };

        setInsights(summary);
        localStorage.setItem('ai_insights', JSON.stringify(summary));
        localStorage.setItem('ai_insights_time', now.toString());
      } catch {
        setInsights({ tip: 'Unable to load insights', completionRate: 0, totalTasks: 0, completed: 0, overdue: 0 });
      }
    };
    fetchBasic();
  }, []);

  // AI mode: morning briefing
  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/analytics/morning-briefing');
      setBriefing(data.briefing);
    } catch {
      setBriefing(null);
    }
    setLoading(false);
  };

  const handleModeChange = (m) => {
    setMode(m);
    if (m === 'ai' && !briefing) fetchBriefing();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {mode === 'ai' ? 'AI Briefing' : 'Insights (7d)'}
        </h3>
        <ModeToggle size="small" mode={mode} onChange={handleModeChange} />
      </div>

      {/* Automation Mode */}
      {mode === 'automation' && insights && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${insights.completionRate >= 70 ? '#22c55e' : '#f59e0b'}, ${insights.completionRate >= 70 ? '#16a34a' : '#d97706'})` }}>
              <span className="text-sm font-bold text-white">{insights.completionRate}%</span>
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Completion Rate</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {insights.completed}/{insights.totalTasks} tasks done
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{insights.tip}</p>
          </div>

          {insights.overdue > 0 && (
            <p className="text-[10px] font-medium" style={{ color: '#ef4444' }}>
              {insights.overdue} overdue task{insights.overdue > 1 ? 's' : ''} need attention
            </p>
          )}
        </div>
      )}

      {mode === 'automation' && !insights && (
        <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading insights...</p>
      )}

      {/* AI Mode — Morning Briefing */}
      {mode === 'ai' && loading && (
        <div className="space-y-2 py-4">
          <div className="h-3 rounded-full animate-pulse" style={{ background: 'rgba(139,92,246,0.15)', width: '80%' }} />
          <div className="h-3 rounded-full animate-pulse" style={{ background: 'rgba(139,92,246,0.1)', width: '60%' }} />
          <div className="h-3 rounded-full animate-pulse" style={{ background: 'rgba(139,92,246,0.08)', width: '70%' }} />
          <p className="text-[10px] text-purple-400 animate-pulse mt-2">AI is analyzing your team data...</p>
        </div>
      )}

      {mode === 'ai' && !loading && briefing && (
        <div className="space-y-2">
          {/* Summary */}
          {briefing.summary && (
            <div className="p-2.5 rounded-xl mb-2" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
              <p className="text-[10px] text-white/60">{briefing.summary}</p>
            </div>
          )}

          {/* Briefing Items */}
          {briefing.items?.map((item, i) => {
            const style = priorityStyles[item.priority] || priorityStyles.info;
            return (
              <div key={i} className="p-2.5 rounded-xl" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: style.dot }} />
                  <div>
                    <p className="text-[11px] font-semibold text-white/80">{item.title}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{item.detail}</p>
                    {item.action && <p className="text-[9px] text-purple-400 mt-1">{item.action}</p>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Productivity Trend */}
          {briefing.productivityTrend && (
            <p className="text-[10px] font-medium mt-1" style={{ color: briefing.productivityTrend === 'up' ? '#22c55e' : briefing.productivityTrend === 'down' ? '#ef4444' : '#f59e0b' }}>
              Productivity: {briefing.productivityTrend === 'up' ? 'Trending up' : briefing.productivityTrend === 'down' ? 'Trending down' : 'Stable'}
            </p>
          )}

          <button onClick={fetchBriefing} className="text-[9px] text-purple-400/60 hover:text-purple-400 transition-colors mt-1">
            Refresh briefing
          </button>
        </div>
      )}

      {mode === 'ai' && !loading && !briefing && (
        <div className="text-center py-4">
          <p className="text-xs text-white/30">Click to load AI briefing</p>
          <button onClick={fetchBriefing} className="text-xs text-purple-400 mt-2">Load Briefing</button>
        </div>
      )}
    </div>
  );
}
