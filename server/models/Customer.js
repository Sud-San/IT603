import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    phone: { type: String, required: true, unique: true, match: /^\d{10}$/ },
  },
  { timestamps: true }
);

export default mongoose.model('Customer', customerSchema);
