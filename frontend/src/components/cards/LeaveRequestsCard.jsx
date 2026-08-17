import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { getAllLeaves, reviewLeave } from '../../services/api.js';

const COLORS = ['#18a04b','#7b4fa0','#466ae6','#eb0910','#e89f00'];
const TYPE_LABELS = { sick:'Sick', casual:'Casual', annual:'Annual', unpaid:'Unpaid', other:'Other' };

export default function LeaveRequestsCard({ onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    try {
      const { data } = await getAllLeaves('pending');
      setRequests(data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handle = async (id, status) => {
    try {
      await reviewLeave(id, { status });
      toast.success(`Leave ${status}`);
      setRequests(prev => prev.filter(r => r._id !== id));
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.7 }}
      className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Leave Requests</h3>
          {requests.length > 0 && (
            <span className="w-5 h-5 bg-brand-400 text-white text-[10px] font-700 rounded-full flex items-center justify-center">
              {requests.length}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">Pending approval</span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-dark-border">
        <AnimatePresence>
          {loading ? (
            <div className="px-5 py-6 text-center">
              <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : requests.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <i className="ti ti-check-circle text-green-400 text-2xl mb-2 block" />
              <p className="text-sm text-gray-400">All requests reviewed</p>
            </div>
          ) : requests.map((r, i) => (
            <motion.div key={r._id} initial={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              transition={{ duration:0.25 }}
              className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
              <div className="flex items-start gap-3">
                <Avatar initials={(r.employee?.fullName||'?').slice(0,2).toUpperCase()}
                  color={COLORS[i % COLORS.length]} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-600 text-gray-800 dark:text-gray-200">{r.employee?.fullName}</p>
                    <Badge label={TYPE_LABELS[r.leaveType] || r.leaveType} variant="orange" />
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(r.fromDate).toLocaleDateString()} → {new Date(r.toDate).toLocaleDateString()}
                  </p>
                  {r.reason && <p className="text-xs text-gray-500 mt-0.5 italic truncate">{r.reason}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                  <button onClick={() => handle(r._id, 'approved')}
                    className="w-7 h-7 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-100 transition-colors" title="Approve">
                    <i className="ti ti-check text-sm" />
                  </button>
                  <button onClick={() => handle(r._id, 'rejected')}
                    className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors" title="Reject">
                    <i className="ti ti-x text-sm" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
