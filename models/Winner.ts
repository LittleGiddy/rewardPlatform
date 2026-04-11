import mongoose from 'mongoose';

const WinnerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  voucherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Voucher', 
    required: true 
  },
  prizeAmount: { 
    type: Number, 
    required: true 
  },
  network: { 
    type: String, 
    required: true 
  },
  voucherCode: { 
    type: String 
  },
  wonAt: { 
    type: Date, 
    default: Date.now 
  },
  notifiedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Add indexes for better query performance
WinnerSchema.index({ userId: 1 });
WinnerSchema.index({ wonAt: -1 });
WinnerSchema.index({ network: 1 });

const Winner = mongoose.models.Winner || mongoose.model('Winner', WinnerSchema);
export default Winner;
