import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';
import AnimatedCounter from '../components/ui/AnimatedCounter';

export default function Reports() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eodText, setEodText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const navigate = useNavigate();
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const fetchReports = async () => {
    if (!isManager) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/reports');
      setReports(data.reports);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleEODSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/reports/eod-submit', { update: eodText });
      toast.success(`EOD submitted! Tasks completed today: ${data.completedToday}`);
      setEodText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const { data } = await api.post('/reports/generate', {});
      toast.success('Report generated');
      fetchReports();
      setSelectedReport(data.report);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{isManager ? 'View daily/weekly reports' : 'Submit your EOD update'}</p>
          </div>
          {isManager && (
            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
            >
              Generate Today's Report
            </button>
          )}
        </div>

        {/* EOD Submit form (all roles) */}
        <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
          <h2 className="text-lg font-semibold text-white mb-3">Submit EOD Update</h2>
          <form onSubmit={handleEODSubmit} className="space-y-3">
            <textarea
              value={eodText}
              onChange={(e) => setEodText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
              style={inputStyle}
              rows={4}
              placeholder="What did you accomplish today? Any blockers?"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}
            >
              {submitting ? 'Submitting...' : 'Submit EOD Update'}
            </button>
          </form>
        </div>

        {/* Report view (selected) */}
        {selectedReport && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 mb-6" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Report — {new Date(selectedReport.date).toLocaleDateString()}
              </h2>
              <button onClick={() => setSelectedReport(null)} className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Close</button>
            </div>
            {selectedReport.aiSummary && (
              <p className="text-sm mb-4 p-3 rounded-xl" style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
                {selectedReport.aiSummary}
              </p>
            )}
            <div dangerouslySetInnerHTML={{ __html: selectedReport.reportHtml }} className="text-sm text-white/70" />
          </motion.div>
        )}

        {/* Reports list (managers) */}
        {isManager && (
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Date</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Type</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Submissions</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Tasks Done</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Emailed</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No reports yet</td></tr>
                ) : (
                  reports.map((r) => {
                    const typeBadgeColor = r.type === 'weekly' ? '#8b5cf6' : '#6366f1';
                    return (
                      <tr key={r._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-6 py-4 text-sm text-white/80">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize" style={{ color: typeBadgeColor, background: typeBadgeColor + '15' }}>
                            {r.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.employeeUpdates?.length || 0}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.tasksCompleted || 0}</td>
                        <td className="px-6 py-4 text-sm">
                          {r.sentToManager
                            ? <span style={{ color: '#22c55e' }}>Yes</span>
                            : <span style={{ color: 'rgba(255,255,255,0.3)' }}>No</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => navigate(`/reports/${r._id}`)} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
