import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/ui/Badge.jsx';
import { getMyLeaves, applyLeave, cancelLeave, getAllLeaves, reviewLeave } from '../services/api.js';

const LEAVE_TYPES = { sick:'Sick', casual:'Casual', annual:'Annual', unpaid:'Unpaid', other:'Other' };
const EMPTY_FORM  = { leaveType:'casual', fromDate:'', toDate:'', reason:'' };

export default function LeaveManagement() {
  const { user }  = useAuth();
  const isAdmin   = !!user?.isAdmin;
  const [tab, setTab]           = useState(isAdmin ? 'all' : 'mine');
  const [leaves, setLeaves]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = tab === 'mine'
        ? await getMyLeaves()
        : await getAllLeaves(statusFilter || undefined);
      setLeaves(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [tab, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applyLeave(form);
      toast.success('Leave request submitted');
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    try { await cancelLeave(id); toast.success('Cancelled'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReview = async (status) => {
    if (!reviewTarget) return;
    try {
      await reviewLeave(reviewTarget._id, { status, reviewNote });
      toast.success(`Leave ${status}`);
      setReviewTarget(null); setReviewNote('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const COUNTS = {
    pending:  leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Leave Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isAdmin ? `${leaves.length} total requests` : 'My leave requests'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {[['pending','Pending','yellow'],['approved','Approved','green'],['rejected','Rejected','red']].map(([s,l,c]) => (
                <div key={s} className={`text-center px-3 py-1.5 rounded-lg bg-${c}-50 dark:bg-${c}-900/20`}>
                  <p className={`text-lg font-800 text-${c}-600`}>{COUNTS[s]}</p>
                  <p className={`text-[10px] text-${c}-500 font-600`}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`grid gap-5 ${isAdmin ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-5'}`}>
        {/* Apply form — employees only */}
        {!isAdmin && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="lg:col-span-2 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card h-fit">
            <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">Apply for Leave</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Leave Type</label>
                <select value={form.leaveType} onChange={e => setForm({...form, leaveType:e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                  {Object.entries(LEAVE_TYPES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">From</label>
                  <input required type="date" value={form.fromDate} onChange={e => setForm({...form, fromDate:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">To</label>
                  <input required type="date" min={form.fromDate} value={form.toDate} onChange={e => setForm({...form, toDate:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Reason (optional)</label>
                <textarea rows={3} value={form.reason} onChange={e => setForm({...form, reason:e.target.value})}
                  placeholder="Brief reason..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-orange text-white py-2.5 rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                {submitting ? <><i className="ti ti-loader-2 animate-spin" /> Submitting...</> : <><i className="ti ti-send" /> Submit Request</>}
              </button>
            </form>
          </motion.div>
        )}

        {/* List */}
        <div className={`${isAdmin ? '' : 'lg:col-span-3'} bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden`}>
          {/* Tabs + Filter */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 dark:border-dark-border gap-3 flex-wrap">
            {isAdmin ? (
              <div className="flex bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5 gap-0.5">
                {[['all','All'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']].map(([v,l]) => (
                  <button key={v} onClick={() => { setStatusFilter(v === 'all' ? '' : v); setTab(v); }}
                    className={`px-3 py-1.5 text-xs font-600 rounded-md transition-all
                      ${tab === v ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                    {l}
                  </button>
                ))}
              </div>
            ) : (
              <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">My Requests</h3>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-16">
              <i className="ti ti-notes text-gray-200 text-5xl mb-3 block" />
              <p className="text-gray-500 font-600">No leave requests found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-dark-border">
              {leaves.map((l, i) => (
                <motion.div key={l._id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                  <div className="flex-1 min-w-0">
                    {isAdmin && (
                      <p className="text-sm font-700 text-gray-800 dark:text-gray-200 mb-0.5">{l.employee?.fullName}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge label={LEAVE_TYPES[l.leaveType] || l.leaveType} variant="orange" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}
                      </span>
                    </div>
                    {l.reason && <p className="text-xs text-gray-400 mt-1 italic">{l.reason}</p>}
                    {l.reviewNote && <p className="text-xs text-gray-500 mt-1">Note: {l.reviewNote}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge label={l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                      variant={l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : l.status === 'cancelled' ? 'gray' : 'yellow'} />
                    {!isAdmin && l.status === 'pending' && (
                      <button onClick={() => handleCancel(l._id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors font-600">Cancel</button>
                    )}
                    {isAdmin && l.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => setReviewTarget(l)}
                          className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors font-600">
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewTarget && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setReviewTarget(null)}>
            <motion.div initial={{ scale:0.95 }} animate={{ scale:1 }} exit={{ scale:0.95 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-sm shadow-2xl p-6"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-700 text-gray-800 dark:text-gray-100 mb-1">Review Leave</h3>
              <p className="text-sm text-gray-500 mb-4">
                {reviewTarget.employee?.fullName} · {LEAVE_TYPES[reviewTarget.leaveType]} ·{' '}
                {new Date(reviewTarget.fromDate).toLocaleDateString()} – {new Date(reviewTarget.toDate).toLocaleDateString()}
              </p>
              <div className="mb-4">
                <label className="block text-xs font-700 text-gray-500 mb-1.5">Note (optional)</label>
                <textarea rows={3} value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                  placeholder="Add a note for the employee..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleReview('rejected')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-700 hover:bg-red-100 transition-colors">
                  <i className="ti ti-x" /> Reject
                </button>
                <button onClick={() => handleReview('approved')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-lg text-sm font-700 hover:bg-green-600 transition-colors">
                  <i className="ti ti-check" /> Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
