import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getAnnouncements } from '../services/api.js';

const TYPE_CONFIG = {
  info:    { icon:'ti-info-circle',    iconBg:'bg-blue-50',   iconColor:'text-blue-500',   cardBorder:'border-l-blue-400',   badgeBg:'bg-blue-100 text-blue-700'   },
  success: { icon:'ti-check-circle',   iconBg:'bg-green-50',  iconColor:'text-green-500',  cardBorder:'border-l-green-400',  badgeBg:'bg-green-100 text-green-700'  },
  warning: { icon:'ti-alert-triangle', iconBg:'bg-yellow-50', iconColor:'text-yellow-500', cardBorder:'border-l-yellow-400', badgeBg:'bg-yellow-100 text-yellow-700' },
  danger:  { icon:'ti-alert-circle',   iconBg:'bg-red-50',    iconColor:'text-red-500',    cardBorder:'border-l-red-400',    badgeBg:'bg-red-100 text-red-700'      },
};

export default function NoticeBoard() {
  const { user }  = useAuth();
  const [notices, setNotices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({ pages:1, total:0 });
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:10 };
      if (search)     params.search = search;
      if (typeFilter) params.type   = typeFilter;
      const { data } = await getAnnouncements(params);
      setNotices(data.announcements);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notices');
    } finally { setLoading(false); }
  }, [page, search, typeFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const pinned   = notices.filter(n => n.isPinned);
  const regular  = notices.filter(n => !n.isPinned);
  const typeCount = { info:0, success:0, warning:0, danger:0 };
  notices.forEach(n => { if (typeCount[n.type] !== undefined) typeCount[n.type]++; });

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Notice Board</h2>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} notice{pagination.total !== 1 ? 's' : ''} · Official company communications</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-surface px-3 py-2 rounded-lg border border-gray-100 dark:border-dark-border">
          <i className="ti ti-bell text-brand-400" />
          {notices.filter(n => !n.isRead).length > 0 ? `${notices.filter(n => !n.isRead).length} unread` : 'All caught up'}
        </div>
      </div>

      {/* Type summary chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setType('')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-600 transition-all
            ${!typeFilter ? 'bg-gray-800 text-white' : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-500 hover:border-gray-400'}`}>
          All <span className="bg-white/20 px-1.5 rounded-full">{pagination.total}</span>
        </button>
        {[['info','Info','text-blue-500','bg-blue-50'],['success','Success','text-green-500','bg-green-50'],
          ['warning','Warning','text-yellow-600','bg-yellow-50'],['danger','Alert','text-red-500','bg-red-50']].map(([v,l,tc,bc]) => (
          <button key={v} onClick={() => setType(typeFilter === v ? '' : v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-600 transition-all
              ${typeFilter === v ? `${bc} ${tc} ring-1 ring-current` : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-500 hover:border-gray-400'}`}>
            {l} <span className={`${bc} ${tc} px-1.5 rounded-full`}>{typeCount[v]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
          <i className="ti ti-speakerphone text-gray-200 text-5xl mb-3 block" />
          <p className="text-gray-500 font-600">No notices found</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for company updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="ti ti-pin text-brand-400 text-sm" />
                <span className="text-xs font-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pinned</span>
              </div>
              {pinned.map((n, i) => <NoticeCard key={n._id} notice={n} index={i} expanded={expanded} setExpanded={setExpanded} />)}
            </div>
          )}

          {/* Regular */}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <i className="ti ti-news text-gray-400 text-sm" />
                  <span className="text-xs font-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider">All Notices</span>
                </div>
              )}
              {regular.map((n, i) => <NoticeCard key={n._id} notice={n} index={i} expanded={expanded} setExpanded={setExpanded} />)}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page<=1} onClick={() => setPage(p=>p-1)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-gray-600 dark:text-gray-300">
            <i className="ti ti-chevron-left" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 px-3">Page {page} of {pagination.pages}</span>
          <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-gray-600 dark:text-gray-300">
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}
    </AppLayout>
  );
}

function NoticeCard({ notice: n, index, expanded, setExpanded }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
  const isExp = expanded === n._id;

  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border border-l-4 ${cfg.cardBorder} rounded-xl shadow-card overflow-hidden`}>
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(isExp ? null : n._id)}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
            <i className={`ti ${cfg.icon} text-xl ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">{n.title}</h3>
                {n.isPinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-brand-50 text-brand-400 font-600 px-2 py-0.5 rounded-full">
                    <i className="ti ti-pin text-xs" /> Pinned
                  </span>
                )}
                <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>{n.type}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
                <i className={`ti ${isExp ? 'ti-chevron-up' : 'ti-chevron-down'} text-gray-400 text-sm`} />
              </div>
            </div>
            <p className={`text-sm text-gray-500 dark:text-gray-400 leading-relaxed ${isExp ? '' : 'line-clamp-2'}`}>{n.body}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-orange flex items-center justify-center">
                  <span className="text-white text-[8px] font-700">{(n.postedBy?.fullName || 'A').slice(0,1)}</span>
                </div>
                <span className="text-xs text-gray-400">{n.postedBy?.fullName || 'Admin'}</span>
              </div>
              {n.audience && n.audience !== 'all' && (
                <span className="text-xs bg-gray-100 dark:bg-dark-surface text-gray-500 px-2 py-0.5 rounded-full">
                  <i className="ti ti-users text-xs mr-0.5" />{n.audience}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
