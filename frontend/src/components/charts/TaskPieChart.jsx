import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { getTaskBreakdown } from '../../services/dashboardData.js';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl px-4 py-3 shadow-hover text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.color }} />
        <span className="font-700 text-gray-800 dark:text-gray-200">{payload[0].name}</span>
        <span className="text-gray-500">·</span>
        <span className="font-600 text-gray-700 dark:text-gray-300">{payload[0].value}</span>
      </div>
    </div>
  );
};

export default function TaskPieChart() {
  const data = getTaskBreakdown();
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Task Analytics</h3>
        <p className="text-xs text-gray-400 mt-0.5">{total} tasks total</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{d.name}</p>
              <p className="text-sm font-700 text-gray-800 dark:text-gray-200">{d.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
