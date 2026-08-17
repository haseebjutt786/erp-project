import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getSettings, updateSettings, BASE_URL, getAllQuotes, createQuote, updateQuote, deleteQuote } from '../services/api.js';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TIMEZONES = ['Asia/Karachi','Asia/Kolkata','Asia/Dubai','UTC','Europe/London','America/New_York','America/Chicago','America/Los_Angeles'];
const CURRENCIES = [{ code:'USD',symbol:'$' },{ code:'PKR',symbol:'Rs' },{ code:'EUR',symbol:'€' },{ code:'GBP',symbol:'£' },{ code:'AED',symbol:'د.إ' },{ code:'INR',symbol:'₹' }];
const TABS = [
  { id:'company',  label:'Company',      icon:'ti-building' },
  { id:'schedule', label:'Schedule',     icon:'ti-clock' },
  { id:'leave',    label:'Leave Policy', icon:'ti-notes' },
  { id:'payroll',  label:'Payroll',      icon:'ti-currency-dollar' },
  { id:'theme',    label:'Theme',        icon:'ti-palette' },
  { id:'quotes',   label:'Daily Quotes', icon:'ti-quote' },
];

export default function Settings() {
  const { user } = useAuth();
  const isAdmin   = !!user?.isAdmin;
  const fileRef   = useRef(null);

  const [tab, setTab]         = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [settings, setSettings] = useState(null);
  const [form, setForm]       = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Quotes state
  const [quotes, setQuotes]         = useState([]);
  const [quotesLoading, setQL]      = useState(false);
  const [quoteForm, setQuoteForm]   = useState({ text:'', author:'' });
  const [editQuoteId, setEditQId]   = useState(null);
  const [savingQuote, setSavingQ]   = useState(false);

  useEffect(() => {
    getSettings()
      .then(({ data }) => { setSettings(data); setForm(data); })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  // Load quotes when tab switches to quotes
  useEffect(() => {
    if (tab === 'quotes' && isAdmin) {
      setQL(true);
      getAllQuotes()
        .then(({ data }) => setQuotes(data))
        .catch(() => toast.error('Failed to load quotes'))
        .finally(() => setQL(false));
    }
  }, [tab, isAdmin]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const toggleDay = (day) => {
    const days = form.workingDays || [];
    set('workingDays', days.includes(day) ? days.filter(d => d !== day) : [...days, day]);
  };

  const handleLogoChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const handleSaveQuote = async (e) => {
    e.preventDefault();
    if (!quoteForm.text.trim()) return toast.error('Quote text is required');
    setSavingQ(true);
    try {
      if (editQuoteId) {
        await updateQuote(editQuoteId, quoteForm);
        toast.success('Quote updated');
      } else {
        await createQuote(quoteForm);
        toast.success('Quote added');
      }
      setQuoteForm({ text:'', author:'' });
      setEditQId(null);
      const { data } = await getAllQuotes();
      setQuotes(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSavingQ(false); }
  };

  const handleDeleteQuote = async (id) => {
    if (!window.confirm('Delete this quote?')) return;
    try {
      await deleteQuote(id);
      toast.success('Deleted');
      setQuotes(prev => prev.filter(q => q._id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggleQuote = async (q) => {
    try {
      await updateQuote(q._id, { isActive: !q.isActive });
      setQuotes(prev => prev.map(x => x._id === q._id ? { ...x, isActive: !x.isActive } : x));
    } catch { /* silent */ }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Admin access required');
    setSaving(true);
    try {
      const fd = new FormData();
      const fields = ['companyName','companyEmail','companyPhone','companyAddress','companyWebsite',
        'timezone','currency','currencySymbol','dateFormat','workStartTime','workEndTime','lateThreshold',
        'annualLeavePerYear','sickLeavePerYear','casualLeavePerYear','emailNotifications',
        'theme','primaryColor','payrollCycle','payrollDay','taxRate'];
      fields.forEach(f => { if (form[f] !== undefined) fd.append(f, form[f]); });
      fd.append('workingDays', JSON.stringify(form.workingDays || []));
      if (logoFile) fd.append('logo', logoFile);
      const { data } = await updateSettings(fd);
      setSettings(data);
      setForm(data);
      setLogoFile(null);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const logoUrl = logoPreview || (settings?.companyLogo ? `${BASE_URL}/uploads/${settings.companyLogo}` : null);

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Settings</h2>
          <p className="text-sm text-gray-400 mt-0.5">Company and system configuration</p>
        </div>
        {!isAdmin && <span className="text-xs bg-yellow-50 text-yellow-600 font-600 px-3 py-1.5 rounded-full"><i className="ti ti-lock text-xs mr-1" />View only — Admin access required to edit</span>}
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-44 flex-shrink-0 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-600 transition-all text-left
                ${tab === t.id ? 'bg-brand-50 dark:bg-brand-400/10 text-brand-400 border border-brand-200 dark:border-brand-400/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-surface'}`}>
              <i className={`ti ${t.icon} text-base`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 min-w-0">
          <motion.div key={tab} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.2 }}
            className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">

            {/* Company Tab */}
            {tab === 'company' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                  <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Company Information</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Basic company details shown across the system</p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Logo */}
                  <div>
                    <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-dark-border flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-dark-surface cursor-pointer hover:border-brand-400 transition-colors" onClick={() => isAdmin && fileRef.current?.click()}>
                        {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover rounded-xl" /> : <i className="ti ti-photo text-2xl text-gray-300" />}
                      </div>
                      {isAdmin && (
                        <div>
                          <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-brand-400 font-600 hover:text-brand-500 transition-colors block">
                            <i className="ti ti-upload text-xs mr-1" />Change logo
                          </button>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                          <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Company Name *">
                      <input value={form.companyName || ''} onChange={e => set('companyName', e.target.value)} disabled={!isAdmin} className="input-style" placeholder="HA Technologies" />
                    </Field>
                    <Field label="Email">
                      <input type="email" value={form.companyEmail || ''} onChange={e => set('companyEmail', e.target.value)} disabled={!isAdmin} className="input-style" placeholder="info@company.com" />
                    </Field>
                    <Field label="Phone">
                      <input value={form.companyPhone || ''} onChange={e => set('companyPhone', e.target.value)} disabled={!isAdmin} className="input-style" placeholder="+92 300 1234567" />
                    </Field>
                    <Field label="Website">
                      <input value={form.companyWebsite || ''} onChange={e => set('companyWebsite', e.target.value)} disabled={!isAdmin} className="input-style" placeholder="https://company.com" />
                    </Field>
                    <Field label="Address" className="sm:col-span-2">
                      <textarea rows={2} value={form.companyAddress || ''} onChange={e => set('companyAddress', e.target.value)} disabled={!isAdmin} className="input-style resize-none" placeholder="123 Business Ave, City, Country" />
                    </Field>
                    <Field label="Timezone">
                      <select value={form.timezone || 'Asia/Karachi'} onChange={e => set('timezone', e.target.value)} disabled={!isAdmin} className="input-style">
                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </Field>
                    <Field label="Currency">
                      <select value={form.currency || 'USD'} onChange={e => {
                        const c = CURRENCIES.find(x => x.code === e.target.value);
                        set('currency', e.target.value);
                        if (c) set('currencySymbol', c.symbol);
                      }} disabled={!isAdmin} className="input-style">
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {tab === 'schedule' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                  <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Work Schedule</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Office hours and attendance settings</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-2">Working Days</label>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS.map(day => (
                        <button key={day} type="button" disabled={!isAdmin}
                          onClick={() => isAdmin && toggleDay(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-700 transition-all border
                            ${(form.workingDays || []).includes(day) ? 'bg-brand-400 text-white border-brand-400' : 'bg-white dark:bg-dark-surface text-gray-500 border-gray-200 dark:border-dark-border hover:border-brand-400'}`}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Work Start Time">
                      <input type="time" value={form.workStartTime || '09:00'} onChange={e => set('workStartTime', e.target.value)} disabled={!isAdmin} className="input-style" />
                    </Field>
                    <Field label="Work End Time">
                      <input type="time" value={form.workEndTime || '18:00'} onChange={e => set('workEndTime', e.target.value)} disabled={!isAdmin} className="input-style" />
                    </Field>
                    <Field label="Late Threshold (minutes)">
                      <input type="number" min="0" max="120" value={form.lateThreshold || 15} onChange={e => set('lateThreshold', e.target.value)} disabled={!isAdmin} className="input-style" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Policy Tab */}
            {tab === 'leave' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                  <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Leave Policy</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Annual leave entitlements per employee</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Annual Leave (days/year)">
                      <input type="number" min="0" value={form.annualLeavePerYear || 14} onChange={e => set('annualLeavePerYear', e.target.value)} disabled={!isAdmin} className="input-style" />
                    </Field>
                    <Field label="Sick Leave (days/year)">
                      <input type="number" min="0" value={form.sickLeavePerYear || 10} onChange={e => set('sickLeavePerYear', e.target.value)} disabled={!isAdmin} className="input-style" />
                    </Field>
                    <Field label="Casual Leave (days/year)">
                      <input type="number" min="0" value={form.casualLeavePerYear || 7} onChange={e => set('casualLeavePerYear', e.target.value)} disabled={!isAdmin} className="input-style" />
                    </Field>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-start gap-3">
                      <i className="ti ti-info-circle text-blue-500 text-lg flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-600 text-blue-700 dark:text-blue-300">Total leaves per employee per year</p>
                        <p className="text-xl font-800 text-blue-800 dark:text-blue-200 mt-1">
                          {(Number(form.annualLeavePerYear)||0) + (Number(form.sickLeavePerYear)||0) + (Number(form.casualLeavePerYear)||0)} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payroll Tab */}
            {tab === 'payroll' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                  <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Payroll Settings</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Salary processing configuration</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Payroll Cycle">
                      <select value={form.payrollCycle || 'monthly'} onChange={e => set('payrollCycle', e.target.value)} disabled={!isAdmin} className="input-style">
                        <option value="monthly">Monthly</option>
                        <option value="bi-monthly">Bi-Monthly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </Field>
                    <Field label="Payroll Day (of month)">
                      <input type="number" min="1" max="31" value={form.payrollDay || 25} onChange={e => set('payrollDay', e.target.value)} disabled={!isAdmin} className="input-style" />
                    </Field>
                    <Field label="Tax Rate (%)">
                      <input type="number" min="0" max="50" step="0.1" value={form.taxRate || 0} onChange={e => set('taxRate', e.target.value)} disabled={!isAdmin} className="input-style" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {tab === 'theme' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                  <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Theme & Appearance</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Customize the look of your HRMS</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-2">Color Mode</label>
                    <div className="flex gap-3">
                      {[['light','Light','ti-sun'],['dark','Dark','ti-moon'],['system','System','ti-device-laptop']].map(([v,l,ic]) => (
                        <button key={v} type="button" disabled={!isAdmin}
                          onClick={() => isAdmin && set('theme', v)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-600 border transition-all
                            ${form.theme === v ? 'bg-brand-400 text-white border-brand-400' : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:border-brand-400'}`}>
                          <i className={`ti ${ic}`} />{l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-2">Accent Color</label>
                    <div className="flex items-center gap-3">
                      {['#ff7b0d','#466ae6','#18a04b','#7b4fa0','#eb0910','#0096c7'].map(c => (
                        <button key={c} type="button" disabled={!isAdmin}
                          onClick={() => isAdmin && set('primaryColor', c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${form.primaryColor === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                          style={{ background: c }} />
                      ))}
                      <input type="color" value={form.primaryColor || '#ff7b0d'} onChange={e => isAdmin && set('primaryColor', e.target.value)} disabled={!isAdmin}
                        className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer" title="Custom color" />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <div onClick={() => isAdmin && set('emailNotifications', !form.emailNotifications)}
                        className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${form.emailNotifications ? 'bg-brand-400' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.emailNotifications ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-500">Enable Email Notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Quotes Tab — handled separately, no form submit */}
            {tab === 'quotes' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                  <h3 className="text-sm font-700 text-gray-800 dark:text-gray-100">Daily Motivational Quotes</h3>
                  <p className="text-xs text-gray-400 mt-0.5">A random quote is shown each day on the employee dashboard</p>
                </div>
                <div className="p-6">
                  {/* Add / Edit form */}
                  <form onSubmit={handleSaveQuote} className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/20">
                    <p className="text-xs font-700 text-gray-600 dark:text-gray-300 mb-3">
                      {editQuoteId ? '✏️ Editing quote' : '➕ Add new quote'}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Quote Text *</label>
                        <textarea required rows={3} value={quoteForm.text}
                          onChange={e => setQuoteForm({...quoteForm, text:e.target.value})}
                          placeholder="Enter motivational quote..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">Author</label>
                        <input value={quoteForm.author}
                          onChange={e => setQuoteForm({...quoteForm, author:e.target.value})}
                          placeholder="e.g. Steve Jobs"
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={savingQuote}
                          className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                          {savingQuote
                            ? <><i className="ti ti-loader-2 animate-spin" /> Saving...</>
                            : <><i className="ti ti-check" /> {editQuoteId ? 'Update' : 'Add Quote'}</>}
                        </button>
                        {editQuoteId && (
                          <button type="button"
                            onClick={() => { setEditQId(null); setQuoteForm({ text:'', author:'' }); }}
                            className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors font-600">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </form>

                  {/* Quote list */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-700 text-gray-500 dark:text-gray-400">
                        {quotes.length} quote{quotes.length !== 1 ? 's' : ''} · {quotes.filter(q=>q.isActive).length} active
                      </p>
                      <p className="text-xs text-gray-400">One random quote shown daily</p>
                    </div>
                    {quotesLoading ? (
                      <div className="flex items-center justify-center h-24">
                        <div className="w-6 h-6 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : quotes.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 dark:bg-dark-surface rounded-xl">
                        <i className="ti ti-quote text-gray-200 text-4xl mb-2 block" />
                        <p className="text-sm text-gray-400 font-600">No quotes yet</p>
                        <p className="text-xs text-gray-400 mt-1">Add quotes above — built-in fallback quotes are used until you add your own</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {quotes.map((q, i) => (
                          <motion.div key={q._id}
                            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                            className={`flex items-start gap-3 p-4 rounded-xl border transition-all
                              ${q.isActive
                                ? 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border'
                                : 'bg-gray-50 dark:bg-dark-surface border-gray-100 dark:border-dark-border opacity-60'}`}>
                            {/* Quote number */}
                            <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-400 flex items-center justify-center text-xs font-800 flex-shrink-0">
                              {i + 1}
                            </div>
                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                                "{q.text}"
                              </p>
                              <p className="text-xs text-gray-400 mt-1">— {q.author || 'Unknown'}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Active toggle */}
                              <button type="button" onClick={() => handleToggleQuote(q)} title={q.isActive ? 'Deactivate' : 'Activate'}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs
                                  ${q.isActive ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                <i className={`ti ${q.isActive ? 'ti-eye' : 'ti-eye-off'} text-xs`} />
                              </button>
                              {/* Edit */}
                              <button type="button"
                                onClick={() => { setEditQId(q._id); setQuoteForm({ text:q.text, author:q.author||'' }); window.scrollTo({ top:0, behavior:'smooth' }); }}
                                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                <i className="ti ti-edit text-xs" />
                              </button>
                              {/* Delete */}
                              <button type="button" onClick={() => handleDeleteQuote(q._id)}
                                className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                                <i className="ti ti-trash text-xs" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Save footer — hidden on quotes tab (has its own save) */}
            {isAdmin && tab !== 'quotes' && (
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
                <button type="button" onClick={() => { setForm(settings); setLogoFile(null); setLogoPreview(null); }}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors font-600">
                  Reset
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                  {saving ? <><i className="ti ti-loader-2 animate-spin" /> Saving...</> : <><i className="ti ti-device-floppy" /> Save Settings</>}
                </button>
              </div>
            )}
          </motion.div>
        </form>
      </div>
    </AppLayout>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
