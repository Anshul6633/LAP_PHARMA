const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users
router.get('/', protect, authorize('admin', 'instructor'), async (req, res) => {
  const { role, semester, division, search } = req.query;
  let filter = {};
  // Instructors can only fetch students from this endpoint.
  if (req.user.role === 'instructor') {
    filter.role = 'student';
  } else if (role) {
    filter.role = role;
  }
  if (semester) filter.semester = semester;
  if (division) filter.division = String(division).toUpperCase();
  if (search) filter.name = { $regex: search, $options: 'i' };
  const users = await User.find(filter)
    .populate('assignedLabs', 'name code')
    .populate('assignedInstructor', 'name email division')
    .lean();
  res.json({ success: true, count: users.length, users });
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('assignedLabs')
    .populate('assignedInstructor', 'name email division');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

// PUT /api/users/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  if (req.body.assignedInstructor) {
    const instructor = await User.findById(req.body.assignedInstructor);
    if (!instructor || instructor.role !== 'instructor')
      return res.status(400).json({ success: false, message: 'Assigned instructor is invalid' });
    if (req.body.division && instructor.division && instructor.division !== String(req.body.division).toUpperCase())
      return res.status(400).json({ success: false, message: 'Instructor division does not match student division' });
  }

  if (req.body.division) req.body.division = String(req.body.division).toUpperCase();
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

// DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  if (req.user._id.toString() === req.params.id)
    return res.status(400).json({ success: false, message: 'You cannot remove your own account' });

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User removed successfully' });
});

// GET /api/users/stats/summary
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  const totalStudents   = await User.countDocuments({ role: 'student', isActive: true });
  const totalInstructors= await User.countDocuments({ role: 'instructor', isActive: true });
  const totalAdmins     = await User.countDocuments({ role: 'admin', isActive: true });
  res.json({ success: true, stats: { totalStudents, totalInstructors, totalAdmins } });
});

module.exports = router;
