import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getOnLeaveToday, getAllDepartments } from '../services/api.js';

const LEAVE_LABELS = { sick:'Sick', casual:'Casual', annual:'Annual', unpaid:'Unpaid', other:'Other' };
const COLORS = ['#466ae6','#ff7b0d','#18a04b','#7b4fa0','#eb0910','#0096c7','#e89f00'];

const diffDays = (from, to) => Math.ceil((new Date(to) - new Date(from)) / (1000*60*60*24)) + 1;

export default function OnLeaveToday() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = !!user?.isAdmin;

  const [leaves, setLeaves]       = useState([]);
  const [departments, setDepts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [deptFilter, setDept]     = useState('');
  const [typeFilter, setType]     = useState('');
  const [page, setPage]           = useState(1);
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (deptFilter) params.department = deptFilter;
      const { data } = await getOnLeaveToday(params);
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [deptFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getAllDepartments().then(({ data }) => setDepts(data)).catch(() => {});
  }, []);

  // Client-side search + type filter
  const filtered = leaves.filter(l => {
    const name  = l.employee?.fullName?.toLowerCase() || '';
    const id    = l.employee?.employeeId?.toLowerCase() || '';
    const dept  = l.employee?.department?.toLowerCase() || '';
    const matchSearch = !search || name.includes(search.toLowerCase()) || id.includes(search.toLowerCase()) || dept.includes(search.toLowerCase());
    const matchType   = !typeFilter || l.leaveType === typeFilter;
    return matchSearch && matchType;
  });

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-brand-400 transition-colors">
              <i className="ti ti-arrow-left text-base" />
            </button>
            <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">On Leave Today</h2>
          </div>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric' })} · {filtered.length} employee{filtered.length!==1?'s':''} on leave
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-2xl font-800 text-blue-600">{leaves.length}</p>
            <p className="text-xs text-blue-500 font-600">On Leave</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input placeholder="Search by name, ID or department..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
        </div>
        <select value={deptFilter} onChange={e => { setDept(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
          <option value="">All Types</option>
          {Object.entries(LEAVE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
          <i className="ti ti-check-circle text-green-300 text-6xl mb-3 block" />
          <p className="text-gray-500 font-700 text-lg">Everyone is present today!</p>
          <p className="text-sm text-gray-400 mt-1">No approved leave requests for today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((leave, i) => {
            const emp   = leave.employee || {};
            const color = COLORS[i % COLORS.length];
            const days  = diffDays(leave.fromDate, leave.toDate);
            return (
              <motion.div key={leave._id}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
                className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden hover:shadow-hover hover:-translate-y-0.5 transition-all">
                {/* Color top accent */}
                <div className="h-1" style={{ background: color }} />
                <div className="p-5">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-700 flex-shrink-0"
                      style={{ background: color }}>
                      {(emp.fullName||'?').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-700 text-gray-800 dark:text-gray-200 truncate">{emp.fullName || '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{emp.employeeId || 'No ID'}</p>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="space-y-2">
                    <InfoRow icon="ti-building" label="Department" value={emp.department || '—'} />
                    <InfoRow icon="ti-briefcase" label="Designation" value={emp.designation || '—'} />
                    <InfoRow icon="ti-notes" label="Leave Type"
                      value={<span className="text-xs font-700 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{LEAVE_LABELS[leave.leaveType] || leave.leaveType}</span>} />
                    <InfoRow icon="ti-calendar" label="Duration"
                      value={`${new Date(leave.fromDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${new Date(leave.toDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`} />
                    <InfoRow icon="ti-clock" label="Days" value={`${days} day${days!==1?'s':''}`} />
                    {leave.reason && <InfoRow icon="ti-message" label="Reason" value={leave.reason} truncate />}
                  </div>

                  {/* Status badge */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-700 bg-green-50 text-green-600 px-3 py-1 rounded-full">
                      <i className="ti ti-check mr-1" />Approved
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => navigate('/employees')}
                        className="text-xs text-brand-400 font-600 hover:text-brand-500 transition-colors flex items-center gap-1">
                        Profile <i className="ti ti-arrow-right text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page<=1} onClick={() => setPage(p=>p-1)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors text-gray-600 dark:text-gray-300">
            <i className="ti ti-chevron-left" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
          <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors text-gray-600 dark:text-gray-300">
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}
    </AppLayout>
  );
}

function InfoRow({ icon, label, value, truncate }) {
  return (
    <div className="flex items-start gap-2">
      <i className={`ti ${icon} text-gray-400 text-xs mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-600">{label} </span>
        {typeof value === 'string' ? (
          <span className={`text-xs text-gray-700 dark:text-gray-300 font-500 ${truncate ? 'block truncate' : ''}`}>{value}</span>
        ) : value}
      </div>
    </div>
  );
}
