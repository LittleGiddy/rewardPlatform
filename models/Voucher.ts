import mongoose from 'mongoose';

const VoucherSchema = new mongoose.Schema({
  network: { type: String, required: true },
  amount: { type: Number, required: true },
  voucherCode: { type: String, unique: true, sparse: true }, // Actual voucher code for redemption
  status: { 
    type: String, 
    enum: ['available', 'locked', 'redeemed', 'expired'], 
    default: 'available' 
  },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date }, // Voucher expiry date
  createdAt: { type: Date, default: Date.now },
  redeemedAt: Date,
});

// Generate a unique voucher code before saving
VoucherSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'available' && !this.voucherCode) {
    // Generate a formatted voucher code: NETWORK-XXXX-XXXX
    const networkCode = this.network.substring(0, 3).toUpperCase();
    const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.voucherCode = `${networkCode}-${random1}-${random2}`;
    
    // Set expiry to 30 days from now
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

export default mongoose.models.Voucher || mongoose.model('Voucher', VoucherSchema);