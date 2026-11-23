import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    salonName: { type: String, default: 'Aurelia Salon' },
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '21:00' },
    onlineQueueOpen: { type: Boolean, default: true },
    onlineQueueClosingMinutes: { type: Number, default: 30, min: 0, max: 180 },
    noShowGraceMinutes: { type: Number, default: 10, min: 1, max: 60 },
    supportedLanguages: { type: [String], default: ['en', 'gu'] },
  },
  { timestamps: true }
);

export default mongoose.model('SalonSettings', settingsSchema);
