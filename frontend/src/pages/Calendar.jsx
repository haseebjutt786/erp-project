import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { getAllLeaves, getMyLeaves } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const COLORS = {
  leave:   { bg:'bg-green-100', text:'text-green-700', dot:'bg-green-400' },
  pending: { bg:'bg-yellow-100', text:'text-yellow-700', dot:'bg-yellow-400' },
  holiday: { bg:'bg-red-100', text:'text-red-700', dot:'bg-red-400' },
};

export default function Calendar() {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const today   = new Date();
  const [cur, setCur]       = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [leaves, setLeaves] = useState([]);
  const [selected, setSelected] = useState(null); // selected date string YYYY-MM-DD
  const [view, setView]     = useState('month'); // month | week

  useEffect(() => {
    const fn = isAdmin ? getAllLeaves : getMyLeaves;
    fn().then(({ data }) => setLeaves(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isAdmin]);

  const daysInMonth  = new Date(cur.year, cur.month + 1, 0).getDate();
  const firstDayOfMonth = new Date(cur.year, cur.month, 1).getDay();
  const cells = Array.from({ length: firstDayOfMonth + daysInMonth }, (_, i) =>
    i < firstDayOfMonth ? null : i - firstDayOfMonth + 1
  );

  const prev = () => setCur(v => v.month === 0 ? { year:v.year-1, month:11 } : { ...v, month:v.month-1 });
  const next = () => setCur(v => v.month === 11 ? { year:v.year+1, month:0 } : { ...v, month:v.month+1 });

  // Map leaves to date ranges
  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${cur.year}-${String(cur.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const d = new Date(dateStr);
    return leaves.filter(l => {
      const from = new Date(l.fromDate);
      const to   = new Date(l.toDate);
      from.setHours(0,0,0,0); to.setHours(23,59,59,999);
      return d >= from && d <= to && l.status !== 'cancelled' && l.status !== 'rejected';
    });
  };

  const selectedDateStr = selected
    ? `${cur.year}-${String(cur.month+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`
    : null;
  const selectedEvents = selected ? getEventsForDay(selected) : [];

  const isToday = (day) =>
    day && cur.year === today.getFullYear() && cur.month === today.getMonth() && day === today.getDate();

  const hasEvent = (day) => day && getEventsForDay(day).length > 0;
  const getEventColor = (day) => {
    const evs = getEventsForDay(day);
    if (!evs.length) return null;
    const e = evs[0];
    return e.status === 'approved' ? COLORS.leave : COLORS.pending;
  };

  const LEAVE_TYPE_LABELS = { sick:'Sick', casual:'Casual', annual:'Annual', unpaid:'Unpaid', other:'Other' };

  // Stats
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
  const pendingLeaves  = leaves.filter(l => l.status === 'pending').length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Calendar</h2>
          <p className="text-sm text-gray-400 mt-0.5">Leave schedule & events</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-surface px-3 py-1.5 rounded-lg border border-gray-100 dark:border-dark-border">
            <i className="ti ti-calendar text-brand-400" />
            {MONTHS[cur.month]} {cur.year}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label:'Total Leaves',    value:leaves.length,  icon:'ti-notes',        bg:'bg-blue-50',   color:'text-blue-500' },
          { label:'Approved',        value:approvedLeaves, icon:'ti-check-circle',  bg:'bg-green-50',  color:'text-green-500' },
          { label:'Pending',         value:pendingLeaves,  icon:'ti-clock',         bg:'bg-yellow-50', color:'text-yellow-600' },
          { label:'This Month Events',value:leaves.filter(l => {
              const d = new Date(l.fromDate);
              return d.getMonth() === cur.month && d.getFullYear() === cur.year;
            }).length, icon:'ti-calendar-event', bg:'bg-orange-50', color:'text-brand-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
            className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 shadow-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
              <i className={`ti ${s.icon} text-lg ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-800 text-gray-800 dark:text-gray-100">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="lg:col-span-2 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-dark-border">
            <button onClick={prev} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface flex items-center justify-center text-gray-500 transition-colors">
              <i className="ti ti-chevron-left" />
            </button>
            <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">{MONTHS[cur.month]} {cur.year}</h3>
            <button onClick={next} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface flex items-center justify-center text-gray-500 transition-colors">
              <i className="ti ti-chevron-right" />
            </button>
          </div>

          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-700 text-gray-400 py-2">{d}</div>
              ))}
            </div>
            {/* Date cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                const ev = day ? getEventsForDay(day) : [];
                const c  = getEventColor(day);
                const isTod = isToday(day);
                const isSel = day && selected === day;
                return (
                  <div key={i} onClick={() => day && setSelected(isSel ? null : day)}
                    className={`min-h-[52px] rounded-xl p-1 cursor-pointer transition-all relative
                      ${!day ? '' : isSel ? 'ring-2 ring-brand-400' : 'hover:bg-gray-50 dark:hover:bg-dark-surface'}
                      ${isTod ? 'bg-brand-400 text-white' : 'bg-transparent'}`}>
                    {day && (
                      <>
                        <span className={`text-xs font-600 block text-center mb-1
                          ${isTod ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                        {ev.slice(0, 2).map((e, ei) => {
                          const ec = e.status === 'approved' ? 'bg-green-400' : 'bg-yellow-400';
                          return (
                            <div key={ei} className={`text-[9px] ${ec} text-white rounded px-1 mb-0.5 truncate font-600`}>
                              {e.employee?.fullName?.split(' ')[0] || 'Leave'}
                            </div>
                          );
                        })}
                        {ev.length > 2 && (
                          <div className="text-[9px] text-gray-400 text-center">+{ev.length - 2}</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 pb-4">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-400" /><span className="text-xs text-gray-400">Today</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400" /><span className="text-xs text-gray-400">Approved Leave</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="text-xs text-gray-400">Pending Leave</span></div>
          </div>
        </motion.div>

        {/* Side panel */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
          className="space-y-4">
          {/* Selected date events */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border">
              <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">
                {selected ? `${MONTHS[cur.month]} ${selected}` : 'Select a date'}
              </h3>
            </div>
            <div className="p-4">
              {!selected ? (
                <div className="text-center py-6">
                  <i className="ti ti-calendar-event text-gray-200 text-3xl mb-2 block" />
                  <p className="text-sm text-gray-400">Click on a date to see events</p>
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="text-center py-6">
                  <i className="ti ti-check text-green-300 text-3xl mb-2 block" />
                  <p className="text-sm text-gray-400">No events on this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map(e => (
                    <div key={e._id} className={`p-3 rounded-lg border-l-4 ${e.status === 'approved' ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10'}`}>
                      <p className="text-sm font-600 text-gray-800 dark:text-gray-200">
                        {e.employee?.fullName || user?.fullName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {LEAVE_TYPE_LABELS[e.leaveType] || e.leaveType} Leave
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(e.fromDate).toLocaleDateString()} – {new Date(e.toDate).toLocaleDateString()}
                      </p>
                      <span className={`inline-block mt-1 text-[10px] font-700 px-2 py-0.5 rounded-full
                        ${e.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {e.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming leaves */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border">
              <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Upcoming Leaves</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-dark-border">
              {leaves.filter(l => new Date(l.fromDate) >= today && l.status === 'approved').slice(0, 5).map(l => (
                <div key={l._id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <i className="ti ti-notes text-green-500 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-600 text-gray-800 dark:text-gray-200 truncate">
                      {l.employee?.fullName || user?.fullName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(l.fromDate).toLocaleDateString()} – {new Date(l.toDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {leaves.filter(l => new Date(l.fromDate) >= today && l.status === 'approved').length === 0 && (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-gray-400">No upcoming approved leaves</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
