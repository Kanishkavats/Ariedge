const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Book = require('../models/Book');
const Borrow = require('../models/Borrow');

// @route POST /api/borrows  { bookId }
// Member borrows a book if a copy is available and they don't already hold it.
const borrowBook = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const userId = req.user._id;

  const existing = await Borrow.findOne({ user: userId, book: bookId, status: 'borrowed' });
  if (existing) {
    throw new ApiError(400, 'You already have this book borrowed');
  }

  // Atomic decrement guarded by availableCopies > 0 so two concurrent
  // requests can't both borrow the last remaining copy.
  const book = await Book.findOneAndUpdate(
    { _id: bookId, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );

  if (!book) {
    const exists = await Book.findById(bookId);
    if (!exists) throw new ApiError(404, 'Book not found');
    throw new ApiError(400, 'No copies available for this book');
  }

  const borrowedAt = new Date();
  const dueAt = new Date(borrowedAt);
  dueAt.setDate(dueAt.getDate() + Borrow.DUE_DAYS);

  const borrow = await Borrow.create({
    user: userId,
    book: bookId,
    borrowedAt,
    dueAt,
  });

  res.status(201).json({
    success: true,
    message: 'Book borrowed successfully',
    data: { borrow },
  });
});

// @route PATCH /api/borrows/:id/return
// Member returns a book they currently hold.
const returnBook = asyncHandler(async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);

  if (!borrow) {
    throw new ApiError(404, 'Borrow record not found');
  }
  if (borrow.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot return a book you did not borrow');
  }
  if (borrow.status === 'returned') {
    throw new ApiError(400, 'This book has already been returned');
  }

  borrow.status = 'returned';
  borrow.returnedAt = new Date();
  await borrow.save();

  await Book.findByIdAndUpdate(borrow.book, { $inc: { availableCopies: 1 } });

  res.status(200).json({
    success: true,
    message: 'Book returned successfully',
    data: { borrow },
  });
});

// @route GET /api/borrows/my
// Member's current + past borrow history, with a computed overdue flag.
const getMyBorrows = asyncHandler(async (req, res) => {
  const borrows = await Borrow.find({ user: req.user._id })
    .populate('book', 'title author genre')
    .sort({ createdAt: -1 });

  const now = new Date();
  const withStatus = borrows.map((b) => {
    const obj = b.toObject();
    obj.isOverdue = b.status === 'borrowed' && b.dueAt < now;
    return obj;
  });

  res.status(200).json({ success: true, data: { borrows: withStatus } });
});

// @route GET /api/borrows
// Admin views all borrowing activity across the system
const getAllBorrows = asyncHandler(async (req, res) => {
  const borrows = await Borrow.find()
    .populate('user', 'name email')
    .populate('book', 'title author genre')
    .sort({ createdAt: -1 });

  const now = new Date();
  const withStatus = borrows.map((b) => {
    const obj = b.toObject();
    obj.isOverdue = b.status === 'borrowed' && b.dueAt < now;
    return obj;
  });

  res.status(200).json({ success: true, data: { borrows: withStatus } });
});

// @route GET /api/borrows/:id (admin only)
const getBorrowById = asyncHandler(async (req, res) => {
  const borrow = await Borrow.findById(req.params.id)
    .populate('user', 'name email')
    .populate('book', 'title author genre');

  if (!borrow) {
    throw new ApiError(404, 'Borrow record not found');
  }

  const now = new Date();
  const obj = borrow.toObject();
  obj.isOverdue = borrow.status === 'borrowed' && borrow.dueAt < now;

  res.status(200).json({ success: true, data: { borrow: obj } });
});

// @route PATCH /api/borrows/:id (admin only)
// Lets an admin correct a due date or flip status (e.g. fix a mis-recorded
// return). Flipping status keeps the book's availableCopies consistent,
// same as the member-facing borrow/return endpoints do.
const updateBorrow = asyncHandler(async (req, res) => {
  const { dueAt, status } = req.body;

  const borrow = await Borrow.findById(req.params.id);
  if (!borrow) {
    throw new ApiError(404, 'Borrow record not found');
  }

  if (dueAt !== undefined) {
    borrow.dueAt = new Date(dueAt);
  }

  if (status !== undefined && status !== borrow.status) {
    if (status === 'returned') {
      borrow.status = 'returned';
      borrow.returnedAt = new Date();
      await Book.findByIdAndUpdate(borrow.book, { $inc: { availableCopies: 1 } });
    } else if (status === 'borrowed') {
      const book = await Book.findOneAndUpdate(
        { _id: borrow.book, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true }
      );
      if (!book) {
        throw new ApiError(400, 'Cannot mark as borrowed — no copies available for this book');
      }
      borrow.status = 'borrowed';
      borrow.returnedAt = null;
    }
  }

  await borrow.save();
  await borrow.populate([
    { path: 'user', select: 'name email' },
    { path: 'book', select: 'title author genre' },
  ]);

  res.status(200).json({ success: true, message: 'Borrow record updated', data: { borrow } });
});

// @route DELETE /api/borrows/:id (admin only)
// Deleting an active borrow releases its copy back to the catalog first,
// so availableCopies never gets stuck short a copy with no way to fix it.
const deleteBorrow = asyncHandler(async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);
  if (!borrow) {
    throw new ApiError(404, 'Borrow record not found');
  }

  if (borrow.status === 'borrowed') {
    await Book.findByIdAndUpdate(borrow.book, { $inc: { availableCopies: 1 } });
  }

  await borrow.deleteOne();

  res.status(200).json({ success: true, message: 'Borrow record deleted' });
});

module.exports = {
  borrowBook,
  returnBook,
  getMyBorrows,
  getAllBorrows,
  getBorrowById,
  updateBorrow,
  deleteBorrow,
};
