const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users (members) with pagination and search
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';

  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // To match the UI, we might want to return all users or just members.
  // We'll return all users since the UI shows role as well.
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-password'); // Exclude password from the query

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  });
});

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { role, name, email } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  
  await user.save();
  
  res.status(200).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Optional: check if user has active borrows before allowing deletion
  // This is a POC so we'll just delete them for now.
  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getUsers,
  updateUser,
  deleteUser
};
