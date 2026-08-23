import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { BookOpen, Layers, Users, AlertTriangle } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!stats) return null;

  // Pie Chart Data & Colors
  const pieData = [
    { name: 'Active', value: stats.borrowingOverview.active, color: '#4f46e5' },   // Indigo/Purple
    { name: 'Returned', value: stats.borrowingOverview.returned, color: '#10b981' }, // Emerald/Green
    { name: 'Overdue', value: stats.borrowingOverview.overdue, color: '#ef4444' }, // Red
    { name: 'Due Soon', value: stats.borrowingOverview.dueSoon, color: '#f59e0b' }, // Amber/Orange
  ].filter(d => d.value > 0);

  // Helper for Top Categories progress bar
  const maxCategoryCount = Math.max(...(stats.topCategories.length ? stats.topCategories.map(c => c.count) : [1]));

  return (
    <div className="space-y-6">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Welcome back, {user?.name || 'Admin'}! Here's what's happening in your library.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Books */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Books</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalBooks}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className={`font-medium ${stats.growth.books > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                {stats.growth.books > 0 ? `↑ +${stats.growth.books}` : 'No new books'}
              </span>
              {stats.growth.books > 0 && <span className="text-slate-400">this month</span>}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Total Copies */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Copies</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalCopies}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className={`font-medium ${stats.growth.copies > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                {stats.growth.copies > 0 ? `↑ +${stats.growth.copies}` : 'No new copies'}
              </span>
              {stats.growth.copies > 0 && <span className="text-slate-400">this month</span>}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Members */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Members</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalMembers}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className={`font-medium ${stats.growth.members > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                {stats.growth.members > 0 ? `↑ +${stats.growth.members}` : 'No new members'}
              </span>
              {stats.growth.members > 0 && <span className="text-slate-400">this month</span>}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Out of Stock</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.outOfStock}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-slate-400">Live count, as of today</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Book Overview Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Book Overview
            </h2>
            <span className="text-xs text-slate-400 font-medium">Last 14 days</span>
          </div>
          
          {/* Custom legend above chart */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Books</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Copies</span>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.bookOverview} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalBooks" 
                  name="Total Books"
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="totalCopies" 
                  name="Total Copies"
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Borrowing Overview Donut Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Borrowing Overview
          </h2>
          
          <div className="flex-1 relative flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.borrowingOverview.total}</span>
            </div>
            
            <div className="w-[200px] h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.name}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.value} <span className="text-[10px] text-slate-400 font-normal">({stats.borrowingOverview.total > 0 ? Math.round((item.value / stats.borrowingOverview.total) * 100) : 0}%)</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recent Transactions
            </h2>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-xs uppercase font-medium border-b border-slate-100 dark:border-slate-800/50">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Book Title</th>
                  <th className="pb-3 font-medium">Member</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((trx) => (
                    <tr key={trx.id} className="text-slate-600 dark:text-slate-300">
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{trx.id}</td>
                      <td className="py-3 truncate max-w-[150px]">{trx.bookTitle}</td>
                      <td className="py-3 truncate max-w-[120px]">{trx.member}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{trx.type}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{trx.date}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          trx.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          trx.status === 'Returned' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' :
                          'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          {trx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400 text-xs">No recent transactions.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Top Categories
            </h2>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">View All</button>
          </div>
          
          <div className="space-y-4">
            {stats.topCategories.length > 0 ? (
              stats.topCategories.map((cat, idx) => {
                // Different color for each bar to match image
                const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500'];
                const colorClass = colors[idx % colors.length];
                const widthPercent = Math.max(10, Math.round((cat.count / maxCategoryCount) * 100));

                return (
                  <div key={cat.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <span className="text-slate-500">{cat.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${widthPercent}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No categories found.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
