const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  label: String,
  time: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  village: { type: String, default: '' },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  adviceCount: { type: Number, default: 0 },
  schemesViewCount: { type: Number, default: 0 },
  loanChecksCount: { type: Number, default: 0 },
  activityLog: { type: [activitySchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
