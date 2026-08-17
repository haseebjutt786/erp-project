import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';

const COLORS = ['#466ae6','#ff7b0d','#18a04b','#7b4fa0','#eb0910','#0096c7'];

export default function RecentEmployeesCard({ employees = [] }) {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <div>
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Recent Employees</h3>
          <p className="text-xs text-gray-400 mt-0.5">Latest joiners</p>
        </div>
        <button onClick={() => navigate('/employees')}
          className="text-xs text-brand-400 font-600 hover:text-brand-500 transition-colors flex items-center gap-1">
          View all <i className="ti ti-arrow-right text-xs" />
        </button>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-dark-border">
        {employees.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <i className="ti ti-users text-gray-200 text-3xl mb-2 block" />
            <p className="text-sm text-gray-400">No employees yet</p>
          </div>
        ) : employees.map((emp, i) => (
          <motion.div key={emp._id} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
            transition={{ delay: 0.55 + i * 0.06 }}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
            <Avatar initials={(emp.fullName||'?').slice(0,2).toUpperCase()}
              color={COLORS[i % COLORS.length]} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 text-gray-800 dark:text-gray-200 truncate">{emp.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{emp.designation || emp.department || '—'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-600 text-gray-500 dark:text-gray-400">{emp.department || '—'}</span>
              <p className="text-[10px] text-gray-400">{emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : ''}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
