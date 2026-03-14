const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const equipmentSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  code:         { type: String, unique: true, default: () => `EQ-${uuidv4().slice(0,8).toUpperCase()}` },
  barcode:      { type: String, unique: true, sparse: true },
  qrCode:       { type: String }, // base64 QR image
  category:     { type: String, enum: ['glassware','instrument','consumable','safety','other'], default: 'glassware' },
  lab:          { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' },
  description:  { type: String },
  manufacturer: { type: String },
  model:        { type: String },
  serialNumber: { type: String },
  purchaseDate: { type: Date },
  purchasePrice:{ type: Number },
  totalQuantity:  { type: Number, default: 1 },
  availableQuantity: { type: Number, default: 1 },
  condition:    { type: String, enum: ['good','fair','poor','damaged','maintenance'], default: 'good' },
  location:     { type: String },
  lastMaintenance: { type: Date },
  nextMaintenance: { type: Date },
  isActive:     { type: Boolean, default: true },
  notes:        { type: String },
  image:        { type: String },
  maintenanceHistory: [{
    date:     Date,
    type:     String,
    notes:    String,
    cost:     Number,
    doneBy:   String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
