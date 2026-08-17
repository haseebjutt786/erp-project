import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getBirthdays, sendBirthdayWish, getWishesForUser } from '../services/api.js';

const COLORS = ['#ff7b0d','#466ae6','#18a04b','#7b4fa0','#eb0910','#0096c7','#e89f00','#6d8b74'];
const CAKE_EMOJIS = ['🎂','🎉','🎁','🥳','🎈','✨'];

export default function Birthdays() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [birthdays, setBirthdays]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [daysFilter, setDaysFilter] = useState(30);
  const [wishModal, setWishModal]   = useState(null); // { employee }
  const [wishMsg, setWishMsg]       = useState('Happy Birthday! 🎉');
  const [wishing, setWishing]       = useState(false);
  const [wishesModal, setWishesModal] = useState(null); // view all wishes for an employee
  const [wishes, setWishes]         = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getBirthdays(daysFilter);
      setBirthdays(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load birthdays');
    } finally { setLoading(false); }
  }, [daysFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = birthdays.filter(b =>
    !search ||
    b.fullName.toLowerCase().includes(search.toLowerCase()) ||
    b.department?.toLowerCase().includes(search.toLowerCase())
  );

  const todayBdays    = filtered.filter(b => b.isToday);
  const upcomingBdays = filtered.filter(b => !b.isToday);

  const handleSendWish = async () => {
    if (!wishModal) return;
    setWishing(true);
    try {
      await sendBirthdayWish(wishModal._id, { message: wishMsg });
      toast.success(`Wish sent to ${wishModal.fullName}! 🎉`);
      setWishModal(null);
      setWishMsg('Happy Birthday! 🎉');
      load(); // refresh to update alreadyWished flag
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send wish');
    } finally { setWishing(false); }
  };

  const openWishes = async (emp) => {
    setWishesModal(emp);
    try {
      const { data } = await getWishesForUser(emp._id);
      setWishes(data);
    } catch { setWishes([]); }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-brand-400 transition-colors">
              <i className="ti ti-arrow-left text-base" />
            </button>
            <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">🎂 Birthdays</h2>
          </div>
          <p className="text-sm text-gray-400">
            {todayBdays.length > 0 ? `${todayBdays.length} birthday${todayBdays.length!==1?'s':''} today!` : 'Upcoming birthdays'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Days filter */}
          <div className="flex bg-gray-100 dark:bg-dark-surface rounded-lg p-0.5 gap-0.5">
            {[[7,'7d'],[14,'14d'],[30,'30d'],[90,'90d']].map(([v,l]) => (
              <button key={v} onClick={() => setDaysFilter(v)}
                className={`px-3 py-1.5 text-xs font-600 rounded-md transition-all ${daysFilter===v ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input placeholder="Search by name or department..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-16 text-center shadow-card">
          <div className="text-6xl mb-3">🎂</div>
          <p className="text-gray-500 font-700 text-lg">No birthdays in this period</p>
          <p className="text-sm text-gray-400 mt-1">Try extending the range or add DOB to employee profiles</p>
        </div>
      ) : (
        <>
          {/* Today's birthdays */}
          {todayBdays.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎉</span>
                <h3 className="text-sm font-800 text-gray-800 dark:text-gray-100 uppercase tracking-wider">Today's Birthdays</h3>
                <span className="text-xs bg-brand-400 text-white font-700 px-2 py-0.5 rounded-full">{todayBdays.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {todayBdays.map((b, i) => (
                  <BirthdayCard key={b._id} employee={b} index={i} isToday={true}
                    currentUserId={user?._id}
                    onWish={() => { setWishModal(b); setWishMsg('Happy Birthday! 🎉'); }}
                    onViewWishes={() => openWishes(b)} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming birthdays */}
          {upcomingBdays.length > 0 && (
            <div>
              {todayBdays.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📅</span>
                  <h3 className="text-sm font-800 text-gray-800 dark:text-gray-100 uppercase tracking-wider">Upcoming</h3>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {upcomingBdays.map((b, i) => (
                  <BirthdayCard key={b._id} employee={b} index={i} isToday={false}
                    currentUserId={user?._id}
                    onWish={() => { setWishModal(b); setWishMsg('Happy Birthday! 🎉'); }}
                    onViewWishes={() => openWishes(b)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Send Wish Modal */}
      <AnimatePresence>
        {wishModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setWishModal(null)}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-sm shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              {/* Birthday decoration header */}
              <div className="bg-gradient-orange p-6 text-center">
                <div className="text-4xl mb-2">🎂</div>
                <p className="text-white font-800 text-lg">{wishModal.fullName}</p>
                <p className="text-white/70 text-sm">{wishModal.designation} · {wishModal.department}</p>
              </div>
              <div className="p-5">
                <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-2">Your Message</label>
                <textarea rows={4} value={wishMsg} onChange={e => setWishMsg(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none mb-4" />
                {/* Quick messages */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Happy Birthday! 🎉','Wishing you joy! 🎈','Many happy returns! 🌟','Have a great day! 🥳'].map(m => (
                    <button key={m} onClick={() => setWishMsg(m)}
                      className="text-xs bg-gray-50 dark:bg-dark-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border px-2 py-1 rounded-lg hover:border-brand-400 hover:text-brand-400 transition-colors">
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setWishModal(null)}
                    className="flex-1 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm font-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSendWish} disabled={wishing}
                    className="flex-1 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {wishing ? <><i className="ti ti-loader-2 animate-spin" /> Sending...</> : <><i className="ti ti-send" /> Send Wish 🎉</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Wishes Modal */}
      <AnimatePresence>
        {wishesModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setWishesModal(null)}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
                <div>
                  <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">Birthday Wishes</h3>
                  <p className="text-xs text-gray-400">For {wishesModal.fullName} · {wishes.length} wishes received</p>
                </div>
                <button onClick={() => setWishesModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500"><i className="ti ti-x text-sm" /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                {wishes.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-2">💌</div>
                    <p className="text-gray-400 font-600">No wishes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wishes.map((w, i) => (
                      <div key={w._id} className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-800/20">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-orange flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
                            {(w.sender?.fullName||'?').slice(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-700 text-gray-800 dark:text-gray-200">{w.sender?.fullName}</p>
                              <span className="text-[10px] text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{w.sender?.department}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">"{w.message}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function BirthdayCard({ employee: b, index, isToday, currentUserId, onWish, onViewWishes }) {
  const color = COLORS[index % COLORS.length];
  const emoji = CAKE_EMOJIS[index % CAKE_EMOJIS.length];
  const isOwnBirthday = String(b._id) === String(currentUserId);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: index*0.05 }}
      className={`bg-white dark:bg-dark-card rounded-xl border shadow-card overflow-hidden hover:shadow-hover hover:-translate-y-0.5 transition-all
        ${isToday ? 'border-brand-400 ring-2 ring-brand-400/20' : 'border-gray-100 dark:border-dark-border'}`}>
      {isToday && (
        <div className="bg-gradient-orange px-3 py-1 text-center">
          <p className="text-white text-xs font-700">🎉 Today's Birthday!</p>
        </div>
      )}
      <div className="p-5">
        {/* Avatar */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-800 mb-2 shadow-lg"
            style={{ background: color }}>
            {emoji}
          </div>
          <p className="text-sm font-700 text-gray-800 dark:text-gray-200">{b.fullName}</p>
          <p className="text-xs text-gray-400">{b.designation || b.department || '—'}</p>
        </div>

        {/* Info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Department</span>
            <span className="font-600 text-gray-700 dark:text-gray-300">{b.department || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Birthday</span>
            <span className="font-600 text-gray-700 dark:text-gray-300">
              {new Date(b.dateOfBirth).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Age</span>
            <span className="font-600 text-gray-700 dark:text-gray-300">{b.age} years</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Company</span>
            <span className="font-600 text-gray-700 dark:text-gray-300">{b.yearsInCompany}y {b.yearsInCompany===1?'yr':'yrs'}</span>
          </div>
          {!isToday && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">In</span>
              <span className="font-700 text-brand-400">{b.daysLeft} day{b.daysLeft!==1?'s':''}</span>
            </div>
          )}
          {b.wishCount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Wishes</span>
              <span className="font-600 text-brand-400">{b.wishCount} 🎉</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isOwnBirthday && (
            <button onClick={onWish} disabled={b.alreadyWished}
              className={`flex-1 py-2 rounded-lg text-xs font-700 transition-all flex items-center justify-center gap-1
                ${b.alreadyWished
                  ? 'bg-green-50 text-green-600 cursor-default'
                  : 'bg-gradient-orange text-white hover:shadow-glow'}`}>
              {b.alreadyWished ? <><i className="ti ti-check" /> Wished</> : '🎉 Wish'}
            </button>
          )}
          {(isOwnBirthday || b.wishCount > 0) && (
            <button onClick={onViewWishes}
              className="flex-1 py-2 rounded-lg text-xs font-700 bg-gray-50 dark:bg-dark-surface text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1">
              <i className="ti ti-messages text-xs" /> {b.wishCount} Wish{b.wishCount!==1?'es':''}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
