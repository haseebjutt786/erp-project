import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const INITIAL_TICKETS = [
  { id:1, subject:'Payroll calculation error for March', category:'Payroll', priority:'High', status:'open', createdAt:'2026-08-01', description:'My March payroll shows incorrect deductions.', replies:[] },
  { id:2, subject:'Unable to clock in via mobile', category:'Attendance', priority:'Medium', status:'in_progress', createdAt:'2026-08-03', description:'The clock-in button is not responding on mobile browsers.', replies:[{ by:'HR Team', msg:'We are investigating this issue.', at:'2026-08-04' }] },
  { id:3, subject:'Leave balance incorrect', category:'Leave', priority:'Low', status:'resolved', createdAt:'2026-08-02', description:'My annual leave balance shows 5 days but should be 14.', replies:[{ by:'HR Team', msg:'Fixed! Please refresh the page.', at:'2026-08-03' }] },
];

const CATEGORIES = ['Payroll','Attendance','Leave','IT Support','HR','General'];
const PRIORITIES  = ['Low','Medium','High','Critical'];
const PRIORITY_COLORS = { Low:'blue', Medium:'yellow', High:'orange', Critical:'red' };
const STATUS_COLORS   = { open:'blue', in_progress:'yellow', resolved:'green', closed:'gray' };
const EMPTY = { subject:'', category:'General', priority:'Medium', description:'' };

