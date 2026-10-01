const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Shift = require('../models/Shift');
const generateToken = require('../utils/generateToken');
const { ApiError, sendApiError } = require('../utils/apiError');
const { requireObjectBody, validateAccountFields } = require('../utils/accountValidation');

const MAX_PROFILE_IMAGE_BYTES = 1024 * 1024;
const googleClient = new OAuth2Client();

function publicProfile(user) {
  const profile = user.toObject();
  profile.hasPassword = Boolean(profile.password);
  profile.googleConnected = Boolean(profile.googleId);
  delete profile.password;
  delete profile.googleId;
  return profile;
}

function validateProfileImage(value) {
  if (value === null) return null;
  if (typeof value !== 'string') throw new ApiError(400, 'Profile image must be an image upload.');
  const match = value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw new ApiError(400, 'Use a JPEG, PNG, or WebP profile image.');
  if (Buffer.byteLength(match[2], 'base64') > MAX_PROFILE_IMAGE_BYTES) {
    throw new ApiError(400, 'Profile image must be 1 MB or smaller.');
  }
  return value;
}

function validateProfileUpdate(body) {
  requireObjectBody(body);
  const allowed = ['name', 'phone', 'profileImage'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    throw new ApiError(400, 'Only name, phone, and profileImage can be updated.');
  }
  const update = {};
  if (Object.hasOwn(body, 'name')) {
    if (typeof body.name !== 'string' || !body.name.trim()) throw new ApiError(400, 'Name is required.');
    update.name = body.name.trim();
  }
  if (Object.hasOwn(body, 'phone')) {
    if (typeof body.phone !== 'string') throw new ApiError(400, 'Phone must be a string.');
    update.phone = body.phone.trim();
  }
  if (Object.hasOwn(body, 'profileImage')) update.profileImage = validateProfileImage(body.profileImage);
  if (!Object.keys(update).length) throw new ApiError(400, 'Provide at least one profile field to update.');
  return update;
}

// @route   POST /api/auth/register
// @access  Public (commuter accounts only)
const registerUser = async (req, res) => {
  try {
    requireObjectBody(req.body);
    const { name, email, password, phone, role } = req.body;
    if (role !== undefined && role !== 'commuter') {
      throw new ApiError(400, 'Public registration is available for commuter accounts only.');
    }
    const fields = validateAccountFields({ name, email, password, ...(phone === undefined ? {} : { phone }) }, { create: true });
    if (await User.exists({ email: fields.email })) throw new ApiError(400, 'User already exists');
    const newUser = await User.create({ ...fields, role: 'commuter', assignedBus: null });
    const token = generateToken(newUser._id, newUser.role);
    res.status(201).json({ _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, token });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'User already exists' });
    sendApiError(res, error, 'Server error');
  }
};

// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    requireObjectBody(req.body);
    const { email, password } = req.body;
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      throw new ApiError(400, 'Please provide all required fields');
    }
    const foundUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (!foundUser) throw new ApiError(400, 'User not found');
    if (!(await foundUser.matchPassword(password))) throw new ApiError(400, 'Invalid credentials');
    const token = generateToken(foundUser._id, foundUser.role);
    res.status(200).json({ _id: foundUser._id, name: foundUser.name, email: foundUser.email, role: foundUser.role, token });
  } catch (error) {
    sendApiError(res, error, 'Server error');
  }
};

// @route   POST /api/auth/google
// @access  Public (verified Google identities can only enter commuter accounts)
const googleLogin = async (req, res) => {
  try {
    requireObjectBody(req.body);
    if (typeof req.body.credential !== 'string' || !req.body.credential) {
      throw new ApiError(400, 'A Google credential is required.');
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new ApiError(503, 'Google sign-in is not configured.');
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      throw new ApiError(401, 'Google could not verify this sign-in. Please try again.');
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new ApiError(401, 'A verified Google email address is required.');
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email });
      if (user && user.role !== 'commuter') {
        throw new ApiError(409, 'This Google email belongs to a driver or administrator account. Use email and password to sign in.');
      }
      if (user && user.googleId && user.googleId !== payload.sub) {
        throw new ApiError(409, 'This email is already connected to another Google account.');
      }
      if (user) {
        user.googleId = payload.sub;
        await user.save();
      } else {
        user = await User.create({ name: payload.name?.trim() || email.split('@')[0], email, googleId: payload.sub, role: 'commuter' });
      }
    }
    if (user.role !== 'commuter') {
      throw new ApiError(403, 'Google sign-in is available for commuter accounts only.');
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
  } catch (error) {
    sendApiError(res, error, 'Unable to complete Google sign-in.', 'This Google account is already connected to another passenger.');
  }
};

// @route   GET /api/auth/profile
// @access  Private (current authenticated user, without password)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(401, 'Not authorized, user no longer exists');
    const activeShift = user.role === 'driver'
      ? await Shift.findOne({ driver: user._id, status: 'active' })
        .populate('bus', 'busNumber status direction currentStopIndex route')
        .populate('route', 'routeName startPoint endPoint')
        .lean()
      : null;
    res.status(200).json({ ...publicProfile(user), activeShift });
  } catch (error) {
    sendApiError(res, error, 'Server error fetching profile');
  }
};

// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const update = validateProfileUpdate(req.body);
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(401, 'Not authorized, user no longer exists');
    Object.assign(user, update);
    await user.save();
    res.status(200).json(publicProfile(user));
  } catch (error) {
    sendApiError(res, error, 'Unable to update profile');
  }
};

// @route   PATCH /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    requireObjectBody(req.body);
    const { currentPassword, newPassword } = req.body;
    if (Object.keys(req.body).some((key) => !['currentPassword', 'newPassword'].includes(key))) {
      throw new ApiError(400, 'Only currentPassword and newPassword can be provided.');
    }
    if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new ApiError(400, 'Provide your current password and a new password with at least 6 characters.');
    }
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(401, 'Not authorized, user no longer exists');
    if (!user.password) throw new ApiError(400, 'This Google-only account does not have a password to change.');
    if (!(await user.matchPassword(currentPassword))) throw new ApiError(400, 'Your current password is incorrect.');
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    sendApiError(res, error, 'Unable to change password');
  }
};

module.exports = { registerUser, loginUser, googleLogin, getMe, updateProfile, changePassword };