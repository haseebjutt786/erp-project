import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getProjectReport, getAllProjects, getAllEmployees } from '../services/api.js';
import { exportProjectPDF, exportProjectExcel } from '../utils/exportUtils.js';

const MONTHS = [
  {v:0,l:'All Time'},{v:1,l:'January'},{v:2,l:'February'},{v:3,l:'March'},
  {v:4,l:'April'},{v:5,l:'May'},{v:6,l:'June'},{v:7,l:'July'},
  {v:8,l:'August'},{v:9,l:'September'},{v:10,l:'October'},{v:11,l:'November'},{v:12,l:'December'},
];

const STATUS_BADGE = {
  active:      'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  on_hold:     'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  completed:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  not_started: 'bg-gray-100 dark:bg-dark-surface text-gray-500 dark:text-gray-400',
  in_progress: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  done:        'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
};

const now = new Date();
const YEARS = [];
for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) YEARS.push(y);

export default function ProjectReport() {
  const { user } = useAuth();
  const isAdmin  = !!user?.isAdmin;

  const [month,      setMonth]      = useState(0);
  const [year,       setYear]       = useState(now.getFullYear());
  const [statusFilter, setStatus]   = useState('');
  const [empFilter,  setEmpFilter]  = useState('');
  const [report,     setReport]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [exporting,  setExporting]  = useState('');
  const [employees,  setEmployees]  = useState([]);

  useEffect(() => {
    if (isAdmin) {
      getAllEmployees().then(({ data }) => setEmployees(data)).catch(() => {});
    }
  }, [isAdmin]);

  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);
    try {
      const params = {};
      if (month > 0) { params.month = month; params.year = year; }
      if (statusFilter) params.status = statusFilter;
      if (isAdmin && empFilter) params.employeeId = empFilter;
      const { data } = await getProjectReport(params);
      setReport(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally { setLoading(false); }
  };

  const handleExport = async (format) => {
    if (!report) return;
    setExporting(format);
    try {
      format === 'pdf'
        ? await exportProjectPDF(report)
        : await exportProjectExcel(report);
      toast.success(`${format.toUpperCase()} exported`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally { setExporting(''); }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Project & Task Report</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {isAdmin ? 'Organization-wide project and task analytics' : 'Your assigned projects and tasks'}
          </p>
        </div>
        {report && (
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport('pdf')} disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-700 hover:bg-red-600 transition-all disabled:opacity-60">
              {exporting==='pdf' ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-file-type-pdf" />}
              Export PDF
            </button>
            <button onClick={() => handleExport('excel')} disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-700 hover:bg-green-700 transition-all disabled:opacity-60">
              {exporting==='excel' ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-file-spreadsheet" />}
              Export Excel
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Period</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          {month > 0 && (
            <div>
              <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          {isAdmin && (
            <div>
              <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Employee</label>
              <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                <option value="">All Employees</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
              </select>
            </div>
          )}
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 bg-gradient-orange text-white px-5 py-2 rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60 self-end">
            {loading ? <><i className="ti ti-loader-2 animate-spin" /> Generating...</> : <><i className="ti ti-chart-bar" /> Generate</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {report && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { l:'Total Projects', v:report.summary.totalProjects,   bg:'bg-blue-50 dark:bg-blue-900/20',   t:'text-blue-600 dark:text-blue-400' },
              { l:'Total Tasks',    v:report.summary.totalTasks,      bg:'bg-purple-50 dark:bg-purple-900/20',t:'text-purple-600 dark:text-purple-400' },
              { l:'Completed',      v:report.summary.doneTasks,       bg:'bg-green-50 dark:bg-green-900/20', t:'text-green-600 dark:text-green-400' },
              { l:'In Progress',    v:report.summary.inProgressTasks, bg:'bg-orange-50 dark:bg-orange-900/20',t:'text-brand-400' },
              { l:'Overdue',        v:report.summary.overdueTasks,    bg:'bg-red-50 dark:bg-red-900/20',     t:'text-red-500' },
            ].map((s, i) => (
              <motion.div key={s.l} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className={`${s.bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-800 ${s.t}`}>{s.v}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-600 mt-0.5">{s.l}</p>
              </motion.div>
            ))}
          </div>

          {/* Projects table */}
          {report.projectRows.length > 0 && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border flex items-center gap-2">
                <i className="ti ti-folder text-brand-400" />
                <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Projects</h3>
                <span className="text-xs bg-brand-50 text-brand-400 font-600 px-2 py-0.5 rounded-full">{report.projectRows.length}</span>
              </div>
              <div className="overflow-x-auto">
                <div style={{ minWidth: 700 }}>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-dark-surface">
                        {['Project','Status','Deadline','Tasks','Done','Overdue','Progress','Members'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.projectRows.map((p, i) => (
                        <tr key={p._id} className={`hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors ${i%2===0?'bg-white dark:bg-dark-card':'bg-gray-50/40 dark:bg-dark-surface/40'}`}>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm font-600 text-gray-800 dark:text-gray-200">{p.name}</td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                            <span className={`text-xs font-700 px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status]||'bg-gray-100 dark:bg-dark-surface text-gray-500'}`}>{p.status}</span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">{p.deadline}</td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm text-gray-600 dark:text-gray-300">{p.totalTasks}</td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border"><span className="text-xs font-700 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">{p.doneTasks}</span></td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border"><span className={`text-xs font-700 px-2 py-0.5 rounded-full ${p.overdueTasks>0?'bg-red-50 dark:bg-red-900/20 text-red-500':'bg-gray-100 dark:bg-dark-surface text-gray-400'}`}>{p.overdueTasks}</span></td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border w-32">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-orange rounded-full" style={{ width:`${p.progress}%` }} />
                              </div>
                              <span className="text-xs font-600 text-gray-500 dark:text-gray-400 w-8">{p.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-400 dark:text-gray-500 max-w-[140px] truncate">{p.members||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tasks table */}
          {report.taskRows.length > 0 && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border flex items-center gap-2">
                <i className="ti ti-list-check text-brand-400" />
                <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Tasks</h3>
                <span className="text-xs bg-brand-50 text-brand-400 font-600 px-2 py-0.5 rounded-full">{report.taskRows.length}</span>
              </div>
              <div className="overflow-x-auto">
                <div style={{ minWidth: 680 }}>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-dark-surface">
                        {['Task','Project','Assigned To','Dept','Status','Due Date'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.taskRows.map((t, i) => (
                        <tr key={String(t._id)} className={`hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors ${i%2===0?'bg-white dark:bg-dark-card':'bg-gray-50/40 dark:bg-dark-surface/40'}`}>
                          <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border">
                            <p className={`text-sm font-600 ${t.status==='done'?'line-through text-gray-400':'text-gray-800 dark:text-gray-200'}`}>{t.title}</p>
                            {t.isOverdue && <span className="text-[10px] text-red-500 font-600">⚠ Overdue</span>}
                          </td>
                          <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">{t.project}</td>
                          <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-600 dark:text-gray-300">{t.assignedTo}</td>
                          <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-400 dark:text-gray-500">{t.department}</td>
                          <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border">
                            <span className={`text-xs font-700 px-2.5 py-1 rounded-full ${STATUS_BADGE[t.status]||'bg-gray-100 dark:bg-dark-surface text-gray-500'}`}>{t.status.replace('_',' ')}</span>
                          </td>
                          <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">{t.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {report.projectRows.length === 0 && report.taskRows.length === 0 && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
              <i className="ti ti-folder-off text-gray-200 dark:text-gray-600 text-5xl mb-3 block" />
              <p className="text-gray-500 dark:text-gray-400 font-600">No projects or tasks found for this filter</p>
            </div>
          )}
        </motion.div>
      )}

      {!loading && !report && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
          <i className="ti ti-folder-analytics text-gray-200 dark:text-gray-600 text-6xl mb-3 block" />
          <p className="text-gray-500 dark:text-gray-400 font-600">Select filters and click Generate</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Then export as PDF or Excel</p>
        </div>
      )}
    </AppLayout>
  );
}
