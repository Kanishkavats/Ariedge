/**
 * ReturnedBooksPage — member's own return history with full details
 * (borrow date, due date, return date, on-time/late).
 */
import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReturnedBooksPage() {
  const [returned, setReturned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/borrows/my');
      setReturned((res.data.data.borrows || []).filter((b) => b.status === 'returned'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const wasOnTime = (b) => new Date(b.returnedAt) <= new Date(b.dueAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-emerald-500" />
          Returned Books
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your complete return history</p>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <div className="py-16"><LoadingSpinner /></div>
      ) : returned.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="font-medium text-slate-500 dark:text-slate-400">No returned books yet</p>
          <p className="text-sm text-slate-400 mt-1">Books you return will show up here.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">
                  <th className="px-6 py-4">Book</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Borrow Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Return Date</th>
                  <th className="px-6 py-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {returned.map((borrow) => {
                  const onTime = wasOnTime(borrow);
                  return (
                    <tr key={borrow._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{borrow.book?.title || '—'}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{borrow.book?.author || '—'}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(borrow.borrowedAt)}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(borrow.dueAt)}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(borrow.returnedAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          onTime
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {onTime ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {onTime ? 'On Time' : 'Late'}
                        </span>
                      </td>
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
