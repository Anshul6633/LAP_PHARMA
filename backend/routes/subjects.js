const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Semester = require('../models/Semester');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const { semester } = req.query;
  const filter = semester ? { semester } : {};
  const subjects = await Subject.find(filter).populate('semester', 'number name').populate('labs', 'name code');
  res.json({ success: true, count: subjects.length, subjects });
});

router.get('/:id', protect, async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('semester', 'number name')
    .populate({ path: 'labs', populate: { path: 'experiments', select: 'name experimentNo category' } });
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
  res.json({ success: true, subject });
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  const subject = await Subject.create(req.body);
  await Semester.findByIdAndUpdate(req.body.semester, { $addToSet: { subjects: subject._id } });
  res.status(201).json({ success: true, subject });
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
  res.json({ success: true, subject });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
  await Semester.findByIdAndUpdate(subject.semester, { $pull: { subjects: subject._id } });
  res.json({ success: true, message: 'Subject deleted' });
});

module.exports = router;
