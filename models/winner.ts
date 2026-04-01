import mongoose from 'mongoose';

const WinnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  prizeAmount: Number,
  network: String,
  notifiedAt: Date,
});

export default mongoose.models.Winner || mongoose.model('Winner', WinnerSchema);