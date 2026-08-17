// Dummy data service — mirrors real API shape for easy swap-out later

export const getDummyStats = () => ({
  employees:      { value: 284,  delta: '+12 this month',  trend: 'up' },
  attendance:     { value: '91%', delta: '258 present today', trend: 'up' },
  projects:       { value: 18,   delta: '5 due this week',  trend: 'neutral' },
  payroll:        { value: '$142,800', delta: 'This month', trend: 'up' },
  leaveRequests:  { value: 7,    delta: 'Pending approval', trend: 'down' },
  openTasks:      { value: 63,   delta: '14 overdue',       trend: 'down' },
  departments:    { value: 12,   delta: 'Active',           trend: 'neutral' },
  newHires:       { value: 8,    delta: 'This month',       trend: 'up' },
});

export const getAttendanceTrend = () => [
  { day: 'Mon', present: 248, absent: 36, late: 12 },
  { day: 'Tue', present: 261, absent: 23, late: 8  },
  { day: 'Wed', present: 255, absent: 29, late: 15 },
  { day: 'Thu', present: 271, absent: 13, late: 6  },
  { day: 'Fri', present: 258, absent: 26, late: 10 },
  { day: 'Sat', present: 142, absent: 142, late: 4  },
  { day: 'Sun', present: 38,  absent: 246, late: 2  },
];

export const getTaskBreakdown = () => [
  { name: 'Completed', value: 148, color: '#18a04b' },
  { name: 'In Progress', value: 63,  color: '#466ae6' },
  { name: 'Pending',    value: 41,  color: '#ff7b0d' },
  { name: 'Overdue',    value: 14,  color: '#eb0910' },
];

export const getPayrollTrend = () => [
  { month: 'Feb', cost: 128000 },
  { month: 'Mar', cost: 131500 },
  { month: 'Apr', cost: 134200 },
  { month: 'May', cost: 138800 },
  { month: 'Jun', cost: 136400 },
  { month: 'Jul', cost: 142800 },
];

export const getDeptDistribution = () => [
  { name: 'Engineering',  value: 82, color: '#466ae6' },
  { name: 'Sales',        value: 48, color: '#ff7b0d' },
  { name: 'Marketing',    value: 31, color: '#7b4fa0' },
  { name: 'HR',           value: 18, color: '#18a04b' },
  { name: 'Finance',      value: 27, color: '#eb0910' },
  { name: 'Operations',   value: 38, color: '#0096c7' },
  { name: 'Support',      value: 40, color: '#e89f00' },
];

export const getRecentProjects = () => [
  { id: 1, name: 'HRMS Revamp',         dept: 'Engineering', deadline: '2026-08-30', priority: 'High',   status: 'In Progress', progress: 68 },
  { id: 2, name: 'Q3 Marketing Drive',  dept: 'Marketing',   deadline: '2026-09-15', priority: 'Medium', status: 'Planning',    progress: 22 },
  { id: 3, name: 'Payroll Automation',  dept: 'Finance',     deadline: '2026-08-10', priority: 'High',   status: 'Review',      progress: 88 },
  { id: 4, name: 'Mobile App v2',       dept: 'Engineering', deadline: '2026-10-01', priority: 'Medium', status: 'In Progress', progress: 45 },
  { id: 5, name: 'Customer Portal',     dept: 'Sales',       deadline: '2026-08-20', priority: 'Low',    status: 'On Hold',     progress: 35 },
];

export const getRecentEmployees = () => [
  { id: 1,  name: 'Ayesha Raza',     dept: 'Engineering', role: 'Sr. Engineer',      joined: '2026-07-28', avatar: 'AR', color: '#466ae6' },
  { id: 2,  name: 'Bilal Khan',      dept: 'Sales',       role: 'Sales Executive',   joined: '2026-07-25', avatar: 'BK', color: '#18a04b' },
  { id: 3,  name: 'Sara Ahmed',      dept: 'HR',          role: 'HR Coordinator',    joined: '2026-07-22', avatar: 'SA', color: '#7b4fa0' },
  { id: 4,  name: 'Usman Tariq',     dept: 'Finance',     role: 'Financial Analyst', joined: '2026-07-18', avatar: 'UT', color: '#ff7b0d' },
  { id: 5,  name: 'Fatima Malik',    dept: 'Marketing',   role: 'Content Strategist',joined: '2026-07-14', avatar: 'FM', color: '#eb0910' },
];

