import React from 'react';
import { motion } from 'framer-motion';
import Badge from '../ui/Badge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { getRecentProjects } from '../../services/dashboardData.js';

const PRIORITY_COLORS = { High: '#eb0910', Medium: '#e89f00', Low: '#466ae6' };

export default function RecentProjectsTable() {
  const projects = getRecentProjects();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <div>
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Recent Projects</h3>
          <p className="text-xs text-gray-400 mt-0.5">Status, deadline & progress</p>
        </div>
        <button className="text-xs text-brand-400 font-600 hover:text-brand-500 transition-colors flex items-center gap-1">
          View all <i className="ti ti-arrow-right text-xs" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {['Project', 'Department', 'Priority', 'Deadline', 'Status', 'Progress'].map(h => (
                <th key={h} className="table-header text-left first:pl-5 last:pr-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
              >
                <td className="table-cell pl-5">
                  <p className="text-sm font-600 text-gray-800 dark:text-gray-200">{p.name}</p>
                </td>
                <td className="table-cell">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{p.dept}</span>
                </td>
                <td className="table-cell">
                  <span className="flex items-center gap-1.5 text-xs font-600" style={{ color: PRIORITY_COLORS[p.priority] }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLORS[p.priority] }} />
                    {p.priority}
                  </span>
                </td>
                <td className="table-cell">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{p.deadline}</span>
                </td>
                <td className="table-cell">
                  <Badge label={p.status} />
                </td>
                <td className="table-cell pr-5 w-32">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={p.progress} color={p.progress >= 80 ? '#18a04b' : p.progress >= 50 ? '#ff7b0d' : '#466ae6'} height={5} />
                    <span className="text-xs font-600 text-gray-500 w-8 flex-shrink-0">{p.progress}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
