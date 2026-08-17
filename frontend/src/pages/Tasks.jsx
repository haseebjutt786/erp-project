import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyTasks, getAllTasks, createTask, updateTaskStatus, getAllProjects, getAllEmployees } from '../services/api.js';

const STATUSES = { not_started:'Not Started', in_progress:'In Progress', done:'Done' };
const STATUS_COLORS = { not_started:'gray', in_progress:'blue', done:'green' };
const EMPTY = { title:'', project:'', dueDate:'', assignedTo:'' };

export default function Tasks() {
  const { user }  = useAuth();
  const isAdmin   = !!user?.isAdmin;
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const [tasksRes, projRes] = await Promise.all([
        isAdmin ? getAllTasks(params) : getMyTasks(),
        getAllProjects(),
      ]);
      setTasks(tasksRes.data);
      setProjects(projRes.data);
      if (isAdmin) {
        const empRes = await getAllEmployees();
        setEmployees(empRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title:form.title, project:form.project || 'General', dueDate:form.dueDate || undefined };
      if (isAdmin && form.assignedTo) payload.assignedTo = form.assignedTo;
      await createTask(payload);
      toast.success('Task created');
      setModal(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleStatus = async (task, status) => {
    try { await updateTaskStatus(task._id, status); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.project?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all:          tasks.length,
    not_started:  tasks.filter(t => t.status === 'not_started').length,
    in_progress:  tasks.filter(t => t.status === 'in_progress').length,
    done:         tasks.filter(t => t.status === 'done').length,
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">{isAdmin ? 'All Tasks' : 'My Tasks'}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-gradient-orange text-white px-4 py-2.5 rounded-lg text-sm font-700 hover:shadow-glow transition-all">
          <i className="ti ti-plus" /> New Task
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[['all','All','gray'],['not_started','Not Started','gray'],['in_progress','In Progress','blue'],['done','Done','green']].map(([s, l, c]) => (
          <button key={s} onClick={() => setStatusFilter(s === 'all' ? '' : s)}
            className={`p-3 rounded-xl border text-left transition-all ${(statusFilter === s || (s === 'all' && !statusFilter)) ? 'border-brand-400 bg-brand-50 dark:bg-brand-400/10' : 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border'} shadow-card`}>
            <p className={`text-lg font-800 ${c === 'blue' ? 'text-blue-600' : c === 'green' ? 'text-green-600' : 'text-gray-700 dark:text-gray-200'}`}>{counts[s]}</p>
            <p className="text-xs text-gray-400 mt-0.5">{l}</p>
          </button>
        ))}
      </div>

      {/* Search + Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 dark:border-dark-border">
          <div className="relative w-64">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <i className="ti ti-list-check text-gray-200 text-5xl mb-3 block" />
            <p className="text-gray-500 font-600">No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-dark-border">
            {filtered.map((task, i) => {
              const isOverdue = task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <motion.div key={task._id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.04 }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${task.status === 'done' ? 'bg-green-400' : task.status === 'in_progress' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-600 truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{task.project || 'General'}</span>
                        {isAdmin && task.assignedTo && (
                          <span className="text-xs text-gray-400">· {task.assignedTo.fullName}</span>
                        )}
                        {task.dueDate && (
                          <span className={`text-xs ${isOverdue ? 'text-red-500 font-600' : 'text-gray-400'}`}>
                            · {isOverdue ? '⚠ Overdue' : ''} {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <select value={task.status} onChange={e => handleStatus(task, e.target.value)}
                    className={`text-xs font-600 px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-all
                      ${task.status === 'done' ? 'bg-green-50 text-green-600' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setModal(false)}>
            <motion.form initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.95, opacity:0 }} transition={{ duration:0.2 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()} onSubmit={handleCreate}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">New Task</h3>
                <button type="button" onClick={() => setModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                  <i className="ti ti-x text-sm" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title:e.target.value})}
                    placeholder="Task title..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Project</label>
                  <select value={form.project} onChange={e => setForm({...form, project:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                    <option value="">General</option>
                    {projects.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Assign To</label>
                    <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      <option value="">Myself</option>
                      {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.fullName}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors font-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                  {saving ? <><i className="ti ti-loader-2 animate-spin" /> Creating...</> : <><i className="ti ti-check" /> Create</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
