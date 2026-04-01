import mongoose from 'mongoose';

const ClickSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false }, // for dwell time verification
});

const ShareLinkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, unique: true },
  clicks: [ClickSchema],
  verifiedAt: Date,
});

export default mongoose.models.ShareLink || mongoose.model('ShareLink', ShareLinkSchema);