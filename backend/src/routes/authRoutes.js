const express = require('express');
const router = express.Router();

const { registerUser, loginUser, googleLogin, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/profile', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, changePassword);

module.exports = router;