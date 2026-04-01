
import mongoose from 'mongoose';

const ScratchEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  revealedAmount: Number,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.ScratchEvent || mongoose.model('ScratchEvent', ScratchEventSchema);