export default function Tickets() {
  const { user } = useAuth();
  const isAdmin   = !!user?.isAdmin;
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [modal, setModal]     = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [reply, setReply]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch]   = useState('');

  const filtered = tickets.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const newTicket = {
      id: Date.now(),
      ...form,
      status: 'open',
      createdAt: new Date().toISOString().slice(0,10),
      replies: [],
    };
    setTickets(prev => [newTicket, ...prev]);
    toast.success('Ticket submitted successfully');
    setModal(false);
    setForm(EMPTY);
  };

  const handleReply = (ticketId) => {
    if (!reply.trim()) return;
    setTickets(prev => prev.map(t => t.id === ticketId
      ? { ...t, replies: [...t.replies, { by: user?.fullName || 'You', msg: reply.trim(), at: new Date().toISOString().slice(0,10) }] }
      : t
    ));
    if (selected?.id === ticketId) {
      setSelected(prev => ({ ...prev, replies: [...prev.replies, { by: user?.fullName || 'You', msg: reply.trim(), at: new Date().toISOString().slice(0,10) }] }));
    }
    setReply('');
    toast.success('Reply added');
  };

  const handleStatusChange = (ticketId, status) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    if (selected?.id === ticketId) setSelected(prev => ({ ...prev, status }));
    toast.success(`Status updated to ${status}`);
  };

  const PRIORITY_VARIANT = { Low:'badge-blue', Medium:'badge-yellow', High:'badge-orange', Critical:'badge-red' };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Support Tickets</h2>
          <p className="text-sm text-gray-400 mt-0.5">{tickets.filter(t=>t.status==='open').length} open · {tickets.length} total</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-gradient-orange text-white px-4 py-2.5 rounded-lg text-sm font-700 hover:shadow-glow transition-all">
          <i className="ti ti-plus" /> New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label:'Open',        value:tickets.filter(t=>t.status==='open').length,        color:'blue',   icon:'ti-alert-circle' },
          { label:'In Progress', value:tickets.filter(t=>t.status==='in_progress').length, color:'yellow', icon:'ti-clock' },
          { label:'Resolved',    value:tickets.filter(t=>t.status==='resolved').length,    color:'green',  icon:'ti-check-circle' },
          { label:'Closed',      value:tickets.filter(t=>t.status==='closed').length,      color:'gray',   icon:'ti-lock' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
            className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card">
            <div className={`w-9 h-9 rounded-xl bg-${s.color}-50 flex items-center justify-center mb-2`}>
              <i className={`ti ${s.icon} text-lg text-${s.color}-500`} />
            </div>
            <p className="text-xl font-800 text-gray-800 dark:text-gray-100">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
        </div>
        <div className="flex bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5 gap-0.5">
          {['all','open','in_progress','resolved','closed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-600 rounded-md transition-all capitalize
                ${filterStatus===s ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400'}`}>
              {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-12 text-center shadow-card">
              <i className="ti ti-headset text-gray-200 text-5xl mb-3 block" />
              <p className="text-gray-500 font-600">No tickets found</p>
            </div>
          ) : filtered.map((ticket, i) => (
            <motion.div key={ticket.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              onClick={() => setSelected(ticket)}
              className={`bg-white dark:bg-dark-card rounded-xl border shadow-card p-4 cursor-pointer hover:shadow-hover transition-all
                ${selected?.id === ticket.id ? 'border-brand-400' : 'border-gray-100 dark:border-dark-border'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-700 text-gray-800 dark:text-gray-200 flex-1">{ticket.subject}</p>
                <span className={`text-xs font-700 px-2 py-0.5 rounded-full bg-${STATUS_COLORS[ticket.status]}-50 text-${STATUS_COLORS[ticket.status]}-600 flex-shrink-0`}>
                  {ticket.status.replace('_',' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-600 px-2 py-0.5 rounded-full bg-${PRIORITY_COLORS[ticket.priority] === 'orange' ? 'orange' : PRIORITY_COLORS[ticket.priority]}-50 text-${PRIORITY_COLORS[ticket.priority] === 'orange' ? 'brand' : PRIORITY_COLORS[ticket.priority]}-500`}>
                  {ticket.priority}
                </span>
                <span className="text-xs text-gray-400 bg-gray-50 dark:bg-dark-surface px-2 py-0.5 rounded-full">{ticket.category}</span>
                <span className="text-xs text-gray-400 ml-auto">{ticket.createdAt}</span>
              </div>
              {ticket.replies.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <i className="ti ti-message text-xs text-gray-400" />
                  <span className="text-xs text-gray-400">{ticket.replies.length} repl{ticket.replies.length>1?'ies':'y'}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden h-fit sticky top-20">
              <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-50 dark:border-dark-border">
                <div className="flex-1">
                  <p className="text-sm font-700 text-gray-800 dark:text-gray-100">{selected.subject}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400">{selected.category}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{selected.createdAt}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500 hover:bg-gray-200 flex-shrink-0">
                  <i className="ti ti-x text-xs" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{selected.description}</p>
                {isAdmin && (
                  <div className="mb-4">
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Update Status</label>
                    <select value={selected.status} onChange={e => handleStatusChange(selected.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                )}
                {/* Replies */}
                {selected.replies.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="text-xs font-700 text-gray-500 dark:text-gray-400">Conversation</p>
                    {selected.replies.map((r, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-dark-surface rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-700 text-gray-700 dark:text-gray-200">{r.by}</span>
                          <span className="text-[10px] text-gray-400">{r.at}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{r.msg}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Reply box */}
                <div>
                  <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Add Reply</label>
                  <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none mb-2" />
                  <button onClick={() => handleReply(selected.id)}
                    className="w-full py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all">
                    <i className="ti ti-send mr-1" /> Send Reply
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="hidden lg:flex bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card items-center justify-center p-16">
              <div className="text-center">
                <i className="ti ti-message-2 text-gray-200 text-5xl mb-3 block" />
                <p className="text-gray-400 font-600">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
            <motion.form initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()} onSubmit={handleCreate}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">New Support Ticket</h3>
                <button type="button" onClick={() => setModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500">
                  <i className="ti ti-x text-sm" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Subject *</label>
                  <input required value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} placeholder="Brief description of your issue"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-700 text-gray-500 mb-1.5">Priority</label>
                    <select value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-700 text-gray-500 mb-1.5">Description *</label>
                  <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Describe your issue in detail..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 font-600">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all">
                  <i className="ti ti-send" /> Submit Ticket
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
