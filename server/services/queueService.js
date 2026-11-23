import Counter from '../models/Counter.js';
import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import Barber from '../models/Barber.js';
import QueueEntry from '../models/QueueEntry.js';
import SalonSettings from '../models/SalonSettings.js';
import ServiceHistory from '../models/ServiceHistory.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import { AppError } from '../utils/asyncHandler.js';
import { businessDate } from '../utils/time.js';
import { broadcast } from '../socket/index.js';
import {
  ACTIVE_STATUSES,
  assertTransition,
  computePosition,
  estimateWaitingMinutes,
  evaluateAccess,
  formatToken,
  isEligibleForBarber,
  isValidPhone,
  selectNextCustomer,
} from './queueRules.js';

const POPULATE = [
  { path: 'customer', select: 'name phone' },
  { path: 'services', select: 'name nameGujarati duration price isActive' },
  { path: 'preferredBarber', select: 'name availability isActive profileImage' },
  { path: 'assignedBarber', select: 'name availability isActive profileImage' },
];

async function nextToken(date) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { businessDate: date },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      return formatToken(counter.seq);
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw new AppError('Could not generate a unique token. Please try again.', 503);
}

export async function getSettings() {
  let settings = await SalonSettings.findOne();
  if (!settings) settings = await SalonSettings.create({});
  return settings;
}

function plainBarber(barber) {
  return {
    _id: barber._id,
    id: barber._id,
    isActive: barber.isActive,
    availability: barber.availability,
  };
}

export function presentEntry(entry, { waiting, includePhone = true } = {}) {
  const object = entry.toObject ? entry.toObject() : entry;
  const waitingList = waiting || [];
  const position = object.status === 'WAITING' ? computePosition(object, waitingList) : null;
  const customer = object.customer || {};
  return {
    id: object._id,
    token: object.token,
    status: object.status,
    source: object.source,
    totalDuration: object.totalDuration,
    totalPrice: object.totalPrice,
    queuePosition: position,
    estimatedWait: null,
    joinedAt: object.joinedAt,
    calledAt: object.calledAt,
    serviceStartedAt: object.serviceStartedAt,
    completedAt: object.completedAt,
    cancelledAt: object.cancelledAt,
    customer: customer._id
      ? { id: customer._id, name: customer.name, phone: includePhone ? customer.phone : undefined }
      : null,
    services: (object.services || []).map((service) => ({
      id: service._id || service,
      name: service.name,
      nameGujarati: service.nameGujarati,
      duration: service.duration,
      price: service.price,
    })),
    preferredBarber: object.preferredBarber
      ? { id: object.preferredBarber._id, name: object.preferredBarber.name }
      : null,
    assignedBarber: object.assignedBarber
      ? { id: object.assignedBarber._id, name: object.assignedBarber.name }
      : null,
  };
}

async function loadContext(date = businessDate()) {
  const [entries, barbers] = await Promise.all([
    QueueEntry.find({ businessDate: date }).populate(POPULATE).sort({ joinedAt: 1 }),
    Barber.find(),
  ]);
  const waiting = entries.filter((entry) => entry.status === 'WAITING');
  const active = entries.filter((entry) => ACTIVE_STATUSES.includes(entry.status));
  return { entries, barbers, waiting, active, date };
}

function decorate(entry, context, includePhone, now = new Date()) {
  const estimatedWait = estimateWaitingMinutes({
    entry,
    activeEntries: context.active,
    barbers: context.barbers.map(plainBarber),
    now,
  });
  const view = presentEntry(entry, {
    waiting: context.waiting,
    includePhone,
  });
  view.estimatedWait = estimatedWait;
  view.queuePosition = entry.status === 'WAITING' ? computePosition(entry, context.waiting) : null;
  return view;
}

