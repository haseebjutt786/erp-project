import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getMonthlyAttendanceReport, getOrgMonthlyAttendance, getAllEmployees, getAllDepartments,
} from '../services/api.js';
import {
  exportAttendancePDF, exportAttendanceExcel,
  exportOrgAttendancePDF, exportOrgAttendanceExcel,
} from '../utils/exportUtils.js';

const MONTHS = [
  {v:1,l:'January'},{v:2,l:'February'},{v:3,l:'March'},{v:4,l:'April'},
  {v:5,l:'May'},{v:6,l:'June'},{v:7,l:'July'},{v:8,l:'August'},
  {v:9,l:'September'},{v:10,l:'October'},{v:11,l:'November'},{v:12,l:'December'},
];

const STATUS_BADGE = {
  'Full Day':        'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  'Full Day (WFH)':  'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  'Partial':         'bg-orange-50 dark:bg-orange-900/20 text-brand-400',
  'Partial (WFH)':   'bg-orange-50 dark:bg-orange-900/20 text-brand-400',
  'Leave':           'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  'Absent':          'bg-red-50 dark:bg-red-900/20 text-red-500',
  'Weekend':         'bg-gray-100 dark:bg-dark-surface text-gray-400 dark:text-gray-500',
};

const now = new Date();

export default function AttendanceReport() {
  const { user }  = useAuth();
  const isAdmin   = !!user?.isAdmin;

  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [empFilter,  setEmpFilter]  = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewMode,   setViewMode]   = useState(isAdmin ? 'org' : 'self'); // 'self' | 'org'
  const [report,     setReport]     = useState(null);
  const [orgReport,  setOrgReport]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [exporting,  setExporting]  = useState('');
  const [employees,  setEmployees]  = useState([]);
  const [departments,setDepts]      = useState([]);
  const [empsLoaded, setEmpsLoaded] = useState(false);

  // Load employees/depts for admin filters
  const loadFilters = useCallback(async () => {
    if (empsLoaded || !isAdmin) return;
    try {
      const [eR, dR] = await Promise.all([getAllEmployees(), getAllDepartments()]);
      setEmployees(eR.data);
      setDepts(dR.data);
      setEmpsLoaded(true);
    } catch { /* silent */ }
  }, [empsLoaded, isAdmin]);

  React.useEffect(() => { loadFilters(); }, [loadFilters]);

  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);
    setOrgReport(null);
    try {
      if (viewMode === 'self' || !isAdmin) {
        const params = { month, year };
        const { data } = await getMonthlyAttendanceReport(params);
        setReport(data);
      } else {
        const params = { month, year };
        if (empFilter)  params.employeeId = empFilter;
        if (deptFilter) params.department = deptFilter;
        const { data } = await getOrgMonthlyAttendance(params);
        setOrgReport(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally { setLoading(false); }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      if (viewMode === 'self' && report) {
        format === 'pdf'
          ? await exportAttendancePDF(report)
          : await exportAttendanceExcel(report);
      } else if (orgReport) {
        format === 'pdf'
          ? await exportOrgAttendancePDF(orgReport)
          : await exportOrgAttendanceExcel(orgReport);
      }
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed — please try again');
    } finally { setExporting(''); }
  };

  const hasData = report || orgReport;

  const YEARS = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) YEARS.push(y);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Monthly Attendance Report</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Generate and export attendance data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasData && (
            <>
              <button onClick={() => handleExport('pdf')} disabled={!!exporting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-700 hover:bg-red-600 transition-all disabled:opacity-60">
                {exporting === 'pdf' ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-file-type-pdf" />}
                Export PDF
              </button>
              <button onClick={() => handleExport('excel')} disabled={!!exporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-700 hover:bg-green-700 transition-all disabled:opacity-60">
                {exporting === 'excel' ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-file-spreadsheet" />}
                Export Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          {/* View mode — admin only */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Report Type</label>
              <div className="flex bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5 gap-0.5">
                {[['self','My Report'],['org','All Employees']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => { setViewMode(v); setReport(null); setOrgReport(null); }}
                    className={`px-3 py-1.5 text-xs font-600 rounded-md transition-all
                      ${viewMode===v ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Month */}
          <div>
            <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Employee filter (admin, org mode) */}
          {isAdmin && viewMode === 'org' && (
            <div>
              <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Employee</label>
              <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                <option value="">All Employees</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
              </select>
            </div>
          )}

          {/* Department filter (admin, org mode) */}
          {isAdmin && viewMode === 'org' && (
            <div>
              <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Department</label>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          )}

          {/* Generate */}
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 bg-gradient-orange text-white px-5 py-2 rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60 self-end">
            {loading ? <><i className="ti ti-loader-2 animate-spin" /> Generating...</> : <><i className="ti ti-chart-bar" /> Generate Report</>}
          </button>
        </div>
      </div>

      {/* ── SELF REPORT ── */}
      {report && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          {/* Employee info card */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card mb-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-lg font-800 text-gray-800 dark:text-gray-100">{report.employee.fullName}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  {report.employee.employeeId || '—'} · {report.employee.department || '—'} · {report.employee.designation || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-700 text-brand-400">{report.period.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Attendance Report</p>
              </div>
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
            {[
              { l:'Working Days', v:report.summary.totalWorkingDays, bg:'bg-gray-50 dark:bg-dark-surface', t:'text-gray-700 dark:text-gray-200' },
              { l:'Present',      v:report.summary.presentDays,      bg:'bg-green-50 dark:bg-green-900/20', t:'text-green-600 dark:text-green-400' },
              { l:'Full Days',    v:report.summary.fullDays,          bg:'bg-green-50 dark:bg-green-900/20', t:'text-green-600 dark:text-green-400' },
              { l:'Partial',      v:report.summary.partialDays,       bg:'bg-orange-50 dark:bg-orange-900/20', t:'text-brand-400' },
              { l:'Absent',       v:report.summary.absentDays,        bg:'bg-red-50 dark:bg-red-900/20',    t:'text-red-500' },
              { l:'Leave',        v:report.summary.leaveDays,         bg:'bg-blue-50 dark:bg-blue-900/20',  t:'text-blue-600 dark:text-blue-400' },
              { l:'WFH',          v:report.summary.wfhDays,           bg:'bg-purple-50 dark:bg-purple-900/20', t:'text-purple-500' },
              { l:'Total Hours',  v:report.summary.totalHours,        bg:'bg-indigo-50 dark:bg-indigo-900/20', t:'text-indigo-600 dark:text-indigo-400' },
            ].map((s, i) => (
              <motion.div key={s.l} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                className={`${s.bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-800 ${s.t}`}>{s.v}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-600 mt-0.5">{s.l}</p>
              </motion.div>
            ))}
          </div>

          {/* Daily detail table */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border">
              <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Daily Attendance Detail</h3>
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 620 }}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-dark-surface">
                      {['Date','Day','Clock In','Clock Out','Sessions','Hours','Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.dailyRows.map((r, i) => (
                      <tr key={r.date}
                        className={`transition-colors hover:bg-gray-50 dark:hover:bg-dark-surface
                          ${r.isWeekend ? 'opacity-50' : ''}
                          ${i%2===0 ? 'bg-white dark:bg-dark-card' : 'bg-gray-50/40 dark:bg-dark-surface/40'}`}>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-sm font-600 text-gray-800 dark:text-gray-200">{r.date}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">{r.dayName}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-sm text-gray-600 dark:text-gray-300">{r.firstClockIn}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-sm text-gray-600 dark:text-gray-300">{r.lastClockOut}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-sm text-gray-600 dark:text-gray-300">{r.sessions||0}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-sm font-600 text-gray-700 dark:text-gray-200">{r.totalHours}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border">
                          <span className={`text-xs font-700 px-2.5 py-1 rounded-full ${STATUS_BADGE[r.status] || 'bg-gray-100 dark:bg-dark-surface text-gray-500'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── ORG REPORT ── */}
      {orgReport && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card mb-4">
            <p className="text-lg font-800 text-gray-800 dark:text-gray-100">{orgReport.period.label} — Organization Attendance</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Working Days: {orgReport.totalWorkingDays} · {orgReport.rows.length} employees</p>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <div style={{ minWidth: 700 }}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-dark-surface">
                      {['#','Employee','ID','Department','Designation','Present','Leave','WFH','Absent','Total Hours'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orgReport.rows.map((r, i) => (
                      <tr key={i} className={`hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors ${i%2===0?'bg-white dark:bg-dark-card':'bg-gray-50/40 dark:bg-dark-surface/40'}`}>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-400 dark:text-gray-500">{i+1}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-sm font-600 text-gray-800 dark:text-gray-200">{r.name}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">{r.employeeId}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">{r.department}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">{r.designation}</td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border"><span className="text-xs font-700 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">{r.presentDays}</span></td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border"><span className="text-xs font-700 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{r.leaveDays}</span></td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border"><span className="text-xs font-700 bg-purple-50 dark:bg-purple-900/20 text-purple-500 px-2 py-0.5 rounded-full">{r.wfhDays}</span></td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border"><span className={`text-xs font-700 px-2 py-0.5 rounded-full ${r.absentDays > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-dark-surface text-gray-400'}`}>{r.absentDays}</span></td>
                        <td className="px-4 py-2.5 border-b border-gray-50 dark:border-dark-border text-sm font-700 text-gray-700 dark:text-gray-200">{r.totalHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
          <i className="ti ti-report-analytics text-gray-200 dark:text-gray-600 text-6xl mb-3 block" />
          <p className="text-gray-500 dark:text-gray-400 font-600">Select month, year and click Generate Report</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Then export as PDF or Excel</p>
        </div>
      )}
    </AppLayout>
  );
}
