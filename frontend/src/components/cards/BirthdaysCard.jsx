import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar.jsx';
import { getUpcomingBirthdays } from '../../services/dashboardData.js';

export default function BirthdaysCard() {
  const birthdays = getUpcomingBirthdays();
  const [wished, setWished] = useState(new Set());

  const handleWish = (id) => setWished(prev => new Set([...prev, id]));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border flex items-center gap-2">
        <i className="ti ti-cake text-brand-400" />
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Upcoming Birthdays</h3>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-dark-border">
        {birthdays.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 + i * 0.06 }}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
          >
            <Avatar initials={b.avatar} color={b.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 text-gray-800 dark:text-gray-200 truncate">{b.name}</p>
              <p className="text-xs text-gray-400">{b.dept} · {b.date}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] bg-orange-50 text-brand-400 font-600 px-2 py-0.5 rounded-full">
                {b.daysLeft === 1 ? 'Tomorrow!' : `${b.daysLeft} days`}
              </span>
              <button
                onClick={() => handleWish(b.id)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-600 transition-all ${
                  wished.has(b.id)
                    ? 'bg-green-50 text-green-600 cursor-default'
                    : 'bg-brand-400 text-white hover:bg-brand-500'
                }`}
              >
                {wished.has(b.id) ? '✓ Wished' : '🎉 Wish'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
