const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const QRCode = require('qrcode');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', protect, async (req, res) => {
  const { lab, category, condition, search } = req.query;
  let filter = {};
  if (lab)       filter.lab = lab;
  if (category)  filter.category = category;
  if (condition) filter.condition = condition;
  if (search)    filter.name = { $regex: search, $options: 'i' };
  const equipment = await Equipment.find(filter).populate('lab', 'name code').sort({ name: 1 });
  res.json({ success: true, count: equipment.length, equipment });
});

router.get('/low-stock', protect, authorize('admin', 'instructor'), async (req, res) => {
  const items = await Equipment.find({ availableQuantity: { $lte: 2 }, isActive: true }).populate('lab', 'name');
  res.json({ success: true, count: items.length, equipment: items });
});

router.get('/:id', protect, async (req, res) => {
  const item = await Equipment.findById(req.params.id).populate('lab', 'name code');
  if (!item) return res.status(404).json({ success: false, message: 'Equipment not found' });
  res.json({ success: true, equipment: item });
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  const equipment = new Equipment(req.body);
  // Generate QR code
  const qr = await QRCode.toDataURL(`PHARMA-EQ:${equipment.code}:${equipment._id}`);
  equipment.qrCode = qr;
  await equipment.save();
  res.status(201).json({ success: true, equipment });
});

router.put('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
  res.json({ success: true, equipment });
});

// Add maintenance record
router.post('/:id/maintenance', protect, authorize('admin', 'instructor'), async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
  equipment.maintenanceHistory.push(req.body);
  equipment.lastMaintenance = new Date();
  if (req.body.nextMaintenance) equipment.nextMaintenance = req.body.nextMaintenance;
  await equipment.save();
  res.json({ success: true, equipment });
});

// Update availability
router.patch('/:id/availability', protect, authorize('admin', 'instructor'), async (req, res) => {
  const equipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    { availableQuantity: req.body.availableQuantity, condition: req.body.condition },
    { new: true }
  );
  res.json({ success: true, equipment });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  await Equipment.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Equipment deleted' });
});

module.exports = router;
