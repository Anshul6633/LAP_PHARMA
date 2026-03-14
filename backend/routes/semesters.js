const express = require('express');
const router = express.Router();
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const semesters = await Semester.find().populate('subjects', 'name code').sort('number');
  res.json({ success: true, count: semesters.length, semesters });
});

router.get('/:id', protect, async (req, res) => {
  const semester = await Semester.findById(req.params.id).populate({ path: 'subjects', populate: { path: 'labs' } });
  if (!semester) return res.status(404).json({ success: false, message: 'Semester not found' });
  res.json({ success: true, semester });
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  const semester = await Semester.create(req.body);
  res.status(201).json({ success: true, semester });
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!semester) return res.status(404).json({ success: false, message: 'Semester not found' });
  res.json({ success: true, semester });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  await Semester.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Semester deleted' });
});

module.exports = router;
