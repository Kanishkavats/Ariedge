import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, List, Grid, Check, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useDebounce } from 'use-debounce';
import Modal from '../components/Modal';
import BookForm from '../components/BookForm';
import Alert from '../components/Alert';

export default function AdminSearchBooksPage() {
  const navigate = useNavigate();
  // Filters State
  const [q, setQ] = useState('');
  const [debouncedQ] = useDebounce(q, 500);
  
  const [availability, setAvailability] = useState('all'); // 'all', 'available', 'issued'
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  const [books, setBooks] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Metadata for dropdowns
  const [genres, setGenres] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.append('q', debouncedQ);
      if (availability !== 'all') params.append('availability', availability);
      if (category) params.append('genre', category);
      if (author) params.append('author', author);
      if (yearFrom) params.append('yearFrom', yearFrom);
      if (yearTo) params.append('yearTo', yearTo);
      if (language) params.append('language', language);
      if (sortBy) params.append('sortBy', sortBy);
      
      const res = await api.get(`/books?${params.toString()}`);
      setBooks(res.data.data.books);
      setTotalResults(res.data.data.pagination.total);
      
      if (res.data.data.genres) setGenres(res.data.data.genres);
      if (res.data.data.authors) setAuthors(res.data.data.authors);
      if (res.data.data.languages) setLanguages(res.data.data.languages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, availability, category, author, yearFrom, yearTo, language, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleClearFilters = () => {
    setAvailability('all');
    setCategory('');
    setAuthor('');
    setYearFrom('');
    setYearTo('');
    setLanguage('');
  };

  const handleEdit = async (values) => {
    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('author', values.author);
      formData.append('genre', values.genre);
      formData.append('totalCopies', values.totalCopies);
      formData.append('isbn', values.isbn || '');
      formData.append('pages', values.pages || '');
      formData.append('publicationYear', values.publicationYear || '');
      formData.append('language', values.language || '');
      formData.append('description', values.description || '');
      formData.append('publisher', values.publisher || '');
      formData.append('edition', values.edition || '');
      if (values.image) formData.append('image', values.image);

      await api.put(`/books/${editTarget._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditTarget(null);
      setBanner({ type: 'success', text: `"${values.title}" updated.` });
      fetchBooks();
    } catch (err) {
      return { error: getErrorMessage(err) };
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-full bg-[#f4f6fb] dark:bg-[#0d1117]">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Search Books</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Home <span className="mx-1">&gt;</span> <span className="text-indigo-600 dark:text-indigo-400 font-medium">Search Books</span>
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start flex-1">
        
        {/* ── Left Content (Search & Results) ── */}
        <div className="flex-1 w-full flex flex-col gap-6">
          
          {/* Top Search Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, author, ISBN or keyword..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
              />
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {banner.text && <Alert type={banner.type} message={banner.text} />}

          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Showing 1-{Math.min(books.length, 10)} of {totalResults} results
          </p>

          {/* Book Grid view */}
          {!loading && books.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {books.map((book) => (
                <div key={book._id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col">
                  <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm mb-3">
                    {book.imageUrl ? (
                      <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-300">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2 line-clamp-1">{book.author}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-semibold rounded-full">
                      {book.genre}
                    </span>
                    <span className={`text-xs font-bold ${book.availableCopies > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Issued'}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/books/details/${book._id}`)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => { setEditTarget(book); setBanner({ type: '', text: '' }); }}
                      className="flex-1 px-3 py-1.5 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Book List view */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-center py-10 text-slate-500">Loading books...</div>
            ) : books.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No books found.</div>
            ) : viewMode === 'grid' ? null : (
              books.map(book => (
                <div key={book._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row gap-6">
                  {/* Book Cover */}
                  <div className="w-32 h-44 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm mx-auto sm:mx-0">
                    {book.imageUrl ? (
                      <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center p-2 text-center text-xs text-slate-400 font-medium">
                        No Image Available
                      </div>
                    )}
                  </div>
                  
                  {/* Book Info */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1">{book.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{book.author}</p>
                        
                        <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full mb-4">
                          {book.genre}
                        </div>
                      </div>
                      
                      {/* Availability status */}
                      <div className="text-right flex-shrink-0">
                        {book.availableCopies > 0 ? (
                          <>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Available</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{book.availableCopies} Copies</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Issued</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">0 Copies</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-auto flex flex-col sm:flex-row justify-between items-end gap-4">
                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>ISBN: {book.isbn || 'N/A'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span>Pages: {book.pages || 'N/A'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span>Published: {book.publicationYear || 'N/A'}</span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => navigate(`/admin/books/details/${book._id}`)}
                          className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => { setEditTarget(book); setBanner({ type: '', text: '' }); }}
                          className="flex-1 sm:flex-none px-4 py-2 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          Edit Book
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Sidebar (Filters) ── */}
        <div className="w-full lg:w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
            <button onClick={handleClearFilters} className="text-sm font-semibold text-rose-500 hover:text-rose-600">
              Clear All
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* Availability */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Availability</h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'available', label: 'Available' },
                  { id: 'issued', label: 'Issued' },
                ].map(opt => (
                  <label
                    key={opt.id}
                    onClick={() => setAvailability(opt.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      availability === opt.id
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-blue-400'
                    }`}>
                      {availability === opt.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Category</h3>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Author */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Author</h3>
              <div className="relative">
                <select
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Authors</option>
                  {authors.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Publication Year */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Publication Year</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="From Year"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  placeholder="To Year"
                  value={yearTo}
                  onChange={(e) => setYearTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Language</h3>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Languages</option>
                  {languages.filter(Boolean).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={fetchBooks}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2 shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>

      </div>

      {editTarget && (
        <Modal title="Edit Book" onClose={() => setEditTarget(null)}>
          <BookForm
            initial={{
              title: editTarget.title,
              author: editTarget.author,
              genre: editTarget.genre,
              totalCopies: String(editTarget.totalCopies),
              isbn: editTarget.isbn || '',
              pages: editTarget.pages ? String(editTarget.pages) : '',
              publicationYear: editTarget.publicationYear ? String(editTarget.publicationYear) : '',
              language: editTarget.language || '',
              description: editTarget.description || '',
              publisher: editTarget.publisher || '',
              edition: editTarget.edition || '',
              imageUrl: editTarget.imageUrl,
            }}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
            loading={formLoading}
          />
        </Modal>
      )}
    </div>
  );
}
