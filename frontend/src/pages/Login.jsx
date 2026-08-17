import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { loginUser } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      login(data);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-5/12 flex-col justify-center px-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #321740 0%, #55316b 55%, #7b4fa0 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ background: '#ff7b0d' }} />

        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-orange flex items-center justify-center mb-6 shadow-glow">
            <span className="text-white text-xl font-800">HA</span>
          </div>
          <h1 className="text-white text-3xl font-800 leading-tight mb-3">HA Technologies</h1>
          <p className="text-white/60 text-base mb-10">Complete HR Management System for modern enterprises.</p>

          <div className="space-y-4">
            {['Manage employees & departments', 'Track attendance & leaves', 'Payroll & project management', 'Reports & analytics'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <i className="ti ti-check text-white text-xs" />
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex items-center justify-center bg-white dark:bg-dark-bg px-6 py-10"
      >
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-800 text-gray-800 dark:text-gray-100">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-700 text-gray-600 dark:text-gray-400 mb-1.5">Email Address</label>
              <div className="relative">
                <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-700 text-gray-600 dark:text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'} text-sm`} />
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-gradient-orange text-white font-700 text-sm rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ti ti-loader-2 animate-spin" /> Signing in...
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 font-700 hover:text-brand-500 transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
