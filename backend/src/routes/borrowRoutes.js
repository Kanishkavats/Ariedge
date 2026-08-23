const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  borrowBook,
  returnBook,
  getMyBorrows,
  getAllBorrows,
  getBorrowById,
  updateBorrow,
  deleteBorrow,
} = require('../controllers/borrowController');

const router = express.Router();

router.use(protect);

router.get('/my', getMyBorrows);

router.get('/', authorize('admin'), getAllBorrows);

router.post(
  '/',
  [body('bookId').isMongoId().withMessage('A valid bookId is required')],
  validate,
  borrowBook
);

router.patch('/:id/return', returnBook);

router.get('/:id', authorize('admin'), getBorrowById);

router.patch(
  '/:id',
  authorize('admin'),
  [
    body('dueAt').optional().isISO8601().withMessage('dueAt must be a valid date'),
    body('status').optional().isIn(['borrowed', 'returned']).withMessage('status must be borrowed or returned'),
  ],
  validate,
  updateBorrow
);

router.delete('/:id', authorize('admin'), deleteBorrow);

module.exports = router;
