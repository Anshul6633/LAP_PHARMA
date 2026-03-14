const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  type:       { type: String, enum: ['info','warning','success','error'], default: 'info' },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  link:       { type: String },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  audience:   { type: String, enum: ['all','admin','instructor','student','specific'], default: 'all' },
  expiresAt:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
