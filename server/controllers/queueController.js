import { body, param, query } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  callNext,
  callSpecific,
  cancelEntry,
  estimateJoin,
  getEntry,
  getPosition,
  joinQueue,
  listQueue,
  markNoShow,
  trackQueue,
} from '../services/queueService.js';

export const joinRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2 to 50 characters'),
  body('phone').matches(/^\d{10}$/).withMessage('Mobile number must be 10 digits'),
  body('serviceIds').isArray({ min: 1, max: 3 }).withMessage('Select 1 to 3 services'),
  body('preferredBarberId').optional({ nullable: true }).isString(),
];

export const estimate = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await estimateJoin({
      serviceIds: req.body.serviceIds || [],
      preferredBarberId: req.body.preferredBarberId || null,
    }),
  });
});

export const join = asyncHandler(async (req, res) => {
  const result = await joinQueue({ ...req.body, source: 'ONLINE' });
  res.status(result.alreadyActive ? 200 : 201).json({
    success: true,
    data: result.entry,
    alreadyActive: result.alreadyActive,
    message: result.alreadyActive ? 'An active token already exists for this number' : 'Joined the queue',
  });
});

export const walkIn = asyncHandler(async (req, res) => {
  const result = await joinQueue({ ...req.body, source: 'WALK_IN' });
  res.status(result.alreadyActive ? 200 : 201).json({
    success: true,
    data: result.entry,
    alreadyActive: result.alreadyActive,
    message: result.alreadyActive ? 'An active token already exists for this number' : 'Walk-in added',
  });
});

export const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listQueue() });
});

export const track = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await trackQueue(req.query.q) });
});

export const show = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getEntry(req.params.id) });
});

export const position = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPosition(req.params.id) });
});

export const callNextHandler = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'BARBER') {
    const { assertBarberAccess } = await import('../middleware/auth.js');
    assertBarberAccess(req, req.body.barberId);
  }
  const entry = await callNext(req.body.barberId);
  res.json({ success: true, data: entry, message: 'Customer called' });
});

export const callOne = asyncHandler(async (req, res) => {
  const entry = await callSpecific(req.params.id);
  res.json({ success: true, data: entry, message: 'Customer called' });
});

export const cancel = asyncHandler(async (req, res) => {
  const byStaff = Boolean(req.user);
  const entry = await cancelEntry(req.params.id, { byStaff });
  res.json({ success: true, data: entry, message: 'Queue entry cancelled' });
});

export const noShow = asyncHandler(async (req, res) => {
  const entry = await markNoShow(req.params.id);
  res.json({ success: true, data: entry, message: 'Marked as no-show' });
});

export const idRule = [param('id').isMongoId().withMessage('Invalid id')];
export const callRule = [body('barberId').isMongoId().withMessage('Select a barber')];
export const trackRule = [query('q').trim().notEmpty().withMessage('Enter a token or phone number')];
