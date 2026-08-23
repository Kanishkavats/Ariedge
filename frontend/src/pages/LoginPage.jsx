import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { BookOpen, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingBooksBackground from '../components/FloatingBooksBackground';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [roleMode, setRoleMode] = useState('member'); // 'member' or 'admin'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Optional: Auto-fill for convenience based on role selection
  const handleRoleSelect = (role) => {
    setRoleMode(role);
    setError('');
    if (role === 'admin') {
      setEmail('admin@example.com');
      setPassword('Admin@12345');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate(result.role === 'admin' ? '/admin/dashboard' : '/home');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden px-4">
      
      {/* Animated Floating Books Background */}
      <FloatingBooksBackground />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10 border border-white/20 dark:border-slate-700/50"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 transform -rotate-6">
            <BookOpen className="w-7 h-7 text-white transform rotate-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Book Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
            Sign in to access your library
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8 relative">
          <button
            type="button"
            onClick={() => handleRoleSelect('member')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${
              roleMode === 'member' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            Member
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg z-10 transition-colors ${
              roleMode === 'admin' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin
          </button>
          
          {/* Active Tab Background (Animated) */}
          <div className="absolute inset-y-1 w-[calc(50%-4px)] pointer-events-none">
             <motion.div
                className="w-full h-full bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                initial={false}
                animate={{ x: roleMode === 'member' ? 4 : '100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
             />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert type="error" message={error} />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-slate-900 dark:text-white transition-all font-medium"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300" htmlFor="login-password">Password</label>
              <a href="#" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Forgot?</a>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-slate-900 dark:text-white transition-all font-medium"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl py-3.5 mt-2 text-sm font-bold shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : `Login as ${roleMode === 'admin' ? 'Admin' : 'Member'}`}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8 font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
