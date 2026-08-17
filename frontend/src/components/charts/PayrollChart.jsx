import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { getPayrollTrend } from '../../services/dashboardData.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl px-4 py-3 shadow-hover text-xs">
      <p className="font-700 text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      <p className="text-brand-500 font-700">${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function PayrollChart() {
  const data = getPayrollTrend();
  const latest = data[data.length - 1]?.cost || 0;
  const prev   = data[data.length - 2]?.cost || 0;
  const delta  = ((latest - prev) / prev * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Payroll Analytics</h3>
          <p className="text-xs text-gray-400 mt-0.5">Monthly salary cost (6 months)</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-800 text-gray-800 dark:text-gray-100">${latest.toLocaleString()}</p>
          <p className={`text-xs font-600 ${parseFloat(delta) > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {parseFloat(delta) > 0 ? '+' : ''}{delta}% vs last month
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ff7b0d" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ff7b0d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48}
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="cost" stroke="#ff7b0d" strokeWidth={2.5}
            fill="url(#payrollGrad)" dot={{ r: 4, fill: '#ff7b0d', strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
