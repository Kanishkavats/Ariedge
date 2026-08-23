const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: 150,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
      maxlength: 80,
    },
    isbn: {
      type: String,
      trim: true,
    },
    pages: {
      type: Number,
      min: 1,
    },
    publicationYear: {
      type: Number,
      set: (v) => (v === '' ? undefined : v),
    },
    language: {
      type: String,
      trim: true,
      set: (v) => (v === '' ? undefined : v),
    },
    description: {
      type: String,
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    edition: {
      type: String,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: [1, 'Total copies must be at least 1'],
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Supports catalog search by title/author and the genre filter.
// language_override:'none' prevents the MongoServerError 17262 (language field conflict).
bookSchema.index({ title: 'text', author: 'text' }, { language_override: 'none' });
bookSchema.index({ genre: 1 });

module.exports = mongoose.model('Book', bookSchema);
