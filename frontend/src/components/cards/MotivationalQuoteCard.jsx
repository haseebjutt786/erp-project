import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import { getTodayQuote, getAllQuotes, createQuote, updateQuote, deleteQuote } from '../../services/api.js';

const GRADIENT_PAIRS = [
  'from-orange-400 to-pink-500',
  'from-blue-500 to-purple-600',
  'from-green-400 to-teal-600',
  'from-purple-500 to-indigo-600',
  'from-pink-400 to-rose-600',
];

export default function MotivationalQuoteCard() {
  const { user } = useAuth();
  const isAdmin   = !!user?.isAdmin;

  const [quote, setQuote]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [manageOpen, setManage] = useState(false);
  const [quotes, setQuotes]     = useState([]);
  const [form, setForm]         = useState({ text:'', author:'' });
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);

  // Pick gradient based on day of year (stable daily)
  const dayIdx      = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000*60*60*24));
  const gradientCls = GRADIENT_PAIRS[dayIdx % GRADIENT_PAIRS.length];

  useEffect(() => {
    getTodayQuote()
      .then(({ data }) => setQuote(data))
      .catch(() => setQuote({ text: 'Every day is a new beginning.', author: 'Unknown' }))
      .finally(() => setLoading(false));
  }, []);

  const loadAllQuotes = async () => {
    try { const { data } = await getAllQuotes(); setQuotes(data); }
    catch { /* silent */ }
  };

  const openManage = () => { loadAllQuotes(); setManage(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return toast.error('Quote text required');
    setSaving(true);
    try {
      if (editId) { await updateQuote(editId, form); toast.success('Updated'); }
      else        { await createQuote(form);         toast.success('Quote added'); }
      setForm({ text:'', author:'' }); setEditId(null);
      loadAllQuotes();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteQuote(id); toast.success('Deleted'); loadAllQuotes(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden shadow-card">
        <div className="bg-gradient-to-br from-gray-300 to-gray-400 p-5 space-y-2 animate-skeleton">
          <div className="h-3 bg-white/30 rounded w-12" />
          <div className="h-4 bg-white/30 rounded w-full" />
          <div className="h-4 bg-white/30 rounded w-3/4" />
          <div className="h-3 bg-white/20 rounded w-24 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className={`rounded-xl overflow-hidden shadow-card bg-gradient-to-br ${gradientCls} relative`}>
        <div className="p-5">
          {/* Label */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="ti ti-quote text-white/60 text-base" />
              <span className="text-white/70 text-xs font-600">Daily Motivation</span>
            </div>
            {isAdmin && (
              <button onClick={openManage}
                className="text-white/60 hover:text-white transition-colors" title="Manage quotes">
                <i className="ti ti-settings text-sm" />
              </button>
            )}
          </div>

          {/* Quote */}
          <AnimatePresence mode="wait">
            {quote && (
              <motion.div key={quote.text}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <p className="text-white font-600 text-sm leading-relaxed mb-3">
                  "{quote.text}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-white/40 rounded" />
                  <p className="text-white/70 text-xs font-500">{quote.author || 'Unknown'}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decorative quote mark */}
          <div className="absolute top-3 right-4 text-white/5 text-8xl font-900 leading-none pointer-events-none select-none">
            "
          </div>
        </div>
      </motion.div>

      {/* Admin manage modal */}
      <AnimatePresence>
        {manageOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setManage(false)}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.95, opacity:0 }} transition={{ duration:0.2 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">Manage Quotes</h3>
                <button onClick={() => setManage(false)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500">
                  <i className="ti ti-x text-sm" />
                </button>
              </div>

              {/* Add / edit form */}
              <form onSubmit={handleSave} className="p-4 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
                <p className="text-xs font-700 text-gray-500 dark:text-gray-400 mb-2">{editId ? 'Edit Quote' : 'Add New Quote'}</p>
                <textarea rows={2} required value={form.text} onChange={e => setForm({...form, text:e.target.value})}
                  placeholder="Quote text..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none mb-2" />
                <div className="flex gap-2">
                  <input value={form.author} onChange={e => setForm({...form, author:e.target.value})}
                    placeholder="Author (optional)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                    {saving ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-check" />}
                    {editId ? 'Update' : 'Add'}
                  </button>
                  {editId && (
                    <button type="button" onClick={() => { setEditId(null); setForm({ text:'', author:'' }); }}
                      className="px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Quote list */}
              <div className="overflow-y-auto flex-1 divide-y divide-gray-50 dark:divide-dark-border">
                {quotes.length === 0 ? (
                  <div className="p-6 text-center">
                    <i className="ti ti-quote text-gray-200 text-3xl mb-2 block" />
                    <p className="text-sm text-gray-400">No quotes yet. Add one above.</p>
                  </div>
                ) : quotes.map(q => (
                  <div key={q._id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">"{q.text}"</p>
                      <p className="text-xs text-gray-400 mt-0.5">— {q.author}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditId(q._id); setForm({ text:q.text, author:q.author||'' }); }}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <i className="ti ti-edit text-xs" />
                      </button>
                      <button onClick={() => handleDelete(q._id)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                        <i className="ti ti-trash text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
