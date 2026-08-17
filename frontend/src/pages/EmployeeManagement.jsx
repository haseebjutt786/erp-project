import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AppLayout from '../components/layouts/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAllEmployees, createEmployee, updateEmployee,
  deactivateEmployee, reactivateEmployee, getAllDepartments,
} from '../services/api.js';

const EMPTY = {
  fullName:'', email:'', password:'', designation:'',
  department:'', employeeId:'', basicSalary:'',
  dateOfBirth:'', isAdmin: false,
};

export default function EmployeeManagement() {
  const { user: me } = useAuth();
  const [employees, setEmployees]   = useState([]);
  const [departments, setDepts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modal, setModal]           = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [showPass, setShowPass]     = useState(false);

  const load = async (q = '', dept = '') => {
    setLoading(true);
    try {
      const params = {};
      if (q)    params.search     = q;
      if (dept) params.department = dept;
      const { data } = await getAllEmployees(params);
      setEmployees(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load employees');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    getAllDepartments().then(({ data }) => setDepts(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search, deptFilter), 350);
    return () => clearTimeout(t);
  }, [search, deptFilter]); // eslint-disable-line

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setShowPass(false); setModal(true); };
  const openEdit = (emp) => {
    setEditingId(emp._id);
    setForm({
      fullName:    emp.fullName,
      email:       emp.email,
      password:    '',
      designation: emp.designation || '',
      department:  emp.department  || '',
      employeeId:  emp.employeeId  || '',
      basicSalary: emp.basicSalary || '',
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : '',
      isAdmin:     emp.isAdmin,
    });
    setShowPass(false);
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { password, email, ...rest } = form;
        await updateEmployee(editingId, rest);
        toast.success('Employee updated');
      } else {
        await createEmployee(form);
        toast.success('Employee added');
      }
      setModal(false);
      load(search, deptFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleToggle = async (emp) => {
    try {
      if (emp.isActive) { await deactivateEmployee(emp._id); toast.success(`${emp.fullName} deactivated`); }
      else              { await reactivateEmployee(emp._id); toast.success(`${emp.fullName} reactivated`); }
      load(search, deptFilter);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const activeCount = employees.filter(e => e.isActive).length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-5 shadow-card">
        <div>
          <h2 className="text-xl font-800 text-gray-800 dark:text-gray-100">Employee Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">{employees.length} total · {activeCount} active</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-orange text-white px-5 py-2.5 rounded-lg text-sm font-700 hover:shadow-glow transition-all">
          <i className="ti ti-user-plus" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-0" style={{ minWidth: '160px' }}>
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16">
            <i className="ti ti-users text-gray-200 text-5xl mb-3 block" />
            <p className="text-gray-500 font-600">No employees found</p>
            <button onClick={openAdd} className="mt-3 text-sm text-brand-400 font-600 hover:text-brand-500 transition-colors">Add first employee →</button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-0">
            <div style={{ minWidth: '600px' }}>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-surface">
                  {['Employee','Email','Designation','Department','DOB','Role','Status',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <motion.tr key={emp._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-orange flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
                          {emp.fullName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-600 text-gray-800 dark:text-gray-200">{emp.fullName}</p>
                          <p className="text-xs text-gray-400">{emp.employeeId || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{emp.email}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{emp.designation || '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">{emp.department || '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border text-xs text-gray-500">
                      {emp.dateOfBirth
                        ? new Date(emp.dateOfBirth).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                      <span className={`text-xs font-700 px-2.5 py-1 rounded-full ${emp.isAdmin ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.isAdmin ? 'Admin' : 'Employee'}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                      <span className={`text-xs font-700 px-2.5 py-1 rounded-full ${emp.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(emp)}
                          className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors font-600 flex items-center gap-1">
                          <i className="ti ti-edit text-xs" /> Edit
                        </button>
                        {emp._id !== me?._id && (
                          <button onClick={() => handleToggle(emp)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-600 transition-colors flex items-center gap-1
                              ${emp.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {emp.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            </div>{/* end minWidth wrapper */}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setModal(false)}>
            <motion.form initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.95, opacity:0 }} transition={{ duration:0.2 }}
              className="bg-white dark:bg-dark-card rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
              onClick={e => e.stopPropagation()} onSubmit={handleSave}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
                <div>
                  <h3 className="text-base font-700 text-gray-800 dark:text-gray-100">
                    {editingId ? 'Edit Employee' : 'Add New Employee'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editingId ? 'Update employee information' : 'Fill in the details to create an account'}
                  </p>
                </div>
                <button type="button" onClick={() => setModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                  <i className="ti ti-x text-sm" />
                </button>
              </div>

              {/* Form body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Row 1: Full name + Employee ID */}
                <div className="grid grid-cols-2 gap-4">
                  <F label="Full Name *">
                    <input required value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})}
                      placeholder="e.g. Ali Hassan" className="input-style" />
                  </F>
                  <F label="Employee ID">
                    <input value={form.employeeId} onChange={e => setForm({...form, employeeId:e.target.value})}
                      placeholder="e.g. EMP-001" className="input-style" />
                  </F>
                </div>

                {/* Email */}
                <F label="Email Address *">
                  <input required type="email" disabled={!!editingId}
                    value={form.email} onChange={e => setForm({...form, email:e.target.value})}
                    placeholder="employee@company.com"
                    className={`input-style ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`} />
                </F>

                {/* Password — only on add */}
                {!editingId && (
                  <F label="Temporary Password (min 8 chars) *">
                    <div className="relative">
                      <input required type={showPass ? 'text' : 'password'} minLength={8}
                        value={form.password} onChange={e => setForm({...form, password:e.target.value})}
                        placeholder="Minimum 8 characters" className="input-style pr-10" />
                      <button type="button" onClick={() => setShowPass(v=>!v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'} text-sm`} />
                      </button>
                    </div>
                  </F>
                )}

                {/* Row 2: Designation + Department */}
                <div className="grid grid-cols-2 gap-4">
                  <F label="Designation">
                    <input value={form.designation} onChange={e => setForm({...form, designation:e.target.value})}
                      placeholder="e.g. Software Engineer" className="input-style" />
                  </F>
                  <F label="Department">
                    {departments.length > 0 ? (
                      <select value={form.department} onChange={e => setForm({...form, department:e.target.value})} className="input-style">
                        <option value="">No department</option>
                        {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                      </select>
                    ) : (
                      <input value={form.department} onChange={e => setForm({...form, department:e.target.value})}
                        placeholder="Type department name" className="input-style" />
                    )}
                  </F>
                </div>

                {/* Row 3: Basic Salary + Date of Birth */}
                <div className="grid grid-cols-2 gap-4">
                  <F label="Basic Salary (monthly)">
                    <input type="number" min="0" value={form.basicSalary}
                      onChange={e => setForm({...form, basicSalary:e.target.value})}
                      placeholder="e.g. 50000" className="input-style" />
                  </F>
                  <F label="Date of Birth">
                    <input type="date" value={form.dateOfBirth}
                      onChange={e => setForm({...form, dateOfBirth:e.target.value})}
                      max={new Date().toISOString().slice(0,10)}
                      className="input-style" />
                  </F>
                </div>

                {/* Admin toggle */}
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/20">
                  <div>
                    <p className="text-sm font-600 text-gray-800 dark:text-gray-200">Admin / HR Access</p>
                    <p className="text-xs text-gray-400 mt-0.5">Can manage employees, approve leaves, generate payroll</p>
                  </div>
                  <div onClick={() => setForm({...form, isAdmin:!form.isAdmin})}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${form.isAdmin ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isAdmin ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border flex-shrink-0">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors font-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-orange text-white rounded-lg text-sm font-700 hover:shadow-glow transition-all disabled:opacity-60">
                  {saving
                    ? <><i className="ti ti-loader-2 animate-spin" /> Saving...</>
                    : <><i className="ti ti-check" /> {editingId ? 'Update' : 'Add Employee'}</>}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function F({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-700 text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
