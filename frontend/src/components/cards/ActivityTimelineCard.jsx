import React from 'react';
import { motion } from 'framer-motion';

export default function ActivityTimelineCard({ items = [] }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Activity Timeline</h3>
        <p className="text-xs text-gray-400 mt-0.5">Recent system activity</p>
      </div>
      <div className="p-5">
        {items.length === 0 ? (
          <div className="text-center py-6">
            <i className="ti ti-timeline text-gray-200 text-3xl mb-2 block" />
            <p className="text-sm text-gray-400">No recent activity</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100 dark:bg-dark-border" />
            <div className="space-y-4">
              {items.map((item, i) => (
                <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: 0.8 + i * 0.06 }}
                  className="relative flex gap-4 pl-10">
                  <div className="absolute left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: (item.color||'#ff7b0d') + '20' }}>
                    <i className={`ti ${item.icon || 'ti-point'} text-xs`}
                      style={{ color: item.color || '#ff7b0d' }} />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {item.at ? new Date(item.at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : ''}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
