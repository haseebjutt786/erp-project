import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { getDeptDistribution } from '../../services/dashboardData.js';

export default function DeptDistributionChart() {
  const data = getDeptDistribution();
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Employee Distribution</h3>
        <p className="text-xs text-gray-400 mt-0.5">By Department</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={130} height={130}>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={2} strokeWidth={0}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{d.name}</span>
              <span className="text-xs font-700 text-gray-800 dark:text-gray-200">{d.value}</span>
              <span className="text-xs text-gray-400">{((d.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