export async function estimateJoin({ serviceIds = [], preferredBarberId = null, now = new Date() } = {}) {
  const ids = [...new Set(serviceIds)].slice(0, 3);
  const services = ids.length ? await Service.find({ _id: { $in: ids }, isActive: true }) : [];
  const context = await loadContext(businessDate(now));
  const synthetic = {
    _id: 'preview',
    status: 'WAITING',
    preferredBarber: preferredBarberId || null,
    joinedAt: now,
    totalDuration: services.reduce((sum, service) => sum + service.duration, 0),
  };
  return {
    totalDuration: synthetic.totalDuration,
    totalPrice: services.reduce((sum, service) => sum + service.price, 0),
    estimatedWait: services.length
      ? estimateWaitingMinutes({
          entry: synthetic,
          activeEntries: context.active,
          barbers: context.barbers.map(plainBarber),
          now,
        })
      : null,
  };
}

export async function joinQueue(input, options = {}) {
  const now = options.now || new Date();
  const name = String(input.name || '').trim();
  const phone = String(input.phone || '').trim();
  const source = input.source === 'WALK_IN' ? 'WALK_IN' : 'ONLINE';
  const serviceIds = [...new Set(input.serviceIds || [])];
  const preferredId = input.preferredBarberId || null;

  if (name.length < 2 || name.length > 50) throw new AppError('Enter a customer name between 2 and 50 characters');
  if (!isValidPhone(phone)) throw new AppError('Enter a valid 10-digit mobile number');
  if (!serviceIds.length || serviceIds.length > 3) throw new AppError('Select between 1 and 3 services');

  const settings = await getSettings();
  const access = evaluateAccess(settings, now);
  if (source === 'ONLINE' && !access.onlineOpen) {
    throw new AppError('The online queue is closed. Please visit the salon for a walk-in token.', 403);
  }
  if (source === 'WALK_IN' && !access.salonOpen) {
    throw new AppError('The salon is closed, so walk-in registration is unavailable.', 403);
  }

  const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
  if (services.length !== serviceIds.length) throw new AppError('One or more selected services are unavailable');
  const ordered = serviceIds.map((id) => services.find((service) => String(service._id) === String(id)));

  let preferred = null;
  if (preferredId) {
    preferred = await Barber.findOne({ _id: preferredId, isActive: true });
    if (!preferred) throw new AppError('Selected barber is not available');
  }

  let customer = await Customer.findOne({ phone });
  if (!customer) customer = await Customer.create({ name, phone });
  else if (customer.name !== name) {
    customer.name = name;
    await customer.save();
  }

  const existing = await QueueEntry.findOne({ customer: customer._id, status: { $in: ACTIVE_STATUSES } });
  if (existing) {
    const populated = await existing.populate(POPULATE);
    const context = await loadContext(populated.businessDate);
    return { alreadyActive: true, entry: decorate(populated, context, true, now) };
  }

  const date = businessDate(now);
  const token = await nextToken(date);
  let entry;
  try {
    entry = await QueueEntry.create({
      token,
      businessDate: date,
      customer: customer._id,
      services: ordered.map((service) => service._id),
      preferredBarber: preferred ? preferred._id : null,
      totalDuration: ordered.reduce((sum, service) => sum + service.duration, 0),
      totalPrice: ordered.reduce((sum, service) => sum + service.price, 0),
      status: 'WAITING',
      source,
      joinedAt: now,
    });
  } catch (error) {
    if (error.code === 11000) {
      const raced = await QueueEntry.findOne({ customer: customer._id, status: { $in: ACTIVE_STATUSES } }).populate(POPULATE);
      if (raced) {
        const context = await loadContext(raced.businessDate);
        return { alreadyActive: true, entry: decorate(raced, context, true, now) };
      }
    }
    throw error;
  }
  const populated = await QueueEntry.findById(entry._id).populate(POPULATE);
  const context = await loadContext(date);
  const view = decorate(populated, context, true, now);
  broadcast('queue:joined', { entryId: view.id, token: view.token, status: view.status, barberId: preferredId });
  return { alreadyActive: false, entry: view };
}

