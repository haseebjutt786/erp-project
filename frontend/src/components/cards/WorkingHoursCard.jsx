import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyAttendance } from '../../services/api.js';

const WORK_HOURS_TARGET = 8; // hours per day
const WORK_MINUTES_TARGET = WORK_HOURS_TARGET * 60;

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDuration = (mins) => {
  if (!mins || mins <= 0) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export default function WorkingHoursCard() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [liveMinutes, setLiveMinutes] = useState(0);
  const [loading, setLoading]         = useState(true);

  // Fetch today's attendance record
  useEffect(() => {
    getMyAttendance(1)
      .then(({ data }) => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const rec = data.find(r => r.date === todayStr) || null;
        setTodayRecord(rec);
      })
      .catch(() => setTodayRecord(null))
      .finally(() => setLoading(false));
  }, [user?.isClockedIn]); // Re-fetch when clock state changes

  // Live counter — increments every second if currently clocked in
  useEffect(() => {
    if (!user?.isClockedIn || !user?.clockInTime) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(user.clockInTime).getTime()) / 60000);
      const stored  = todayRecord?.totalMinutes || 0;
      setLiveMinutes(stored + elapsed);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [user?.isClockedIn, user?.clockInTime, todayRecord]);

  // When not clocked in, use stored minutes
  useEffect(() => {
    if (!user?.isClockedIn) {
      setLiveMinutes(todayRecord?.totalMinutes || 0);
    }
  }, [user?.isClockedIn, todayRecord]);

  const workedMins   = liveMinutes;
  const remainMins   = Math.max(0, WORK_MINUTES_TARGET - workedMins);
  const overtimeMins = Math.max(0, workedMins - WORK_MINUTES_TARGET);
  const progressPct  = Math.min(100, Math.round((workedMins / WORK_MINUTES_TARGET) * 100));

  // Clock in time from today's first session
  const firstSession = todayRecord?.sessions?.[todayRecord.sessions.length - 1];
  const lastSession  = todayRecord?.sessions?.[0];
  const clockInTime  = firstSession?.clockIn  || user?.clockInTime;
  const clockOutTime = lastSession?.clockOut;

  const barColor = progressPct >= 100 ? '#18a04b' : progressPct >= 75 ? '#ff7b0d' : '#466ae6';

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card p-5 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-dark-surface rounded animate-skeleton w-36" />
        <div className="h-8 bg-gray-200 dark:bg-dark-surface rounded animate-skeleton w-24" />
        <div className="h-2 bg-gray-200 dark:bg-dark-surface rounded-full animate-skeleton" />
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-200 dark:bg-dark-surface rounded-lg animate-skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <i className="ti ti-clock text-blue-500 text-base" />
          </div>
          <div>
            <p className="text-sm font-700 text-gray-800 dark:text-gray-100">Working Hours</p>
            <p className="text-[10px] text-gray-400">Today's session</p>
          </div>
        </div>
        {user?.isClockedIn && (
          <span className="flex items-center gap-1.5 text-[10px] font-700 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>
        )}
      </div>

      {/* Big worked time */}
      <div className="flex items-end gap-1 mb-3">
        <span className="text-3xl font-800 text-gray-800 dark:text-gray-100 tabular-nums leading-none">
          {fmtDuration(workedMins)}
        </span>
        <span className="text-xs text-gray-400 mb-0.5">/ {WORK_HOURS_TARGET}h target</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>0h</span>
          <span className="font-600" style={{ color: barColor }}>{progressPct}%</span>
          <span>{WORK_HOURS_TARGET}h</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full transition-all"
            style={{ background: barColor }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox icon="ti-login"       label="Clock In"    value={fmtTime(clockInTime)}     color="text-green-500" bg="bg-green-50" />
        <StatBox icon="ti-logout"      label="Clock Out"   value={clockOutTime ? fmtTime(clockOutTime) : (user?.isClockedIn ? 'Still working' : '—')} color="text-red-400" bg="bg-red-50" />
        <StatBox icon="ti-hourglass"   label="Remaining"   value={workedMins >= WORK_MINUTES_TARGET ? 'Done ✓' : fmtDuration(remainMins)} color="text-brand-400" bg="bg-orange-50" />
        <StatBox icon="ti-trending-up" label="Overtime"    value={overtimeMins > 0 ? fmtDuration(overtimeMins) : '—'} color="text-purple-500" bg="bg-purple-50" />
      </div>
    </motion.div>
  );
}

function StatBox({ icon, label, value, color, bg }) {
  return (
    <div className={`${bg} dark:bg-opacity-10 rounded-lg p-2.5`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <i className={`ti ${icon} text-xs ${color}`} />
        <span className="text-[10px] text-gray-400 font-600">{label}</span>
      </div>
      <p className="text-xs font-700 text-gray-700 dark:text-gray-200 truncate">{value}</p>
    </div>
  );
}
