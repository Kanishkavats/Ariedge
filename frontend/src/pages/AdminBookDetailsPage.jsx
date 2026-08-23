import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, User, Tag, Hash, FileText, Globe, Building, Layers, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const StarRating = ({ rating = 4.5 }) => {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.floor(rating) ? 'text-amber-400' : star - 0.5 <= rating ? 'text-amber-300' : 'text-slate-300 dark:text-slate-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-0.5">{rating}</span>
      <span className="text-sm text-slate-400">(12 reviews)</span>
    </div>
  );
};

const TABS = ['Overview', 'Details', 'Table of Contents', 'Reviews (0)'];

export default function AdminBookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/books/${id}`);
        setBook(res.data.data.book);
      } catch {
        navigate('/admin/search');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!book) return null;

  const issuedCopies = book.totalCopies - book.availableCopies;
  const isAvailable = book.availableCopies > 0;
  const description = book.description || 'No description available for this book.';
  const truncated = description.length > 200 && !showFullDesc
    ? description.slice(0, 200) + '...'
    : description;

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm mb-6 text-slate-500 dark:text-slate-400">
        <Link to="/admin/dashboard" className="hover:text-slate-700 dark:hover:text-slate-200">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/admin/search" className="hover:text-slate-700 dark:hover:text-slate-200">Search Books</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800 dark:text-white">Book Details</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ── Left / Main column ── */}
        <div className="flex-1 w-full flex flex-col gap-5">
          
          {/* Book Header Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Cover Image */}
              <div className="w-44 h-60 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md mx-auto sm:mx-0">
                {book.imageUrl ? (
                  <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex flex-col items-center justify-center gap-2">
                    <BookOpen className="w-10 h-10 text-indigo-400" />
                    <span className="text-xs text-slate-400 text-center px-2">No Cover</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-1">{book.title}</h1>
                {book.edition && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{book.edition} • Comprehensive Guide</p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{book.author}</span>
                </div>
                <StarRating />

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-5">
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span className="text-xs">Category</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{book.genre}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Hash className="w-3.5 h-3.5" />
                      <span className="text-xs">ISBN</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{book.isbn || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-xs">Pages</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{book.pages || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">Published</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{book.publicationYear || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="text-xs">Language</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{book.language || 'N/A'}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {truncated}{' '}
                    {description.length > 200 && (
                      <button
                        onClick={() => setShowFullDesc(v => !v)}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1"
                      >
                        {showFullDesc ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-4 flex gap-6 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'Overview' && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {tab}
                    </span>
                  )}
                  {tab !== 'Overview' && tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed min-h-[60px]">
              {activeTab === 'Overview' && (
                <p>{description}</p>
              )}
              {activeTab === 'Details' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    ['Title', book.title],
                    ['Author', book.author],
                    ['Genre', book.genre],
                    ['ISBN', book.isbn || 'N/A'],
                    ['Pages', book.pages || 'N/A'],
                    ['Publication Year', book.publicationYear || 'N/A'],
                    ['Language', book.language || 'N/A'],
                    ['Publisher', book.publisher || 'N/A'],
                    ['Edition', book.edition || 'N/A'],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{val}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'Table of Contents' && (
                <p className="italic text-slate-400">Table of contents not available for this book.</p>
              )}
              {activeTab === 'Reviews (0)' && (
                <p className="italic text-slate-400">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-5">
          
          {/* Availability Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Availability</h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isAvailable
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
              }`}>
                {isAvailable ? 'Available' : 'Issued'}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex justify-around text-center border border-slate-100 dark:border-slate-700 rounded-xl py-3 mb-5">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Copies</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{book.totalCopies}</p>
              </div>
              <div className="w-px bg-slate-100 dark:bg-slate-700" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Available</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{book.availableCopies}</p>
              </div>
              <div className="w-px bg-slate-100 dark:bg-slate-700" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Issued</p>
                <p className="text-2xl font-bold text-rose-500 dark:text-rose-400">{issuedCopies}</p>
              </div>
            </div>

            {/* Action buttons exactly like screenshot */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors mb-3 flex items-center justify-center gap-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Edit Book
            </button>
            <button className="w-full border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold py-2.5 rounded-xl text-sm transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 mb-2 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Add to Wishlist
            </button>
            <button className="w-full border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notify Me
            </button>
          </div>

          {/* Book Information Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Book Information</h2>
            <div className="flex flex-col gap-3.5">
              {[
                { icon: <Building className="w-4 h-4" />, label: 'Publisher', value: book.publisher || 'N/A' },
                { icon: <Layers className="w-4 h-4" />, label: 'Edition', value: book.edition || 'N/A' },
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  label: 'Publication Year',
                  value: book.publicationYear || 'N/A'
                },
                { icon: <Globe className="w-4 h-4" />, label: 'Language', value: book.language || 'N/A' },
                { icon: <FileText className="w-4 h-4" />, label: 'Pages', value: book.pages || 'N/A' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    {icon}
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
