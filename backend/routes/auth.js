const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, rollNumber, semester, division, assignedInstructor, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

  if (assignedInstructor) {
    const instructor = await User.findById(assignedInstructor);
    if (!instructor || instructor.role !== 'instructor')
      return res.status(400).json({ success: false, message: 'Assigned instructor is invalid' });
    if (division && instructor.division && instructor.division !== String(division).toUpperCase())
      return res.status(400).json({ success: false, message: 'Instructor division does not match student division' });
  }

  const user = await User.create({ name, email, password, role, rollNumber, semester, division, assignedInstructor, phone });
  const token = generateToken(user._id);
  res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const match = await user.matchPassword(password);
  if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const token = generateToken(user._id);
  res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, semester: user.semester } });
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('assignedLabs', 'name code')
    .populate('assignedInstructor', 'name email division');
  res.json({ success: true, user });
});

// PUT /api/auth/password
router.put('/password', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  const match = await user.matchPassword(req.body.currentPassword);
  if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

module.exports = router;
