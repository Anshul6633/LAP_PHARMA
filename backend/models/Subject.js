const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, unique: true },
  semester:    { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  description: { type: String },
  credits:     { type: Number, default: 2 },
  hasLab:      { type: Boolean, default: true },
  labs:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }],
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
