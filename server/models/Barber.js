import mongoose from 'mongoose';

const barberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    profileImage: { type: String, default: '' },
    availability: { type: String, enum: ['AVAILABLE', 'ON_BREAK'], default: 'AVAILABLE' },
    isActive: { type: Boolean, default: true },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '20:00' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Barber', barberSchema);
