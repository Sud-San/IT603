import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import Barber from '../models/Barber.js';
import QueueEntry from '../models/QueueEntry.js';
import Counter from '../models/Counter.js';
import SalonSettings from '../models/SalonSettings.js';
import ServiceHistory from '../models/ServiceHistory.js';
import {
  callNext,
  cancelEntry,
  completeService,
  joinQueue,
  markNoShow,
  setAvailability,
  startService,
} from '../services/queueService.js';

const NOW = new Date('2026-11-18T04:30:00.000Z');

async function reset() {
  await Promise.all([
    Customer.deleteMany({}),
    Service.deleteMany({}),
    Barber.deleteMany({}),
    QueueEntry.deleteMany({}),
    Counter.deleteMany({}),
    SalonSettings.deleteMany({}),
    ServiceHistory.deleteMany({}),
  ]);
  await SalonSettings.create({
    salonName: 'Test Salon',
    openingTime: '00:00',
    closingTime: '23:59',
    onlineQueueOpen: true,
    onlineQueueClosingMinutes: 0,
    noShowGraceMinutes: 10,
  });
}

async function fixtures() {
  const haircut = await Service.create({
    name: 'Haircut',
    nameGujarati: 'વાળ કાપવા',
    description: 'Cut',
    duration: 30,
    price: 150,
  });
  const beard = await Service.create({
    name: 'Beard Trim',
    nameGujarati: 'દાઢી',
    description: 'Beard',
    duration: 15,
    price: 80,
  });
  const ravi = await Barber.create({ name: 'Ravi', availability: 'AVAILABLE', isActive: true });
  const amit = await Barber.create({ name: 'Amit', availability: 'AVAILABLE', isActive: true });
  return { haircut, beard, ravi, amit };
}

