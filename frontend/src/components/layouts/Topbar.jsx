import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useClock } from '../../hooks/useClock.js';
import { useDarkMode } from '../../hooks/useDarkMode.js';
import {
  getMyNotifications, markNotificationRead,
  markAllNotificationsRead, deleteNotification,
} from '../../services/api.js';

const PATH_LABELS = {
  '/':'Dashboard', '/employees':'Employees', '/departments':'Departments',
  '/attendance':'Attendance', '/leaves':'Leave Management', '/payroll':'Payroll',
  '/projects':'Projects', '/tasks':'Tasks', '/calendar':'Calendar',
  '/documents':'Documents', '/reports':'Reports', '/announcements':'Announcements',
  '/settings':'Settings', '/notices':'Notice Board', '/tickets':'Tickets',
};

const NOTIF_ICONS = {
  employee_joined:      { icon:'ti-user-plus',       color:'#466ae6' },
  leave_applied:        { icon:'ti-notes',            color:'#ff7b0d' },
  leave_approved:       { icon:'ti-check',            color:'#18a04b' },
  leave_rejected:       { icon:'ti-x',                color:'#eb0910' },
  payroll_generated:    { icon:'ti-currency-dollar',  color:'#18a04b' },
  task_assigned:        { icon:'ti-list-check',       color:'#ff7b0d' },
  task_completed:       { icon:'ti-circle-check',     color:'#18a04b' },
  announcement_published:{ icon:'ti-speakerphone',   color:'#7b4fa0' },
  department_created:   { icon:'ti-building',         color:'#0096c7' },
  general:              { icon:'ti-bell',             color:'#9ca3af' },
};

export default function Topbar({ onMenuClick = () => {}, mobileOpen = false }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const now       = useClock();
  const [dark, setDark] = useDarkMode();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  const pageTitle = PATH_LABELS[location.pathname] || 'Page';
  const timeStr   = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const dateStr   = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  const initials  = (user?.fullName || 'U').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await getMyNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 30000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id).catch(()=>{});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead:true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(()=>{});
    setNotifications(prev => prev.map(n => ({ ...n, isRead:true })));
    setUnread(0);
  };

  const handleDeleteNotif = async (id, e) => {
    e.stopPropagation();
    await deleteNotification(id).catch(()=>{});
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const handleNotifClick = (n) => {
    if (!n.isRead) handleMarkRead(n._id);
    if (n.link) navigate(n.link);
    setNotifOpen(false);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };

  return (
    <header className="h-14 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border flex items-center px-3 sm:px-6 gap-2 sm:gap-3 sticky top-0 z-10 shadow-sm">

      {/* ── Hamburger (mobile only) ────────────────────────────────────── */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface transition-all flex-shrink-0"
        aria-label="Toggle menu"
      >
        <i className={`ti ${mobileOpen ? 'ti-x' : 'ti-menu-2'} text-xl`} />
      </button>

      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Home</span>
        <i className="ti ti-chevron-right text-gray-300 text-xs hidden sm:block" />
        <span className="text-sm font-600 text-gray-800 dark:text-gray-100 truncate">{pageTitle}</span>
      </div>

      {/* Date/Time */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 dark:bg-dark-surface px-3 py-1.5 rounded-lg border border-gray-100 dark:border-dark-border flex-shrink-0">
        <i className="ti ti-calendar text-brand-400 text-sm" />
        <span>{dateStr}</span>
        <span className="text-gray-300">·</span>
        <span className="font-600 text-gray-600 dark:text-gray-300 tabular-nums">{timeStr}</span>
      </div>

      {/* Search */}
      <div className={`relative hidden md:block transition-all duration-200 flex-shrink-0 ${searchFocused ? 'w-56' : 'w-40'}`}>
        <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input placeholder="Search..." onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 text-gray-700 dark:text-gray-200 transition-all" />
      </div>

      {/* Dark mode */}
      <button onClick={() => setDark(v => !v)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-surface transition-all flex-shrink-0"
        title="Toggle dark mode">
        <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'} text-base`} />
      </button>

      {/* Notifications */}
      <div className="relative flex-shrink-0" ref={notifRef}>
        <button onClick={() => { setNotifOpen(v=>!v); setProfileOpen(false); }}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-surface transition-all">
          <i className="ti ti-bell text-base" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-brand-400 text-white text-[9px] font-700 rounded-full flex items-center justify-center px-0.5">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div initial={{ opacity:0, y:8, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:8, scale:0.95 }} transition={{ duration:0.15 }}
              className="absolute right-0 top-10 w-72 sm:w-80 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl shadow-hover z-50 max-w-[calc(100vw-1rem)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                <span className="text-sm font-700 text-gray-800 dark:text-gray-100">Notifications</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <span className="text-xs bg-brand-50 text-brand-400 font-600 px-2 py-0.5 rounded-full">{unread} new</span>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-gray-400 hover:text-brand-400 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <i className="ti ti-bell-off text-gray-300 text-2xl mb-2 block" />
                    <p className="text-sm text-gray-400">No notifications</p>
                  </div>
                ) : notifications.map(n => {
                  const meta = NOTIF_ICONS[n.type] || NOTIF_ICONS.general;
                  return (
                    <div key={n._id} onClick={() => handleNotifClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-surface cursor-pointer transition-colors ${!n.isRead ? 'bg-brand-50/30 dark:bg-brand-400/5' : ''}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: meta.color+'18' }}>
                        <i className={`ti ${meta.icon} text-sm`} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-600 text-gray-800 dark:text-gray-200">{n.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{n.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                        <button onClick={(e) => handleDeleteNotif(n._id, e)}
                          className="text-gray-300 hover:text-red-400 transition-colors">
                          <i className="ti ti-x text-xs" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile */}
      <div className="relative flex-shrink-0" ref={profileRef}>
        <button onClick={() => { setProfileOpen(v=>!v); setNotifOpen(false); }}
          className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-surface px-2 py-1.5 rounded-lg transition-all">
          <div className="w-7 h-7 rounded-full bg-gradient-orange flex items-center justify-center text-white text-xs font-700">{initials}</div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-600 text-gray-800 dark:text-gray-100 leading-tight">{user?.fullName}</p>
            <p className="text-[10px] text-gray-400">{user?.isAdmin ? 'Admin' : 'Employee'}</p>
          </div>
          <i className="ti ti-chevron-down text-gray-400 text-xs" />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div initial={{ opacity:0, y:8, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:8, scale:0.95 }} transition={{ duration:0.15 }}
              className="absolute right-0 top-11 w-52 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl shadow-hover z-50 overflow-hidden max-w-[calc(100vw-1rem)]">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-orange flex items-center justify-center text-white text-sm font-700 mx-auto mb-2">{initials}</div>
                <p className="text-sm font-700 text-gray-800 dark:text-gray-100">{user?.fullName}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              {[{ icon:'ti-settings', label:'Settings', path:'/settings' }].map(item => (
                <button key={item.label} onClick={() => { navigate(item.path); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors font-500">
                  <i className={`ti ${item.icon} text-gray-400`} />{item.label}
                </button>
              ))}
              <div className="border-t border-gray-50 dark:border-dark-border">
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-600">
                  <i className="ti ti-logout" />Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
