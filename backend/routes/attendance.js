const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const { lab, experiment, date, student } = req.query;
  let filter = {};
  if (lab)        filter.lab = lab;
  if (experiment) filter.experiment = experiment;
  if (date) {
    const d = new Date(date);
    filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
  }
  if (student && student !== 'undefined') {
    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }
    filter['records.student'] = student;
  }
  const attendance = await Attendance.find(filter)
    .populate('lab', 'name code')
    .populate('experiment', 'name experimentNo')
    .populate('records.student', 'name rollNumber')
    .populate('markedBy', 'name')
    .sort({ date: -1 });
  res.json({ success: true, count: attendance.length, attendance });
});

// Student attendance summary
router.get('/student/:studentId', protect, async (req, res) => {
  const { studentId } = req.params;
  if (!studentId || studentId === 'undefined' || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: 'Invalid student id' });
  }
  const records = await Attendance.find({ 'records.student': studentId })
    .populate('lab', 'name code')
    .populate('experiment', 'name');
  const summary = records.map(r => {
    const rec = r.records.find(x => x.student.toString() === studentId);
    return { date: r.date, lab: r.lab, experiment: r.experiment, status: rec?.status };
  });
  const present = summary.filter(s => s.status === 'present' || s.status === 'late').length;
  res.json({ success: true, total: summary.length, present, percentage: summary.length ? ((present / summary.length) * 100).toFixed(1) : 0, records: summary });
});

router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  req.body.markedBy = req.user._id;
  const att = await Attendance.create(req.body);
  res.status(201).json({ success: true, attendance: att });
});

router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  const att = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!att) return res.status(404).json({ success: false, message: 'Attendance record not found' });
  res.json({ success: true, attendance: att });
});

module.exports = router;
