import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Dashboard          from "./pages/Dashboard.jsx";
import AdminDashboard     from "./pages/AdminDashboard.jsx";
import Login              from "./pages/Login.jsx";
import Register           from "./pages/Register.jsx";
import ComingSoon         from "./pages/ComingSoon.jsx";
import EmployeeManagement from "./pages/EmployeeManagement.jsx";
import Departments        from "./pages/Departments.jsx";
import AttendancePage     from "./pages/Attendance.jsx";
import MyAttendance       from "./pages/MyAttendance.jsx";
import LeaveManagement    from "./pages/LeaveManagement.jsx";
import Payroll            from "./pages/Payroll.jsx";
import MyPayroll          from "./pages/MyPayroll.jsx";
import Projects           from "./pages/Projects.jsx";
import Tasks              from "./pages/Tasks.jsx";
import Announcements      from "./pages/Announcements.jsx";
import Documents          from "./pages/Documents.jsx";
import Reports            from "./pages/Reports.jsx";
import Settings           from "./pages/Settings.jsx";
import Calendar           from "./pages/Calendar.jsx";
import Tickets            from "./pages/Tickets.jsx";
import NoticeBoard        from "./pages/NoticeBoard.jsx";
import OnLeaveToday       from "./pages/OnLeaveToday.jsx";
import Birthdays          from "./pages/Birthdays.jsx";
import WFH                from "./pages/WFH.jsx";
import AttendanceReport   from "./pages/AttendanceReport.jsx";
import ProjectReport      from "./pages/ProjectReport.jsx";
import ProtectedRoute     from "./components/ProtectedRoute.jsx";
import { useAuth }        from "./context/AuthContext.jsx";

const useIsAdmin = () => { const { user } = useAuth(); return !!user?.isAdmin; };

function Home()           { const a = useIsAdmin(); return a ? <AdminDashboard /> : <Dashboard />; }
function EmployeesRoute() { const a = useIsAdmin(); return a ? <EmployeeManagement /> : <Home />; }
function DeptRoute()      { const a = useIsAdmin(); return a ? <Departments /> : <Home />; }
function AttendRoute()    { const a = useIsAdmin(); return a ? <AttendancePage /> : <MyAttendance />; }
function PayrollRoute()   { const a = useIsAdmin(); return a ? <Payroll /> : <MyPayroll />; }
function ProjectsRoute()  { const a = useIsAdmin(); return a ? <Projects /> : <Home />; }
function ReportsRoute()   { const a = useIsAdmin(); return a ? <Reports /> : <Home />; }

const W = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

const PLACEHOLDERS = [
  { path:"/timer", title:"Timer" },
];

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false}
        newestOnTop closeOnClick pauseOnHover draggable theme="light" />
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/"               element={<W><Home /></W>} />
        <Route path="/employees"      element={<W><EmployeesRoute /></W>} />
        <Route path="/departments"    element={<W><DeptRoute /></W>} />
        <Route path="/attendance"     element={<W><AttendRoute /></W>} />
        <Route path="/leaves"         element={<W><LeaveManagement /></W>} />
        <Route path="/payroll"        element={<W><PayrollRoute /></W>} />
        <Route path="/projects"       element={<W><ProjectsRoute /></W>} />
        <Route path="/tasks"          element={<W><Tasks /></W>} />
        <Route path="/announcements"  element={<W><Announcements /></W>} />
        <Route path="/documents"      element={<W><Documents /></W>} />
        <Route path="/reports"        element={<W><ReportsRoute /></W>} />
        <Route path="/settings"       element={<W><Settings /></W>} />
        <Route path="/calendar"       element={<W><Calendar /></W>} />
        <Route path="/tickets"        element={<W><Tickets /></W>} />
        <Route path="/notices"        element={<W><NoticeBoard /></W>} />
        <Route path="/on-leave-today" element={<W><OnLeaveToday /></W>} />
        <Route path="/birthdays"      element={<W><Birthdays /></W>} />
        <Route path="/wfh"            element={<W><WFH /></W>} />
        <Route path="/reports/attendance" element={<W><AttendanceReport /></W>} />
        <Route path="/reports/projects"   element={<W><ProjectReport /></W>} />

        {PLACEHOLDERS.map(({ path, title }) => (
          <Route key={path} path={path} element={<W><ComingSoon title={title} /></W>} />
        ))}
        <Route path="*" element={<W><ComingSoon title="Page Not Found" /></W>} />
      </Routes>
    </>
  );
}
