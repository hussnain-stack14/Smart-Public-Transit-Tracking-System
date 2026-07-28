const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @route   POST /api/auth/register
// @desc    Create a new user (commuter, driver, or admin)
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Password gets hashed automatically by the pre-save hook in User model
    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'commuter',
    });

    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user and return a JWT
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await foundUser.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(foundUser._id, foundUser.role);

    res.status(200).json({
      _id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/auth/profile
// @desc    Get currently logged-in user's profile
// @access  Private (requires valid JWT)
const getMe = async (req, res) => {
  // req.user is attached by the `protect` middleware
  res.status(200).json(req.user);
};

module.exports = { registerUser, loginUser, getMe };