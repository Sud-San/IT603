import mongoose from 'mongoose';

const historySchema = new mongoose.Schema(
  {
    queueEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'QueueEntry', required: true },
    barber: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalDuration: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    businessDate: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('ServiceHistory', historySchema);
