import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0d1117] transition-colors duration-300">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 flex justify-center px-4 pt-3 pb-2">
        <nav className="w-full max-w-6xl flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm px-4 h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 text-brand-600 dark:text-brand-400 flex-shrink-0 mr-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.012 3C4.35 3 3 4.35 3 6.012v11.976C3 19.65 4.35 21 6.012 21H18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7V3H6.012ZM7 6h10v13H6.012A1.012 1.012 0 0 1 5 17.988V7.82A2.985 2.985 0 0 0 6.012 8H7V6ZM5 6.012C5 5.453 5.453 5 6.012 5H7v1H6.012A1.012 1.012 0 0 0 5 7.012V6.012Z"/>
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">LibraTrack</span>
          </NavLink>

          {/* Desktop Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/catalog" className={navLinkClass}>Catalog</NavLink>
            {user?.role === 'member' && (
              <NavLink to="/my-borrows" className={navLinkClass}>My Borrows</NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin/dashboard" className={navLinkClass}>Admin Dashboard</NavLink>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1">
              <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{user?.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${user?.role === 'admin' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                {user?.role}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden fixed top-20 left-4 right-4 z-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 flex flex-col gap-2">
          <NavLink to="/catalog" className={navLinkClass} onClick={() => setMenuOpen(false)}>Catalog</NavLink>
          {user?.role === 'member' && (
            <NavLink to="/my-borrows" className={navLinkClass} onClick={() => setMenuOpen(false)}>My Borrows</NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" className={navLinkClass} onClick={() => setMenuOpen(false)}>Admin Dashboard</NavLink>
          )}
          <hr className="border-slate-200 dark:border-slate-700 my-1" />
          <button onClick={handleLogout} className="text-left px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            Sign out
          </button>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
