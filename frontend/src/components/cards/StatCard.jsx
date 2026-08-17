import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const GRADIENTS = {
  orange: 'from-orange-400 to-orange-500',
  blue:   'from-blue-500 to-blue-600',
  green:  'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  red:    'from-red-500 to-red-600',
  teal:   'from-teal-500 to-teal-600',
  yellow: 'from-yellow-400 to-yellow-500',
  indigo: 'from-indigo-500 to-indigo-600',
};

const LIGHT_BG = {
  orange: 'bg-orange-50 text-orange-500',
  blue:   'bg-blue-50 text-blue-500',
  green:  'bg-green-50 text-green-500',
  purple: 'bg-purple-50 text-purple-500',
  red:    'bg-red-50 text-red-500',
  teal:   'bg-teal-50 text-teal-500',
  yellow: 'bg-yellow-50 text-yellow-500',
  indigo: 'bg-indigo-50 text-indigo-500',
};

export default function StatCard({ icon, label, value, delta, trend, color = 'orange', index = 0, prefix = '', suffix = '' }) {
  const isNumeric = typeof value === 'number';
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';
  const trendIcon  = trend === 'up' ? 'ti-trend-up' : trend === 'down' ? 'ti-trend-down' : 'ti-minus';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -3, boxShadow: '0 12px 28px rgba(0,0,0,0.10)' }}
      className="bg-white dark:bg-dark-card rounded-xl p-3 sm:p-5 border border-gray-100 dark:border-dark-border cursor-pointer relative overflow-hidden"
    >
      {/* Decorative top stripe */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${GRADIENTS[color]}`} />

      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${LIGHT_BG[color]}`}>
          <i className={`ti ${icon} text-lg sm:text-xl`} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-600 ${trendColor}`}>
          <i className={`ti ${trendIcon} text-sm`} />
        </div>
      </div>

      <div className="mt-3 sm:mt-4">
        {isNumeric ? (
          <p className="text-xl sm:text-2xl font-800 text-gray-800 dark:text-gray-100">
            {prefix}
            <CountUp end={value} duration={1.5} separator="," />
            {suffix}
          </p>
        ) : (
          <p className="text-xl sm:text-2xl font-800 text-gray-800 dark:text-gray-100 truncate">{value}</p>
        )}
        <p className="text-[10px] sm:text-xs font-600 text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{label}</p>
      </div>

      {delta && (
        <p className={`text-[10px] sm:text-xs mt-1.5 font-500 ${trendColor} truncate`}>{delta}</p>
      )}
    </motion.div>
  );
}
