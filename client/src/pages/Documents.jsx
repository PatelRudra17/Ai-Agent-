import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Layout from '../components/Layout';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [askModal, setAskModal] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents');
      setDocs(data.documents);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded');
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAnswer('');
    try {
      const { data } = await api.post(`/documents/${askModal._id}/ask`, { question });
      setAnswer(data.answer);
    } catch {
      toast.error('AI query failed');
    } finally {
      setAsking(false);
    }
  };

  const handleSummary = async (docId) => {
    try {
      const { data } = await api.get(`/documents/${docId}/summary`);
      setAskModal(docs.find((d) => d._id === docId));
      setAnswer(data.summary);
      setQuestion('');
    } catch {
      toast.error('Summary failed');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Documents</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Upload PDF/DOCX and ask AI questions</p>
          </div>
          <label
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer ${uploading ? 'opacity-50' : ''}`}
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
          >
            {uploading ? 'Uploading...' : '+ Upload Document'}
            <input type="file" accept=".pdf,.docx,.txt,.csv" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            title="No documents uploaded"
            description="Upload a PDF, DOCX, or CSV to get started with AI Q&A"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5"
                style={cardStyle}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{doc.originalName}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatSize(doc.size)} — {new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setAskModal(doc); setAnswer(''); setQuestion(''); }}
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                    style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}>
                    Ask AI
                  </button>
                  <button onClick={() => handleSummary(doc._id)}
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                    style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)' }}>
                    Summary
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Ask AI Modal */}
        {askModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAskModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-semibold text-white">Ask about: {askModal.originalName}</h3>
                <button onClick={() => setAskModal(null)} className="text-white/40 hover:text-white/70 text-lg transition-colors">&times;</button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh]">
                <form onSubmit={handleAsk} className="flex gap-2">
                  <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about this document..."
                    className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={inputStyle} />
                  <button type="submit" disabled={asking}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
                    {asking ? '...' : 'Ask'}
                  </button>
                </form>
                {answer && (
                  <div className="rounded-xl p-4 text-sm whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {answer}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
