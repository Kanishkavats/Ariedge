import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Book, BookOpen, Search, PlusCircle, 
  Library, Clock, Users, PieChart, Settings, User as UserIcon, LogOut, ChevronDown, ChevronRight 
} from 'lucide-react';

// For the sidebar items, we can define a nested structure
const NAV_ITEMS = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    label: 'Books',
    icon: <Book className="w-5 h-5" />,
    children: [
      { to: '/admin/books/new', label: 'Add New Book', icon: <PlusCircle className="w-4 h-4" /> },
      { to: '/admin/books', label: 'All Books', icon: <Library className="w-4 h-4" /> },
      { to: '/admin/search', label: 'Search Books', icon: <Search className="w-4 h-4" /> }, // Kept for functionality
    ]
  },
  {
    label: 'Borrowing',
    icon: <Clock className="w-5 h-5" />,
    children: [
      { to: '/admin/borrows', label: 'All Transactions', icon: <BookOpen className="w-4 h-4" /> },
    ]
  },
  {
    to: '/admin/members',
    label: 'Members',
    icon: <Users className="w-5 h-5" />
  },
  {
    to: '/admin/reports',
    label: 'Reports',
    icon: <PieChart className="w-5 h-5" />
  },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />
  },
  {
    to: '/admin/profile',
    label: 'Profile',
    icon: <UserIcon className="w-5 h-5" />
  }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ Books: true, Borrowing: true });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="min-h-screen flex bg-[#f4f6fb] dark:bg-[#0d1117]">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white dark:bg-[#161b22] border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-sm`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-md">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Book Hub</p>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              const isOpen = openMenus[item.label];
              const isChildActive = item.children.some(child => location.pathname === child.to);
              return (
                <div key={item.label} className="mb-1">
                  <button 
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isChildActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  
                  {isOpen && (
                    <div className="mt-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800 flex flex-col gap-1 pl-3">
                      {item.children.map(child => (
                        <NavLink
                          key={child.label}
                          to={child.to}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-500/10 dark:text-indigo-400'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 font-medium'
                            }`
                          }
                        >
                          {child.icon}
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-200 dark:shadow-none'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 font-medium'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
          <button
            type="button"
            onClick={() => navigate('/admin/profile')}
            className="flex items-center gap-3 px-3 py-2 mb-2 w-full text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Administrator</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col lg:pl-64 w-full">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#161b22] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 text-sm w-64">
              <Search className="w-4 h-4" />
              <input type="text" placeholder="Search books, members..." className="bg-transparent outline-none w-full placeholder-slate-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#161b22]"></span>
            </button>
            
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-slate-800 rounded-full"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
