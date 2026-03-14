const mongoose = require('mongoose');

const studentRecordSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  experiment:   { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
  lab:          { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  semester:     { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
  submittedAt:  { type: Date, default: Date.now },
  aim:          { type: String },
  procedure:    { type: String },
  observations: { type: String },
  result:       { type: String },
  conclusion:   { type: String },
  attachments:  [{ type: String }], // file paths
  marks: {
    practical:  { type: Number, default: 0, max: 10 },
    viva:       { type: Number, default: 0, max: 5 },
    record:     { type: Number, default: 0, max: 5 },
    total:      { type: Number, default: 0, max: 20 },
  },
  feedback:     { type: String },
  status:       { type: String, enum: ['draft','submitted','evaluated','approved'], default: 'draft' },
  evaluatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evaluatedAt:  { type: Date },
  isCompleted:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('StudentRecord', studentRecordSchema);
