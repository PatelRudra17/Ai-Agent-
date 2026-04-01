import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function MeetingsWidget() {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/meetings');
        const upcoming = data.meetings
          .filter((m) => new Date(m.scheduledAt) >= new Date())
          .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
          .slice(0, 3);
        setMeetings(upcoming);
      } catch {}
    };
    fetch();
  }, []);

  const timeUntil = (date) => {
    const diff = new Date(date) - new Date();
    if (diff < 0) return 'Started';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Upcoming Meetings</h3>
        <button onClick={() => navigate('/meetings')} className="text-[10px] font-medium" style={{ color: '#8b5cf6' }}>View All</button>
      </div>
      {meetings.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>No upcoming meetings</p>
      ) : (
        <div className="space-y-2">
          {meetings.map((m, i) => (
            <motion.div key={m._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="p-2.5 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{m.title}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(m.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-[10px] font-bold shrink-0 ml-2 rounded-md px-1.5 py-0.5"
                  style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.15)' }}>
                  {timeUntil(m.scheduledAt)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
