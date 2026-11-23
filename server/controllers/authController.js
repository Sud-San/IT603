import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';

function sign(user) {
  return jwt.sign(
    { id: user._id, role: user.role, barberId: user.barberId || null },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function presentUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    barberId: user.barberId || null,
  };
}

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) throw new AppError('Invalid email or password', 401);
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid email or password', 401);

  const token = sign(user);
  res.json({
    success: true,
    data: {
      token,
      user: presentUser(user),
      tokenType: 'Bearer',
      expiresIn: '12h',
      issuedAt: new Date().toISOString(),
    },
    message: 'Logged in successfully',
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: presentUser(req.user) });
});
