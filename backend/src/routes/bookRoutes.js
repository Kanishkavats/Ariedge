const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const router = express.Router();

const bookValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('genre').trim().notEmpty().withMessage('Genre is required'),
  body('totalCopies')
    .isInt({ min: 1 })
    .withMessage('Total copies must be at least 1'),
];

// All book routes require a logged-in user; mutations require admin role.
router.use(protect);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  getBooks
);

router.get('/:id', getBookById);

router.post('/', authorize('admin'), upload.single('image'), bookValidation, validate, createBook);

router.put(
  '/:id',
  authorize('admin'),
  upload.single('image'),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
    body('genre').optional().trim().notEmpty().withMessage('Genre cannot be empty'),
    body('totalCopies')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Total copies must be at least 1'),
  ],
  validate,
  updateBook
);

router.delete('/:id', authorize('admin'), deleteBook);

module.exports = router;