describe('queue integration', { concurrency: false }, () => {
before(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/salon_queue_test');
  await mongoose.connection.dropDatabase();
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('customer joins with multiple services and correct totals', async () => {
  await reset();
  const { haircut, beard, ravi } = await fixtures();
  const result = await joinQueue(
    {
      name: 'Aarav Mehta',
      phone: '9000000001',
      serviceIds: [String(haircut._id), String(beard._id)],
      preferredBarberId: String(ravi._id),
      source: 'ONLINE',
    },
    { now: NOW }
  );
  assert.equal(result.alreadyActive, false);
  assert.equal(result.entry.token, 'S-001');
  assert.equal(result.entry.totalDuration, 45);
  assert.equal(result.entry.totalPrice, 230);
  assert.equal(result.entry.status, 'WAITING');
  assert.equal(result.entry.services.length, 2);
  assert.equal(result.entry.queuePosition, 1);
});

test('invalid phone and duplicate active phone are rejected', async () => {
  await reset();
  const { haircut } = await fixtures();
  await assert.rejects(
    () => joinQueue({ name: 'Diya Shah', phone: '12345', serviceIds: [String(haircut._id)], source: 'ONLINE' }, { now: NOW }),
    /10-digit/
  );
  const first = await joinQueue(
    { name: 'Diya Shah', phone: '9000000002', serviceIds: [String(haircut._id)], source: 'ONLINE' },
    { now: NOW }
  );
  const second = await joinQueue(
    { name: 'Diya Shah', phone: '9000000002', serviceIds: [String(haircut._id)], source: 'ONLINE' },
    { now: new Date(NOW.getTime() + 60000) }
  );
  assert.equal(second.alreadyActive, true);
  assert.equal(String(second.entry.id), String(first.entry.id));
  assert.equal(await QueueEntry.countDocuments({ status: 'WAITING' }), 1);
});

test('simultaneous joins receive unique tokens', async () => {
  await reset();
  const { haircut } = await fixtures();
  const results = await Promise.all(
    [1, 2, 3, 4, 5].map((n) =>
      joinQueue(
        { name: `Guest ${n}`, phone: `900000001${n}`, serviceIds: [String(haircut._id)], source: 'ONLINE' },
        { now: new Date(NOW.getTime() + n * 1000) }
      )
    )
  );
  const tokens = results.map((result) => result.entry.token);
  assert.equal(new Set(tokens).size, 5);
  assert.deepEqual([...tokens].sort(), ['S-001', 'S-002', 'S-003', 'S-004', 'S-005']);
});

test('call next respects barber preference and a single active customer', async () => {
  await reset();
  const { haircut, ravi, amit } = await fixtures();
  const raviCustomer = await joinQueue(
    { name: 'Ravi Guest', phone: '9000000021', serviceIds: [String(haircut._id)], preferredBarberId: String(ravi._id), source: 'ONLINE' },
    { now: NOW }
  );
  const anyCustomer = await joinQueue(
    { name: 'Any Guest', phone: '9000000022', serviceIds: [String(haircut._id)], source: 'ONLINE' },
    { now: new Date(NOW.getTime() + 60000) }
  );
  const called = await callNext(amit._id);
  assert.equal(called.token, anyCustomer.entry.token);
  assert.notEqual(called.token, raviCustomer.entry.token);
  assert.equal(called.assignedBarber.name, 'Amit');
  await assert.rejects(() => callNext(amit._id), /already has an active customer/);
  const raviCalled = await callNext(ravi._id);
  assert.equal(raviCalled.token, raviCustomer.entry.token);
  await assert.rejects(() => callNext(ravi._id), /already has an active customer/);
});

test('start, complete, no-show, cancel and break follow allocation rules', async () => {
  await reset();
  const { haircut, ravi, amit } = await fixtures();
  const first = await joinQueue(
    { name: 'First', phone: '9000000031', serviceIds: [String(haircut._id)], preferredBarberId: String(ravi._id), source: 'ONLINE' },
    { now: NOW }
  );
  const second = await joinQueue(
    { name: 'Second', phone: '9000000032', serviceIds: [String(haircut._id)], preferredBarberId: String(ravi._id), source: 'ONLINE' },
    { now: new Date(NOW.getTime() + 60000) }
  );
  await cancelEntry(second.entry.id);
  const called = await callNext(ravi._id);
  assert.equal(called.token, first.entry.token);
  const started = await startService(ravi._id);
  assert.equal(started.status, 'IN_CHAIR');
  assert.ok(started.serviceStartedAt);
  const done = await completeService(ravi._id);
  assert.equal(done.status, 'DONE');
  assert.equal(await ServiceHistory.countDocuments({ barber: ravi._id }), 1);
  assert.equal(await QueueEntry.countDocuments({ status: 'WAITING' }), 0);

  const third = await joinQueue(
    { name: 'Third', phone: '9000000033', serviceIds: [String(haircut._id)], preferredBarberId: String(amit._id), source: 'ONLINE' },
    { now: new Date(NOW.getTime() + 120000) }
  );
  await setAvailability(amit._id, 'ON_BREAK');
  await assert.rejects(() => callNext(amit._id), /on break/);
  await setAvailability(amit._id, 'AVAILABLE');
  const calledThird = await callNext(amit._id);
  assert.equal(calledThird.token, third.entry.token);
  const missed = await markNoShow(calledThird.id);
  assert.equal(missed.status, 'NO_SHOW');
  await assert.rejects(() => callNext(amit._id), /No eligible/);
});

test('closing the online queue blocks joining but walk-in still follows salon hours', async () => {
  await reset();
  const { haircut } = await fixtures();
  await SalonSettings.updateOne({}, { onlineQueueOpen: false, openingTime: '09:00', closingTime: '21:00' });
  const openNow = new Date('2026-11-18T04:30:00.000Z');
  await assert.rejects(
    () => joinQueue({ name: 'Online', phone: '9000000041', serviceIds: [String(haircut._id)], source: 'ONLINE' }, { now: openNow }),
    /online queue is closed/
  );
  const walkIn = await joinQueue(
    { name: 'Walk', phone: '9000000042', serviceIds: [String(haircut._id)], source: 'WALK_IN' },
    { now: openNow }
  );
  assert.equal(walkIn.entry.source, 'WALK_IN');

  const closedNow = new Date('2026-11-17T20:30:00.000Z');
  await assert.rejects(
    () => joinQueue({ name: 'Late', phone: '9000000043', serviceIds: [String(haircut._id)], source: 'WALK_IN' }, { now: closedNow }),
    /salon is closed/
  );
});
});
