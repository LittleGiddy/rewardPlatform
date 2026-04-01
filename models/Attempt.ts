import mongoose from 'mongoose';

const AttemptSchema = new mongoose.Schema({
  userFingerprint: String,
  date: String, // YYYY-MM-DD
  count: { type: Number, default: 0 },
  lockUntil: Date,
});

export default mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);