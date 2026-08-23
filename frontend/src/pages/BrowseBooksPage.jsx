/**
 * BrowseBooksPage — animated "browse the catalog" experience.
 * Hero: a flipping 3D book + floating mini books. Below: real book cards
 * (cover click -> details, Borrow button -> BorrowBookModal), paginated.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, X, CheckCircle } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';
import BorrowBookModal from '../components/BorrowBookModal';
import FloatingBooksBackground from '../components/FloatingBooksBackground';

const LIMIT = 8;


function BookCard({ book, onViewDetails, onBorrow }) {
  const available = book.availableCopies > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(79,70,229,0.18)' }}
      transition={{ duration: 0.35 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
    >
      {/* Cover — clicking it opens details */}
      <button
        onClick={() => onViewDetails(book)}
        className="w-full h-48 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden group"
      >
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-indigo-300" />
          </div>
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {available ? `${book.availableCopies} available` : 'Unavailable'}
        </span>
      </button>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="badge-blue badge self-start capitalize">{book.genre}</span>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">{book.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{book.author}</p>

        <div className="mt-auto pt-2 flex items-center gap-2">
          <button
            onClick={() => onViewDetails(book)}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition"
          >
            View Details
          </button>
          <button
            onClick={() => onBorrow(book)}
            disabled={!available}
            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition ${
              available
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            Borrow
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function BrowseBooksPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.get('/books', { params: { page, limit: LIMIT } });
      const data = res.data.data;
      setBooks(data.books || []);
      setPagination({
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      });
    } catch (err) {
      setFetchError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleBorrowClick = (book) => {
    setSelectedBook(book);
    setBorrowModalOpen(true);
    setSuccessMsg('');
  };

  const handleBorrowSuccess = () => {
    setBorrowModalOpen(false);
    setSuccessMsg(`"${selectedBook.title}" borrowed successfully! Check "Book Issued" to view it.`);
    fetchBooks();
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ── HERO: floating + flipping book animation ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[320px] flex items-center justify-center">
        
        {/* Floating Book Images (Same as Login Page) */}
        <FloatingBooksBackground />

        {/* Center: heading */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] rounded-2xl m-4 border border-white/20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-700 mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Browse the Collection
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              Find your next great read
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 max-w-md font-medium">
              Tap a cover for details, or borrow it right from the card.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Success / error banners ── */}
      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      {fetchError && <Alert type="error" message={fetchError} />}

      {/* ── Book cards grid ── */}
      {loading ? (
        <div className="py-16"><LoadingSpinner /></div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No books in the catalog yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {books.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onViewDetails={(b) => navigate(`/book/${b._id}`)}
                onBorrow={handleBorrowClick}
              />
            ))}
          </div>

          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      <BorrowBookModal
        isOpen={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        book={selectedBook}
        onSuccess={handleBorrowSuccess}
      />
    </div>
  );
}
