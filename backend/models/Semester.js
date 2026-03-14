const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  number:      { type: Number, required: true, unique: true, min: 1, max: 8 },
  name:        { type: String, required: true }, // e.g. "Semester 1"
  year:        { type: Number, required: true }, // academic year
  description: { type: String },
  startDate:   { type: Date },
  endDate:     { type: Date },
  isActive:    { type: Boolean, default: true },
  subjects:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
}, { timestamps: true });

module.exports = mongoose.model('Semester', semesterSchema);
