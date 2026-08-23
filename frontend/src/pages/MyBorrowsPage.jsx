/**
 * MyBorrowsPage — Member's borrowed books (Book Hub design)
 * Tabs: Current | Returned | Overdue
 */
import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { BookMarked, BookOpen, RotateCcw, AlertTriangle } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const TABS = [
  { key: 'current', label: 'Current', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'returned', label: 'Returned', icon: <RotateCcw className="w-4 h-4" /> },
  { key: 'overdue', label: 'Overdue', icon: <AlertTriangle className="w-4 h-4" /> },
];

export default function MyBorrowsPage() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [returnMsg, setReturnMsg] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('current');

  const fetchBorrows = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.get('/borrows/my');
      setBorrows(res.data.data.borrows);
    } catch (err) {
      setFetchError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBorrows(); }, [fetchBorrows]);

  const handleReturn = async (borrow) => {
    setReturningId(borrow._id);
    setReturnMsg({ type: '', text: '' });
    try {
      await api.patch(`/borrows/${borrow._id}/return`);
      setReturnMsg({ type: 'success', text: `"${borrow.book?.title}" returned successfully.` });
      fetchBorrows();
    } catch (err) {
      setReturnMsg({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setReturningId(null);
    }
  };

  const now = new Date();
  const currentBorrows = borrows.filter((b) => b.status === 'borrowed' && new Date(b.dueAt) >= now);
  const returnedBorrows = borrows.filter((b) => b.status === 'returned');
  const overdueBorrows = borrows.filter((b) => b.status === 'borrowed' && (b.isOverdue || new Date(b.dueAt) < now));

  const tabData = { current: currentBorrows, returned: returnedBorrows, overdue: overdueBorrows };
  const displayBorrows = tabData[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-blue-500" />
          Borrowing Tracking
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track the books you've borrowed and their status.
        </p>
      </div>

      {/* Alert */}
      {returnMsg.text && <Alert type={returnMsg.type} message={returnMsg.text} />}
      {fetchError && <Alert type="error" message={fetchError} />}

      {/* Overdue warning */}
      {overdueBorrows.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>Please return books on or before the due date to avoid overdue penalties.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {TABS.map((tab) => {
          const count = tabData[tab.key]?.length || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16"><LoadingSpinner /></div>
      ) : displayBorrows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="font-medium text-slate-500 dark:text-slate-400">
            {activeTab === 'current' && 'No books currently borrowed'}
            {activeTab === 'returned' && 'No books returned yet'}
            {activeTab === 'overdue' && 'No overdue books 🎉'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === 'current' && 'Head to Browse Books to borrow your first book!'}
            {activeTab === 'returned' && 'Your returned books will appear here.'}
            {activeTab === 'overdue' && 'Great job returning your books on time!'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">
                  <th className="px-6 py-4">Book</th>
                  <th className="px-6 py-4">Borrow Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Return Date</th>
                  <th className="px-6 py-4">Status</th>
                  {activeTab === 'current' && <th className="px-6 py-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayBorrows.map((borrow) => {
                  const book = borrow.book || {};
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
                      {/* Book */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100 leading-tight line-clamp-1">{book.title || '—'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{book.author || '—'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Borrow Date */}
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(borrow.borrowedAt)}</td>
                      {/* Due Date */}
                      <td className={`px-6 py-4 text-xs font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatDate(borrow.dueAt)}
                      </td>
                      {/* Return Date */}
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {borrow.status === 'returned' ? formatDate(borrow.returnedAt) : '—'}
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      {/* Return Action */}
                      {activeTab === 'current' && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleReturn(borrow)}
                            disabled={returningId === borrow._id}
                            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50 shadow-sm shadow-blue-200 dark:shadow-none"
                          >
                            {returningId === borrow._id ? 'Returning...' : 'Return'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
