import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AppLayout from '../components/layouts/AppLayout.jsx';
import { getDailyAttendance } from "../services/api.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

const formatDuration = (minutes) => {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function Attendance() {
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (d) => {
    setLoading(true);
    try {
      const { data } = await getDailyAttendance(d);
      setData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(date); }, [date]);

  const presentCount = data?.present?.length || 0;
  const absentCount = data?.absent?.length || 0;
  const total = data?.totalEmployees || 0;
  const attendancePct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <AppLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border px-6 py-4.5 shadow-card">
        <div>
          <h2 className="text-xl font-700 text-gray-800 dark:text-gray-100 mb-0.5">Attendance</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {data ? `${presentCount} of ${total} employees present` : "Loading..."}
          </p>
        </div>
        <div>
          <label className="block text-xs font-600 text-gray-400 dark:text-gray-500 mb-1">Select Date</label>
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-dark-border rounded text-sm bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      {/* Summary stat cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <MiniStat label="Total Employees" value={total} icon="ti-users" iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-500" />
          <MiniStat label="Present" value={presentCount} icon="ti-user-check" iconBg="bg-green-50 dark:bg-green-900/20" iconColor="text-green-500" />
          <MiniStat label="Absent" value={absentCount} icon="ti-user-x" iconBg="bg-red-50 dark:bg-red-900/20" iconColor="text-red-500" />
          <MiniStat label="Attendance Rate" value={`${attendancePct}%`} icon="ti-chart-pie" iconBg="bg-orange-50 dark:bg-orange-900/20" iconColor="text-brand-400" />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 dark:text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Present */}
          <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl px-6 py-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-green-50 dark:bg-green-900/20">
                  <i className="ti ti-user-check text-sm text-green-500" />
                </div>
                <p className="text-[15px] font-700 text-gray-800 dark:text-gray-100">Present</p>
              </div>
              <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-700 px-2.5 py-1 rounded-full">
                {presentCount}
              </span>
            </div>
            {presentCount === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm py-2">No one has clocked in on this date.</p>
            ) : (
              data.present.map((p, i) => (
                <div
                  key={p.employee?._id || i}
                  className={`flex justify-between items-center py-3 ${i < data.present.length - 1 ? "border-b border-gray-100 dark:border-dark-border" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-400 text-white flex items-center justify-center text-xs font-700 flex-shrink-0">
                      {p.employee?.fullName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-600 text-gray-800 dark:text-gray-200">{p.employee?.fullName || "Unknown"}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{p.employee?.department || "No department"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-600 text-gray-700 dark:text-gray-200">
                      {formatTime(p.sessions[0]?.clockIn)} – {formatTime(p.sessions[p.sessions.length - 1]?.clockOut)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatDuration(p.totalMinutes)} · {p.sessions.length} session{p.sessions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Absent */}
          <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl px-6 py-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                  <i className="ti ti-user-x text-sm text-red-500" />
                </div>
                <p className="text-[15px] font-700 text-gray-800 dark:text-gray-100">Absent</p>
              </div>
              <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-700 px-2.5 py-1 rounded-full">
                {absentCount}
              </span>
            </div>
            {absentCount === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm py-2">Everyone clocked in today 🎉</p>
            ) : (
              data.absent.map((emp, i) => (
                <div
                  key={emp._id}
                  className={`flex justify-between items-center py-3 ${i < data.absent.length - 1 ? "border-b border-gray-100 dark:border-dark-border" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-white flex items-center justify-center text-xs font-700 flex-shrink-0">
                      {emp.fullName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-600 text-gray-800 dark:text-gray-200">{emp.fullName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{emp.department || "No department"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function MiniStat({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl p-4 flex items-center gap-3 shadow-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <i className={`ti ${icon} text-base ${iconColor}`} />
      </div>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className="text-lg font-700 text-gray-800 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}
