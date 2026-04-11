import mongoose from 'mongoose';

const VoucherSchema = new mongoose.Schema({
  network: { 
    type: String, 
    required: true,
    enum: ['Yas', 'Airtel', 'Vodacom', 'Halotel', 'MTN']
  },
  amount: { type: Number, required: true },
  voucherCode: { 
    type: String, 
    unique: true, 
    sparse: true,
    index: { unique: true, sparse: true, name: 'voucher_code_idx' } // Custom index name
  },
  status: { 
    type: String, 
    enum: ['available', 'locked', 'redeemed', 'expired'], 
    default: 'available' 
  },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  redeemedAt: Date,
});

// Remove the pre-save hook that might be causing issues
// Generate voucher code before saving (only for new available vouchers)
VoucherSchema.pre('save', async function(next) {
  // Only generate code if it's a new document, status is available, and no code exists
  if (this.isNew && this.status === 'available' && !this.voucherCode) {
    const networkCode = this.network.substring(0, 3).toUpperCase();
    const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.voucherCode = `${networkCode}-${random1}-${random2}`;
    
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

// Ensure indexes are created properly
VoucherSchema.index({ voucherCode: 1 }, { unique: true, sparse: true, name: 'voucher_code_idx' });
VoucherSchema.index({ network: 1, status: 1 });
VoucherSchema.index({ createdAt: -1 });

const Voucher = mongoose.models.Voucher || mongoose.model('Voucher', VoucherSchema);
export default Voucher;