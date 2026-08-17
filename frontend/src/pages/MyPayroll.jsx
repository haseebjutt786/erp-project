import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { getMyPayroll } from '../services/api.js';

const fmt  = (n) => `$${Number(n || 0).toLocaleString()}`;
const fmtM = (m) => new Date(`${m}-01`).toLocaleDateString('en-US', { month:'long', year:'numeric' });

export default function MyPayroll() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPayroll()
      .then(({ data }) => setEntries(data))
      .catch(err => toast.error(err.response?.data?.message || 'Failed to load payroll'))
      .finally(() => setLoading(false));
  }, []);

  const totalNet = entries.reduce((s, e) => s + (e.netSalary || 0), 0);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">My Payslips</h2>
          <p className="text-sm text-gray-400 mt-0.5">{entries.length} payslip{entries.length !== 1 ? 's' : ''} · Total earned: {fmt(totalNet)}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
          <i className="ti ti-currency-dollar text-2xl text-green-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
          <i className="ti ti-receipt text-gray-200 text-5xl mb-3 block" />
          <p className="text-gray-500 font-600">No payslips generated yet</p>
          <p className="text-sm text-gray-400 mt-1">Contact HR to generate your payroll</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((e, i) => (
            <motion.div key={e._id}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden hover:shadow-hover hover:-translate-y-0.5 transition-all">
              {/* Top accent */}
              <div className={`h-1 ${e.status === 'paid' ? 'bg-gradient-green' : 'bg-gradient-to-r from-yellow-400 to-yellow-500'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-800 text-gray-800 dark:text-gray-100">{fmtM(e.month)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{e.month}</p>
                  </div>
                  <span className={`text-xs font-700 px-2.5 py-1 rounded-full ${e.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {e.status === 'paid' ? '✓ Paid' : 'Pending'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Basic Salary</span>
                    <span className="font-600 text-gray-700 dark:text-gray-300">{fmt(e.basicSalary)}</span>
                  </div>
                  {e.allowances > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Allowances</span>
                      <span className="font-600 text-green-600">+{fmt(e.allowances)}</span>
                    </div>
                  )}
                  {e.bonus > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Bonus</span>
                      <span className="font-600 text-green-600">+{fmt(e.bonus)}</span>
                    </div>
                  )}
                  {e.deductions > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Deductions</span>
                      <span className="font-600 text-red-500">-{fmt(e.deductions)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-dark-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-700 text-gray-600 dark:text-gray-300">Net Salary</span>
                    <span className="text-xl font-800 text-gray-800 dark:text-gray-100">{fmt(e.netSalary)}</span>
                  </div>
                  {e.paidOn && (
                    <p className="text-xs text-gray-400 mt-1">Paid on {new Date(e.paidOn).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
