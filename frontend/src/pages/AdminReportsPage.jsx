import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { PlusCircle, BookOpen, RotateCcw, AlertTriangle, PieChart as PieChartIcon, Activity } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const GENRE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#ec4899', '#14b8a6'];

function StatCard({ icon, label, value, tone }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="text-[11px] text-slate-400 mt-1">This month</div>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
        {icon}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stats/reports')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!data) return null;

  // Merge registered + updated series by day for a single activity chart
  const activityData = data.registeredPerDay.map((d, i) => ({
    label: d.label,
    registered: d.count,
    updated: data.updatedPerDay[i]?.count || 0,
  }));

  const borrowReturnData = data.borrowedPerDay.map((d, i) => ({
    label: d.label,
    borrowed: d.count,
    returned: data.returnedPerDay[i]?.count || 0,
  }));

  const pieData = data.genreDistribution.map((g, i) => ({
    name: g.genre,
    value: g.count,
    color: GENRE_COLORS[i % GENRE_COLORS.length],
  }));
  const totalGenreBooks = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Book inventory activity & borrowing analytics
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={<PlusCircle className="w-6 h-6" />} label="Books Added" value={data.summary.booksAdded} tone="indigo" />
        <StatCard icon={<BookOpen className="w-6 h-6" />} label="Books Borrowed" value={data.summary.booksBorrowed} tone="sky" />
        <StatCard icon={<RotateCcw className="w-6 h-6" />} label="Books Returned" value={data.summary.booksReturned} tone="emerald" />
        <StatCard icon={<AlertTriangle className="w-6 h-6" />} label="Overdue Books" value={data.summary.overdueBooks} tone="rose" />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book Registered vs Updated — line chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-indigo-500" />
            Book Inventory Activity (last 14 days)
          </h2>
          <p className="text-xs text-slate-400 mb-4">Books registered vs. books updated/edited, per day</p>

          <div className="flex items-center gap-6 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Registered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Updated / Edited</span>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="registered" name="Registered" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="updated" name="Updated / Edited" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Genre distribution — pie chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
            <PieChartIcon className="w-4 h-4 text-indigo-500" />
            Genre Distribution
          </h2>

          {pieData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No books yet</div>
          ) : (
            <>
              <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalGenreBooks}</span>
                </div>
                <div className="w-[200px] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2 max-h-[110px] overflow-y-auto">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate capitalize">{item.name}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Borrowed vs Returned bar chart ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          Books Borrowed vs Returned (last 14 days)
        </h2>
        <p className="text-xs text-slate-400 mb-4">Daily borrow and return activity across the library</p>

        <div className="flex items-center gap-6 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Borrowed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Returned</span>
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={borrowReturnData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="borrowed" name="Borrowed" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returned" name="Returned" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
