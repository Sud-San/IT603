import { parseHHMM, nowMinutes } from '../utils/time.js';

export const STATUSES = ['WAITING', 'CALLED', 'IN_CHAIR', 'DONE', 'CANCELLED', 'NO_SHOW'];
export const ACTIVE_STATUSES = ['WAITING', 'CALLED', 'IN_CHAIR'];

const TRANSITIONS = {
  WAITING: ['CALLED', 'CANCELLED'],
  CALLED: ['IN_CHAIR', 'NO_SHOW'],
  IN_CHAIR: ['DONE'],
  DONE: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const error = new Error(`Cannot change status from ${from} to ${to}`);
    error.status = 409;
    throw error;
  }
}

export function formatToken(sequence) {
  return `S-${String(sequence).padStart(3, '0')}`;
}

export function isValidPhone(phone) {
  return /^\d{10}$/.test(String(phone || ''));
}

export function idOf(value) {
  if (!value) return null;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

export function sameId(a, b) {
  const left = idOf(a);
  const right = idOf(b);
  return Boolean(left && right && left === right);
}

export function competes(a, b) {
  const prefA = idOf(a.preferredBarber);
  const prefB = idOf(b.preferredBarber);
  if (!prefA || !prefB) return true;
  return prefA === prefB;
}

export function selectNextCustomer(waiting, barberId) {
  const ordered = [...waiting]
    .filter((entry) => entry.status === 'WAITING')
    .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
  return (
    ordered.find((entry) => {
      const preferred = idOf(entry.preferredBarber);
      return !preferred || preferred === String(barberId);
    }) || null
  );
}

export function computePosition(entry, waitingEntries) {
  if (entry.status !== 'WAITING') return null;
  const ahead = waitingEntries.filter((other) => {
    if (idOf(other) && idOf(entry) && idOf(other) === idOf(entry)) return false;
    if (other.status !== 'WAITING') return false;
    if (new Date(other.joinedAt) >= new Date(entry.joinedAt)) return false;
    return competes(other, entry);
  });
  return ahead.length + 1;
}

function remainingMinutes(entry, now) {
  if (!entry) return 0;
  if (entry.status === 'CALLED') return Number(entry.totalDuration) || 0;
  if (entry.status === 'IN_CHAIR') {
    const started = new Date(entry.serviceStartedAt || now);
    const elapsed = Math.max(0, (now - started) / 60000);
    return Math.max(0, (Number(entry.totalDuration) || 0) - elapsed);
  }
  return 0;
}

export function estimateWaitingMinutes({ entry, activeEntries, barbers, now = new Date() }) {
  if (!entry || entry.status !== 'WAITING') return entry?.status === 'CALLED' || entry?.status === 'IN_CHAIR' ? 0 : null;

  const working = barbers.filter((barber) => barber.isActive !== false && barber.availability !== 'ON_BREAK');
  const preferred = idOf(entry.preferredBarber);
  const aheadWaiting = activeEntries.filter((other) => {
    if (other.status !== 'WAITING') return false;
    if (idOf(other) && idOf(entry) && idOf(other) === idOf(entry)) return false;
    if (new Date(other.joinedAt) >= new Date(entry.joinedAt)) return false;
    return competes(other, entry);
  });

  const currentFor = (barber) =>
    activeEntries.find(
      (other) =>
        (other.status === 'CALLED' || other.status === 'IN_CHAIR') &&
        sameId(other.assignedBarber, barber._id || barber.id)
    );

  if (!preferred) {
    const pool = working.length ? working : [];
    if (!pool.length) return null;
    const occupied = pool.reduce((sum, barber) => sum + remainingMinutes(currentFor(barber), now), 0);
    const ahead = aheadWaiting.reduce((sum, other) => sum + (Number(other.totalDuration) || 0), 0);
    return Math.round((occupied + ahead) / pool.length);
  }

  const barber = barbers.find((item) => sameId(item._id || item.id, preferred) && item.isActive !== false);
  if (!barber) return null;
  const currentLoad = remainingMinutes(currentFor(barber), now);
  const others = working.filter((item) => !sameId(item._id || item.id, preferred)).length;
  let aheadMinutes = 0;
  for (const other of aheadWaiting) {
    const otherPref = idOf(other.preferredBarber);
    if (otherPref === preferred) {
      aheadMinutes += Number(other.totalDuration) || 0;
    } else if (!otherPref && barber.availability !== 'ON_BREAK') {
      aheadMinutes += (Number(other.totalDuration) || 0) / (others + 1);
    }
  }
  return Math.round(currentLoad + aheadMinutes);
}

export function evaluateAccess(settings, now = new Date()) {
  const minutes = nowMinutes(now);
  const open = parseHHMM(settings.openingTime);
  const close = parseHHMM(settings.closingTime);
  const salonOpen = open != null && close != null && minutes >= open && minutes < close;
  const cutoff = close == null ? null : close - Number(settings.onlineQueueClosingMinutes || 0);
  const onlineOpen = Boolean(settings.onlineQueueOpen) && salonOpen && cutoff != null && minutes < cutoff;
  return { salonOpen, onlineOpen };
}

export function isEligibleForBarber(entry, barberId) {
  if (entry.status !== 'WAITING') return false;
  const preferred = idOf(entry.preferredBarber);
  return !preferred || preferred === String(barberId);
}
