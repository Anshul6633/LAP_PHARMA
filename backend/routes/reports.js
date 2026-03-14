const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const StudentRecord = require('../models/StudentRecord');
const Attendance = require('../models/Attendance');
const Equipment = require('../models/Equipment');
const Solution = require('../models/Solution');
const User = require('../models/User');
const Experiment = require('../models/Experiment');
const Lab = require('../models/Lab');
const { protect, authorize } = require('../middleware/auth');

const xmlEscape = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

// Admin analytics dashboard
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
  const [totalStudents, totalInstructors, totalExperiments, totalLabs, totalEquipment] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'instructor', isActive: true }),
    Experiment.countDocuments(),
    Lab.countDocuments({ isActive: true }),
    Equipment.countDocuments({ isActive: true }),
  ]);
  const recentRecords = await StudentRecord.find().sort({ submittedAt: -1 }).limit(5)
    .populate('student', 'name rollNumber')
    .populate('experiment', 'name');
  const equipmentAlerts = await Equipment.find({ availableQuantity: { $lte: 2 }, isActive: true }).populate('lab', 'name');
  res.json({ success: true, analytics: { totalStudents, totalInstructors, totalExperiments, totalLabs, totalEquipment, recentRecords, equipmentAlerts } });
});

// Student lab report PDF
router.get('/student/:studentId/pdf', protect, async (req, res) => {
  const { studentId } = req.params;
  if (!studentId || studentId === 'undefined' || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: 'Invalid student id' });
  }
  const student = await User.findById(studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  const records = await StudentRecord.find({ student: studentId, status: 'evaluated' })
    .populate('experiment', 'name experimentNo')
    .populate('lab', 'name');
  const attendance = await Attendance.find({ 'records.student': studentId }).populate('lab', 'name');
  const present = attendance.filter(a => {
    const r = a.records.find(x => x.student?.toString() === studentId);
    return r?.status === 'present' || r?.status === 'late';
  }).length;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=lab_report_${student.name.replace(/\s+/g, '_')}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('PHARMACY LABORATORY MANAGEMENT SYSTEM', { align: 'center' });
  doc.fontSize(16).text('Student Lab Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica');
  doc.text(`Name: ${student.name}`);
  doc.text(`Roll Number: ${student.rollNumber || 'N/A'}`);
  doc.text(`Semester: ${student.semester || 'N/A'}`);
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  // Attendance
  doc.fontSize(14).font('Helvetica-Bold').text('Attendance Summary');
  doc.fontSize(12).font('Helvetica');
  doc.text(`Total Classes: ${attendance.length}`);
  doc.text(`Present: ${present}`);
  doc.text(`Percentage: ${attendance.length ? ((present / attendance.length) * 100).toFixed(1) : 0}%`);
  doc.moveDown();

  // Experiments
  doc.fontSize(14).font('Helvetica-Bold').text('Practical Records');
  doc.fontSize(12).font('Helvetica');
  let totalMarks = 0;
  records.forEach((rec, i) => {
    doc.text(`${i + 1}. ${rec.experiment?.name || 'N/A'} - ${rec.lab?.name || 'N/A'}`);
    doc.text(`   Marks: ${rec.marks?.total || 0}/20  |  Status: ${rec.status}`);
    totalMarks += rec.marks?.total || 0;
  });
  doc.moveDown();
  doc.fontSize(13).font('Helvetica-Bold').text(`Total Marks: ${totalMarks}/${records.length * 20}`);
  doc.end();
});

// Semester report
router.get('/semester/:semesterId', protect, authorize('admin', 'instructor'), async (req, res) => {
  const labs = await Lab.find({ semester: req.params.semesterId }).populate('experiments').populate('instructors', 'name');
  const studentCount = await User.countDocuments({ semester: req.params.semesterId, role: 'student' });
  res.json({ success: true, report: { labs, studentCount, experimentCount: labs.reduce((s, l) => s + l.experiments.length, 0) } });
});

