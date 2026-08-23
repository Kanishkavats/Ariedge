const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Book = require('../models/Book');

// @route GET /api/books
// Supports pagination, search, and advanced filtering (availability, author, genre, year, language).
const getBooks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const { q, genre, availability, author, yearFrom, yearTo, language, sortBy } = req.query;

  const filter = {};
  
  if (genre) filter.genre = genre;
  if (author) filter.author = new RegExp(author.trim(), 'i');
  if (language) filter.language = language;

  if (yearFrom || yearTo) {
    filter.publicationYear = {};
    if (yearFrom) filter.publicationYear.$gte = parseInt(yearFrom, 10);
    if (yearTo) filter.publicationYear.$lte = parseInt(yearTo, 10);
  }

  if (availability === 'available') {
    filter.availableCopies = { $gt: 0 };
  } else if (availability === 'issued') {
    // Show books where at least 1 copy is currently borrowed out
    filter.$expr = { $lt: ['$availableCopies', '$totalCopies'] };
  }

  if (q) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ title: regex }, { author: regex }, { isbn: regex }];
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sortBy === 'newest') sortOption = { createdAt: -1 };
  else if (sortBy === 'oldest') sortOption = { createdAt: 1 };
  else if (sortBy === 'relevance' && q) sortOption = { score: { $meta: 'textScore' } };

  let query = Book.find(filter);
  if (sortBy === 'relevance' && q) {
    query = Book.find(filter, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
  } else {
    query = query.sort(sortOption);
  }

  const [books, total, genres, authors, languages] = await Promise.all([
    query.skip((page - 1) * limit).limit(limit),
    Book.countDocuments(filter),
    Book.distinct('genre'),
    Book.distinct('author'),
    Book.distinct('language'),
  ]);

  res.status(200).json({
    success: true,
    data: {
      books,
      genres,
      authors,
      languages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// @route GET /api/books/:id
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }
  res.status(200).json({ success: true, data: { book } });
});

// @route POST /api/books (admin only)
const createBook = asyncHandler(async (req, res) => {
  const { title, author, genre, totalCopies, isbn, pages, publicationYear, language, description, publisher, edition } = req.body;
  const imageUrl = req.file ? req.file.path : undefined;

  const book = await Book.create({
    title,
    author,
    genre,
    totalCopies,
    availableCopies: totalCopies,
    isbn,
    pages: pages ? parseInt(pages, 10) : undefined,
    publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
    language,
    description,
    publisher,
    edition,
    imageUrl,
  });

  res.status(201).json({ success: true, message: 'Book created', data: { book } });
});

// @route PUT /api/books/:id (admin only)
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  const { title, author, genre, totalCopies, isbn, pages, publicationYear, language, description, publisher, edition } = req.body;
  const alreadyBorrowed = book.totalCopies - book.availableCopies;

  if (totalCopies !== undefined) {
    if (totalCopies < alreadyBorrowed) {
      throw new ApiError(
        400,
        `Total copies cannot be less than the ${alreadyBorrowed} copies currently borrowed`
      );
    }
    book.availableCopies = totalCopies - alreadyBorrowed;
    book.totalCopies = totalCopies;
  }

  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (genre !== undefined) book.genre = genre;
  if (isbn !== undefined) book.isbn = isbn;
  if (pages !== undefined) book.pages = pages ? parseInt(pages, 10) : undefined;
  if (publicationYear !== undefined) book.publicationYear = publicationYear ? parseInt(publicationYear, 10) : undefined;
  if (language !== undefined) book.language = language;
  if (description !== undefined) book.description = description;
  if (publisher !== undefined) book.publisher = publisher;
  if (edition !== undefined) book.edition = edition;
  if (req.file) book.imageUrl = req.file.path;

  await book.save();

  res.status(200).json({ success: true, message: 'Book updated', data: { book } });
});

// @route DELETE /api/books/:id (admin only)
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  const Borrow = require('../models/Borrow');
  const activeBorrow = await Borrow.findOne({ book: book._id, status: 'borrowed' });
  if (activeBorrow) {
    throw new ApiError(400, 'Cannot delete a book that currently has active borrows');
  }

  await book.deleteOne();

  res.status(200).json({ success: true, message: 'Book deleted' });
});

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
