const express = require('express');
const router = express.Router();
const Experiment = require('../models/Experiment');
const Lab = require('../models/Lab');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', protect, async (req, res) => {
  const { lab, semester, subject, category, search, approved } = req.query;
  let filter = {};
  if (lab)      filter.lab = lab;
  if (semester) filter.semester = semester;
  if (subject)  filter.subject = subject;
  if (category) filter.category = category;
  if (approved !== undefined) filter.isApproved = approved === 'true';
  if (search)   filter.$text = { $search: search };
  const experiments = await Experiment.find(filter)
    .populate('lab', 'name code')
    .populate('subject', 'name code')
    .populate('semester', 'number name')
    .populate('solutions', 'name formula concentration')
    .populate('createdBy', 'name')
    .sort({ experimentNo: 1 });
  res.json({ success: true, count: experiments.length, experiments });
});

router.get('/:id', protect, async (req, res) => {
  const exp = await Experiment.findById(req.params.id)
    .populate('lab', 'name code location')
    .populate('subject', 'name code')
    .populate('semester', 'number name')
    .populate('solutions')
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name');
  if (!exp) return res.status(404).json({ success: false, message: 'Experiment not found' });
  res.json({ success: true, experiment: exp });
});

router.post('/', protect, authorize('admin', 'instructor'), async (req, res) => {
  req.body.createdBy = req.user._id;
  const experiment = await Experiment.create(req.body);
  await Lab.findByIdAndUpdate(req.body.lab, { $addToSet: { experiments: experiment._id } });
  res.status(201).json({ success: true, experiment });
});

router.put('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
  const experiment = await Experiment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!experiment) return res.status(404).json({ success: false, message: 'Experiment not found' });
  res.json({ success: true, experiment });
});

router.put('/:id/approve', protect, authorize('admin', 'instructor'), async (req, res) => {
  const experiment = await Experiment.findByIdAndUpdate(
    req.params.id,
    { isApproved: true, approvedBy: req.user._id },
    { new: true }
  );
  if (!experiment) return res.status(404).json({ success: false, message: 'Experiment not found' });
  res.json({ success: true, experiment });
});

router.post('/:id/upload', protect, authorize('admin', 'instructor'), (req, res, next) => {
  req.uploadFolder = 'experiments';
  next();
}, upload.single('file'), async (req, res) => {
  const field = req.body.fileType === 'procedure' ? 'procedureFile' : 'labManualFile';
  const experiment = await Experiment.findByIdAndUpdate(req.params.id, { [field]: req.file.path }, { new: true });
  res.json({ success: true, filePath: req.file.path, experiment });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const exp = await Experiment.findByIdAndDelete(req.params.id);
  if (!exp) return res.status(404).json({ success: false, message: 'Experiment not found' });
  await Lab.findByIdAndUpdate(exp.lab, { $pull: { experiments: exp._id } });
  res.json({ success: true, message: 'Experiment deleted' });
});

module.exports = router;
