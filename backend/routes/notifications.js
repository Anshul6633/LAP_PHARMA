const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const q = { $or: [{ audience: 'all' }, { audience: req.user.role }, { recipients: req.user._id }] };
  const notifications = await Notification.find(q).sort({ createdAt: -1 }).limit(50).populate('createdBy', 'name');
  const unread = notifications.filter(n => !n.readBy.includes(req.user._id)).length;
  res.json({ success: true, count: notifications.length, unread, notifications });
});

router.post('/', protect, authorize('admin', 'instructor'), async (req, res) => {
  req.body.createdBy = req.user._id;
  const notification = await Notification.create(req.body);
  res.status(201).json({ success: true, notification });
});

router.put('/:id/read', protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } });
  res.json({ success: true, message: 'Marked as read' });
});

router.put('/read-all', protect, async (req, res) => {
  const q = { $or: [{ audience: 'all' }, { audience: req.user.role }, { recipients: req.user._id }] };
  await Notification.updateMany(q, { $addToSet: { readBy: req.user._id } });
  res.json({ success: true, message: 'All notifications marked as read' });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = router;
