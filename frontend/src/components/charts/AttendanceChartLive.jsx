import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl px-4 py-3 shadow-hover text-xs">
      <p className="font-700 text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-600 text-gray-800 dark:text-gray-200">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AttendanceChartLive({ data = [] }) {
  const [type, setType] = useState('bar');
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Attendance Trend</h3>
          <p className="text-xs text-gray-400 mt-0.5">Last 7 days — live data</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5">
          {['bar','line'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs font-600 rounded-md transition-all capitalize
                ${type === t ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400'}`}>
              <i className={`ti ${t === 'bar' ? 'ti-chart-bar' : 'ti-chart-line'} mr-1`} />{t}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        {type === 'bar' ? (
          <BarChart data={data} barSize={16} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<Tip />} cursor={{ fill:'#f9fafb' }} />
            <Legend wrapperStyle={{ fontSize:11, paddingTop:12 }} iconType="circle" iconSize={8} />
            <Bar dataKey="present" fill="#ff7b0d" radius={[4,4,0,0]} name="Present" />
            <Bar dataKey="absent"  fill="#e5e7eb" radius={[4,4,0,0]} name="Absent" />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize:11, paddingTop:12 }} iconType="circle" iconSize={8} />
            <Line type="monotone" dataKey="present" stroke="#ff7b0d" strokeWidth={2.5} dot={{ r:4, fill:'#ff7b0d' }} name="Present" />
            <Line type="monotone" dataKey="absent"  stroke="#e5e7eb" strokeWidth={2.5} dot={{ r:4, fill:'#e5e7eb' }} name="Absent" />
          </LineChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
}
