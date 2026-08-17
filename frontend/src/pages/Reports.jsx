import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import AppLayout from '../components/layouts/AppLayout.jsx';
import {
  getAttendanceReport, getPayrollReport, getLeavesReport,
  getEmployeesReport, getTasksReport, getReportsOverview,
} from '../services/api.js';

const PALETTE = ['#ff7b0d','#466ae6','#18a04b','#7b4fa0','#eb0910','#0096c7','#e89f00','#6d8b74'];
const fmt = (n) => `$${Number(n||0).toLocaleString()}`;
const fmtPct = (n) => `${n || 0}%`;

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl px-3 py-2.5 shadow-hover text-xs">
      <p className="font-700 text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-600 text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const TABS = [
  { id:'overview',    label:'Overview',    icon:'ti-layout-dashboard' },
  { id:'attendance',  label:'Attendance',  icon:'ti-calendar-check'   },
  { id:'payroll',     label:'Payroll',     icon:'ti-currency-dollar'  },
  { id:'leaves',      label:'Leaves',      icon:'ti-notes'            },
  { id:'employees',   label:'Employees',   icon:'ti-users'            },
  { id:'tasks',       label:'Tasks',       icon:'ti-list-check'       },
];

export default function Reports() {
  const [tab, setTab]           = useState('overview');
  const [loading, setLoading]   = useState(false);
  const [overview, setOverview] = useState(null);
  const [report, setReport]     = useState(null);
  const [period, setPeriod]     = useState('month');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');

  const fetchOverview = async () => {
    try {
      const { data } = await getReportsOverview();
      setOverview(data);
    } catch { /* silent */ }
  };

  const fetchReport = async () => {
    if (tab === 'overview') return;
    setLoading(true);
    try {
      const params = from && to ? { from, to } : { period };
      const FNS = { attendance: getAttendanceReport, payroll: getPayrollReport, leaves: getLeavesReport, employees: getEmployeesReport, tasks: getTasksReport };
      const { data } = await FNS[tab](params);
      setReport(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOverview(); }, []);
  useEffect(() => { setReport(null); fetchReport(); }, [tab, period, from, to]); // eslint-disable-line

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Reports & Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Live data from MongoDB</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-2 shadow-card">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all
              ${tab === t.id ? 'bg-gradient-orange text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-surface'}`}>
            <i className={`ti ${t.icon} text-base`} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Date filter (non-overview tabs) */}
      {tab !== 'overview' && tab !== 'employees' && (
        <div className="flex flex-wrap gap-3 mb-5 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card">
          <div className="flex bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5 gap-0.5">
            {[['week','Week'],['month','Month'],['year','Year']].map(([v,l]) => (
              <button key={v} onClick={() => { setPeriod(v); setFrom(''); setTo(''); }}
                className={`px-3 py-1.5 text-xs font-600 rounded-md transition-all ${period === v && !from ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-600">Custom:</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'overview'   && overview && <OverviewTab data={overview} />}
          {tab === 'attendance' && report   && <AttendanceTab data={report} />}
          {tab === 'payroll'    && report   && <PayrollTab data={report} />}
          {tab === 'leaves'     && report   && <LeavesTab data={report} />}
          {tab === 'employees'  && report   && <EmployeesTab data={report} />}
          {tab === 'tasks'      && report   && <TasksTab data={report} />}
        </>
      )}
    </AppLayout>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ data }) {
  const cards = [
    { label:'Total Employees', value:data.employees.total,     icon:'ti-users',          color:'blue',   sub:`${data.employees.active} active` },
    { label:'Present Today',   value:data.attendance.present,  icon:'ti-calendar-check', color:'green',  sub:`${data.attendance.absent} absent` },
    { label:'Departments',     value:data.departments,         icon:'ti-building',        color:'purple', sub:'Active' },
    { label:'Pending Leaves',  value:data.leaves.pending,      icon:'ti-notes',           color:'orange', sub:`${data.leaves.approved} approved` },
    { label:'Payroll (Month)', value:fmt(data.payroll.amount), icon:'ti-currency-dollar', color:'green',  sub:`${data.payroll.entries} entries` },
    { label:'Tasks Done',      value:`${data.tasks.completionRate}%`, icon:'ti-list-check', color:'teal', sub:`${data.tasks.done}/${data.tasks.total}` },
    { label:'Active Projects', value:data.activeProjects,      icon:'ti-folder',          color:'indigo', sub:'Running' },
    { label:'Task Completion', value:fmtPct(data.tasks.completionRate), icon:'ti-chart-bar', color:'red', sub:'Overall rate' },
  ];
  const colorMap = { blue:'bg-blue-50 text-blue-500', green:'bg-green-50 text-green-500', purple:'bg-purple-50 text-purple-500', orange:'bg-orange-50 text-brand-400', teal:'bg-teal-50 text-teal-500', indigo:'bg-indigo-50 text-indigo-500', red:'bg-red-50 text-red-500' };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div key={c.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
          className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[c.color] || 'bg-gray-50 text-gray-500'}`}>
            <i className={`ti ${c.icon} text-xl`} />
          </div>
          <p className="text-2xl font-800 text-gray-800 dark:text-gray-100">{c.value}</p>
          <p className="text-xs font-600 text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Attendance ────────────────────────────────────────────────────────────────
function AttendanceTab({ data }) {
  if (!data || !data.summary) return <EmptyChart text="No attendance data for this period" />;
  const trend = data.trend || [];
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label:'Total Employees',  value:data.summary.totalEmployees  ?? 0, icon:'ti-users',     bg:'bg-blue-50',   color:'text-blue-500' },
        { label:'Range Days',       value:data.summary.rangeDays       ?? 0, icon:'ti-calendar',  bg:'bg-orange-50', color:'text-brand-400' },
        { label:'Total Sessions',   value:data.summary.totalSessions   ?? 0, icon:'ti-clock',     bg:'bg-purple-50', color:'text-purple-500' },
        { label:'Avg Daily Present',value:data.summary.avgDailyPresent ?? 0, icon:'ti-user-check',bg:'bg-green-50',  color:'text-green-500' },
      ]} />
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">Daily Attendance Trend</h3>
        {trend.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<Tip />} cursor={{ fill:'#f9fafb' }} />
              <Legend wrapperStyle={{ fontSize:11 }} iconType="circle" iconSize={8} />
              <Bar dataKey="present" fill="#ff7b0d" radius={[4,4,0,0]} name="Present" />
              <Bar dataKey="absent"  fill="#e5e7eb" radius={[4,4,0,0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Payroll ────────────────────────────────────────────────────────────────────
function PayrollTab({ data }) {
  if (!data || !data.summary) return <EmptyChart text="No payroll data for this period" />;
  const trend = data.trend || [];
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label:'Total Entries', value:data.summary.totalEntries ?? 0,       icon:'ti-users',          bg:'bg-blue-50',   color:'text-blue-500' },
        { label:'Total Net',     value:fmt(data.summary.totalNet ?? 0),       icon:'ti-currency-dollar',bg:'bg-green-50',  color:'text-green-500' },
        { label:'Paid',          value:data.summary.paidEntries  ?? 0,       icon:'ti-check',          bg:'bg-teal-50',   color:'text-teal-500' },
        { label:'Avg Salary',    value:fmt(data.summary.avgSalary ?? 0),      icon:'ti-chart-bar',      bg:'bg-orange-50', color:'text-brand-400' },
      ]} />
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">Monthly Salary Cost</h3>
        {trend.length === 0 ? <EmptyChart text="No payroll data for this period" /> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="pgRep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff7b0d" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ff7b0d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={56} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="total" stroke="#ff7b0d" strokeWidth={2.5} fill="url(#pgRep)" name="Total" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Leaves ─────────────────────────────────────────────────────────────────────
function LeavesTab({ data }) {
  if (!data || !data.summary) return <EmptyChart text="No leave data for this period" />;
  const byStatus = data.byStatus || [];
  const byType   = data.byType   || [];
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label:'Total Requests', value:data.summary.total    ?? 0, icon:'ti-notes',    bg:'bg-blue-50',   color:'text-blue-500' },
        { label:'Approved',       value:data.summary.approved ?? 0, icon:'ti-check',    bg:'bg-green-50',  color:'text-green-500' },
        { label:'Pending',        value:data.summary.pending  ?? 0, icon:'ti-clock',    bg:'bg-orange-50', color:'text-brand-400' },
        { label:'Avg Duration',   value:`${data.summary.avgDuration ?? 0}d`, icon:'ti-calendar', bg:'bg-purple-50', color:'text-purple-500' },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">By Status</h3>
          {byStatus.length === 0 || byStatus.every(d => d.value === 0) ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                  {byStatus.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:'8px', fontSize:'12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize:11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">By Type</h3>
          {byType.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byType} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={64} />
                <Tooltip content={<Tip />} cursor={{ fill:'#f9fafb' }} />
                <Bar dataKey="value" fill="#ff7b0d" radius={[0,4,4,0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Employees ──────────────────────────────────────────────────────────────────
function EmployeesTab({ data }) {
  if (!data || !data.summary) return <EmptyChart text="No employee data" />;
  const deptDist      = data.deptDistribution  || [];
  const monthlyHiring = data.monthlyHiring     || [];
  const employees     = data.employees         || [];
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label:'Total',    value:data.summary.total    ?? 0, icon:'ti-users',     bg:'bg-blue-50',   color:'text-blue-500' },
        { label:'Active',   value:data.summary.active   ?? 0, icon:'ti-user-check',bg:'bg-green-50',  color:'text-green-500' },
        { label:'Inactive', value:data.summary.inactive ?? 0, icon:'ti-user-off',  bg:'bg-red-50',    color:'text-red-500' },
        { label:'Admins',   value:data.summary.admins   ?? 0, icon:'ti-shield',    bg:'bg-purple-50', color:'text-purple-500' },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">Department Distribution</h3>
          {deptDist.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {deptDist.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:'8px', fontSize:'12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize:11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">Monthly Hiring Trend</h3>
          {monthlyHiring.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyHiring}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="count" stroke="#ff7b0d" strokeWidth={2.5} dot={{ r:4, fill:'#ff7b0d' }} name="Hired" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border">
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Employee List</h3>
        </div>
        {employees.length === 0 ? (
          <div className="p-10 text-center"><p className="text-gray-400">No employee records</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 dark:bg-dark-surface">
                {['Name','Email','Department','Designation','Basic Salary','Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={emp._id} className={i % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-gray-50/50 dark:bg-dark-surface/50'}>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm font-600 text-gray-800 dark:text-gray-200">{emp.fullName}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{emp.email}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{emp.department || '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{emp.designation || '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs font-600 text-gray-700 dark:text-gray-300">{fmt(emp.basicSalary)}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{new Date(emp.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tasks ──────────────────────────────────────────────────────────────────────
function TasksTab({ data }) {
  if (!data || !data.summary) return <EmptyChart text="No task data for this period" />;
  const byStatus  = data.byStatus  || [];
  const byProject = data.byProject || [];
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label:'Total Tasks',     value:data.summary.total          ?? 0, icon:'ti-list-check',    bg:'bg-blue-50',   color:'text-blue-500' },
        { label:'Completed',       value:data.summary.done           ?? 0, icon:'ti-circle-check',  bg:'bg-green-50',  color:'text-green-500' },
        { label:'Overdue',         value:data.summary.overdue        ?? 0, icon:'ti-alert-triangle',bg:'bg-red-50',    color:'text-red-500' },
        { label:'Completion Rate', value:fmtPct(data.summary.completionRate ?? 0), icon:'ti-chart-pie', bg:'bg-orange-50', color:'text-brand-400' },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">Status Breakdown</h3>
          {byStatus.length === 0 || byStatus.every(d => d.value === 0) ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                  {byStatus.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:'8px', fontSize:'12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize:11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">Progress by Project</h3>
          {byProject.length === 0 ? <EmptyChart /> : (
            <div className="space-y-3 mt-2">
              {byProject.slice(0, 6).map(p => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-300 font-600 truncate max-w-[60%]">{p.name}</span>
                    <span className="text-gray-400">{p.done}/{p.total} · {p.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden h-1.5">
                    <div className="h-full bg-gradient-orange rounded-full transition-all duration-700" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────
function SummaryCards({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map((c, i) => (
        <motion.div key={c.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
          className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
            <i className={`ti ${c.icon} text-lg ${c.color}`} />
          </div>
          <p className="text-xl font-800 text-gray-800 dark:text-gray-100">{c.value}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-600">{c.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyChart({ text = 'No data for this period' }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-gray-300">
      <i className="ti ti-chart-bar text-4xl mb-2" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
