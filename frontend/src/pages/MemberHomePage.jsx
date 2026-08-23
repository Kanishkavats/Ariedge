/**
 * MemberHomePage — "Assignment POC" style dashboard for members.
 * Two panels mirroring the reference layout: Book Catalog overview + My Borrowing overview,
 * both backed by real member-scoped data (GET /stats/me, /books, /borrows/my).
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Layers, Tags, AlertTriangle, Search,
  BookMarked, Clock, TrendingUp, Star, ArrowRight, RotateCcw,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

function StatCard({ icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-slate-900 dark:text-white leading-none truncate">{value}</p>
        <p className="text-[11px] text-slate-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MemberHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [borrowTab, setBorrowTab] = useState('all');
  const [returningId, setReturningId] = useState(null);
  const [returnMsg, setReturnMsg] = useState({ type: '', text: '' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, booksRes, borrowsRes] = await Promise.all([
        api.get('/stats/me'),
        api.get('/books', { params: { limit: 5, page: 1 } }),
        api.get('/borrows/my'),
      ]);
      setStats(statsRes.data.data);
      setBooks(booksRes.data.data.books || []);
      setBorrows(borrowsRes.data.data.borrows || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleReturn = async (borrow) => {
    setReturningId(borrow._id);
    setReturnMsg({ type: '', text: '' });
    try {
      await api.patch(`/borrows/${borrow._id}/return`);
      setReturnMsg({ type: 'success', text: `"${borrow.book?.title}" returned successfully.` });
      loadAll();
    } catch (err) {
      setReturnMsg({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setReturningId(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/catalog?q=${encodeURIComponent(search.trim())}` : '/catalog');
  };

  const now = new Date();
  const visibleBorrows = borrows
    .filter((b) => {
      if (borrowTab === 'active') return b.status === 'borrowed' && !(b.isOverdue || new Date(b.dueAt) < now);
      if (borrowTab === 'overdue') return b.status === 'borrowed' && (b.isOverdue || new Date(b.dueAt) < now);
      return true;
    })
    .slice(0, 5);

  if (loading) return <div className="py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Welcome back, {user?.name || 'Member'}
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {returnMsg.text && <Alert type={returnMsg.type} message={returnMsg.text} />}

      {/* ── BOOK CATALOG PANEL ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Book Catalog</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Browse & borrow from our collection</p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <form onSubmit={handleSearch} className="relative flex-1 lg:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search books…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9 w-full"
              />
            </form>
            <div className="hidden sm:flex items-center gap-2">
              <StatCard icon={<BookOpen className="w-4 h-4" />} label="Total Books" value={stats?.totalBooks ?? 0} tone="blue" />
              <StatCard icon={<Layers className="w-4 h-4" />} label="Total Copies" value={stats?.totalCopies ?? 0} tone="green" />
              <StatCard icon={<Tags className="w-4 h-4" />} label="Genres" value={stats?.genres ?? 0} tone="amber" />
              <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Out of Stock" value={stats?.outOfStock ?? 0} tone="rose" />
            </div>
          </div>
        </div>

        {/* Mobile stat cards */}
        <div className="grid grid-cols-2 sm:hidden gap-2 mb-5">
          <StatCard icon={<BookOpen className="w-4 h-4" />} label="Total Books" value={stats?.totalBooks ?? 0} tone="blue" />
          <StatCard icon={<Layers className="w-4 h-4" />} label="Total Copies" value={stats?.totalCopies ?? 0} tone="green" />
          <StatCard icon={<Tags className="w-4 h-4" />} label="Genres" value={stats?.genres ?? 0} tone="amber" />
          <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Out of Stock" value={stats?.outOfStock ?? 0} tone="rose" />
        </div>

        {books.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No books in the catalog yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Cover</th>
                  <th className="py-2 pr-4 font-semibold">Title</th>
                  <th className="py-2 pr-4 font-semibold">Author</th>
                  <th className="py-2 pr-4 font-semibold">Genre</th>
                  <th className="py-2 pr-4 font-semibold text-center">Available</th>
                  <th className="py-2 pr-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {books.map((book) => (
                  <tr key={book._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 pr-4">
                      <div className="w-9 h-12 rounded bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden flex items-center justify-center">
                        {book.imageUrl ? (
                          <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-blue-300" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4 font-semibold text-slate-800 dark:text-slate-100 max-w-[180px] truncate">{book.title}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400 max-w-[140px] truncate">{book.author}</td>
                    <td className="py-2 pr-4"><span className="badge-blue badge capitalize">{book.genre}</span></td>
                    <td className="py-2 pr-4 text-center">
                      <span className={book.availableCopies > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500 font-semibold'}>
                        {book.availableCopies}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <button
                        onClick={() => navigate(`/book/${book._id}`)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => navigate('/catalog')}
          className="mt-4 flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Browse full catalog <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── MY BORROWING PANEL ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">My Borrowing</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your borrowing records & status</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatCard icon={<BookMarked className="w-4 h-4" />} label="Currently Borrowed" value={stats?.currentlyBorrowed ?? 0} tone="blue" />
            <StatCard icon={<Clock className="w-4 h-4" />} label="Due This Week" value={stats?.dueThisWeek ?? 0} tone="amber" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Overdue" value={stats?.overdue ?? 0} tone="rose" />
            <StatCard icon={<Star className="w-4 h-4" />} label="Popular Book" value={stats?.popularBook || '—'} tone="green" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBorrowTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                borrowTab === tab.key
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {visibleBorrows.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No borrowing records in this view</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Book Title</th>
                  <th className="py-2 pr-4 font-semibold">Borrow Date</th>
                  <th className="py-2 pr-4 font-semibold">Due Date</th>
                  <th className="py-2 pr-4 font-semibold">Return Date</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {visibleBorrows.map((borrow) => {
                  const isActive = borrow.status === 'borrowed';
                  const isOverdue = isActive && (borrow.isOverdue || new Date(borrow.dueAt) < now);
                  let statusLabel = 'Active';
                  let statusClass = 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
                  if (borrow.status === 'returned') {
                    statusLabel = 'Returned';
                    statusClass = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
                  } else if (isOverdue) {
                    statusLabel = 'Overdue';
                    statusClass = 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
                  }
                  return (
                    <tr key={borrow._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 pr-4 font-semibold text-slate-800 dark:text-slate-100 max-w-[180px] truncate">{borrow.book?.title || '—'}</td>
                      <td className="py-2 pr-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(borrow.borrowedAt)}</td>
                      <td className={`py-2 pr-4 text-xs font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{formatDate(borrow.dueAt)}</td>
                      <td className="py-2 pr-4 text-slate-500 dark:text-slate-400 text-xs">{borrow.status === 'returned' ? formatDate(borrow.returnedAt) : '—'}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${statusClass}`}>{statusLabel}</span>
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {isActive ? (
                          <button
                            onClick={() => handleReturn(borrow)}
                            disabled={returningId === borrow._id}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {returningId === borrow._id ? 'Returning…' : 'Return'}
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => navigate('/issued')}
          className="mt-4 flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all issued & returned books <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
