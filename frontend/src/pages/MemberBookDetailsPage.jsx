import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { ChevronLeft, BookOpen, Heart } from 'lucide-react';

export default function MemberBookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [borrowing, setBorrowing] = useState(false);
  const [borrowMsg, setBorrowMsg] = useState({ type: '', text: '' });

  const fetchBook = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/books/${id}`);
      setBook(res.data.data.book);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBook(); }, [fetchBook]);

  const handleBorrow = async () => {
    if (!book || book.availableCopies <= 0) return;
    setBorrowing(true);
    setBorrowMsg({ type: '', text: '' });
    try {
      await api.post('/borrows', { bookId: book._id });
      setBorrowMsg({ type: 'success', text: `"${book.title}" borrowed successfully! Due in 14 days.` });
      // Refresh book data to get updated copies
      fetchBook();
    } catch (err) {
      setBorrowMsg({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) {
    return <div className="py-20"><LoadingSpinner /></div>;
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Alert type="error" message={error || 'Book not found'} />
        <button onClick={() => navigate('/catalog')} className="mt-4 text-emerald-600 hover:underline">
          &larr; Back to Browse Books
        </button>
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/catalog" className="hover:text-emerald-600 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Browse Books
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate">Book Details</span>
      </div>

      {borrowMsg.text && <Alert type={borrowMsg.type} message={borrowMsg.text} />}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col md:flex-row">
        {/* Left: Book Cover */}
        <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-800/50 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
          <div className="w-full max-w-[240px] aspect-[2/3] bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden relative">
            {book.imageUrl ? (
              <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20">
                <BookOpen className="w-12 h-12 text-emerald-500/50 mb-3" />
                <span className="text-sm font-bold text-center text-emerald-800 dark:text-emerald-400">{book.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Book Info */}
        <div className="w-full md:w-2/3 p-8 flex flex-col">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
            {book.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 text-xs font-bold rounded-lg">
              {book.genre || 'Uncategorized'}
            </span>
            <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg">
              Bestseller
            </span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isAvailable ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">{book.availableCopies}</span> / {book.totalCopies} copies available
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            {book.description || `Dive into "${book.title}", a captivating read by ${book.author}. Whether you're a long-time fan or a new reader, this book promises an engaging journey from start to finish.`}
          </p>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">Author</p>
              <p className="font-semibold text-slate-900 dark:text-white">{book.author}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">Genre</p>
              <p className="font-semibold text-slate-900 dark:text-white">{book.genre || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">ISBN</p>
              <p className="font-semibold text-slate-900 dark:text-white">{book.isbn || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">Total Copies</p>
              <p className="font-semibold text-slate-900 dark:text-white">{book.totalCopies}</p>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <button
              onClick={handleBorrow}
              disabled={!isAvailable || borrowing}
              className={`flex-1 max-w-[200px] py-3 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                isAvailable
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 active:scale-95'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {borrowing ? 'Borrowing...' : 'Borrow Book'}
            </button>

            <button className="flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <Heart className="w-4 h-4" />
              Add to Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
