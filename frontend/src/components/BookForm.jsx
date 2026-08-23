/**
 * BookForm — shared form used for both creating and editing a book.
 * Controlled component: receives initial values + onSubmit handler.
 */
import { useState } from 'react';
import Alert from './Alert';

const EMPTY = { title: '', author: '', genre: '', totalCopies: '', isbn: '', pages: '', publicationYear: '', language: '', description: '', publisher: '', edition: '' };

export default function BookForm({ initial = EMPTY, onSubmit, submitLabel = 'Save', loading }) {
  const [values, setValues] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [image, setImage] = useState(null);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!values.title.trim())  errs.title  = 'Title is required';
    if (!values.author.trim()) errs.author = 'Author is required';
    if (!values.genre.trim())  errs.genre  = 'Genre is required';
    const copies = Number(values.totalCopies);
    if (!values.totalCopies || isNaN(copies) || copies < 1)
      errs.totalCopies = 'Must be at least 1';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = await onSubmit({
      title: values.title.trim(),
      author: values.author.trim(),
      genre: values.genre.trim(),
      totalCopies: Number(values.totalCopies),
      isbn: values.isbn.trim(),
      pages: values.pages ? Number(values.pages) : undefined,
      publicationYear: values.publicationYear ? Number(values.publicationYear) : undefined,
      language: values.language.trim(),
      description: values.description.trim(),
      publisher: values.publisher.trim(),
      edition: values.edition.trim(),
      image,
    });

    if (result?.error) setApiError(result.error);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Alert type="error" message={apiError} />

      <div>
        <label className="form-label" htmlFor="book-title">Title</label>
        <input
          id="book-title"
          type="text"
          className="form-input"
          placeholder="e.g. The Great Gatsby"
          value={values.title}
          onChange={set('title')}
        />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div>
        <label className="form-label" htmlFor="book-author">Author</label>
        <input
          id="book-author"
          type="text"
          className="form-input"
          placeholder="e.g. F. Scott Fitzgerald"
          value={values.author}
          onChange={set('author')}
        />
        {errors.author && <p className="form-error">{errors.author}</p>}
      </div>

      <div>
        <label className="form-label" htmlFor="book-genre">Genre</label>
        <input
          id="book-genre"
          type="text"
          className="form-input"
          placeholder="e.g. Fiction"
          value={values.genre}
          onChange={set('genre')}
        />
        {errors.genre && <p className="form-error">{errors.genre}</p>}
      </div>

      <div>
        <label className="form-label" htmlFor="book-copies">Total Copies</label>
        <input
          id="book-copies"
          type="number"
          min="1"
          className="form-input"
          placeholder="e.g. 5"
          value={values.totalCopies}
          onChange={set('totalCopies')}
        />
        {errors.totalCopies && <p className="form-error">{errors.totalCopies}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label" htmlFor="book-isbn">ISBN (Optional)</label>
          <input
            id="book-isbn"
            type="text"
            className="form-input"
            placeholder="e.g. 9788131700075"
            value={values.isbn}
            onChange={set('isbn')}
          />
        </div>
        <div>
          <label className="form-label" htmlFor="book-pages">Pages (Optional)</label>
          <input
            id="book-pages"
            type="number"
            min="1"
            className="form-input"
            placeholder="e.g. 418"
            value={values.pages}
            onChange={set('pages')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label" htmlFor="book-pub-year">Publication Year (Optional)</label>
          <input
            id="book-pub-year"
            type="number"
            className="form-input"
            placeholder="e.g. 1995"
            value={values.publicationYear}
            onChange={set('publicationYear')}
          />
        </div>
        <div>
          <label className="form-label" htmlFor="book-language">Language (Optional)</label>
          <input
            id="book-language"
            type="text"
            className="form-input"
            placeholder="e.g. English"
            value={values.language}
            onChange={set('language')}
          />
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="book-description">Description (Optional)</label>
        <textarea
          id="book-description"
          rows={4}
          className="form-input resize-none"
          placeholder="Write a short description of the book..."
          value={values.description}
          onChange={set('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label" htmlFor="book-publisher">Publisher (Optional)</label>
          <input
            id="book-publisher"
            type="text"
            className="form-input"
            placeholder="e.g. Pearson"
            value={values.publisher}
            onChange={set('publisher')}
          />
        </div>
        <div>
          <label className="form-label" htmlFor="book-edition">Edition (Optional)</label>
          <input
            id="book-edition"
            type="text"
            className="form-input"
            placeholder="e.g. 1st Edition"
            value={values.edition}
            onChange={set('edition')}
          />
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="book-image">Cover Image (Optional)</label>
        {initial.imageUrl && (
          <div className="mb-2">
            <span className="block text-xs text-slate-500 mb-1">Current Image:</span>
            <img src={initial.imageUrl} alt="Current cover" className="w-16 h-24 object-cover rounded border border-slate-200" />
          </div>
        )}
        <input
          id="book-image"
          type="file"
          accept="image/*"
          className="form-input"
          onChange={(e) => { setImage(e.target.files[0]); setApiError(''); }}
        />
      </div>

      <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
