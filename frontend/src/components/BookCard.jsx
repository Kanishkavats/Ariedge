/**
 * BookCard — redesigned with Librix-inspired style:
 * Cover image on left, details on right, clean availability badge.
 */
export default function BookCard({ book, onBorrow, borrowing }) {
  const available = book.availableCopies > 0;

  return (
    <div className="card flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl">
      {/* Cover image */}
      <div className="w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden relative flex-shrink-0">
        {book.imageUrl ? (
          <img
            src={book.imageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-14 h-14 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.012 3C4.35 3 3 4.35 3 6.012v11.976C3 19.65 4.35 21 6.012 21H18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7V3H6.012ZM7 6h10v13H6.012A1.012 1.012 0 0 1 5 17.988V7.82A2.985 2.985 0 0 0 6.012 8H7V6ZM5 6.012C5 5.453 5.453 5 6.012 5H7v1H6.012A1.012 1.012 0 0 0 5 7.012V6.012Z"/>
            </svg>
          </div>
        )}
        {/* Availability badge overlay */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
          available
            ? 'bg-emerald-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {available ? `${book.availableCopies} available` : 'Unavailable'}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Genre chip */}
        <span className="badge-blue badge self-start capitalize">{book.genre}</span>

        {/* Title & author */}
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 text-sm">
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{book.author}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-auto">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {book.totalCopies} {book.totalCopies === 1 ? 'copy' : 'copies'} total
          </span>
          {onBorrow && (
            <button
              onClick={() => onBorrow(book)}
              disabled={!available || borrowing}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                available
                  ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {borrowing ? 'Borrowing…' : available ? 'Borrow' : 'Unavailable'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
