import { Router } from 'express';
import { body } from 'express-validator';
import { login, me } from '../controllers/authController.js';
import * as queue from '../controllers/queueController.js';
import * as services from '../controllers/serviceController.js';
import * as barbers from '../controllers/barberController.js';
import * as admin from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { ok: true, service: 'salon-queue' } });
});

router.post('/auth/login', [body('email').isEmail().withMessage('Enter a valid email'), body('password').notEmpty()], validate, login);
router.get('/auth/me', protect, me);

router.get('/public/home', admin.home);
router.get('/public/board', admin.board);

router.get('/services', services.list);
router.post('/services', protect, authorize('ADMIN'), services.serviceRules, validate, services.create);
router.put('/services/:id', protect, authorize('ADMIN'), services.serviceRules, validate, services.update);
router.delete('/services/:id', protect, authorize('ADMIN'), services.remove);

router.get('/barbers', barbers.list);
router.post('/barbers', protect, authorize('ADMIN'), barbers.barberRules, validate, barbers.create);
router.put('/barbers/:id', protect, authorize('ADMIN'), barbers.update);
router.delete('/barbers/:id', protect, authorize('ADMIN'), barbers.remove);
router.get('/barbers/:id/current', protect, authorize('ADMIN', 'BARBER', 'RECEPTIONIST'), barbers.current);
router.put('/barbers/:id/start', protect, authorize('ADMIN', 'BARBER'), barbers.start);
router.put('/barbers/:id/complete', protect, authorize('ADMIN', 'BARBER'), barbers.complete);
router.put(
  '/barbers/:id/availability',
  protect,
  authorize('ADMIN', 'BARBER'),
  [body('availability').isIn(['AVAILABLE', 'ON_BREAK']).withMessage('Invalid availability')],
  validate,
  barbers.availability
);

router.post('/customers', protect, authorize('ADMIN', 'RECEPTIONIST'), admin.createCustomer);
router.get('/customers/:id', protect, authorize('ADMIN', 'RECEPTIONIST'), admin.showCustomer);

router.post('/queue/estimate', queue.estimate);
router.post('/queue/join', queue.joinRules, validate, queue.join);
router.post('/queue/walk-in', protect, authorize('ADMIN', 'RECEPTIONIST'), queue.joinRules, validate, queue.walkIn);
router.get('/queue/track', queue.trackRule, validate, queue.track);
router.get('/queue', protect, authorize('ADMIN', 'RECEPTIONIST', 'BARBER'), queue.list);
router.post('/queue/call-next', protect, authorize('ADMIN', 'RECEPTIONIST', 'BARBER'), queue.callRule, validate, queue.callNextHandler);
router.get('/queue/:id/position', queue.idRule, validate, queue.position);
router.get('/queue/:id', queue.idRule, validate, queue.show);
router.put('/queue/:id/cancel', queue.idRule, validate, queue.cancel);
router.put('/queue/:id/no-show', protect, authorize('ADMIN', 'RECEPTIONIST', 'BARBER'), queue.idRule, validate, queue.noShow);
router.post('/queue/:id/call', protect, authorize('ADMIN', 'RECEPTIONIST'), queue.idRule, validate, queue.callOne);

router.get('/admin/dashboard', protect, authorize('ADMIN', 'RECEPTIONIST'), admin.dashboard);
router.get('/admin/analytics', protect, authorize('ADMIN'), admin.analytics);
router.get('/admin/settings', admin.settings);
router.put('/admin/settings', protect, authorize('ADMIN'), admin.settingsRules, validate, admin.updateSettings);

export default router;
