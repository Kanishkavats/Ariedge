const mongoose = require('mongoose');

const DUE_DAYS = 14;

const borrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    borrowedAt: {
      type: Date,
      default: Date.now,
    },
    dueAt: {
      type: Date,
      required: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned'],
      default: 'borrowed',
    },
  },
  { timestamps: true }
);

// Speeds up "my borrowed books" and "does this user already have this book" lookups.
borrowSchema.index({ user: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });

borrowSchema.statics.DUE_DAYS = DUE_DAYS;

module.exports = mongoose.model('Borrow', borrowSchema);