export async function listQueue() {
  const context = await loadContext();
  const settings = await getSettings();
  return {
    graceMinutes: settings.noShowGraceMinutes,
    serverTime: new Date().toISOString(),
    entries: context.entries.map((entry) => decorate(entry, context, true)),
  };
}

export async function getEntry(id) {
  const entry = await QueueEntry.findById(id).populate(POPULATE);
  if (!entry) throw new AppError('Queue entry not found', 404);
  const context = await loadContext(entry.businessDate);
  return decorate(entry, context, true);
}

export async function getPosition(id) {
  const entry = await getEntry(id);
  return { id: entry.id, token: entry.token, queuePosition: entry.queuePosition, estimatedWait: entry.estimatedWait, status: entry.status };
}

export async function trackQueue(query) {
  const q = String(query || '').trim();
  if (!q) throw new AppError('Enter a token or mobile number');
  let customerIds = [];
  if (isValidPhone(q)) {
    const customer = await Customer.findOne({ phone: q });
    if (customer) customerIds = [customer._id];
  }
  const entry = await QueueEntry.findOne({
    status: { $in: ACTIVE_STATUSES },
    $or: [{ token: q.toUpperCase() }, { customer: { $in: customerIds } }],
  })
    .populate(POPULATE)
    .sort({ joinedAt: -1 });
  if (!entry) throw new AppError('No active token was found for that phone or token', 404);
  const context = await loadContext(entry.businessDate);
  return decorate(entry, context, true);
}

async function activeForBarber(barberId, date) {
  return QueueEntry.findOne({
    assignedBarber: barberId,
    businessDate: date,
    status: { $in: ['CALLED', 'IN_CHAIR'] },
  });
}

export async function callNext(barberId) {
  const barber = await Barber.findById(barberId);
  if (!barber || !barber.isActive) throw new AppError('Barber not found', 404);
  if (barber.availability === 'ON_BREAK') throw new AppError('This barber is on break and cannot take the next customer', 409);

  const date = businessDate();
  const busy = await activeForBarber(barberId, date);
  if (busy) throw new AppError('This barber already has an active customer', 409);

  const waiting = await QueueEntry.find({ businessDate: date, status: 'WAITING' }).sort({ joinedAt: 1 });
  const candidate = selectNextCustomer(waiting, barberId);
  if (!candidate) throw new AppError('No eligible waiting customer for this barber', 404);

  const updated = await QueueEntry.findOneAndUpdate(
    { _id: candidate._id, status: 'WAITING' },
    { status: 'CALLED', assignedBarber: barber._id, calledAt: new Date() },
    { new: true }
  ).populate(POPULATE);
  if (!updated) throw new AppError('That customer was just taken by another action. Refresh and try again.', 409);

  const context = await loadContext(date);
  const view = decorate(updated, context, true);
  broadcast('queue:called', {
    entryId: view.id,
    token: view.token,
    status: view.status,
    barberId: String(barber._id),
    barberName: barber.name,
  });
  return view;
}

export async function callSpecific(entryId) {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) throw new AppError('Queue entry not found', 404);
  assertTransition(entry.status, 'CALLED');

  const date = businessDate();
  const waiting = await QueueEntry.find({ businessDate: date, status: 'WAITING' }).sort({ joinedAt: 1 });
  const preferred = entry.preferredBarber ? String(entry.preferredBarber) : null;

  let barber = null;
  if (preferred) {
    barber = await Barber.findOne({ _id: preferred, isActive: true });
    if (!barber) throw new AppError('Preferred barber is not active', 409);
    if (barber.availability === 'ON_BREAK') throw new AppError('Preferred barber is on break', 409);
    const next = selectNextCustomer(waiting, barber._id);
    if (!next || String(next._id) !== String(entry._id)) {
      throw new AppError('This customer is not the next eligible person for their barber', 409);
    }
  } else {
    const barbers = await Barber.find({ isActive: true, availability: 'AVAILABLE' });
    for (const option of barbers) {
      const busy = await activeForBarber(option._id, date);
      if (busy) continue;
      const next = selectNextCustomer(waiting, option._id);
      if (next && String(next._id) === String(entry._id)) {
        barber = option;
        break;
      }
    }
    if (!barber) throw new AppError('No free barber can take this customer yet', 409);
  }

  const busy = await activeForBarber(barber._id, date);
  if (busy) throw new AppError('This barber already has an active customer', 409);
  return callNext(barber._id);
}

