const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  lab:        { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  experiment: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' },
  date:       { type: Date, required: true, default: Date.now },
  semester:   { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
  markedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  records: [{
    student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:   { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'absent' },
    remarks:  { type: String },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
