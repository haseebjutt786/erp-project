import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { getMyAttendance } from '../services/api.js';

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDur = (mins) => {
  if (!mins) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export default function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAttendance(30)
      .then(({ data }) => setRecords(data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  const totalDays    = records.length;
  const totalMins    = records.reduce((s, r) => s + (r.totalMinutes || 0), 0);
  const totalHours   = Math.floor(totalMins / 60);
  const avgMins      = totalDays > 0 ? Math.round(totalMins / totalDays) : 0;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">My Attendance</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Last 30 days · {totalDays} days present</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
          <i className="ti ti-calendar-check text-xl text-green-500" />
        </div>
      </div>

      {/* Summary */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { label:'Days Present', value:`${totalDays}`, icon:'ti-calendar-check', bg:'bg-green-50 dark:bg-green-900/20', color:'text-green-500' },
            { label:'Total Hours',  value:`${totalHours}h`, icon:'ti-clock',         bg:'bg-blue-50 dark:bg-blue-900/20',  color:'text-blue-500' },
            { label:'Avg Per Day',  value:fmtDur(avgMins),  icon:'ti-chart-bar',     bg:'bg-orange-50 dark:bg-orange-900/20', color:'text-brand-400' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
              className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <i className={`ti ${s.icon} text-lg ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{s.label}</p>
                <p className="text-xl font-800 text-gray-800 dark:text-gray-100">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12">
            <div className="w-6 h-6 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400 dark:text-gray-500">Loading records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <i className="ti ti-calendar-off text-gray-200 dark:text-gray-600 text-5xl mb-3" />
            <p className="text-gray-600 dark:text-gray-300 font-600">No attendance records yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Clock in from the Dashboard to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: '560px' }}>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-surface">
                    {['Date','First Clock-In','Last Clock-Out','Sessions','Total Hours','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const hrs = Math.floor((r.totalMinutes || 0) / 60);
                    const isFullDay = hrs >= 8;
                    return (
                      <motion.tr key={r.date}
                        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                        className={`hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors
                          ${i % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-gray-50/50 dark:bg-dark-surface/50'}`}>
                        <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm font-600 text-gray-800 dark:text-gray-200">
                          {fmtDate(r.date)}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm text-gray-600 dark:text-gray-300">
                          {fmt(r.sessions[r.sessions.length - 1]?.clockIn)}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm text-gray-600 dark:text-gray-300">
                          {fmt(r.sessions[0]?.clockOut)}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm text-gray-600 dark:text-gray-300">
                          {r.sessions.length}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm font-700 text-gray-700 dark:text-gray-200">
                          {fmtDur(r.totalMinutes)}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                          <span className={`text-xs font-700 px-2.5 py-1 rounded-full
                            ${isFullDay
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-orange-50 dark:bg-orange-900/20 text-brand-400'}`}>
                            {isFullDay ? 'Full Day' : 'Partial'}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
