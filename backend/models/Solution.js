const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  formula:        { type: String },
  concentration:  { type: String }, // e.g. "0.1N", "1M"
  preparation:    { type: String, required: true },
  chemicals: [{
    name:     { type: String, required: true },
    quantity: { type: String, required: true },
    unit:     { type: String, default: 'g' },
  }],
  volume:         { type: String }, // e.g. "1000 mL"
  storageCondition: { type: String },
  shelfLife:      { type: String },
  hazardLevel:    { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  precautions:    { type: String },
  experiment:     { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' },
  lab:            { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stockAvailable: { type: Number, default: 0 },
  unit:           { type: String, default: 'mL' },
}, { timestamps: true });

module.exports = mongoose.model('Solution', solutionSchema);
