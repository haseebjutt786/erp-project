import React from 'react';
import { motion } from 'framer-motion';
import { getAnnouncements } from '../../services/dashboardData.js';

const TYPE_STYLES = {
  info:    { icon: 'ti-info-circle', bg: 'bg-blue-50', iconColor: 'text-blue-500',  border: 'border-l-blue-400' },
  success: { icon: 'ti-check-circle', bg: 'bg-green-50', iconColor: 'text-green-500', border: 'border-l-green-400' },
  warning: { icon: 'ti-alert-triangle', bg: 'bg-yellow-50', iconColor: 'text-yellow-500', border: 'border-l-yellow-400' },
  danger:  { icon: 'ti-alert-circle', bg: 'bg-red-50', iconColor: 'text-red-500',  border: 'border-l-red-400' },
};

export default function AnnouncementsCard() {
  const items = getAnnouncements();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <i className="ti ti-speakerphone text-brand-400" />
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Announcements</h3>
        </div>
        <button className="text-xs text-brand-400 font-600 hover:text-brand-500 transition-colors">Post new</button>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item, i) => {
          const s = TYPE_STYLES[item.type] || TYPE_STYLES.info;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.06 }}
              className={`${s.bg} border-l-4 ${s.border} rounded-r-lg px-3 py-3`}
            >
              <div className="flex items-start gap-2">
                <i className={`ti ${s.icon} ${s.iconColor} text-base flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-700 text-gray-800 dark:text-gray-200">{item.title}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.body}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
