/**
 * BookIssuedPage — member self-service "issue a book" form + list of books
 * currently issued to them. Uses the same /borrows POST and /borrows/my GET
 * endpoints as the rest of the borrow flow; no new backend needed.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Calendar, Clock, CheckCircle, X, RotateCcw } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BookIssuedPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const [issued, setIssued] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [listMsg, setListMsg] = useState({ type: '', text: '' });

  const debounceRef = useRef(null);

  const loadIssued = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/borrows/my');
      setIssued((res.data.data.borrows || []).filter((b) => b.status === 'borrowed'));
    } catch (err) {
      setListMsg({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadIssued(); }, [loadIssued]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/books', { params: { q: search.trim(), availability: 'available', limit: 6 } });
        setResults(res.data.data.books || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const pickBook = (book) => {
    setSelectedBook(book);
    setResults([]);
    setSearch('');
    setFormMsg({ type: '', text: '' });
  };

  const handleIssue = async () => {
    if (!selectedBook) return;
    setIssuing(true);
    setFormMsg({ type: '', text: '' });
    try {
      await api.post('/borrows', { bookId: selectedBook._id });
      setFormMsg({ type: 'success', text: `"${selectedBook.title}" issued successfully! Due in 14 days.` });
      setSelectedBook(null);
      loadIssued();
    } catch (err) {
      setFormMsg({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIssuing(false);
    }
  };

  const handleReturn = async (borrow) => {
    setReturningId(borrow._id);
    setListMsg({ type: '', text: '' });
    try {
      await api.patch(`/borrows/${borrow._id}/return`);
      setListMsg({ type: 'success', text: `"${borrow.book?.title}" returned successfully.` });
      loadIssued();
    } catch (err) {
      setListMsg({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setReturningId(null);
    }
  };

  const dueDatePreview = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return formatDate(d);
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Book Issued</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Issue a new book and view what's currently issued to you</p>
      </div>

      {/* ── Issue a Book form ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Issue a Book</h2>

        {formMsg.text && <div className="mb-4"><Alert type={formMsg.type} message={formMsg.text} /></div>}

        {!selectedBook ? (
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for a book to issue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 w-full"
            />
            {(searching || results.length > 0) && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
                {searching ? (
                  <div className="p-3 text-xs text-slate-400 text-center">Searching…</div>
                ) : (
                  results.map((book) => (
                    <button
                      key={book._id}
                      onClick={() => pickBook(book)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                    >
                      <div className="w-8 h-11 rounded bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {book.imageUrl ? <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" /> : <BookOpen className="w-3.5 h-3.5 text-blue-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{book.title}</p>
                        <p className="text-xs text-slate-400 truncate">{book.author} · {book.availableCopies} available</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md">
            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                {selectedBook.imageUrl ? <img src={selectedBook.imageUrl} alt={selectedBook.title} className="w-full h-full object-cover" /> : <BookOpen className="w-6 h-6 text-blue-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">{selectedBook.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedBook.author}</p>
                  </div>
                  <button onClick={() => setSelectedBook(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" /> Issue Date: <span className="font-semibold text-slate-800 dark:text-slate-200">Today</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> Due Date: <span className="font-semibold text-slate-800 dark:text-slate-200">{dueDatePreview()} (14 days)</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleIssue}
              disabled={issuing}
              className="mt-4 w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {issuing ? 'Issuing…' : 'Confirm & Issue Book'}
            </button>
          </div>
        )}
      </div>

      {/* ── Currently issued list ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Currently Issued to You</h2>

        {listMsg.text && <div className="mb-4"><Alert type={listMsg.type} message={listMsg.text} /></div>}

        {loading ? (
          <div className="py-10"><LoadingSpinner /></div>
        ) : issued.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No books currently issued to you</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Book</th>
                  <th className="py-2 pr-4 font-semibold">Issue Date</th>
                  <th className="py-2 pr-4 font-semibold">Due Date</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {issued.map((borrow) => {
                  const isOverdue = borrow.isOverdue || new Date(borrow.dueAt) < now;
                  return (
                    <tr key={borrow._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 pr-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{borrow.book?.title || '—'}</p>
                        <p className="text-xs text-slate-400">{borrow.book?.author || '—'}</p>
                      </td>
                      <td className="py-2 pr-4 text-slate-500 dark:text-slate-400 text-xs">{formatDate(borrow.borrowedAt)}</td>
                      <td className={`py-2 pr-4 text-xs font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{formatDate(borrow.dueAt)}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${isOverdue ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <button
                          onClick={() => handleReturn(borrow)}
                          disabled={returningId === borrow._id}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {returningId === borrow._id ? 'Returning…' : 'Return'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => navigate('/catalog')}
          className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Browse more books to issue →
        </button>
      </div>
    </div>
  );
}