export async function cancelEntry(entryId, { byStaff = false } = {}) {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) throw new AppError('Queue entry not found', 404);
  if (!byStaff && entry.status !== 'WAITING') throw new AppError('You can cancel only while you are waiting', 409);
  assertTransition(entry.status, 'CANCELLED');
  entry.status = 'CANCELLED';
  entry.cancelledAt = new Date();
  await entry.save();
  const populated = await entry.populate(POPULATE);
  const context = await loadContext(entry.businessDate);
  const view = decorate(populated, context, true);
  broadcast('queue:cancelled', { entryId: view.id, token: view.token, status: view.status });
  return view;
}

export async function markNoShow(entryId) {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) throw new AppError('Queue entry not found', 404);
  assertTransition(entry.status, 'NO_SHOW');
  const barberId = entry.assignedBarber ? String(entry.assignedBarber) : null;
  entry.status = 'NO_SHOW';
  await entry.save();
  const populated = await entry.populate(POPULATE);
  const context = await loadContext(entry.businessDate);
  const view = decorate(populated, context, true);
  broadcast('queue:no-show', { entryId: view.id, token: view.token, status: view.status, barberId });
  return view;
}

export async function startService(barberId) {
  const date = businessDate();
  const entry = await QueueEntry.findOne({
    assignedBarber: barberId,
    businessDate: date,
    status: 'CALLED',
  });
  if (!entry) throw new AppError('There is no called customer at this chair', 404);
  assertTransition(entry.status, 'IN_CHAIR');
  entry.status = 'IN_CHAIR';
  entry.serviceStartedAt = new Date();
  await entry.save();
  const populated = await entry.populate(POPULATE);
  const context = await loadContext(date);
  const view = decorate(populated, context, true);
  broadcast('service:started', {
    entryId: view.id,
    token: view.token,
    status: view.status,
    barberId: String(barberId),
    barberName: populated.assignedBarber?.name,
  });
  return view;
}

export async function completeService(barberId) {
  const date = businessDate();
  const entry = await QueueEntry.findOne({
    assignedBarber: barberId,
    businessDate: date,
    status: 'IN_CHAIR',
  });
  if (!entry) throw new AppError('There is no customer in this chair', 404);
  assertTransition(entry.status, 'DONE');
  const end = new Date();
  entry.status = 'DONE';
  entry.completedAt = end;
  await entry.save();
  await ServiceHistory.create({
    queueEntry: entry._id,
    barber: barberId,
    services: entry.services,
    startTime: entry.serviceStartedAt || end,
    endTime: end,
    totalDuration: entry.totalDuration,
    totalAmount: entry.totalPrice,
    businessDate: date,
  });
  const populated = await entry.populate(POPULATE);
  const context = await loadContext(date);
  const view = decorate(populated, context, true);
  broadcast('service:completed', {
    entryId: view.id,
    token: view.token,
    status: view.status,
    barberId: String(barberId),
    barberName: populated.assignedBarber?.name,
  });
  return view;
}

export async function setAvailability(barberId, availability) {
  if (!['AVAILABLE', 'ON_BREAK'].includes(availability)) throw new AppError('Availability must be AVAILABLE or ON_BREAK');
  const barber = await Barber.findById(barberId);
  if (!barber || !barber.isActive) throw new AppError('Barber not found', 404);
  barber.availability = availability;
  await barber.save();
  broadcast(availability === 'ON_BREAK' ? 'barber:on-break' : 'barber:available', {
    barberId: String(barber._id),
    barberName: barber.name,
  });
  return barber;
}

