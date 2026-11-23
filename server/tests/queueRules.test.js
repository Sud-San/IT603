import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransition,
  computePosition,
  estimateWaitingMinutes,
  evaluateAccess,
  formatToken,
  isEligibleForBarber,
  isValidPhone,
  selectNextCustomer,
} from '../services/queueRules.js';

test('status transitions follow the queue rules', () => {
  assert.equal(canTransition('WAITING', 'CALLED'), true);
  assert.equal(canTransition('WAITING', 'CANCELLED'), true);
  assert.equal(canTransition('CALLED', 'IN_CHAIR'), true);
  assert.equal(canTransition('CALLED', 'NO_SHOW'), true);
  assert.equal(canTransition('IN_CHAIR', 'DONE'), true);
  assert.equal(canTransition('DONE', 'WAITING'), false);
  assert.equal(canTransition('CALLED', 'CANCELLED'), false);
  assert.equal(canTransition('IN_CHAIR', 'CALLED'), false);
  assert.equal(canTransition('NO_SHOW', 'WAITING'), false);
});

test('daily tokens are zero padded and unique for a sequence', () => {
  const tokens = [1, 2, 3, 12, 100].map(formatToken);
  assert.deepEqual(tokens, ['S-001', 'S-002', 'S-003', 'S-012', 'S-100']);
  assert.equal(new Set(tokens).size, tokens.length);
});

test('phone numbers must be exactly 10 digits', () => {
  assert.equal(isValidPhone('9876501001'), true);
  assert.equal(isValidPhone('98765'), false);
  assert.equal(isValidPhone('98765010012'), false);
  assert.equal(isValidPhone('98765abc01'), false);
});

test('call next never assigns a customer to a barber they did not choose', () => {
  const waiting = [
    { _id: '1', status: 'WAITING', preferredBarber: 'ravi', joinedAt: '2026-11-18T04:00:00.000Z' },
    { _id: '2', status: 'WAITING', preferredBarber: null, joinedAt: '2026-11-18T04:05:00.000Z' },
    { _id: '3', status: 'WAITING', preferredBarber: 'amit', joinedAt: '2026-11-18T04:10:00.000Z' },
  ];
  assert.equal(selectNextCustomer(waiting, 'amit')._id, '2');
  assert.equal(selectNextCustomer(waiting, 'ravi')._id, '1');
  assert.equal(selectNextCustomer([waiting[0]], 'amit'), null);
  assert.equal(isEligibleForBarber(waiting[0], 'amit'), false);
  assert.equal(isEligibleForBarber(waiting[0], 'ravi'), true);
  assert.equal(isEligibleForBarber(waiting[1], 'amit'), true);
});

test('queue position counts only competing customers ahead', () => {
  const waiting = [
    { _id: '1', status: 'WAITING', preferredBarber: null, joinedAt: '2026-11-18T04:00:00.000Z' },
    { _id: '2', status: 'WAITING', preferredBarber: 'ravi', joinedAt: '2026-11-18T04:05:00.000Z' },
    { _id: '3', status: 'WAITING', preferredBarber: 'amit', joinedAt: '2026-11-18T04:10:00.000Z' },
  ];
  assert.equal(computePosition(waiting[2], waiting), 2);
  assert.equal(computePosition(waiting[1], waiting), 2);
  assert.equal(computePosition(waiting[0], waiting), 1);
});

test('waiting estimate respects preference, occupancy and breaks', () => {
  const now = new Date('2026-11-18T05:00:00.000Z');
  const barbers = [
    { _id: 'ravi', isActive: true, availability: 'AVAILABLE' },
    { _id: 'amit', isActive: true, availability: 'AVAILABLE' },
    { _id: 'imran', isActive: true, availability: 'ON_BREAK' },
  ];
  const active = [
    {
      _id: 'chair',
      status: 'IN_CHAIR',
      assignedBarber: 'ravi',
      totalDuration: 30,
      serviceStartedAt: new Date('2026-11-18T04:50:00.000Z'),
      joinedAt: '2026-11-18T04:00:00.000Z',
    },
    { _id: 'w1', status: 'WAITING', preferredBarber: null, totalDuration: 30, joinedAt: '2026-11-18T04:10:00.000Z' },
    { _id: 'w2', status: 'WAITING', preferredBarber: 'ravi', totalDuration: 45, joinedAt: '2026-11-18T04:20:00.000Z' },
  ];
  const entry = {
    _id: 'me',
    status: 'WAITING',
    preferredBarber: 'ravi',
    totalDuration: 30,
    joinedAt: '2026-11-18T04:30:00.000Z',
  };
  assert.equal(estimateWaitingMinutes({ entry, activeEntries: active, barbers, now }), 80);

  const anyEntry = {
    _id: 'any',
    status: 'WAITING',
    preferredBarber: null,
    joinedAt: '2026-11-18T04:40:00.000Z',
  };
  assert.equal(estimateWaitingMinutes({ entry: anyEntry, activeEntries: [...active, entry], barbers, now }), 63);
});

test('online queue closes before the salon and walk-in follows opening hours', () => {
  const settings = {
    openingTime: '09:00',
    closingTime: '21:00',
    onlineQueueOpen: true,
    onlineQueueClosingMinutes: 30,
  };
  const morning = evaluateAccess(settings, new Date('2026-11-18T04:30:00.000Z'));
  assert.equal(morning.salonOpen, true);
  assert.equal(morning.onlineOpen, true);

  const late = evaluateAccess(settings, new Date('2026-11-18T15:00:00.000Z'));
  assert.equal(late.salonOpen, true);
  assert.equal(late.onlineOpen, false);

  const night = evaluateAccess(settings, new Date('2026-11-17T20:30:00.000Z'));
  assert.equal(night.salonOpen, false);
  assert.equal(night.onlineOpen, false);

  const paused = evaluateAccess({ ...settings, onlineQueueOpen: false }, new Date('2026-11-18T04:30:00.000Z'));
  assert.equal(paused.salonOpen, true);
  assert.equal(paused.onlineOpen, false);
});
