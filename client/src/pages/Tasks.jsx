import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import ExportButton from '../components/ui/ExportButton';
import ModeToggle from '../components/ui/ModeToggle';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const STATUS_COLS = [
  { key: 'pending', label: 'Pending', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.15)' },
  { key: 'inprogress', label: 'In Progress', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', glow: 'rgba(99,102,241,0.15)' },
  { key: 'done', label: 'Done', gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.15)' },
  { key: 'overdue', label: 'Overdue', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.15)' },
];
const priorityColors = { critical: '#ef4444', high: '#f97316', medium: '#6366f1', low: '#6b7280' };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function Tasks() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', tags: '' });
  const [assignMode, setAssignMode] = useState('automation');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const navigate = useNavigate();
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const fetchTasks = async () => { setLoading(true); try { const ep = isManager ? '/tasks/team?limit=100' : '/tasks/my'; const { data } = await api.get(ep); setTasks(data.tasks); } catch {} finally { setLoading(false); } };
  const fetchStats = async () => { if (!isManager) return; try { const { data } = await api.get('/tasks/dashboard'); setStats(data.stats); } catch {} };
  const fetchEmployees = async () => { if (!isManager) return; try { const { data } = await api.get('/users?limit=100'); setEmployees(data.users); } catch {} };
  useEffect(() => { fetchTasks(); fetchStats(); fetchEmployees(); }, []);

  const handleAISuggest = async () => {
    if (!form.title) { toast.error('Enter a title first'); return; }
    setSuggestLoading(true); setAiSuggestion(null);
    try {
      const { data } = await api.post('/tasks/suggest-assignee', { title: form.title, description: form.description, priority: form.priority, dueDate: form.dueDate });
      setAiSuggestion(data.suggestion);
      if (data.suggestion?.employee?._id) setForm((f) => ({ ...f, assignedTo: data.suggestion.employee._id }));
    } catch { toast.error('AI suggestion failed'); }
    setSuggestLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/tasks', { ...form, tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [] }); toast.success('Task created'); setShowForm(false); setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', tags: '' }); setAiSuggestion(null); fetchTasks(); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAction = async (taskId, action) => {
    try { await api.patch(`/tasks/${taskId}/${action}`); toast.success(`Task ${action === 'start' ? 'started' : 'completed'}`); fetchTasks(); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const tasksByStatus = (s) => tasks.filter((t) => t.status === s);

  const handleDragEnd = async (result) => {
    if (!result.destination || !isManager) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const task = tasks.find((t) => t._id === draggableId);
    if (!task || task.status === newStatus) return;
    // Optimistic update
    setTasks((prev) => prev.map((t) => t._id === draggableId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
      fetchStats();
    } catch {
      toast.error('Failed to update status');
      fetchTasks();
    }
  };
  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' };
  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.h1 {...fadeUp} className="text-2xl font-bold text-white">Tasks</motion.h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{isManager ? 'Team task board' : 'My task queue'}</p>
        </div>
        <div className="flex gap-3">
          {isManager && <ExportButton endpoint="/tasks/export" filename="tasks.csv" label="Export CSV" />}
          {isManager && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowForm(!showForm)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
              {showForm ? 'Cancel' : '+ Create Task'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats */}
      {isManager && stats.total !== undefined && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[{ l: 'Total', v: stats.total, c: '#fff' }, { l: 'Pending', v: stats.pending, c: '#f59e0b' }, { l: 'In Progress', v: stats.inprogress, c: '#6366f1' }, { l: 'Done', v: stats.done, c: '#10b981' }, { l: 'Overdue', v: stats.overdue, c: '#ef4444' }, { l: 'Critical', v: stats.critical, c: '#ef4444' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl p-3 text-center" style={cardStyle}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.l}</p>
              <p className="text-xl font-bold mt-1" style={{ color: s.c }}><AnimatedCounter end={s.v || 0} /></p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate} className="rounded-2xl p-6 mb-6 space-y-4 overflow-hidden" style={cardStyle}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} required /></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Assign To</label>
                  <ModeToggle size="small" mode={assignMode} onChange={(m) => { setAssignMode(m); if (m === 'ai') handleAISuggest(); }} />
                </div>
                {assignMode === 'automation' ? (
                  <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} required><option value="">Select...</option>{employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}</select>
                ) : (
                  <div>
                    {suggestLoading ? (
                      <div className="px-4 py-3 rounded-xl text-xs animate-pulse" style={{ ...inputStyle, color: '#a78bfa' }}>AI is analyzing team workload...</div>
                    ) : aiSuggestion ? (
                      <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-300">AI Recommends: {aiSuggestion.employee?.name || aiSuggestion.suggestedEmployee}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: aiSuggestion.confidence === 'high' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: aiSuggestion.confidence === 'high' ? '#34d399' : '#fbbf24' }}>{aiSuggestion.confidence}</span>
                        </div>
                        <p className="text-[10px] text-white/40">{aiSuggestion.reason}</p>
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => {}} className="text-[10px] px-3 py-1 rounded-lg font-semibold" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>Accept</button>
                          <button type="button" onClick={() => setAssignMode('automation')} className="text-[10px] px-3 py-1 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>Choose Manually</button>
                        </div>
                        {aiSuggestion.alternatives?.length > 0 && (
                          <div className="pt-1"><p className="text-[9px] text-white/25">Alternatives: {aiSuggestion.alternatives.map((a) => `${a.employee?.name || a.name}`).join(', ')}</p></div>
                        )}
                      </div>
                    ) : (
                      <button type="button" onClick={handleAISuggest} className="w-full px-4 py-3 rounded-xl text-xs font-medium" style={{ ...inputStyle, color: '#a78bfa' }}>Click to get AI suggestion</button>
                    )}
                    <input type="hidden" value={form.assignedTo} required />
                  </div>
                )}
              </div>
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Due Date</label><input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} /></div>
            </div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} rows={2} /></div>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 16px rgba(99,102,241,0.3)' }}>Create Task</button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Kanban */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="rounded-2xl p-4 min-h-[200px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-20 w-full mb-2" count={3} />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          title="No tasks yet"
          description={isManager ? "Create your first task to get started" : "No tasks assigned to you yet"}
          actionLabel={isManager ? "Create Task" : undefined}
          onAction={isManager ? () => setShowForm(true) : undefined}
        />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLS.map((col) => (
            <Droppable key={col.key} droppableId={col.key} isDropDisabled={!isManager}>
              {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                className="rounded-2xl p-4 min-h-[200px] transition-colors"
                style={{ background: snapshot.isDraggingOver ? col.glow.replace('0.15', '0.25') : col.glow, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.gradient }} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">{col.label} ({tasksByStatus(col.key).length})</h3>
                </div>
                <div className="space-y-2">
                  {tasksByStatus(col.key).map((task, i) => (
                    <Draggable key={task._id} draggableId={task._id} index={i} isDragDisabled={!isManager}>
                      {(dragProvided, dragSnapshot) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                        onClick={() => navigate(`/tasks/${task._id}`)}
                        className="rounded-xl p-3 transition-all hover:scale-[1.02] cursor-pointer"
                        style={{ ...cardStyle, ...(dragSnapshot.isDragging ? { boxShadow: '0 8px 25px rgba(99,102,241,0.3)', transform: 'rotate(2deg)' } : {}), ...dragProvided.draggableProps.style }}>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-white/90">{task.title}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0" style={{ color: priorityColors[task.priority], background: priorityColors[task.priority] + '15' }}>{task.priority}</span>
                        </div>
                        {task.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{task.description}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{isManager ? task.assignedTo?.name : ''} {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''}</span>
                          {task.status === 'pending' && <button onClick={(e) => { e.stopPropagation(); handleAction(task._id, 'start'); }} className="text-[10px] px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Start</button>}
                          {task.status === 'inprogress' && <button onClick={(e) => { e.stopPropagation(); handleAction(task._id, 'complete'); }} className="text-[10px] px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>Done</button>}
                        </div>
                      </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
              )}
            </Droppable>
          ))}
        </div>
        </DragDropContext>
      )}
    </Layout>
  );
}
