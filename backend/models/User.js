import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  profilePicture: { type: String, default: 'default.jpg' },
  bio: { type: String, default: '' },
  theme: { type: String, default: 'light' },
  wallpaper: { type: String, default: 'default' },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  notifications: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true }
  },
  privacy: {
    lastSeen: { type: Boolean, default: true },
    profilePhoto: { type: String, enum: ['Everyone', 'My Contacts', 'Nobody'], default: 'Everyone' },
    readReceipts: { type: Boolean, default: true }
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
