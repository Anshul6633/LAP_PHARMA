const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  experimentNo: { type: String },
  objective:    { type: String, required: true },
  theory:       { type: String },
  lab:          { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  subject:      { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  semester:     { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
  requiredChemicals: [{
    name:     String,
    quantity: String,
    unit:     String,
  }],
  solutions:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Solution' }],
  apparatus: [{
    name:        String,
    quantity:    String,
    description: String,
  }],
  procedure:      { type: String, required: true },
  observations:   { type: String },
  result:         { type: String },
  precautions:    { type: String },
  viva: [{
    question: String,
    answer:   String,
  }],
  references:     [{ type: String }],
  labManualFile:  { type: String },
  procedureFile:  { type: String },
  duration:       { type: Number, default: 3 }, // hours
  difficulty:     { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  category:       { type: String }, // e.g. Pharmaceutical Chemistry, Pharmacognosy
  isApproved:     { type: Boolean, default: false },
  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:           [{ type: String }],
}, { timestamps: true });

experimentSchema.index({ name: 'text', objective: 'text', category: 'text' });

module.exports = mongoose.model('Experiment', experimentSchema);
