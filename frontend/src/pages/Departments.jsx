import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment, getAllEmployees } from '../services/api.js';

const EMPTY = { name: '', description: '', manager: '' };

const CARD_ACCENTS = [
  { accent: '#ff7b0d', iconBg: 'bg-orange-50 dark:bg-orange-900/20', iconColor: 'text-brand-400' },
  { accent: '#466ae6', iconBg: 'bg-blue-50 dark:bg-blue-900/20',   iconColor: 'text-blue-500' },
  { accent: '#18a04b', iconBg: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-500' },
  { accent: '#7b4fa0', iconBg: 'bg-purple-50 dark:bg-purple-900/20',iconColor: 'text-purple-500' },
  { accent: '#eb0910', iconBg: 'bg-red-50 dark:bg-red-900/20',     iconColor: 'text-red-500' },
  { accent: '#0096c7', iconBg: 'bg-teal-50 dark:bg-teal-900/20',   iconColor: 'text-teal-500' },
];

export default function Departments() {
  const [departments, setDepts]   = useState([]);
  const [employees,   setEmps]    = useState([]);
  const [loading,     setLoading] = useState(true);
  const [modal,       setModal]   = useState(false);
  const [editingId,   setEditId]  = useState(null);
  const [form,        setForm]    = useState(EMPTY);
  const [saving,      setSaving]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dR, eR] = await Promise.all([getAllDepartments(), getAllEmployees()]);
      setDepts(dR.data);
      setEmps(eR.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditId(null); setForm(EMPTY); setModal(true); };
  const openEdit = (d) => {
    setEditId(d._id);
    setForm({ name: d.name, description: d.description || '', manager: d.manager?._id || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, manager: form.manager || null };
      if (editingId) { await updateDepartment(editingId, payload); toast.success('Department updated'); }
      else           { await createDepartment(payload);            toast.success('Department created'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete "${dept.name}"?`)) return;
    try { await deleteDepartment(dept._id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Departments</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {departments.length} department{departments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-orange text-white px-4 py-2.5 rounded-lg text-sm font-700 hover:shadow-glow transition-all">
          <i className="ti ti-plus" /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card flex flex-col items-center">
          <i className="ti ti-building text-gray-200 dark:text-gray-600 text-5xl mb-3" />
          <p className="text-gray-600 dark:text-gray-300 font-700">No departments yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add your first department to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept, i) => {
            const c = CARD_ACCENTS[i % CARD_ACCENTS.length];
            return (
              <motion.div key={dept._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden hover:shadow-hover hover:-translate-y-0.5 transition-all">
                {/* Top accent bar */}
                <div className="h-1" style={{ background: c.accent }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                      <i className={`ti ti-building text-xl ${c.iconColor}`} />
                    </div>
                    <span className="text-xs font-600 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-surface px-2 py-1 rounded-full">
                      {dept.employeeCount} {dept.employeeCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <h3 className="text-base font-700 text-gray-800 dark:text-gray-100 mb-1">{dept.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 min-h-[32px] line-clamp-2">
                    {dept.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <i className="ti ti-user-star text-xs" />
                    <span>{dept.manager ? dept.manager.fullName : 'No manager assigned'}</span>
                  </div>
                </div>
                <div className="flex gap-2 px-5 pb-4 pt-3 border-t border-gray-50 dark:border-dark-border">
                  <button onClick={() => openEdit(dept)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <i className="ti ti-edit text-xs" /> Edit
                  </button>
                  <button onClick={() => handleDelete(dept)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-600 text-red-500 bg-red-50 dark:bg-red-900/20 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <i className="ti ti-trash text-xs" /> Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4"
            onClick={() => setModal(false)}>
            <motion.form initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()} onSubmit={handleSave}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">
                  {editingId ? 'Edit Department' : 'Add Department'}
                </h3>
                <button type="button" onClick={() => setModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
                  <i className="ti ti-x text-sm" />
                </button>
              </div>
              {/* Body */}
              <div className="p-6 space-y-4">
                <F label="Department Name *">
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Engineering" className="input-style" />
                </F>
                <F label="Description">
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description..." className="input-style resize-none" />
                </F>
                <F label="Manager (optional)">
                  <select value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className="input-style">
                    <option value="">No manager</option>
                    {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.fullName}</option>)}
                  </select>
                </F>
              </div>
              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors font-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                  {saving ? <><i className="ti ti-loader-2 animate-spin" /> Saving...</> : <><i className="ti ti-check" /> {editingId ? 'Update' : 'Save'}</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function F({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