// Available apparatus/equipment + solutions export (PDF/XML)
router.get('/inventory/export', protect, authorize('admin'), async (req, res) => {
  const format = String(req.query.format || 'pdf').toLowerCase();

  const [equipment, solutions] = await Promise.all([
    Equipment.find({ isActive: true, availableQuantity: { $gt: 0 } })
      .populate('lab', 'name')
      .sort({ name: 1 })
      .lean(),
    Solution.find({ stockAvailable: { $gt: 0 } })
      .populate('lab', 'name')
      .sort({ name: 1 })
      .lean(),
  ]);

  if (format === 'xml') {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<inventory generatedAt="${new Date().toISOString()}">\n  <availableEquipment count="${equipment.length}">\n${equipment.map((item) => `    <equipment>\n      <name>${xmlEscape(item.name)}</name>\n      <code>${xmlEscape(item.code || '')}</code>\n      <category>${xmlEscape(item.category || '')}</category>\n      <lab>${xmlEscape(item.lab?.name || '')}</lab>\n      <availableQuantity>${item.availableQuantity ?? 0}</availableQuantity>\n      <condition>${xmlEscape(item.condition || '')}</condition>\n      <location>${xmlEscape(item.location || '')}</location>\n    </equipment>`).join('\n')}\n  </availableEquipment>\n  <availableSolutions count="${solutions.length}">\n${solutions.map((item) => `    <solution>\n      <name>${xmlEscape(item.name)}</name>\n      <formula>${xmlEscape(item.formula || '')}</formula>\n      <concentration>${xmlEscape(item.concentration || '')}</concentration>\n      <lab>${xmlEscape(item.lab?.name || '')}</lab>\n      <stockAvailable>${item.stockAvailable ?? 0}</stockAvailable>\n      <unit>${xmlEscape(item.unit || '')}</unit>\n      <hazardLevel>${xmlEscape(item.hazardLevel || '')}</hazardLevel>\n    </solution>`).join('\n')}\n  </availableSolutions>\n</inventory>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=available_inventory_${Date.now()}.xml`);
    return res.send(xml);
  }

  if (format !== 'pdf') {
    return res.status(400).json({ success: false, message: 'Invalid format. Use pdf or xml.' });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=available_inventory_${Date.now()}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').text('JAIHIND COLLEGE OF PHARMACY', { align: 'center' });
  doc.fontSize(13).font('Helvetica').text('Available Apparatus/Equipment and Solutions Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.fillColor('black').moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text(`Available Apparatus/Equipment (${equipment.length})`);
  doc.moveDown(0.4);
  if (!equipment.length) {
    doc.fontSize(10).font('Helvetica').text('No available equipment found.');
  } else {
    equipment.forEach((item, index) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${item.name}`);
      doc.font('Helvetica').text(`Code: ${item.code || '-'} | Category: ${item.category || '-'} | Available: ${item.availableQuantity ?? 0}`);
      doc.text(`Lab: ${item.lab?.name || '-'} | Condition: ${item.condition || '-'} | Location: ${item.location || '-'}`);
      doc.moveDown(0.3);
      if (doc.y > 760) doc.addPage();
    });
  }

  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text(`Available Solutions (${solutions.length})`);
  doc.moveDown(0.4);
  if (!solutions.length) {
    doc.fontSize(10).font('Helvetica').text('No available solutions found.');
  } else {
    solutions.forEach((item, index) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${item.name}`);
      doc.font('Helvetica').text(`Formula: ${item.formula || '-'} | Concentration: ${item.concentration || '-'} | Stock: ${item.stockAvailable ?? 0} ${item.unit || ''}`);
      doc.text(`Lab: ${item.lab?.name || '-'} | Hazard: ${item.hazardLevel || '-'}`);
      doc.moveDown(0.3);
      if (doc.y > 760) doc.addPage();
    });
  }

  doc.end();
});

module.exports = router;
