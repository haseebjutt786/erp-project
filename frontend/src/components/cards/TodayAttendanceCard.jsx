import React from 'react';
import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { getTodayAttendance } from '../../services/dashboardData.js';

export default function TodayAttendanceCard() {
  const records = getTodayAttendance();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <div>
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Today's Attendance</h3>
          <p className="text-xs text-gray-400 mt-0.5">Live clock-in status</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-dark-border">
        {records.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
          >
            <Avatar initials={r.avatar} color={r.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 text-gray-800 dark:text-gray-200 truncate">{r.name}</p>
              <p className="text-xs text-gray-400">
                {r.clockIn ? `In: ${r.clockIn}` : 'Not clocked in'}
                {r.clockOut ? ` · Out: ${r.clockOut}` : ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge label={r.status} />
              {r.hours !== '—' && (
                <span className="text-[10px] text-gray-400 font-500">{r.hours}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