export async function getBarberCurrent(barberId) {
  const barber = await Barber.findById(barberId);
  if (!barber) throw new AppError('Barber not found', 404);
  const date = businessDate();
  const context = await loadContext(date);
  const current = context.entries.find(
    (entry) =>
      String(entry.assignedBarber?._id || entry.assignedBarber) === String(barberId) &&
      ['CALLED', 'IN_CHAIR'].includes(entry.status)
  );
  const waiting = context.waiting;
  const next = selectNextCustomer(waiting, barberId);
  const activeCustomer = current
    ? context.entries.find((entry) => String(entry._id) === String(current._id))
    : null;
  return {
    barber,
    current: activeCustomer ? decorate(activeCustomer, context, true) : null,
    next: next ? decorate(await QueueEntry.findById(next._id).populate(POPULATE), context, false) : null,
  };
}

function dutyOf(barber, entries) {
  const current = entries.find(
    (entry) =>
      String(entry.assignedBarber?._id || '') === String(barber._id) &&
      ['CALLED', 'IN_CHAIR'].includes(entry.status)
  );
  if (!barber.isActive) return 'INACTIVE';
  if (barber.availability === 'ON_BREAK') return 'ON_BREAK';
  if (current) return 'BUSY';
  return 'AVAILABLE';
}

export async function getHome() {
  const settings = await getSettings();
  const access = evaluateAccess(settings);
  const context = await loadContext();
  const synthetic = {
    _id: 'new',
    status: 'WAITING',
    preferredBarber: null,
    joinedAt: new Date(),
    totalDuration: 0,
  };
  const approximateWait = estimateWaitingMinutes({
    entry: synthetic,
    activeEntries: context.active,
    barbers: context.barbers.map(plainBarber),
  });
  return {
    settings,
    salonOpen: access.salonOpen,
    onlineJoinOpen: access.onlineOpen,
    waitingCount: context.waiting.length,
    approximateWait,
    barbers: context.barbers
      .filter((barber) => barber.isActive)
      .map((barber) => {
        const current = context.entries.find(
          (entry) =>
            String(entry.assignedBarber?._id || '') === String(barber._id) &&
            ['CALLED', 'IN_CHAIR'].includes(entry.status)
        );
        return {
          id: barber._id,
          name: barber.name,
          profileImage: barber.profileImage,
          availability: barber.availability,
          duty: dutyOf(barber, context.entries),
          workingHours: barber.workingHours,
          currentToken: current?.token || null,
        };
      }),
    services: await Service.find({ isActive: true }).sort({ name: 1 }),
  };
}

