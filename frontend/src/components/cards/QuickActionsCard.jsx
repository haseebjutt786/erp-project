import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { icon:'ti-user-plus',       label:'Add Employee',      color:'#466ae6', bg:'#eef4ff', path:'/employees' },
  { icon:'ti-currency-dollar', label:'Generate Payroll',  color:'#18a04b', bg:'#e8f9f0', path:'/payroll' },
  { icon:'ti-list-check',      label:'Assign Task',       color:'#ff7b0d', bg:'#fff3e9', path:'/tasks' },
  { icon:'ti-notes',           label:'Approve Leave',     color:'#7b4fa0', bg:'#f5f0ff', path:'/leaves' },
  { icon:'ti-building',        label:'Add Department',    color:'#0096c7', bg:'#e8f9ff', path:'/departments' },
  { icon:'ti-speakerphone',    label:'Announcement',      color:'#e89f00', bg:'#fff8e5', path:'/announcements' },
];

export default function QuickActionsCard() {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.85 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Quick Actions</h3>
        <p className="text-xs text-gray-400 mt-0.5">Frequently used shortcuts</p>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {ACTIONS.map((a, i) => (
          <motion.button key={a.label}
            initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
            transition={{ delay: 0.85 + i * 0.05 }}
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}
            onClick={() => navigate(a.path)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-50 dark:border-dark-border hover:shadow-md transition-all cursor-pointer"
            style={{ background: a.bg }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: a.color+'20' }}>
              <i className={`ti ${a.icon} text-lg`} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-600 text-gray-600 dark:text-gray-300 text-center leading-tight">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
