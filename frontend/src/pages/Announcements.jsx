import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAnnouncements, createAnnouncement,
  updateAnnouncement, deleteAnnouncement,
} from '../services/api.js';

const TYPE_STYLES = {
  info:    { icon:'ti-info-circle',    bg:'bg-blue-50',   text:'text-blue-500',   border:'border-l-blue-400',   badge:'bg-blue-100 text-blue-600' },
  success: { icon:'ti-check-circle',   bg:'bg-green-50',  text:'text-green-500',  border:'border-l-green-400',  badge:'bg-green-100 text-green-600' },
  warning: { icon:'ti-alert-triangle', bg:'bg-yellow-50', text:'text-yellow-500', border:'border-l-yellow-400', badge:'bg-yellow-100 text-yellow-700' },
  danger:  { icon:'ti-alert-circle',   bg:'bg-red-50',    text:'text-red-500',    border:'border-l-red-400',    badge:'bg-red-100 text-red-600' },
};
const EMPTY_FORM = { title:'', body:'', type:'info', audience:'all', isPinned:false };

export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination]       = useState({ page:1, pages:1, total:0 });
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [typeFilter, setTypeFilter]       = useState('');
  const [page, setPage]                   = useState(1);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:8 };
      if (search)     params.search = search;
      if (typeFilter) params.type   = typeFilter;
      const { data } = await getAnnouncements(params);
      setAnnouncements(data.announcements);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (a) => { setEditingId(a._id); setForm({ title:a.title, body:a.body, type:a.type, audience:a.audience||'all', isPinned:a.isPinned||false }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error('Title and body are required');
    setSaving(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, form);
        toast.success('Announcement updated');
      } else {
        await createAnnouncement(form);
        toast.success('Announcement published');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Announcements</h2>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} announcement{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-orange text-white px-4 py-2.5 rounded-lg text-sm font-700 hover:shadow-glow transition-all">
            <i className="ti ti-plus" /> New Announcement
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
          <option value="">All Types</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="danger">Danger</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center">
          <i className="ti ti-speakerphone text-gray-200 text-5xl mb-3 block" />
          <p className="text-gray-500 font-600">No announcements found</p>
          {isAdmin && (
            <button onClick={openCreate} className="mt-4 text-sm text-brand-400 font-600 hover:text-brand-500 transition-colors">
              Publish first announcement →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {announcements.map((a, i) => {
              const s = TYPE_STYLES[a.type] || TYPE_STYLES.info;
              return (
                <motion.div key={a._id}
                  initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, height:0 }} transition={{ delay: i * 0.04 }}
                  className={`bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border border-l-4 ${s.border} rounded-xl p-5 shadow-card`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                      <i className={`ti ${s.icon} text-lg ${s.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">{a.title}</h3>
                          {a.isPinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-brand-50 text-brand-400 font-600 px-2 py-0.5 rounded-full">
                              <i className="ti ti-pin text-xs" /> Pinned
                            </span>
                          )}
                          <span className={`text-[10px] font-600 px-2 py-0.5 rounded-full ${s.badge}`}>{a.type}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                          {isAdmin && (
                            <>
                              <button onClick={() => openEdit(a)}
                                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                <i className="ti ti-edit text-xs" />
                              </button>
                              <button onClick={() => handleDelete(a._id)}
                                className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                                <i className="ti ti-trash text-xs" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{a.body}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-gray-400">By {a.postedBy?.fullName || 'Admin'}</span>
                        {a.audience !== 'all' && (
                          <span className="text-xs bg-gray-100 dark:bg-dark-surface text-gray-500 px-2 py-0.5 rounded-full">
                            {a.audience}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p-1)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-gray-600 dark:text-gray-300">
            <i className="ti ti-chevron-left" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 px-3">
            Page {page} of {pagination.pages}
          </span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(p => p+1)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-gray-600 dark:text-gray-300">
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setModalOpen(false)}>
            <motion.form initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.95, opacity:0 }} transition={{ duration:0.2 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()} onSubmit={handleSave}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">
                  {editingId ? 'Edit Announcement' : 'New Announcement'}
                </h3>
                <button type="button" onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                  <i className="ti ti-x text-sm" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-700 text-gray-600 dark:text-gray-400 mb-1.5">Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title:e.target.value})}
                    placeholder="Announcement title..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400" />
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-600 dark:text-gray-400 mb-1.5">Body *</label>
                  <textarea required rows={4} value={form.body} onChange={e => setForm({...form, body:e.target.value})}
                    placeholder="Write the announcement content..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-700 text-gray-600 dark:text-gray-400 mb-1.5">Type</label>
                    <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="danger">Danger</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-700 text-gray-600 dark:text-gray-400 mb-1.5">Audience</label>
                    <input value={form.audience} onChange={e => setForm({...form, audience:e.target.value})}
                      placeholder="all / dept name"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm({...form, isPinned:e.target.checked})}
                    className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Pin this announcement</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors font-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                  {saving ? <><i className="ti ti-loader-2 animate-spin" /> Saving...</> : <><i className="ti ti-check" /> {editingId ? 'Update' : 'Publish'}</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
