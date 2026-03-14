const express = require('express');
const router = express.Router();
const Solution = require('../models/Solution');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const { lab, experiment, hazardLevel, search } = req.query;
  let filter = {};
  if (lab)        filter.lab = lab;
  if (experiment) filter.experiment = experiment;
  if (hazardLevel) filter.hazardLevel = hazardLevel;
  if (search)     filter.name = { $regex: search, $options: 'i' };
  const solutions = await Solution.find(filter)
    .populate('experiment', 'name experimentNo')
    .populate('lab', 'name code')
    .populate('createdBy', 'name');
  res.json({ success: true, count: solutions.length, solutions });
});

router.get('/:id', protect, async (req, res) => {
  const solution = await Solution.findById(req.params.id)
    .populate('experiment', 'name experimentNo')
    .populate('lab', 'name code')
    .populate('createdBy', 'name');
  if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });
  res.json({ success: true, solution });
});

router.post('/', protect, authorize('admin', 'instructor'), async (req, res) => {
  req.body.createdBy = req.user._id;
  const solution = await Solution.create(req.body);
  res.status(201).json({ success: true, solution });
});

router.put('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
  const solution = await Solution.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });
  res.json({ success: true, solution });
});

// Update stock
router.patch('/:id/stock', protect, authorize('admin', 'instructor'), async (req, res) => {
  const { quantity, operation } = req.body;
  const solution = await Solution.findById(req.params.id);
  if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });
  if (operation === 'add')      solution.stockAvailable += Number(quantity);
  else if (operation === 'use') solution.stockAvailable = Math.max(0, solution.stockAvailable - Number(quantity));
  else                          solution.stockAvailable = Number(quantity);
  await solution.save();
  res.json({ success: true, solution });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  await Solution.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Solution deleted' });
});

module.exports = router;
