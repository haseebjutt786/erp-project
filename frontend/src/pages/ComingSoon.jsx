import React from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../components/layouts/AppLayout.jsx';

export default function ComingSoon({ title }) {
  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mb-5"
        >
          <i className="ti ti-tool text-4xl text-brand-400" />
        </motion.div>
        <h2 className="text-2xl font-800 text-gray-800 dark:text-gray-100 mb-2">{title}</h2>
        <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-6">
          This module is currently under development. It'll be ready in a future release.
        </p>
        <div className="w-48 h-1.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '35%' }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-full bg-gradient-orange rounded-full"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">In development</p>
      </motion.div>
    </AppLayout>
  );
}
