const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, unique: true },
  subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  semester:    { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  description: { type: String },
  location:    { type: String }, // room number / building
  capacity:    { type: Number, default: 30 },
  instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  experiments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' }],
  labManual:   { type: String }, // file path
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Lab', labSchema);
