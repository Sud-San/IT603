import jwt from 'jsonwebtoken';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required', 401);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user || !user.isActive) throw new AppError('Account is not active', 401);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired token', 401);
  }
});

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission for this action', 403));
    }
    next();
  };
}

export function assertBarberAccess(req, barberId) {
  if (req.user.role === 'ADMIN') return;
  if (req.user.role === 'BARBER' && String(req.user.barberId) === String(barberId)) return;
  throw new AppError('You can manage only your own chair', 403);
}
