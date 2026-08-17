import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';

const ADMIN_NAV = [
  { section: 'Main', items: [
    { label: 'Dashboard',     icon: 'ti-layout-dashboard', path: '/' },
  ]},
  { section: 'People', items: [
    { label: 'Employees',     icon: 'ti-users',            path: '/employees' },
    { label: 'Departments',   icon: 'ti-building',         path: '/departments' },
  ]},
  { section: 'Work', items: [
    { label: 'Attendance',    icon: 'ti-calendar-check',   path: '/attendance' },
    { label: 'Leave',         icon: 'ti-notes',            path: '/leaves' },
    { label: 'Payroll',       icon: 'ti-currency-dollar',  path: '/payroll' },
    { label: 'Projects',      icon: 'ti-folder',           path: '/projects' },
    { label: 'Tasks',         icon: 'ti-list-check',       path: '/tasks' },
  ]},
  { section: 'More', items: [
    { label: 'Calendar',      icon: 'ti-calendar',         path: '/calendar' },
    { label: 'Documents',     icon: 'ti-file',             path: '/documents' },
    { label: 'Reports',       icon: 'ti-chart-bar',        path: '/reports' },
    { label: 'Attendance Rpt',icon: 'ti-report-analytics', path: '/reports/attendance' },
    { label: 'Project Rpt',   icon: 'ti-folder-analytics', path: '/reports/projects' },
    { label: 'Announcements', icon: 'ti-speakerphone',     path: '/announcements' },
    { label: 'Settings',      icon: 'ti-settings',         path: '/settings' },
  ]},
];

const EMPLOYEE_NAV = [
  { section: 'Main', items: [
    { label: 'Dashboard',    icon: 'ti-layout-dashboard', path: '/' },
  ]},
  { section: 'My Work', items: [
    { label: 'My Attendance',icon: 'ti-calendar-check',   path: '/attendance' },
    { label: 'Leave',        icon: 'ti-notes',            path: '/leaves' },
    { label: 'Tasks',        icon: 'ti-list-check',       path: '/tasks' },
    { label: 'Calendar',     icon: 'ti-calendar',         path: '/calendar' },
  ]},
  { section: 'Other', items: [
    { label: 'Documents',    icon: 'ti-file',             path: '/documents' },
    { label: 'Tickets',      icon: 'ti-headset',          path: '/tickets' },
    { label: 'Notice Board', icon: 'ti-speakerphone',     path: '/notices' },
    { label: 'Settings',     icon: 'ti-settings',         path: '/settings' },
  ]},
];

/**
 * Sidebar
 * Props:
 *   collapsed      — desktop only: icon-only mode
 *   setCollapsed   — toggle desktop collapsed
 *   isMobile       — true when rendered as mobile drawer
 *   onNavClick     — called when a nav item is clicked (closes mobile drawer)
 *   onClose        — called when X button is clicked on mobile
 */
export default function Sidebar({
  collapsed    = false,
  setCollapsed = () => {},
  isMobile     = false,
  onNavClick   = () => {},
  onClose      = () => {},
}) {
  const { user } = useAuth();
  const location = useLocation();
  const nav = user?.isAdmin ? ADMIN_NAV : EMPLOYEE_NAV;

  // On mobile, sidebar is never "collapsed" — always full width
  const isCollapsed = isMobile ? false : collapsed;

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-full flex flex-col overflow-hidden z-20 flex-shrink-0"
      style={{ background: 'linear-gradient(170deg, #321740 0%, #4a2268 60%, #321740 100%)' }}
    >
      {/* ── Brand header ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-orange flex items-center justify-center flex-shrink-0 shadow-glow">
          <span className="text-white text-sm font-800">HA</span>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex-1 min-w-0"
            >
              <p className="text-white text-sm font-700 leading-tight whitespace-nowrap">HA Technologies</p>
              <p className="text-[10px] text-white/40 whitespace-nowrap">HR Management</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: X close button | Desktop: collapse toggle */}
        {isMobile ? (
          <button
            onClick={onClose}
            className="ml-auto text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0"
            aria-label="Close menu"
          >
            <i className="ti ti-x text-lg" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(v => !v)}
            className="ml-auto text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <i className={`ti ${isCollapsed ? 'ti-layout-sidebar-right' : 'ti-layout-sidebar'} text-base`} />
          </button>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {nav.map((section) => (
          <div key={section.section} className="mb-1">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[9px] font-800 text-white/25 uppercase tracking-widest px-3 py-2"
                >
                  {section.section}
                </motion.p>
              )}
            </AnimatePresence>

            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavClick}   // closes mobile drawer on navigation
                >
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 cursor-pointer transition-all duration-150 relative
                      ${isActive
                        ? 'bg-white/15 text-white border-l-2 border-brand-400'
                        : 'text-white/60 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                      }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <i className={`ti ${item.icon} text-base flex-shrink-0 ${isActive ? 'text-brand-400' : ''}`} />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-[13px] font-500 whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && !isCollapsed && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User panel ──────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-orange flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
            {(user?.fullName || 'U').slice(0, 2).toUpperCase()}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-white text-xs font-600 truncate">{user?.fullName}</p>
                <p className="text-white/35 text-[10px] truncate">{user?.isAdmin ? 'Admin / HR' : 'Employee'}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        </div>
      </div>
    </motion.aside>
  );
}