export async function getBoard() {
  const home = await getHome();
  const context = await loadContext();
  const next = context.waiting.slice(0, 5).map((entry) => {
    const view = decorate(entry, context, false);
    return {
      token: view.token,
      estimatedWait: view.estimatedWait,
      services: view.services.map((service) => service.name),
      preferredBarber: view.preferredBarber?.name || 'Any',
    };
  });
  return {
    salonName: home.settings.salonName,
    waitingCount: home.waitingCount,
    approximateWait: home.approximateWait,
    serverTime: new Date().toISOString(),
    barbers: home.barbers.map((barber) => {
      const current = context.entries.find(
        (entry) =>
          String(entry.assignedBarber?._id || '') === String(barber.id) &&
          ['CALLED', 'IN_CHAIR'].includes(entry.status)
      );
      return {
        id: barber.id,
        name: barber.name,
        duty: barber.duty,
        nowServing: current
          ? {
              token: current.token,
              status: current.status,
              services: (current.services || []).map((service) => service.name),
            }
          : null,
      };
    }),
    nextTokens: next,
  };
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function getDashboard() {
  const date = businessDate();
  const context = await loadContext(date);
  const done = context.entries.filter((entry) => entry.status === 'DONE');
  const waits = done
    .filter((entry) => entry.calledAt)
    .map((entry) => (new Date(entry.calledAt) - new Date(entry.joinedAt)) / 60000);
  const servicesDuration = done
    .filter((entry) => entry.completedAt && entry.serviceStartedAt)
    .map((entry) => (new Date(entry.completedAt) - new Date(entry.serviceStartedAt)) / 60000);
  const activeBarbers = context.barbers.filter((barber) => barber.isActive).length;
  return {
    totalCustomers: context.entries.length,
    waiting: context.waiting.length,
    serving: context.entries.filter((entry) => ['CALLED', 'IN_CHAIR'].includes(entry.status)).length,
    completed: done.length,
    noShows: context.entries.filter((entry) => entry.status === 'NO_SHOW').length,
    cancelled: context.entries.filter((entry) => entry.status === 'CANCELLED').length,
    averageWait: average(waits.filter((value) => value >= 0)),
    averageService: average(servicesDuration.filter((value) => value >= 0)),
    revenue: done.reduce((sum, entry) => sum + entry.totalPrice, 0),
    activeBarbers,
  };
}

export async function getAnalytics() {
  const today = businessDate();
  const history = await DailyAnalytics.find({ date: { $lt: today } }).sort({ date: 1 });
  const context = await loadContext(today);
  const done = context.entries.filter((entry) => entry.status === 'DONE');
  const serviceMap = new Map();
  for (const entry of done) {
    for (const service of entry.services || []) {
      const key = service.name || 'Service';
      const current = serviceMap.get(key) || { name: key, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += service.price || 0;
      serviceMap.set(key, current);
    }
  }
  const barberMap = new Map();
  for (const entry of done) {
    const name = entry.assignedBarber?.name || 'Unassigned';
    const current = barberMap.get(name) || { name, completed: 0, revenue: 0 };
    current.completed += 1;
    current.revenue += entry.totalPrice;
    barberMap.set(name, current);
  }
  const live = await getDashboard();
  const daily = [
    ...history.map((day) => ({
      date: day.date,
      customersServed: day.customersServed,
      revenue: day.revenue,
    })),
    { date: today, customersServed: live.completed, revenue: live.revenue },
  ];
  const combinedServices = new Map();
  for (const day of history) {
    for (const service of day.services) {
      const current = combinedServices.get(service.name) || { name: service.name, count: 0, revenue: 0 };
      current.count += service.count;
      current.revenue += service.revenue;
      combinedServices.set(service.name, current);
    }
  }
  for (const service of serviceMap.values()) {
    const current = combinedServices.get(service.name) || { name: service.name, count: 0, revenue: 0 };
    current.count += service.count;
    current.revenue += service.revenue;
    combinedServices.set(service.name, current);
  }
  const combinedBarbers = new Map();
  for (const day of history) {
    for (const barber of day.barbers) {
      const current = combinedBarbers.get(barber.name) || { name: barber.name, completed: 0, revenue: 0 };
      current.completed += barber.completed;
      current.revenue += barber.revenue;
      combinedBarbers.set(barber.name, current);
    }
  }
  for (const barber of barberMap.values()) {
    const current = combinedBarbers.get(barber.name) || { name: barber.name, completed: 0, revenue: 0 };
    current.completed += barber.completed;
    current.revenue += barber.revenue;
    combinedBarbers.set(barber.name, current);
  }
  return {
    daily,
    services: [...combinedServices.values()],
    barbers: [...combinedBarbers.values()],
    statusDistribution: [
      { name: 'Waiting', value: live.waiting },
      { name: 'Serving', value: live.serving },
      { name: 'Done', value: live.completed },
      { name: 'No-show', value: live.noShows },
      { name: 'Cancelled', value: live.cancelled },
    ],
    today: live,
  };
}

export { isEligibleForBarber };
