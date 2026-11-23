import mongoose from 'mongoose';
import { ACTIVE_STATUSES } from '../services/queueRules.js';

const queueEntrySchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    businessDate: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }],
    preferredBarber: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', default: null },
    assignedBarber: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', default: null },
    totalDuration: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    queuePosition: { type: Number, default: null },
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'IN_CHAIR', 'DONE', 'CANCELLED', 'NO_SHOW'],
      default: 'WAITING',
    },
    source: { type: String, enum: ['ONLINE', 'WALK_IN'], default: 'ONLINE' },
    joinedAt: { type: Date, default: Date.now },
    calledAt: { type: Date, default: null },
    serviceStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

queueEntrySchema.index({ businessDate: 1, status: 1, joinedAt: 1 });
queueEntrySchema.index({ businessDate: 1, token: 1 }, { unique: true });
queueEntrySchema.index(
  { customer: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ACTIVE_STATUSES } } }
);

export default mongoose.model('QueueEntry', queueEntrySchema);
