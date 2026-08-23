const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @route POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Role defaults to 'member'; promote to admin manually in the DB for this POC.
  const user = await User.create({ name, email, password });
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user: user.toSafeObject(), token },
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user: user.toSafeObject(), token },
  });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user.toSafeObject() },
  });
});

// @route PATCH /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

// @route PATCH /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (name !== undefined && name.trim()) user.name = name.trim();

  if (email !== undefined && email.trim() && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }
    user.email = email.trim();
  }

  if (req.file) user.avatarUrl = req.file.path;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toSafeObject() },
  });
});

module.exports = { signup, login, getMe, changePassword, updateProfile };
