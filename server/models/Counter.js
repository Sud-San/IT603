import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  businessDate: { type: String, unique: true, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
