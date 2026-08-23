const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getUsers, updateUser, deleteUser } = require('../controllers/userController');

const router = express.Router();

// All user routes are protected and restricted to admin only
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
