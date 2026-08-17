import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge.jsx';

const STATUS_MAP = {
  not_started: { label:'Not Started', variant:'gray' },
  in_progress: { label:'In Progress', variant:'blue' },
  done:        { label:'Done',        variant:'green' },
};

export default function RecentTasksCard({ tasks = [] }) {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.52 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <div>
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Recent Tasks</h3>
          <p className="text-xs text-gray-400 mt-0.5">Latest created</p>
        </div>
        <button onClick={() => navigate('/tasks')}
          className="text-xs text-brand-400 font-600 hover:text-brand-500 transition-colors flex items-center gap-1">
          View all <i className="ti ti-arrow-right text-xs" />
        </button>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-dark-border">
        {tasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <i className="ti ti-list-check text-gray-200 text-3xl mb-2 block" />
            <p className="text-sm text-gray-400">No tasks created yet</p>
          </div>
        ) : tasks.slice(0, 6).map((task, i) => (
          <motion.div key={task._id} initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ delay: 0.52 + i * 0.05 }}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-sm font-600 text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
              <p className="text-xs text-gray-400 truncate">
                {task.assignedTo?.fullName || '—'} · {task.project || 'General'}
              </p>
            </div>
            <Badge label={STATUS_MAP[task.status]?.label || task.status}
              variant={STATUS_MAP[task.status]?.variant || 'gray'} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
