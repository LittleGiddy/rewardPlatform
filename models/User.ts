import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: false },
  network: { type: String, required: true },
  deviceFingerprint: { type: String, required: true },
  ipHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  currentVoucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  currentRevealedAmount: Number,
  lastAttemptAt: Date,
  lockUntil: Date,
  referralCode: { type: String, unique: true },
  consecutiveLosses: { type: Number, default: 0 }, // Track losses for streak bonus
  totalWins: { type: Number, default: 0 },
  totalAttempts: { type: Number, default: 0 },
  lastWinAt: { type: Date, default: null }, // Add this field
});

export default mongoose.models.User || mongoose.model('User', UserSchema);