import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = { not_started:'#9ca3af', in_progress:'#466ae6', done:'#18a04b', overdue:'#eb0910' };
const LABELS = { not_started:'Not Started', in_progress:'In Progress', done:'Done', overdue:'Overdue' };

export default function TaskPieChartLive({ data }) {
  if (!data) return null;
  const chartData = Object.entries(data)
    .map(([key, value]) => ({ name: LABELS[key] || key, value, color: COLORS[key] || '#9ca3af' }))
    .filter(d => d.value > 0);
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Task Analytics</h3>
        <p className="text-xs text-gray-400 mt-0.5">{total} tasks total</p>
      </div>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-300">
          <i className="ti ti-list-check text-4xl mb-2" />
          <p className="text-sm">No tasks yet</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius:'8px', fontSize:'12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {chartData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{d.name}</p>
                  <p className="text-sm font-700 text-gray-800 dark:text-gray-200">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
