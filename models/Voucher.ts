import mongoose from 'mongoose';

const VoucherSchema = new mongoose.Schema({
  network: String,
  amount: Number,
  status: { type: String, enum: ['available', 'locked', 'redeemed'], default: 'available' },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  redeemedAt: Date,
});

export default mongoose.models.Voucher || mongoose.model('Voucher', VoucherSchema);