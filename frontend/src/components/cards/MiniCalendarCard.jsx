import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function MiniCalendarCard() {
  const today = new Date();
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate();
  const firstDay    = new Date(cur.year, cur.month, 1).getDay();
  const cells       = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const prev = () => setCur(v => v.month === 0 ? { year:v.year-1, month:11 } : { ...v, month:v.month-1 });
  const next = () => setCur(v => v.month === 11 ? { year:v.year+1, month:0 } : { ...v, month:v.month+1 });

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.9 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <i className="ti ti-calendar text-brand-400" />
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors">
            <i className="ti ti-chevron-left text-xs" />
          </button>
          <span className="text-xs font-600 text-gray-700 dark:text-gray-200 w-24 text-center">
            {MONTHS[cur.month].slice(0,3)} {cur.year}
          </span>
          <button onClick={next} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors">
            <i className="ti ti-chevron-right text-xs" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-700 text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => {
            const isToday = d && cur.month === today.getMonth() && cur.year === today.getFullYear() && d === today.getDate();
            return (
              <div key={i} className={`aspect-square flex items-center justify-center rounded-lg text-[11px] cursor-pointer transition-all
                ${!d ? '' : isToday ? 'bg-brand-400 text-white font-700' : 'hover:bg-gray-50 dark:hover:bg-dark-surface text-gray-700 dark:text-gray-300 font-500'}`}>
                {d || ''}
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-dark-border">
          <p className="text-xs text-gray-400 text-center">
            Today is {today.toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric'})}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
