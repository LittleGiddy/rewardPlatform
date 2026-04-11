import mongoose from 'mongoose';

const VoucherPoolSchema = new mongoose.Schema({
  network: { 
    type: String, 
    required: true,
    enum: ['Yas', 'Airtel', 'Vodacom', 'Halotel', 'MTN']
  },
  amount: { 
    type: Number, 
    required: true 
  },
  totalVouchers: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  remainingVouchers: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt timestamp before saving
VoucherPoolSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create the model
const VoucherPool = mongoose.models.VoucherPool || mongoose.model('VoucherPool', VoucherPoolSchema);

export default VoucherPool;