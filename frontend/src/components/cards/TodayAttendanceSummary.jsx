import React from 'react';
import { motion } from 'framer-motion';

export default function TodayAttendanceSummary({ stats }) {
  if (!stats) return null;
  const { present = 0, absent = 0, late = 0, total = 0 } = stats;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const rows = [
    { label: 'Present',  value: present, color: '#18a04b', bg: '#e8f9f0', icon: 'ti-user-check' },
    { label: 'Absent',   value: absent,  color: '#eb0910', bg: '#fff0f0', icon: 'ti-user-x' },
    { label: 'Late',     value: late,    color: '#e89f00', bg: '#fff8e5', icon: 'ti-clock-x' },
  ];

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Today's Attendance</h3>
        <p className="text-xs text-gray-400 mt-0.5">{total} active employees</p>
      </div>

      {/* Attendance ring */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ff7b0d" strokeWidth="3.5"
              strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-800 text-gray-800 dark:text-gray-100">{pct}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: r.bg }}>
                  <i className={`ti ${r.icon} text-xs`} style={{ color: r.color }} />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{r.label}</span>
              </div>
              <span className="text-sm font-700 text-gray-800 dark:text-gray-200">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden h-1.5">
        <div className="h-full bg-gradient-orange rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1.5 text-center">{present} of {total} present today</p>
    </motion.div>
  );
}
