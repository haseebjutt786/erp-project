import React from 'react';
import { motion } from 'framer-motion';
import { useClock } from '../../hooks/useClock.js';

const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function DateTimeCard() {
  const now = useClock();

  const hours   = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const isPM    = now.getHours() >= 12;
  const hour12  = String(now.getHours() % 12 || 12).padStart(2, '0');

  const day     = now.getDate();
  const month   = MONTH_NAMES[now.getMonth()];
  const year    = now.getFullYear();
  const dayName = DAY_NAMES[now.getDay()];

  // Day progress (what % of the day has passed)
  const dayMinutes  = now.getHours() * 60 + now.getMinutes();
  const dayProgress = Math.round((dayMinutes / (24 * 60)) * 100);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card p-5 overflow-hidden relative">
      {/* Top: day name + date */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-700 text-brand-400 uppercase tracking-wider mb-0.5">{dayName}</p>
          <p className="text-2xl font-800 text-gray-800 dark:text-gray-100 leading-tight">
            {day} {month}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{year}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <i className="ti ti-calendar-event text-brand-400 text-lg" />
        </div>
      </div>

      {/* Digital clock */}
      <div className="flex items-center gap-1 mb-4">
        {/* Hours */}
        <ClockBlock value={hour12} />
        <span className="text-2xl font-800 text-gray-400 dark:text-gray-500 pb-0.5 animate-pulse">:</span>
        {/* Minutes */}
        <ClockBlock value={minutes} />
        <span className="text-2xl font-800 text-gray-400 dark:text-gray-500 pb-0.5 animate-pulse">:</span>
        {/* Seconds */}
        <ClockBlock value={seconds} small />
        {/* AM/PM */}
        <div className="ml-1 flex flex-col gap-0.5 pb-0.5">
          <span className={`text-[10px] font-800 px-1.5 py-0.5 rounded ${!isPM ? 'bg-brand-400 text-white' : 'text-gray-300 dark:text-gray-600'}`}>AM</span>
          <span className={`text-[10px] font-800 px-1.5 py-0.5 rounded ${isPM  ? 'bg-brand-400 text-white' : 'text-gray-300 dark:text-gray-600'}`}>PM</span>
        </div>
      </div>

      {/* Day progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>12:00 AM</span>
          <span className="text-brand-400 font-600">{dayProgress}% of day</span>
          <span>11:59 PM</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${dayProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-orange rounded-full"
          />
        </div>
      </div>

      {/* Subtle decorative element */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-brand-50 dark:bg-brand-400/5 pointer-events-none" />
    </motion.div>
  );
}

function ClockBlock({ value, small = false }) {
  return (
    <div className={`bg-gray-50 dark:bg-dark-surface rounded-lg flex items-center justify-center tabular-nums
      ${small ? 'w-9 h-9 text-base font-700' : 'w-11 h-11 text-xl font-800'} text-gray-800 dark:text-gray-100`}>
      {value}
    </div>
  );
}
