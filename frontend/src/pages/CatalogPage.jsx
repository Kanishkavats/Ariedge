/**
 * CatalogPage — Librix-style "Search Books" page.
 * List view with book cover + details on left, filter panel on right.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { Search, Grid, List, BookOpen, ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BorrowBookModal from '../components/BorrowBookModal';

const LIMIT = 6;

/* ── Book card in LIST view ── */
function ListBookCard({ book, onClick }) {
  const avail = book.availableCopies > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all"
    >
      {/* Cover */}
      <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-7 h-7 text-blue-300" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-1">
              {book.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{book.author}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className={`text-xs font-bold ${avail ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {avail ? 'Available' : 'Issued'}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              {avail ? book.availableCopies : 0} {avail ? 'Copies' : 'Copy'}
            </p>
          </div>
        </div>

        {book.genre && (
          <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800">
            {book.genre}
          </span>
        )}

        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          {book.isbn && <span>ISBN: {book.isbn}</span>}
          {book.pages && <span>Pages: {book.pages}</span>}
          {book.publishedYear && <span>Published: {book.publishedYear}</span>}
          {!book.isbn && !book.pages && !book.publishedYear && (
            <span>Total Copies: {book.totalCopies}</span>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onClick(book)}
            className="px-4 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition"
          >
            View Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(book, 'request'); }}
            disabled={!avail}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
              avail
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            Request Book
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Book card in GRID view ── */
function GridBookCard({ book, onClick }) {
  const avail = book.availableCopies > 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all"
    >
      <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center relative">
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-10 h-10 text-blue-300" />
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${avail ? 'bg-green-500 text-white' : 'bg-red-400 text-white'}`}>
          {avail ? 'Available' : 'Issued'}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{book.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{book.author}</p>
        {book.genre && (
          <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800 font-semibold">
            {book.genre}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [books, setBooks]           = useState([]);
  const [genres, setGenres]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [viewMode, setViewMode]     = useState('list'); // 'list' | 'grid'
  
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch]             = useState('');
  const [genre, setGenre]               = useState('');
  const [author, setAuthor]             = useState('');
  const [language, setLanguage]         = useState('');
  const [sort, setSort]                 = useState('relevance');
  const [availability, setAvailability] = useState('all'); // 'all' | 'available' | 'issued'
  const [page, setPage]                 = useState(1);

  const debounceRef       = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [authors, setAuthors]   = useState([]);
  const [languages, setLanguages] = useState([]);

  // Read ?q= from URL (from home page search)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) { setSearch(q); setDebouncedSearch(q); }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => { setPage(1); }, [genre, sort, availability, author, language]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = { page, limit: LIMIT };
      if (debouncedSearch) params.q = debouncedSearch;
      if (genre) params.genre = genre;
      if (author) params.author = author;
      if (language) params.language = language;
      if (availability !== 'all') params.availability = availability;
      if (sort && sort !== 'relevance') params.sortBy = sort;

      const res = await api.get('/books', { params });
      const data = res.data.data;

      setBooks(data.books || []);
      setPagination({
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      });
      if (genres.length === 0) setGenres(data.genres || []);
      if (data.authors) setAuthors(data.authors.filter(Boolean));
      if (data.languages) setLanguages(data.languages.filter(Boolean));
    } catch (err) {
      setFetchError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, genre, author, language, availability, sort]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const clearFilters = () => {
    setSearch(''); setDebouncedSearch(''); setGenre('');
    setAuthor(''); setLanguage('');
    setAvailability('all'); setSort('relevance'); setPage(1);
  };

  const handleBookAction = (book, action) => {
    if (action === 'request') {
      setSelectedBook(book);
      setBorrowModalOpen(true);
      setSuccessMsg('');
    } else {
      navigate(`/book/${book._id}`);
    }
  };

  const handleBorrowSuccess = () => {
    setBorrowModalOpen(false);
    setSuccessMsg(`"${selectedBook.title}" requested successfully! Go to My Books to view details.`);
    fetchBooks(); // Refresh available copies
  };

  const hasFilters = search || genre || author || language || availability !== 'all' || sort !== 'relevance';

  return (
    <div className="flex flex-col gap-0">
      {/* ── PAGE HEADER ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-1">
          <span className="hover:text-blue-500 cursor-pointer" onClick={() => navigate('/home')}>Home</span>
          <span>›</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">Search Books</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Search Books</h1>
      </div>

      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-400 text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-5">
        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0">
          {/* Search + Sort + View toggle */}
          <div className="flex items-center gap-3 mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, author, ISBN or keyword..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-800 dark:text-white placeholder-slate-400 transition"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-500 font-medium hidden sm:block">Sort by:</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="py-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="title">Title A–Z</option>
              </select>

              {/* View toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
              {pagination.total > 0
                ? `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, pagination.total)} of ${pagination.total} results`
                : 'No results found'}
              {hasFilters && (
                <button onClick={clearFilters} className="ml-2 text-blue-500 hover:underline font-semibold">
                  Clear filters
                </button>
              )}
            </p>
          )}

          {fetchError && <Alert type="error" message={fetchError} />}

          {/* Book list */}
          {loading ? (
            <div className="py-20"><LoadingSpinner /></div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-500">No books found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
                Clear all filters
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-3">
              {books.map(book => (
                <ListBookCard
                  key={book._id}
                  book={book}
                  onClick={(book, action) => handleBookAction(book, action)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {books.map(book => (
                <GridBookCard
                  key={book._id}
                  book={book}
                  onClick={() => handleBookAction(book)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT FILTER PANEL ── */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs font-semibold text-red-500 hover:underline">
                  Clear All
                </button>
              )}
            </div>

            {/* Availability */}
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Availability</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: 'all',       label: 'All' },
                  { value: 'available', label: 'Available' },
                  { value: 'issued',    label: 'Issued' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availability === opt.value}
                      onChange={() => setAvailability(opt.value)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category / Genre */}
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Category</p>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
              >
                <option value="">All Categories</option>
                {genres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Author</p>
              <select
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
              >
                <option value="">All Authors</option>
                {authors.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div className="mb-5">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Language</p>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
              >
                <option value="">All Languages</option>
                {languages.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchBooks}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Borrow Book Modal */}
      <BorrowBookModal
        isOpen={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        book={selectedBook}
        onSuccess={handleBorrowSuccess}
      />
    </div>
  );
}
