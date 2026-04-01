import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import GlowButton from '../components/ui/GlowButton';

const priorityColors = { critical: '#ef4444', high: '#f97316', medium: '#6366f1', low: '#6b7280' };
const statusColors = { pending: '#f59e0b', inprogress: '#6366f1', done: '#10b981', overdue: '#ef4444', cancelled: '#6b7280' };
const statusLabels = { pending: 'Pending', inprogress: 'In Progress', done: 'Done', overdue: 'Overdue', cancelled: 'Cancelled' };

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const isOwner = task?.assignedTo?._id === user?._id;

  const fetchTask = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data.task);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load task');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleAction = async (action) => {
    try {
      await api.patch(`/tasks/${id}/${action}`);
      toast.success(`Task ${action === 'start' ? 'started' : 'completed'}`);
      fetchTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await api.post(`/tasks/${id}/comment`, { text: comment });
      toast.success('Comment added');
      setComment('');
      fetchTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading task...</p>
        </div>
      </Layout>
    );
  }

  if (!task) return null;

  const timeline = [
    { label: 'Created', date: task.createdAt, active: true },
    { label: 'Started', date: task.status !== 'pending' ? task.updatedAt : null, active: ['inprogress', 'done'].includes(task.status) },
    { label: 'Completed', date: task.completedAt, active: task.status === 'done' },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button onClick={() => navigate('/tasks')} className="text-sm mb-6 flex items-center gap-2 transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span>&larr;</span> Back to Tasks
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ color: priorityColors[task.priority], background: priorityColors[task.priority] + '15' }}>
                {task.priority}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ color: statusColors[task.status], background: statusColors[task.status] + '15' }}>
                {statusLabels[task.status]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{task.title}</h1>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            {(isOwner && task.status === 'pending') && (
              <GlowButton onClick={() => handleAction('start')}>Start Task</GlowButton>
            )}
            {(isOwner && task.status === 'inprogress') && (
              <GlowButton variant="success" onClick={() => handleAction('complete')}>Complete Task</GlowButton>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {task.description && (
              <div className="rounded-2xl p-6" style={cardStyle}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Description</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{task.description}</p>
              </div>
            )}

            {/* Status Timeline */}
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Timeline</h3>
              <div className="flex items-center gap-2">
                {timeline.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full" style={{ background: step.active ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />
                      <p className="text-[10px] mt-1 font-medium" style={{ color: step.active ? '#a5b4fc' : 'rgba(255,255,255,0.2)' }}>{step.label}</p>
                      {step.date && <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{new Date(step.date).toLocaleDateString()}</p>}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className="w-16 h-0.5 mb-6" style={{ background: step.active ? '#6366f1' : 'rgba(255,255,255,0.06)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Comments ({task.comments?.length || 0})
              </h3>

              {task.comments?.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {task.comments.map((c, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white/70">{c.userId?.name || 'Unknown'}</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>No comments yet</p>
              )}

              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none placeholder-white/20"
                  style={inputStyle}
                />
                <GlowButton type="submit" loading={commenting} disabled={!comment.trim()}>Post</GlowButton>
              </form>
            </div>
          </div>

          {/* Right Column — Details Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Assigned To</p>
                  <p className="text-sm text-white/80">{task.assignedTo?.name || '—'}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{task.assignedTo?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Assigned By</p>
                  <p className="text-sm text-white/80">{task.assignedBy?.name || '—'}</p>
                </div>
                {task.dueDate && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Due Date</p>
                    <p className="text-sm" style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? '#ef4444' : 'rgba(255,255,255,0.8)' }}>
                      {new Date(task.dueDate).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Queue Order</p>
                  <p className="text-sm text-white/80">#{task.queueOrder || '—'}</p>
                </div>
                {task.tags?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {task.escalationLevel > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Escalation Level</p>
                    <p className="text-sm font-bold" style={{ color: '#ef4444' }}>Level {task.escalationLevel}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Created</p>
                  <p className="text-sm text-white/80">{new Date(task.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
