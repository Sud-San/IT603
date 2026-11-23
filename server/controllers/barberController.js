import { body } from 'express-validator';
import Barber from '../models/Barber.js';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';
import { assertBarberAccess } from '../middleware/auth.js';
import { completeService, getBarberCurrent, setAvailability, startService } from '../services/queueService.js';

export const barberRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Barber name is required'),
  body('availability').optional().isIn(['AVAILABLE', 'ON_BREAK']).withMessage('Invalid availability'),
  body('isActive').optional().isBoolean(),
  body('workingHours.start').optional().matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:mm'),
  body('workingHours.end').optional().matches(/^\d{2}:\d{2}$/).withMessage('End time must be HH:mm'),
  body('profileImage').optional().isString(),
];

export const list = asyncHandler(async (req, res) => {
  const filter = req.query.all === '1' ? {} : { isActive: true };
  const barbers = await Barber.find(filter).sort({ name: 1 });
  res.json({ success: true, data: barbers });
});

export const create = asyncHandler(async (req, res) => {
  if (req.body.profileImage && req.body.profileImage.length > 200000) {
    throw new AppError('Avatar image is too large');
  }
  const barber = await Barber.create(req.body);
  res.status(201).json({ success: true, data: barber, message: 'Barber added' });
});

export const update = asyncHandler(async (req, res) => {
  if (req.body.profileImage && req.body.profileImage.length > 200000) {
    throw new AppError('Avatar image is too large');
  }
  const barber = await Barber.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!barber) throw new AppError('Barber not found', 404);
  res.json({ success: true, data: barber, message: 'Barber updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const barber = await Barber.findByIdAndUpdate(req.params.id, { isActive: false, availability: 'ON_BREAK' }, { new: true });
  if (!barber) throw new AppError('Barber not found', 404);
  res.json({ success: true, data: barber, message: 'Barber deactivated' });
});

export const current = asyncHandler(async (req, res) => {
  if (req.user.role === 'BARBER') assertBarberAccess(req, req.params.id);
  res.json({ success: true, data: await getBarberCurrent(req.params.id) });
});

export const start = asyncHandler(async (req, res) => {
  assertBarberAccess(req, req.params.id);
  res.json({ success: true, data: await startService(req.params.id), message: 'Service started' });
});

export const complete = asyncHandler(async (req, res) => {
  assertBarberAccess(req, req.params.id);
  res.json({ success: true, data: await completeService(req.params.id), message: 'Service completed' });
});

export const availability = asyncHandler(async (req, res) => {
  assertBarberAccess(req, req.params.id);
  const barber = await setAvailability(req.params.id, req.body.availability);
  res.json({ success: true, data: barber, message: 'Availability updated' });
});
