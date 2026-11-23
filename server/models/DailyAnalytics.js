import mongoose from 'mongoose';

const serviceStatSchema = new mongoose.Schema(
  { name: String, count: Number, revenue: Number },
  { _id: false }
);

const barberStatSchema = new mongoose.Schema(
  { name: String, completed: Number, revenue: Number, avgServiceMinutes: Number },
  { _id: false }
);

const dailySchema = new mongoose.Schema({
  date: { type: String, unique: true, required: true },
  customersServed: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  avgWaitMinutes: { type: Number, default: 0 },
  avgServiceMinutes: { type: Number, default: 0 },
  noShows: { type: Number, default: 0 },
  cancelled: { type: Number, default: 0 },
  services: [serviceStatSchema],
  barbers: [barberStatSchema],
});

export default mongoose.model('DailyAnalytics', dailySchema);
