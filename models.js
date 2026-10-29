const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 3 },
  email: { type: String, unique: true, sparse: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  batch: { type: Number, required: true, min: [1987, 'Batch too early'], max: [2030, 'Batch too late'] },
  dept: { type: String, required: [true, 'Department is required'] },
  role: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, default: '' },
  photo: String,
  bio: { type: String, default: 'Proud Karunya alumnus, happy to connect and mentor.' },
  connections: { type: Number, default: 0 },
});

module.exports = { Alumni: mongoose.model('Alumni', alumniSchema) };
