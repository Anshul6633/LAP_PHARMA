const express = require('express');
const router = express.Router();
const StudentRecord = require('../models/StudentRecord');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', protect, async (req, res) => {
  const { student, lab, experiment, semester, status } = req.query;
  let filter = {};
  if (student)    filter.student = student;
  if (lab)        filter.lab = lab;
  if (experiment) filter.experiment = experiment;
  if (semester)   filter.semester = semester;
  if (status)     filter.status = status;
  if (req.user.role === 'student') filter.student = req.user._id;
  const records = await StudentRecord.find(filter)
    .populate('student', 'name rollNumber')
    .populate('experiment', 'name experimentNo')
    .populate('lab', 'name code')
    .populate('evaluatedBy', 'name')
    .sort({ submittedAt: -1 });
  res.json({ success: true, count: records.length, records });
});

router.get('/:id', protect, async (req, res) => {
  const record = await StudentRecord.findById(req.params.id)
    .populate('student', 'name rollNumber email')
    .populate('experiment')
    .populate('lab', 'name code')
    .populate('evaluatedBy', 'name');
  if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
  res.json({ success: true, record });
});

router.post('/', protect, async (req, res) => {
  if (req.user.role === 'student') req.body.student = req.user._id;
  const record = await StudentRecord.create(req.body);
  res.status(201).json({ success: true, record });
});

router.put('/:id', protect, async (req, res) => {
  const record = await StudentRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
  res.json({ success: true, record });
});

router.put('/:id/evaluate', protect, authorize('instructor', 'admin'), async (req, res) => {
  const { marks, feedback, status } = req.body;
  const total = (marks.practical || 0) + (marks.viva || 0) + (marks.record || 0);
  const record = await StudentRecord.findByIdAndUpdate(
    req.params.id,
    { marks: { ...marks, total }, feedback, status: status || 'evaluated', evaluatedBy: req.user._id, evaluatedAt: new Date() },
    { new: true }
  ).populate('student', 'name rollNumber').populate('experiment', 'name');
  res.json({ success: true, record });
});

router.post('/:id/attachments', protect, (req, res, next) => {
  req.uploadFolder = 'records';
  next();
}, upload.array('files', 5), async (req, res) => {
  const paths = req.files.map(f => f.path);
  const record = await StudentRecord.findByIdAndUpdate(req.params.id, { $push: { attachments: { $each: paths } } }, { new: true });
  res.json({ success: true, record });
});

module.exports = router;
