import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { getAdminDashboardData } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/cards/StatCard.jsx';
import AttendanceChartLive from '../components/charts/AttendanceChartLive.jsx';
import TaskPieChartLive from '../components/charts/TaskPieChartLive.jsx';
import PayrollChartLive from '../components/charts/PayrollChartLive.jsx';
import DeptDistChartLive from '../components/charts/DeptDistChartLive.jsx';
import RecentEmployeesCard from '../components/cards/RecentEmployeesCard.jsx';
import ActivityTimelineCard from '../components/cards/ActivityTimelineCard.jsx';
import AnnouncementsWidget from '../components/cards/AnnouncementsWidget.jsx';
import LeaveRequestsCard from '../components/cards/LeaveRequestsCard.jsx';
import QuickActionsCard from '../components/cards/QuickActionsCard.jsx';
import MiniCalendarCard from '../components/cards/MiniCalendarCard.jsx';
import RecentTasksCard from '../components/cards/RecentTasksCard.jsx';
import TodayAttendanceSummary from '../components/cards/TodayAttendanceSummary.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const firstName = user?.fullName?.split(' ')[0] || 'Admin';

  const fetchData = useCallback(async () => {
    try {
      const { data: d } = await getAdminDashboardData();
      setData(d);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds so stats stay current
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const STAT_CARDS = data ? [
    { icon: 'ti-users',           label: 'Total Employees',    value: data.stats.totalEmployees,    color: 'blue',   trend: 'up',      delta: `${data.stats.activeEmployees} active` },
    { icon: 'ti-building',        label: 'Departments',        value: data.stats.totalDepartments,  color: 'teal',   trend: 'neutral', delta: 'Active departments' },
    { icon: 'ti-calendar-check',  label: 'Present Today',      value: data.stats.attendanceToday.present, color: 'green', trend: 'up', delta: `${data.stats.attendanceToday.absent} absent` },
    { icon: 'ti-clock-x',        label: 'Late Today',         value: data.stats.attendanceToday.late,    color: 'yellow',trend: 'down', delta: 'Clocked in after 9:15' },
    { icon: 'ti-notes',           label: 'Pending Leaves',     value: data.stats.pendingLeaves,     color: 'orange', trend: 'down',    delta: `${data.stats.approvedLeaves} approved` },
    { icon: 'ti-list-check',      label: 'Open Tasks',         value: data.stats.openTasks,         color: 'indigo', trend: 'neutral', delta: `${data.stats.completedTasks} completed` },
    { icon: 'ti-folder',          label: 'Active Projects',    value: data.stats.activeProjects,    color: 'purple', trend: 'neutral', delta: `${data.stats.totalProjects} total` },
    { icon: 'ti-currency-dollar', label: 'Payroll This Month', value: data.stats.payrollThisMonth,  color: 'green',  trend: 'up',      delta: 'Net salary total', prefix: '$' },
  ] : [];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-800 text-gray-800 dark:text-gray-100">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Here's what's happening across your organization today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-2 text-sm text-gray-500 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border px-3 py-2 rounded-lg hover:shadow-sm transition-all">
            <i className="ti ti-refresh text-brand-400" /> Refresh
          </button>
          <button onClick={() => navigate('/employees')}
            className="flex items-center gap-2 text-sm text-white bg-gradient-orange px-4 py-2 rounded-lg hover:shadow-glow transition-all font-600">
            <i className="ti ti-plus" /> Add Employee
          </button>
        </div>
      </motion.div>

      {/* Row 1 — 8 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {STAT_CARDS.map((c, i) => (
          <StatCard key={c.label} index={i} icon={c.icon} label={c.label}
            value={typeof c.value === 'number' && c.prefix ? c.value.toLocaleString() : c.value}
            delta={c.delta} trend={c.trend} color={c.color}
            prefix={c.prefix || ''} />
        ))}
      </div>

      {/* Row 2 — Attendance chart + Task pie + Payroll area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 mb-4">
        <div className="lg:col-span-6">
          <AttendanceChartLive data={data?.attendanceTrend?.data || []} />
        </div>
        <div className="lg:col-span-3">
          <TaskPieChartLive data={data?.taskStatusBreakdown} />
        </div>
        <div className="lg:col-span-3">
          <PayrollChartLive data={data?.payrollTrend || []} />
        </div>
      </div>

      {/* Row 3 — Dept distribution + Today attendance summary + Recent tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <DeptDistChartLive data={data?.departmentDistribution || []} />
        <TodayAttendanceSummary stats={data?.stats?.attendanceToday} />
        <RecentTasksCard tasks={data?.recentTasks || []} />
      </div>

      {/* Row 4 — Recent employees + Announcements + Leave requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <RecentEmployeesCard employees={data?.recentEmployees || []} />
        <AnnouncementsWidget announcements={data?.latestAnnouncements || []} />
        <LeaveRequestsCard onUpdate={fetchData} />
      </div>

      {/* Row 5 — Activity timeline + Quick actions + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <ActivityTimelineCard items={data?.activityTimeline || []} />
        <QuickActionsCard />
        <MiniCalendarCard />
      </div>
    </AppLayout>
  );
}
