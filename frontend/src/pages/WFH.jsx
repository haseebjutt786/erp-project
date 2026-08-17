import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getWFHToday, getAllWFHRequests, getMyWFHRequests,
  submitWFHRequest, cancelWFHRequest, reviewWFHRequest,
} from '../services/api.js';

const STATUS_COLORS = {
  pending:   'bg-yellow-50 text-yellow-600 border-yellow-200',
  approved:  'bg-green-50 text-green-600 border-green-200',
  rejected:  'bg-red-50 text-red-500 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};
const WORK_TYPES = { home:'Home', hybrid:'Hybrid', remote:'Remote' };
const WORK_ICONS  = { home:'ti-home', hybrid:'ti-building-community', remote:'ti-world' };
const COLORS = ['#ff7b0d','#466ae6','#18a04b','#7b4fa0','#eb0910','#0096c7'];

const todayStr = () => new Date().toISOString().slice(0,10);

export default function WFH() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = !!user?.isAdmin;

  const [tab, setTab]               = useState(isAdmin ? 'all' : 'mine');
  const [todayList, setTodayList]   = useState([]);
  const [allReqs, setAllReqs]       = useState([]);
  const [myReqs, setMyReqs]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [newModal, setNewModal]     = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [form, setForm]             = useState({ date: todayStr(), reason:'', workType:'home', location:'' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatus]   = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [todayRes, allRes] = await Promise.all([
          getWFHToday(),
          getAllWFHRequests(statusFilter ? { status: statusFilter } : {}),
        ]);
        setTodayList(todayRes.data);
        setAllReqs(allRes.data);
      } else {
        const { data } = await getMyWFHRequests();
        setMyReqs(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [isAdmin, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitWFHRequest(form);
      toast.success('WFH request submitted');
      setNewModal(false);
      setForm({ date: todayStr(), reason:'', workType:'home', location:'' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    try {
      await cancelWFHRequest(id);
      toast.success('Request cancelled');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReview = async (status) => {
    if (!reviewModal) return;
    try {
      await reviewWFHRequest(reviewModal._id, { status, reviewNote });
      toast.success(`WFH request ${status}`);
      setReviewModal(null);
      setReviewNote('');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const todayCount  = todayList.length;
  const pendingCount = allReqs.filter(r => r.status === 'pending').length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-brand-400 transition-colors">
              <i className="ti ti-arrow-left text-base" />
            </button>
            <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Work From Home</h2>
          </div>
          <p className="text-sm text-gray-400">
            {isAdmin ? `${todayCount} employees on WFH today · ${pendingCount} pending approval` : 'Your WFH requests'}
          </p>
        </div>
        <button onClick={() => setNewModal(true)}
          className="flex items-center gap-2 bg-gradient-orange text-white px-4 py-2.5 rounded-lg text-sm font-700 hover:shadow-glow transition-all">
          <i className="ti ti-plus" /> Request WFH
        </button>
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label:'WFH Today',   value:todayCount, icon:'ti-home', bg:'bg-green-50', color:'text-green-500' },
            { label:'Pending',     value:pendingCount, icon:'ti-clock', bg:'bg-yellow-50', color:'text-yellow-600' },
            { label:'Approved',    value:allReqs.filter(r=>r.status==='approved').length, icon:'ti-check', bg:'bg-blue-50', color:'text-blue-500' },
            { label:'Rejected',    value:allReqs.filter(r=>r.status==='rejected').length, icon:'ti-x', bg:'bg-red-50', color:'text-red-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
              className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}>
                <i className={`ti ${s.icon} text-lg ${s.color}`} />
              </div>
              <p className="text-xl font-800 text-gray-800 dark:text-gray-100">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs (admin only) */}
      {isAdmin && (
        <div className="flex gap-1 mb-5 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-2 shadow-card items-center flex-wrap">
          {[
            ['all',   'All Requests', 'ti-list'],
            ['today', "Today's WFH",  'ti-home'],
          ].map(([v,l,ic]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all relative
                ${tab===v ? 'bg-gradient-orange text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-surface'}`}>
              <i className={`ti ${ic} text-base`} />{l}
              {v === 'all' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-700 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
          {tab === 'all' && (
            <div className="ml-auto flex bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5 gap-0.5">
              {[['','All'],['pending','Pending'],['approved','Approved'],['rejected','Rejected'],['cancelled','Cancelled']].map(([s,l]) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 text-xs font-600 rounded-md transition-all
                    ${statusFilter===s ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400'}`}>
                  {l}
                  {s === 'pending' && pendingCount > 0 && (
                    <span className="ml-1 bg-red-400 text-white text-[9px] font-700 px-1 py-0 rounded-full">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* TODAY WFH (admin) */}
          {isAdmin && tab === 'today' && (
            todayList.length === 0 ? (
              <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
                <i className="ti ti-home text-gray-200 text-6xl mb-3 block" />
                <p className="text-gray-500 font-700 text-lg">No employees on WFH today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {todayList.map((r, i) => {
                  const emp   = r.employee || {};
                  const color = COLORS[i % COLORS.length];
                  return (
                    <motion.div key={r._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden hover:shadow-hover transition-all">
                      <div className="h-1" style={{ background: color }} />
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-700 flex-shrink-0" style={{ background: color }}>
                            {(emp.fullName||'?').slice(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-700 text-gray-800 dark:text-gray-200 truncate">{emp.fullName}</p>
                            <p className="text-xs text-gray-400">{emp.department || '—'}</p>
                          </div>
                          <span className={`text-xs font-700 px-2 py-0.5 rounded-full border ${STATUS_COLORS.approved}`}>WFH</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Designation</span>
                            <span className="font-600 text-gray-700 dark:text-gray-300">{emp.designation || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Work Type</span>
                            <span className="font-600 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <i className={`ti ${WORK_ICONS[r.workType] || 'ti-home'} text-xs`} />
                              {WORK_TYPES[r.workType] || r.workType}
                            </span>
                          </div>
                          {r.location && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Location</span>
                              <span className="font-600 text-gray-700 dark:text-gray-300">{r.location}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Status</span>
                            <span className="font-600 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${emp.isClockedIn ? 'bg-green-400' : 'bg-gray-300'}`} />
                              {emp.isClockedIn ? 'Active' : 'Not clocked in'}
                            </span>
                          </div>
                          {r.clockInTime && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Clock In</span>
                              <span className="font-600 text-gray-700 dark:text-gray-300">
                                {new Date(r.clockInTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                              </span>
                            </div>
                          )}
                          {r.workingHours && r.workingHours !== '—' && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Hours Worked</span>
                              <span className="font-700 text-green-600">{r.workingHours}</span>
                            </div>
                          )}
                          {r.reason && (
                            <p className="text-xs text-gray-400 italic mt-1 line-clamp-1">"{r.reason}"</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          )}

          {/* ALL REQUESTS (admin) */}
          {isAdmin && tab === 'all' && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
              {allReqs.length === 0 ? (
                <div className="p-16 text-center">
                  <i className="ti ti-list text-gray-200 text-5xl mb-3 block" />
                  <p className="text-gray-500 font-600">No WFH requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-gray-50 dark:bg-dark-surface">
                      {['Employee','Department','Date','Type','Location','Reason','Status','Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {allReqs.map((r, i) => (
                        <motion.tr key={r._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                          className={`hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors ${r.status==='pending' ? 'bg-yellow-50/30 dark:bg-yellow-900/5' : ''}`}>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-orange flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
                                {(r.employee?.fullName||'?').slice(0,2).toUpperCase()}
                              </div>
                              <p className="text-sm font-600 text-gray-800 dark:text-gray-200">{r.employee?.fullName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{r.employee?.department || '—'}</td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm font-600 text-gray-700 dark:text-gray-300">{r.date}</td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                            <span className="flex items-center gap-1 text-xs font-600 text-gray-600 dark:text-gray-300 capitalize">
                              <i className={`ti ${WORK_ICONS[r.workType]||'ti-home'} text-xs`} />
                              {WORK_TYPES[r.workType]||r.workType}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{r.location || '—'}</td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500 max-w-[160px] truncate">{r.reason || '—'}</td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                            <span className={`text-xs font-700 px-2.5 py-1 rounded-full border ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                              {r.status.charAt(0).toUpperCase()+r.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                            {r.status === 'pending' ? (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { reviewWFHRequest(r._id, { status:'approved', reviewNote:'' }).then(() => { toast.success('WFH Approved'); loadData(); }).catch(e => toast.error(e.response?.data?.message||'Failed')); }}
                                  className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-lg hover:bg-green-600 transition-colors font-700 flex items-center gap-1">
                                  <i className="ti ti-check text-xs" /> Approve
                                </button>
                                <button onClick={() => { setReviewModal(r); setReviewNote(''); }}
                                  className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors font-700 border border-red-200 flex items-center gap-1">
                                  <i className="ti ti-x text-xs" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {r.reviewedBy?.fullName ? `By ${r.reviewedBy.fullName}` : '—'}
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* EMPLOYEE: my requests */}
          {!isAdmin && (
            myReqs.length === 0 ? (
              <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
                <i className="ti ti-home text-gray-200 text-5xl mb-3 block" />
                <p className="text-gray-500 font-600">No WFH requests yet</p>
                <button onClick={() => setNewModal(true)} className="mt-3 text-sm text-brand-400 font-600 hover:text-brand-500 transition-colors">Submit your first request →</button>
              </div>
            ) : (
              <div className="space-y-3">
                {myReqs.map((r, i) => (
                  <motion.div key={r._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                    className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.status==='approved' ? 'bg-green-50' : r.status==='rejected' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                          <i className={`ti ${WORK_ICONS[r.workType]||'ti-home'} text-xl ${r.status==='approved' ? 'text-green-500' : r.status==='rejected' ? 'text-red-500' : 'text-yellow-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-700 text-gray-800 dark:text-gray-200">{r.date}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 capitalize">{r.workType}</span>
                            {r.location && <span className="text-xs text-gray-400">· {r.location}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-700 px-3 py-1 rounded-full border ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                          {r.status}
                        </span>
                        {r.status === 'pending' && (
                          <button onClick={() => handleCancel(r._id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors font-600">Cancel</button>
                        )}
                      </div>
                    </div>
                    {r.reason && <p className="text-xs text-gray-400 mt-3 italic">"{r.reason}"</p>}
                    {r.reviewNote && <p className="text-xs text-gray-500 mt-1">HR Note: {r.reviewNote}</p>}
                  </motion.div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Submit WFH Modal */}
      <AnimatePresence>
        {newModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setNewModal(false)}>
            <motion.form initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">Request WFH</h3>
                <button type="button" onClick={() => setNewModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500"><i className="ti ti-x text-sm" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Date *</label>
                  <input required type="date" value={form.date} min={todayStr()} onChange={e => setForm({...form, date:e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Work Type</label>
                    <select value={form.workType} onChange={e => setForm({...form, workType:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      {Object.entries(WORK_TYPES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Location</label>
                    <input value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="City or address"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Reason</label>
                  <textarea rows={3} value={form.reason} onChange={e => setForm({...form, reason:e.target.value})} placeholder="Why are you working from home?"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
                <button type="button" onClick={() => setNewModal(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 font-600">Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                  {submitting ? <><i className="ti ti-loader-2 animate-spin" /> Submitting...</> : <><i className="ti ti-send" /> Submit</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setReviewModal(null)}>
            <motion.div initial={{ scale:0.95 }} animate={{ scale:1 }} exit={{ scale:0.95 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-sm shadow-2xl p-6"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-700 text-gray-800 dark:text-gray-100 mb-1">Review WFH Request</h3>
              <p className="text-sm text-gray-500 mb-4">
                {reviewModal.employee?.fullName} · {reviewModal.date} · {WORK_TYPES[reviewModal.workType]}
              </p>
              {reviewModal.reason && <p className="text-xs text-gray-400 italic mb-4">"{reviewModal.reason}"</p>}
              <div className="mb-4">
                <label className="block text-xs font-700 text-gray-500 mb-1.5">Note (optional)</label>
                <textarea rows={2} value={reviewNote} onChange={e => setReviewNote(e.target.value)}
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
