/**
 * AdminBooksPage — full CRUD management for books (admin only).
 *
 * Features:
 *  - Paginated table of all books
 *  - Create book (modal)
 *  - Edit book (modal, pre-filled)
 *  - Delete book with confirmation
 *  - Search + genre filter (reuses same API params)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api, { getErrorMessage } from '../api/axios';
import Modal from '../components/Modal';
import BookForm from '../components/BookForm';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { Eye, PieChart as PieChartIcon, BarChart3, Layers } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';

const LIMIT = 10;
const GENRE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#ec4899', '#14b8a6'];

export default function AdminBooksPage() {
  const [books, setBooks]           = useState([]);
  const [genres, setGenres]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [search, setSearch] = useState('');
  const [genre, setGenre]   = useState('');
  const [page, setPage]     = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // book object or null
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  // Form loading
  const [formLoading, setFormLoading]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Banner feedback
  const [banner, setBanner] = useState({ type: '', text: '' });

  // Full catalog snapshot for the analytics charts below the table
  // (independent of the table's pagination/search/genre filters).
  const [allBooks, setAllBooks] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const fetchChartData = useCallback(async () => {
    setChartsLoading(true);
    try {
      const res = await api.get('/books', { params: { limit: 100 } });
      setAllBooks(res.data.data.books || []);
    } catch {
      // Non-critical — charts just stay empty if this fails.
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => { setPage(1); }, [genre]);

  const fetchBooks = useCallback(async () => {
    setPageLoading(true);
    setFetchError('');
    try {
      const params = { page, limit: LIMIT };
      if (debouncedSearch) params.q = debouncedSearch;
      if (genre)           params.genre = genre;
      const res = await api.get('/books', { params });
      const { books: b, genres: g, pagination: pg } = res.data.data;
      setBooks(b);
      setGenres(g.sort());
      setPagination(pg);
    } catch (err) {
      setFetchError(getErrorMessage(err));
    } finally {
      setPageLoading(false);
    }
  }, [page, debouncedSearch, genre]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleCreate = async (values) => {
    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('author', values.author);
      formData.append('genre', values.genre);
      formData.append('totalCopies', values.totalCopies);
      if (values.isbn) formData.append('isbn', values.isbn);
      if (values.pages) formData.append('pages', values.pages);
      if (values.publicationYear) formData.append('publicationYear', values.publicationYear);
      if (values.language) formData.append('language', values.language);
      if (values.description) formData.append('description', values.description);
      if (values.publisher) formData.append('publisher', values.publisher);
      if (values.edition) formData.append('edition', values.edition);
      if (values.image) formData.append('image', values.image);

      await api.post('/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowCreate(false);
      setBanner({ type: 'success', text: `"${values.title}" added to the catalog.` });
      fetchBooks();
      fetchChartData();
    } catch (err) {
      return { error: getErrorMessage(err) };
    } finally {
      setFormLoading(false);
    }
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
      fetchChartData();
    } catch (err) {
      return { error: getErrorMessage(err) };
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/books/${deleteTarget._id}`);
      setBanner({ type: 'success', text: `"${deleteTarget.title}" has been deleted.` });
      setDeleteTarget(null);
      fetchBooks();
      fetchChartData();
    } catch (err) {
      setBanner({ type: 'error', text: getErrorMessage(err) });
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Derived chart data (from the full catalog snapshot, real & dynamic) ──
  const genreCounts = {};
  allBooks.forEach((b) => {
    const g = b.genre || 'Uncategorized';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const genrePieData = Object.entries(genreCounts)
    .map(([name, value], i) => ({ name, value, color: GENRE_COLORS[i % GENRE_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  const copiesBarData = [...allBooks]
    .sort((a, b) => b.totalCopies - a.totalCopies)
    .slice(0, 8)
    .map((b) => ({
      name: b.title.length > 14 ? `${b.title.slice(0, 14)}…` : b.title,
      total: b.totalCopies,
      available: b.availableCopies,
    }));

  const inStockCount = allBooks.filter((b) => b.availableCopies > 0).length;
  const outOfStockCount = allBooks.length - inStockCount;
  const stockPieData = [
    { name: 'In Stock', value: inStockCount, color: '#10b981' },
    { name: 'Out of Stock', value: outOfStockCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Books</h1>
          <p className="text-sm text-slate-500 mt-1">Create, edit, and remove books from the catalog</p>
        </div>
        <button
          id="add-book-btn"
          onClick={() => { setShowCreate(true); setBanner({ type: '', text: '' }); }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add book
        </button>
      </div>

      {/* ── Banner ── */}
      {banner.text && (
        <div className="mb-4">
          <Alert type={banner.type} message={banner.text} />
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            id="admin-search"
            type="text"
            className="form-input pl-9"
            placeholder="Search books…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="admin-genre"
          className="form-input sm:w-44"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        {(debouncedSearch || genre) && (
          <button onClick={() => { setSearch(''); setGenre(''); }} className="btn-secondary whitespace-nowrap">
            Clear
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {fetchError && <Alert type="error" message={fetchError} />}

      {/* ── Table ── */}
      {pageLoading ? (
        <LoadingSpinner />
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="font-medium text-slate-500">No books found</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600 w-16">Cover</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Title</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Author</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Genre</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Total</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Available</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {books.map((book) => (
                    <tr key={book._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        {book.imageUrl ? (
                          <img 
                            src={book.imageUrl} 
                            alt={book.title} 
                            className="w-10 h-14 object-cover rounded shadow-sm cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={() => setPreviewImage(book.imageUrl)}
                            title="Click to view full image"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400 border border-slate-200 text-center leading-tight">No Img</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">
                        {book.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">
                        {book.author}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge-blue badge">{book.genre}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{book.totalCopies}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={book.availableCopies > 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                          {book.availableCopies}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`view-book-${book._id}`}
                            onClick={() => setViewTarget(book)}
                            title="View details"
                            className="btn-secondary btn-sm !p-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`edit-book-${book._id}`}
                            onClick={() => { setEditTarget(book); setBanner({ type: '', text: '' }); }}
                            className="btn-secondary btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            id={`delete-book-${book._id}`}
                            onClick={() => { setDeleteTarget(book); setBanner({ type: '', text: '' }); }}
                            className="btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>{pagination.total} total books</span>
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* ── Book Inventory Analytics ── */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Book Inventory Analytics</h2>
        <p className="text-sm text-slate-500 mb-5">Live charts computed from your current catalog</p>

        {chartsLoading ? (
          <LoadingSpinner />
        ) : allBooks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
            No books yet — add some to see analytics here.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Genre distribution — Pie chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                Genre Distribution
              </h3>
              <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{allBooks.length}</span>
                </div>
                <div className="w-[200px] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genrePieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                        {genrePieData.map((entry, index) => <Cell key={`g-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-2 max-h-[100px] overflow-y-auto">
                {genrePieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[11px] text-slate-500 truncate capitalize">{item.name}</span>
                    <span className="text-[11px] font-bold text-slate-700 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock status — Pie chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Layers className="w-4 h-4 text-indigo-500" />
                Stock Status
              </h3>
              <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-500">Books</span>
                  <span className="text-2xl font-bold text-slate-900">{allBooks.length}</span>
                </div>
                <div className="w-[200px] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stockPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                        {stockPieData.map((entry, index) => <Cell key={`s-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6">
                {stockPieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-xs text-slate-600">{item.name}: <span className="font-bold">{item.value}</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total vs Available copies — Bar chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Total vs Available Copies
              </h3>
              <p className="text-xs text-slate-400 mb-4">Top 8 books by total copies</p>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={copiesBarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="total" name="Total Copies" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="available" name="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <Modal title="Add New Book" onClose={() => setShowCreate(false)}>
          <BookForm
            onSubmit={handleCreate}
            submitLabel="Create Book"
            loading={formLoading}
          />
        </Modal>
      )}

      {/* ── Edit Modal ── */}
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

      {/* ── View Detail Modal ── */}
      {viewTarget && (
        <Modal title="Book Details" onClose={() => setViewTarget(null)} maxWidth="max-w-lg">
          <div className="flex gap-4 mb-5">
            <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              {viewTarget.imageUrl ? (
                <img src={viewTarget.imageUrl} alt={viewTarget.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 text-center leading-tight">No Img</div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{viewTarget.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{viewTarget.author}</p>
              <span className="badge-blue badge inline-block mt-2 capitalize">{viewTarget.genre}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Copies</p>
              <p className="font-semibold text-slate-800">{viewTarget.totalCopies}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Available Copies</p>
              <p className={`font-semibold ${viewTarget.availableCopies > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{viewTarget.availableCopies}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">ISBN</p>
              <p className="font-semibold text-slate-800">{viewTarget.isbn || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Pages</p>
              <p className="font-semibold text-slate-800">{viewTarget.pages || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Publication Year</p>
              <p className="font-semibold text-slate-800">{viewTarget.publicationYear || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Language</p>
              <p className="font-semibold text-slate-800">{viewTarget.language || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Publisher</p>
              <p className="font-semibold text-slate-800">{viewTarget.publisher || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Edition</p>
              <p className="font-semibold text-slate-800">{viewTarget.edition || 'N/A'}</p>
            </div>
          </div>

          {viewTarget.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-1">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed">{viewTarget.description}</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => { setViewTarget(null); setEditTarget(viewTarget); setBanner({ type: '', text: '' }); }}
              className="btn-secondary flex-1"
            >
              Edit This Book
            </button>
            <button onClick={() => setViewTarget(null)} className="btn-primary flex-1">
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <Modal title="Delete Book" onClose={() => setDeleteTarget(null)} maxWidth="max-w-sm">
          <p className="text-sm text-slate-600 mb-5">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-800">"{deleteTarget.title}"</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="btn-secondary flex-1"
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              id="confirm-delete-btn"
              onClick={confirmDelete}
              className="btn-danger flex-1"
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Image Preview Modal ── */}
      {previewImage && (
        <Modal title="Cover Preview" onClose={() => setPreviewImage(null)} maxWidth="max-w-md">
          <div className="flex justify-center bg-slate-50 -mx-6 -my-5 p-6 rounded-b-2xl">
            <img src={previewImage} alt="Cover Preview" className="max-w-full max-h-[60vh] object-contain rounded shadow-sm border border-slate-200" />
          </div>
        </Modal>
      )}
    </div>
  );
}
