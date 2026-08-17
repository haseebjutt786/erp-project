import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { getPayrollByMonth, generatePayroll, updatePayrollEntry, markPayrollAsPaid } from '../services/api.js';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmt = (n) => `${Number(n || 0).toLocaleString()}`;

export default function Payroll() {
  const [month, setMonth]       = useState(currentMonth());
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editDraft, setEditDraft]   = useState({});

  const load = async (m) => {
    setLoading(true);
    try {
      const { data } = await getPayrollByMonth(m);
      setEntries(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load payroll');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(month); }, [month]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await generatePayroll(month);
      toast.success(data.message);
      load(month);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally { setGenerating(false); }
  };

  const getDraft = (e) => editDraft[e._id] || { allowances:e.allowances, bonus:e.bonus, deductions:e.deductions };
  const setField = (id, field, value) => setEditDraft(p => ({ ...p, [id]: { ...getDraft({ _id:id, ...entries.find(e=>e._id===id) }), [field]:value } }));

  const handleSave = async (entry) => {
    try {
      await updatePayrollEntry(entry._id, getDraft(entry));
      toast.success('Updated');
      load(month);
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handlePay = async (entry) => {
    if (!window.confirm(`Mark ${entry.employee?.fullName}'s payroll as paid?`)) return;
    try {
      await markPayrollAsPaid(entry._id);
      toast.success('Marked as paid');
      load(month);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const totalNet  = entries.reduce((s, e) => s + e.netSalary, 0);
  const paidCount = entries.filter(e => e.status === 'paid').length;
  const draftCount = entries.length - paidCount;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Payroll</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {entries.length > 0
              ? `${entries.length} entries · ${paidCount} paid · ${draftCount} draft · Net total: ${fmt(totalNet)}`
              : 'No entries for this month'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 bg-gradient-orange text-white px-4 py-2 rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
            {generating
              ? <><i className="ti ti-loader-2 animate-spin" /> Generating...</>
              : <><i className="ti ti-refresh" /> Generate Payroll</>}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label:'Total Entries', value:entries.length,   icon:'ti-users',           color:'blue' },
            { label:'Paid',          value:paidCount,         icon:'ti-circle-check',    color:'green' },
            { label:'Draft',         value:draftCount,        icon:'ti-edit',            color:'yellow' },
            { label:'Net Total',     value:fmt(totalNet),     icon:'ti-currency-dollar', color:'purple' },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
              className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-${c.color}-50`}>
                <i className={`ti ${c.icon} text-lg text-${c.color}-500`} />
              </div>
              <p className="text-xs text-gray-400 mb-1">{c.label}</p>
              <p className="text-xl font-800 text-gray-800 dark:text-gray-100">{c.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <i className="ti ti-currency-dollar text-gray-200 text-5xl mb-3 block" />
            <p className="text-gray-500 font-600">No payroll entries for {month}</p>
            <p className="text-sm text-gray-400 mt-1">Click "Generate Payroll" to create draft entries from employee salaries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-surface">
                  {['Employee','Basic','Allowances','Bonus','Deductions','Net Salary','Status',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const d = getDraft(e);
                  const isPaid = e.status === 'paid';
                  return (
                    <motion.tr key={e._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.04 }}
                      className="hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                      <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                        <p className="text-sm font-600 text-gray-800 dark:text-gray-200">{e.employee?.fullName || '—'}</p>
                        <p className="text-xs text-gray-400">{e.employee?.department || '—'}</p>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-sm text-gray-600 dark:text-gray-300">{fmt(e.basicSalary)}</td>
                      {['allowances','bonus','deductions'].map(field => (
                        <td key={field} className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                          <input type="number" min="0" disabled={isPaid} value={d[field]}
                            onChange={ev => setField(e._id, field, ev.target.value)}
                            className="w-20 px-2 py-1 text-xs border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-dark-border" />
                        </td>
                      ))}
                      <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                        <span className="text-sm font-700 text-gray-800 dark:text-gray-100">{fmt(e.netSalary)}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                        <span className={`text-xs font-700 px-2.5 py-1 rounded-full ${isPaid ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                          {isPaid ? '✓ Paid' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                        {!isPaid && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleSave(e)}
                              className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors font-600">
                              Save
                            </button>
                            <button onClick={() => handlePay(e)}
                              className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors font-600">
                              Mark Paid
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
