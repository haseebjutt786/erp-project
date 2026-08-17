import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const PALETTE = ['#466ae6','#ff7b0d','#7b4fa0','#18a04b','#eb0910','#0096c7','#e89f00','#6d8b74'];

export default function DeptDistChartLive({ data = [] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colored = data.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Employee Distribution</h3>
        <p className="text-xs text-gray-400 mt-0.5">By Department</p>
      </div>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-300">
          <i className="ti ti-building text-4xl mb-2" />
          <p className="text-sm">No departments yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={colored} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={2} strokeWidth={0}>
                  {colored.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius:'8px', fontSize:'12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden">
            {colored.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{d.name}</span>
                <span className="text-xs font-700 text-gray-800 dark:text-gray-200">{d.value}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{total > 0 ? Math.round(d.value/total*100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
