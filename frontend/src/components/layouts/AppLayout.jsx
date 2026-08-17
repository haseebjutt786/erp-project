import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout({ children }) {
  const [collapsed,    setCollapsed]    = useState(false);   // desktop collapse
  const [mobileOpen,   setMobileOpen]   = useState(false);   // mobile drawer

  // Close mobile drawer on route change or resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-bg">

      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────── */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} onNavClick={() => {}} />
      </div>

      {/* ── Mobile drawer backdrop ───────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile sidebar drawer ───────────────────────────────────────── */}
      <div
        className={`
          fixed top-0 left-0 h-full z-50 lg:hidden
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: 272 }}
      >
        <Sidebar
          collapsed={false}
          setCollapsed={() => {}}
          isMobile={true}
          onNavClick={closeMobile}
          onClose={closeMobile}
        />
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(v => !v)} mobileOpen={mobileOpen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
