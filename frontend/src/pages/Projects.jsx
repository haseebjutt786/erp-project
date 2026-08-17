import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import Badge from '../components/ui/Badge.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { getAllProjects, createProject, updateProject, deleteProject, getAllEmployees } from '../services/api.js';

const STATUS_LABELS = { active:'Active', on_hold:'On Hold', completed:'Completed' };
const STATUS_VARIANTS = { active:'green', on_hold:'yellow', completed:'blue' };
const EMPTY = { name:'', description:'', status:'active', deadline:'', members:[] };

export default function Projects() {
  const [projects, setProjects]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [pR, eR] = await Promise.all([getAllProjects(), getAllEmployees()]);
      setProjects(pR.data);
      setEmployees(eR.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditingId(null); setForm(EMPTY); setModal(true); };
  const openEdit = (p) => { setEditingId(p._id); setForm({ name:p.name, description:p.description||'', status:p.status, deadline:p.deadline?p.deadline.slice(0,10):'', members:p.members.map(m=>m._id) }); setModal(true); };

  const toggleMember = (id) => setForm(f => ({ ...f, members: f.members.includes(id) ? f.members.filter(m=>m!==id) : [...f.members, id] }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, deadline: form.deadline || null };
      if (editingId) { await updateProject(editingId, payload); toast.success('Project updated'); }
      else           { await createProject(payload);            toast.success('Project created'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try { await deleteProject(p._id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const ACCENT_COLORS = ['#466ae6','#ff7b0d','#18a04b','#7b4fa0','#eb0910','#0096c7'];
  const filtered = projects.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Projects</h2>
          <p className="text-sm text-gray-400 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-orange text-white px-4 py-2.5 rounded-lg text-sm font-700 hover:shadow-glow transition-all">
          <i className="ti ti-plus" /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative w-72">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
          <i className="ti ti-folder text-gray-200 text-5xl mb-3 block" />
          <p className="text-gray-500 font-600">No projects yet</p>
          <button onClick={openAdd} className="mt-4 text-sm text-brand-400 font-600 hover:text-brand-500 transition-colors">Create first project →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const pct    = p.taskCount > 0 ? Math.round((p.tasksDone / p.taskCount) * 100) : 0;
            const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
            return (
              <motion.div key={p._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
                className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden hover:shadow-hover hover:-translate-y-0.5 transition-all">
                <div className="h-1.5" style={{ background: accent }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent+'18' }}>
                        <i className="ti ti-folder text-lg" style={{ color: accent }} />
                      </div>
                      <div>
                        <p className="text-sm font-700 text-gray-800 dark:text-gray-200">{p.name}</p>
                        <Badge label={STATUS_LABELS[p.status]} variant={STATUS_VARIANTS[p.status] || 'gray'} />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">{p.description || 'No description.'}</p>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-600 text-gray-600 dark:text-gray-300">{p.tasksDone}/{p.taskCount} tasks</span>
                    </div>
                    <ProgressBar value={pct} color={accent} height={6} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <i className="ti ti-calendar text-xs" />
                      <span>{p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No deadline'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="ti ti-users text-xs" />
                      <span>{p.members.length} member{p.members.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-gray-50 dark:border-dark-border pt-3">
                    <button onClick={() => openEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-600 text-blue-600 bg-blue-50 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      <i className="ti ti-edit text-xs" /> Edit
                    </button>
                    <button onClick={() => handleDelete(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-600 text-red-500 bg-red-50 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                      <i className="ti ti-trash text-xs" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setModal(false)}>
            <motion.form initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              transition={{ duration:0.2 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()} onSubmit={handleSave}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">{editingId ? 'Edit Project' : 'New Project'}</h3>
                <button type="button" onClick={() => setModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                  <i className="ti ti-x text-sm" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Project name"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Brief description..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Deadline</label>
                    <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Team Members</label>
                  <div className="border border-gray-200 dark:border-dark-border rounded-lg max-h-36 overflow-y-auto p-2 bg-white dark:bg-dark-surface">
                    {employees.map(emp => (
                      <label key={emp._id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-dark-surface rounded-lg cursor-pointer">
                        <input type="checkbox" checked={form.members.includes(emp._id)} onChange={() => toggleMember(emp._id)}
                          className="w-4 h-4 accent-orange-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{emp.fullName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border flex-shrink-0">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors font-600">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                  {saving ? <><i className="ti ti-loader-2 animate-spin" /> Saving...</> : <><i className="ti ti-check" /> {editingId ? 'Update' : 'Create'}</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
