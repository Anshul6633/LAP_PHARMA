const express = require('express');
const router = express.Router();
const Lab = require('../models/Lab');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', protect, async (req, res) => {
  const { semester, subject, instructor } = req.query;
  let filter = {};
  if (semester)   filter.semester = semester;
  if (subject)    filter.subject = subject;
  if (instructor) filter.instructors = instructor;

  // If instructor, only show assigned labs
  if (req.user.role === 'instructor') filter.instructors = req.user._id;

  const labs = await Lab.find(filter)
    .populate('subject', 'name code')
    .populate('semester', 'number name')
    .populate('instructors', 'name email')
    .populate('experiments', 'name experimentNo category');
  res.json({ success: true, count: labs.length, labs });
});

router.get('/:id', protect, async (req, res) => {
  const lab = await Lab.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('semester', 'number name')
    .populate('instructors', 'name email phone')
    .populate({ path: 'experiments', populate: { path: 'solutions', select: 'name formula concentration' } });
  if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });
  res.json({ success: true, lab });
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  const lab = await Lab.create(req.body);
  await Subject.findByIdAndUpdate(req.body.subject, { $addToSet: { labs: lab._id } });
  if (req.body.instructors) {
    await User.updateMany({ _id: { $in: req.body.instructors } }, { $addToSet: { assignedLabs: lab._id } });
  }
  res.status(201).json({ success: true, lab });
});

router.put('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
  const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });
  res.json({ success: true, lab });
});

router.post('/:id/manual', protect, authorize('admin', 'instructor'), (req, res, next) => {
  req.uploadFolder = 'manuals';
  next();
}, upload.single('manual'), async (req, res) => {
  const lab = await Lab.findByIdAndUpdate(req.params.id, { labManual: req.file.path }, { new: true });
  res.json({ success: true, message: 'Lab manual uploaded', filePath: req.file.path, lab });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const lab = await Lab.findByIdAndDelete(req.params.id);
  if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });
  await Subject.findByIdAndUpdate(lab.subject, { $pull: { labs: lab._id } });
  res.json({ success: true, message: 'Lab deleted' });
});

module.exports = router;
