import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layouts/AppLayout.jsx';
import Badge from '../components/ui/Badge.jsx';
import WeatherCard from '../components/cards/WeatherCard.jsx';
import DateTimeCard from '../components/cards/DateTimeCard.jsx';
import WorkingHoursCard from '../components/cards/WorkingHoursCard.jsx';
import MotivationalQuoteCard from '../components/cards/MotivationalQuoteCard.jsx';
import MiniCalendarCard from '../components/cards/MiniCalendarCard.jsx';
import { getDashboardData, toggleClock, getLatestAnnouncements } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useClock } from '../hooks/useClock.js';

const STATUS_MAP = {
  not_started: { label: 'Not Started', variant: 'gray' },
  in_progress: { label: 'In Progress', variant: 'blue' },
  done:        { label: 'Done',        variant: 'green' },
};

const TYPE_STYLE = {
  info:    { icon: 'ti-info-circle',    bg: 'bg-blue-50',   text: 'text-blue-500',   border: 'border-l-blue-400' },
  success: { icon: 'ti-check-circle',   bg: 'bg-green-50',  text: 'text-green-500',  border: 'border-l-green-400' },
  warning: { icon: 'ti-alert-triangle', bg: 'bg-yellow-50', text: 'text-yellow-500', border: 'border-l-yellow-400' },
  danger:  { icon: 'ti-alert-circle',   bg: 'bg-red-50',    text: 'text-red-500',    border: 'border-l-red-400' },
};

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData]                   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const now       = useClock();
  const firstName = user?.fullName?.split(' ')[0] || '';

  const fetchData = async () => {
    try {
      const [dashRes, annRes] = await Promise.all([
        getDashboardData(),
        getLatestAnnouncements(3),
      ]);
      setData(dashRes.data);
      setAnnouncements(annRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClockToggle = async () => {
    try {
      const { data: d } = await toggleClock();
      updateUser({ isClockedIn: d.isClockedIn, clockInTime: d.clockInTime });
      toast.success(d.isClockedIn ? 'Clocked in!' : 'Clocked out. Good work today!');
    } catch {
      toast.error('Something went wrong, please try again');
    }
  };

  const clockInStr = user?.clockInTime
    ? new Date(user.clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <AppLayout>
      {/* ── Header: greeting + clock-in/out ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h1 className="text-xl font-800 text-gray-800 dark:text-gray-100">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-800 text-gray-800 dark:text-gray-100 tabular-nums">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            {clockInStr && user?.isClockedIn && (
              <p className="text-xs text-gray-400 mt-0.5">Clocked in at {clockInStr}</p>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleClockToggle}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-700 text-white transition-all shadow-md
              ${user?.isClockedIn
                ? 'bg-gradient-to-r from-red-500 to-red-400'
                : 'bg-gradient-to-r from-green-500 to-green-400'}`}>
            <i className={`ti ${user?.isClockedIn ? 'ti-clock-off' : 'ti-clock-play'} text-base`} />
            {user?.isClockedIn ? 'Clock Out' : 'Clock In'}
          </motion.button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data && (
        <>
          {/* ── Row 1: Stat mini-cards ────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            {[
              { icon: 'ti-list-check',     label: 'Pending Tasks',  value: data.stats.pendingTasks,   iconBg: 'bg-orange-50', iconColor: 'text-brand-400' },
              { icon: 'ti-folder',         label: 'Active Projects',value: data.stats.activeProjects,  iconBg: 'bg-blue-50',   iconColor: 'text-blue-500' },
              { icon: 'ti-alert-triangle', label: 'Overdue Tasks',  value: data.stats.overdueTasks,   iconBg: 'bg-red-50',    iconColor: 'text-red-500' },
              { icon: 'ti-calendar-check', label: 'Days Present',
                value: `${data.stats.attendance.present}/${data.stats.attendance.total}`,
                iconBg: 'bg-green-50', iconColor: 'text-green-500' },
            ].map((c, i) => (
              <motion.div key={c.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card flex items-center gap-4 hover:shadow-hover hover:-translate-y-0.5 transition-all">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                  <i className={`ti ${c.icon} text-xl ${c.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{c.label}</p>
                  <p className="text-2xl font-800 text-gray-800 dark:text-gray-100">{c.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Row 2: 4 new widgets ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <WeatherCard />
            <DateTimeCard />
            <WorkingHoursCard />
            <MotivationalQuoteCard />
          </div>

          {/* ── Row 3: Tasks + Today at a Glance ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-5">
            {/* Tasks */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
                <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">My Tasks</h3>
                <span className="text-xs bg-brand-50 text-brand-400 font-600 px-2.5 py-0.5 rounded-full">
                  {data.tasks.length} tasks
                </span>
              </div>
              {data.tasks.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <i className="ti ti-check-circle text-green-400 text-3xl mb-2 block" />
                  <p className="text-sm text-gray-400">All caught up! No pending tasks.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-dark-border">
                  {data.tasks.map((task, i) => (
                    <motion.div key={task._id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                      <div>
                        <p className="text-sm font-600 text-gray-800 dark:text-gray-200">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {task.project || 'General'} ·{' '}
                          {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                        </p>
                      </div>
                      <Badge
                        label={STATUS_MAP[task.status]?.label || 'Not Started'}
                        variant={STATUS_MAP[task.status]?.variant || 'gray'} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Today at a Glance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
              <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100 mb-4">Today at a Glance</h3>
              {[
                { icon: 'ti-plane-departure', label: 'On Leave Today',  value: data.today.onLeaveToday,      color: '#466ae6', path: '/on-leave-today' },
                { icon: 'ti-cake',            label: 'Birthdays',       value: data.today.birthdaysThisWeek, color: '#ff7b0d', path: '/birthdays'     },
                { icon: 'ti-home',            label: 'Team on WFH',     value: data.today.teammatesOnWFH,    color: '#18a04b', path: '/wfh'           },
              ].map(row => (
                <div key={row.label}
                  onClick={() => navigate(row.path)}
                  className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-dark-border last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: row.color + '18' }}>
                      <i className={`ti ${row.icon} text-sm`} style={{ color: row.color }} />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-800 text-gray-800 dark:text-gray-200">{row.value}</span>
                    <i className="ti ti-chevron-right text-xs text-gray-400" />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Row 4: Announcements + Calendar ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
                <div className="flex items-center gap-2">
                  <i className="ti ti-speakerphone text-brand-400" />
                  <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Latest Announcements</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {announcements.length === 0 ? (
                  <div className="text-center py-6">
                    <i className="ti ti-speakerphone text-gray-200 text-3xl mb-2 block" />
                    <p className="text-sm text-gray-400">No announcements yet</p>
                  </div>
                ) : announcements.map((a) => {
                  const s = TYPE_STYLE[a.type] || TYPE_STYLE.info;
                  return (
                    <div key={a._id} className={`${s.bg} border-l-4 ${s.border} rounded-r-lg px-3 py-2.5`}>
                      <div className="flex items-start gap-2">
                        <i className={`ti ${s.icon} ${s.text} text-sm flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-700 text-gray-800 dark:text-gray-200">{a.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.body}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
            <MiniCalendarCard />
          </div>
        </>
      )}
    </AppLayout>
  );
}
