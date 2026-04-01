import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/reports/${id}`);
        setReport(data.report);
      } catch (err) {
        toast.error('Failed to load report');
        navigate('/reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading report...</p>
        </div>
      </Layout>
    );
  }

  if (!report) return null;

  const typeBadgeColor = report.type === 'weekly' ? '#8b5cf6' : '#6366f1';

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate('/reports')} className="text-sm mb-6 flex items-center gap-2 transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span>&larr;</span> Back to Reports
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ color: typeBadgeColor, background: typeBadgeColor + '15' }}>
                {report.type}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Report — {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>{report.employeeUpdates?.length || 0} submissions</span>
            <span>{report.tasksCompleted || 0} tasks done</span>
          </div>
        </div>

        {/* AI Summary */}
        {report.aiSummary && (
          <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#818cf8' }}>AI Summary</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{report.aiSummary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Highlights */}
          {report.highlights?.length > 0 && (
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#10b981' }}>Highlights</h3>
              <ul className="space-y-2">
                {report.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5" style={{ color: '#10b981' }}>&#9679;</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Blockers */}
          {report.blockers?.length > 0 && (
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#f59e0b' }}>Blockers</h3>
              <ul className="space-y-2">
                {report.blockers.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5" style={{ color: '#f59e0b' }}>&#9888;</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {b.userId?.name && <span className="font-medium text-white/70">{b.userId.name}: </span>}
                      {b.issue || b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Employee Updates */}
        {report.employeeUpdates?.length > 0 && (
          <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Employee Updates ({report.employeeUpdates.length})
            </h3>
            <div className="space-y-3">
              {report.employeeUpdates.map((u, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white/70">{u.userId?.name || 'Employee'}</span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {u.submittedAt ? new Date(u.submittedAt).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{u.update}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HTML Report Content */}
        {report.reportHtml && (
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Full Report</h3>
            <div dangerouslySetInnerHTML={{ __html: report.reportHtml }} className="text-sm text-white/70 prose prose-invert max-w-none" />
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
