const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },
  rollNumber: { type: String }, // for students
  semester:   { type: Number, min: 1, max: 8 }, // for students
  division:   { type: String, trim: true, uppercase: true },
  assignedInstructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for students
  phone:      { type: String },
  assignedLabs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }], // for instructors
  isActive:   { type: Boolean, default: true },
  avatar:     { type: String, default: '' },
  notifications: [{
    message: String,
    read:    { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
