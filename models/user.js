// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  balance: { type: Number, default: 1000 },
  isAdmin: { type: Boolean, default: false }, // New field for admin status
});

module.exports = mongoose.model("User", userSchema);