export const getTodayAttendance = () => [
  { id: 1, name: 'Hasan Raza',    clockIn: '08:52', clockOut: null,    hours: '6h 18m', status: 'Present', late: false, avatar: 'HR', color: '#466ae6' },
  { id: 2, name: 'Nadia Shah',    clockIn: '09:45', clockOut: null,    hours: '5h 25m', status: 'Late',    late: true,  avatar: 'NS', color: '#7b4fa0' },
  { id: 3, name: 'Kamran Ali',    clockIn: '08:30', clockOut: '17:00', hours: '8h 30m', status: 'Present', late: false, avatar: 'KA', color: '#18a04b' },
  { id: 4, name: 'Zara Hussain',  clockIn: null,    clockOut: null,    hours: '—',      status: 'Absent',  late: false, avatar: 'ZH', color: '#eb0910' },
  { id: 5, name: 'Imran Sheikh',  clockIn: '10:12', clockOut: null,    hours: '4h 58m', status: 'Late',    late: true,  avatar: 'IS', color: '#e89f00' },
];

export const getUpcomingBirthdays = () => [
  { id: 1, name: 'Omar Farooq',   dept: 'Engineering', date: 'Aug 07', daysLeft: 2,  avatar: 'OF', color: '#466ae6' },
  { id: 2, name: 'Hira Baig',     dept: 'HR',          date: 'Aug 09', daysLeft: 4,  avatar: 'HB', color: '#18a04b' },
  { id: 3, name: 'Saad Iqbal',    dept: 'Sales',       date: 'Aug 12', daysLeft: 7,  avatar: 'SI', color: '#ff7b0d' },
  { id: 4, name: 'Mahnoor Ali',   dept: 'Marketing',   date: 'Aug 15', daysLeft: 10, avatar: 'MA', color: '#7b4fa0' },
];

export const getLeaveRequests = () => [
  { id: 1, name: 'Bilal Khan',    type: 'Annual Leave',   from: 'Aug 08', to: 'Aug 12', days: 5, reason: 'Family vacation',         avatar: 'BK', color: '#18a04b' },
  { id: 2, name: 'Sara Ahmed',    type: 'Sick Leave',     from: 'Aug 06', to: 'Aug 07', days: 2, reason: 'Medical appointment',      avatar: 'SA', color: '#7b4fa0' },
  { id: 3, name: 'Nadia Shah',    type: 'Casual Leave',   from: 'Aug 10', to: 'Aug 10', days: 1, reason: 'Personal work',            avatar: 'NS', color: '#466ae6' },
  { id: 4, name: 'Imran Sheikh',  type: 'Emergency Leave',from: 'Aug 06', to: 'Aug 08', days: 3, reason: 'Family emergency',         avatar: 'IS', color: '#eb0910' },
];

export const getAnnouncements = () => [
  { id: 1, title: 'Q3 Performance Reviews',   body: 'All managers must complete performance reviews by August 20, 2026.',          time: '2h ago',   type: 'info' },
  { id: 2, title: 'Office Holiday – Aug 14',  body: 'The office will be closed on August 14 for Independence Day.',                time: '5h ago',   type: 'success' },
  { id: 3, title: 'New Leave Policy Update',  body: 'Updated leave encashment and carry-forward rules effective September 1.',     time: '1d ago',   type: 'warning' },
  { id: 4, title: 'Fire Drill – Aug 8',       body: 'Mandatory fire drill on August 8 at 11:00 AM. All staff must participate.',   time: '2d ago',   type: 'danger' },
];

export const getActivityTimeline = () => [
  { id: 1, user: 'Ayesha Raza',   action: 'Clocked in',              time: '9:02 AM',   icon: 'ti-clock-play',   color: '#18a04b' },
  { id: 2, user: 'Bilal Khan',    action: 'Applied for Annual Leave', time: '9:15 AM',   icon: 'ti-notes',        color: '#ff7b0d' },
  { id: 3, user: 'Sara Ahmed',    action: 'Completed task: Onboarding Doc', time: '9:48 AM', icon: 'ti-check',   color: '#466ae6' },
  { id: 4, user: 'Hasan Raza',    action: 'Submitted timesheet',     time: '10:12 AM',  icon: 'ti-clipboard',    color: '#7b4fa0' },
  { id: 5, user: 'Admin',         action: 'Payroll generated for July', time: '10:30 AM',icon: 'ti-currency-dollar', color: '#18a04b' },
  { id: 6, user: 'Kamran Ali',    action: 'Project status updated',  time: '11:05 AM',  icon: 'ti-folder',       color: '#0096c7' },
];

export const getMiniCalendarEvents = () => ({
  leaves:    [6, 7, 8, 12, 15],
  birthdays: [7, 9, 12, 15],
  meetings:  [6, 10, 11, 14],
  holidays:  [14],
});
