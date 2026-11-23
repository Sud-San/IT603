import { body } from 'express-validator';
import Customer from '../models/Customer.js';
import SalonSettings from '../models/SalonSettings.js';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';
import { getAnalytics, getDashboard, getHome, getSettings } from '../services/queueService.js';
import { broadcast } from '../socket/index.js';
import { parseHHMM } from '../utils/time.js';

export const showCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new AppError('Customer not found', 404);
  res.json({ success: true, data: customer });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  if (name.length < 2) throw new AppError('Name is required');
  if (!/^\d{10}$/.test(phone)) throw new AppError('Mobile number must be 10 digits');
  const existing = await Customer.findOne({ phone });
  if (existing) return res.json({ success: true, data: existing, message: 'Customer already exists' });
  const customer = await Customer.create({ name, phone });
  res.status(201).json({ success: true, data: customer });
});

export const home = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getHome() });
});

export const board = asyncHandler(async (req, res) => {
  const { getBoard } = await import('../services/queueService.js');
  res.json({ success: true, data: await getBoard() });
});

export const dashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getDashboard() });
});

export const analytics = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getAnalytics() });
});

export const settings = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getSettings() });
});

export const settingsRules = [
  body('salonName').optional().trim().isLength({ min: 2, max: 80 }),
  body('openingTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('Opening time must be HH:mm'),
  body('closingTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('Closing time must be HH:mm'),
  body('onlineQueueOpen').optional().isBoolean(),
  body('onlineQueueClosingMinutes').optional().isInt({ min: 0, max: 180 }),
  body('noShowGraceMinutes').optional().isInt({ min: 1, max: 60 }),
];

export const updateSettings = asyncHandler(async (req, res) => {
  if (req.body.openingTime && req.body.closingTime) {
    const open = parseHHMM(req.body.openingTime);
    const close = parseHHMM(req.body.closingTime);
    if (open == null || close == null || close <= open) throw new AppError('Closing time must be after opening time');
  }
  const current = await getSettings();
  Object.assign(current, req.body);
  await current.save();
  broadcast('salon:settings-updated', {});
  res.json({ success: true, data: current, message: 'Settings saved' });
});

export { SalonSettings };
