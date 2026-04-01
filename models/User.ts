import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: false }, // optional
  network: { type: String, required: true },
  deviceFingerprint: { type: String, required: true },
  ipHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  currentVoucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  currentRevealedAmount: Number,
  lastAttemptAt: Date,
  lockUntil: Date,
  referralCode: { type: String, unique: true },
});

// Export the model, using existing if available (for Next.js hot reloading)
export default mongoose.models.User || mongoose.model('User', UserSchema);