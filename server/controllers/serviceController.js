import { body } from 'express-validator';
import Service from '../models/Service.js';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';
import { broadcast } from '../socket/index.js';

export const serviceRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Service name is required'),
  body('nameGujarati').trim().isLength({ min: 1, max: 60 }).withMessage('Gujarati name is required'),
  body('description').optional().isLength({ max: 200 }),
  body('duration').isInt({ min: 5, max: 180 }).withMessage('Duration must be between 5 and 180 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('isActive').optional().isBoolean(),
];

export const list = asyncHandler(async (req, res) => {
  const filter = req.query.all === '1' ? {} : { isActive: true };
  const services = await Service.find(filter).sort({ name: 1 });
  res.json({ success: true, data: services });
});

export const create = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service, message: 'Service created' });
});

export const update = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!service) throw new AppError('Service not found', 404);
  res.json({ success: true, data: service, message: 'Service updated' });
});

export const remove = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!service) throw new AppError('Service not found', 404);
  broadcast('queue:updated', {});
  res.json({ success: true, data: service, message: 'Service deactivated' });
});
