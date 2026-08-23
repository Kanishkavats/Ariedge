import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Search, BookOpen, ClipboardList, RotateCcw, Library,
  LogOut, Sun, Moon, ChevronRight, Bell
} from 'lucide-react';
import { useState } from 'react';

const QUOTE = '"Books are a uniquely portable magic."';
const QUOTE_AUTHOR = '— Stephen King';

export default function MemberLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const [topSearch, setTopSearch] = useState('');

  const handleTopSearch = (e) => {
    e.preventDefault();
    navigate(topSearch.trim() ? `/catalog?q=${encodeURIComponent(topSearch.trim())}` : '/catalog');
  };

  const navLinks = [
    { to: '/home',     label: 'Dashboard',     icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/browse',   label: 'Browse Books',   icon: <Library className="w-5 h-5" /> },
    { to: '/catalog',  label: 'Search Books',   icon: <Search className="w-5 h-5" /> },
    { to: '/issued',   label: 'Book Issued',    icon: <ClipboardList className="w-5 h-5" /> },
    { to: '/returned', label: 'Returned Books', icon: <RotateCcw className="w-5 h-5" /> },
  ];

  // Only routes that actually exist; others are visual-only stubs
  const activeRoutes = ['/home', '/browse', '/catalog', '/issued', '/returned'];

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen flex bg-[#f0f4ff] dark:bg-[#0d1117]">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 flex flex-col
        bg-white dark:bg-[#161b22]
        border-r border-slate-200 dark:border-slate-800
        shadow-sm transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100 dark:border-slate-800/60">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
            <span className="text-white font-black text-sm">L</span>
          </div>
          <div>
            <p className="font-bold text-base leading-tight text-slate-900 dark:text-white">Librix</p>
            <p className="text-[10px] text-slate-400 font-medium">Library Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {navLinks.map(({ to, label, icon }) => {
            const isStub = !activeRoutes.includes(to);
            if (isStub) {
              return (
                <div
                  key={label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed select-none"
                  title="Coming soon"
                >
                  {icon}
                  {label}
                </div>
              );
            }
            return (
              <NavLink
                key={label}
                to={to}
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Quote box */}
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
          <div className="flex justify-center mb-2">
            <div className="flex -space-x-1">
              {['📚','📖','📕'].map((e,i) => (
                <span key={i} className="text-lg">{e}</span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 text-center italic leading-relaxed">{QUOTE}</p>
          <p className="text-[10px] text-slate-400 text-center mt-1 font-medium">{QUOTE_AUTHOR}</p>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Member'}</p>
              <p className="text-[10px] text-blue-500 font-medium">Student</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col lg:pl-56 w-full min-h-screen">
        {/* Desktop top bar */}
        <header className="hidden lg:flex h-16 items-center justify-between gap-4 px-6 bg-white dark:bg-[#161b22] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <form onSubmit={handleTopSearch} className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search books, authors…"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              className="form-input pl-9 w-full"
            />
          </form>
          <div className="flex items-center gap-4">
            <button
              type="button"
              title="Notifications (coming soon)"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-not-allowed"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>
            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{user?.name || 'Member'}</p>
                <p className="text-[10px] text-slate-400 -mt-0.5">Member</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-white dark:bg-[#161b22] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">L</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">Librix</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
