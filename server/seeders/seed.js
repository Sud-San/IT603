import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import Barber from '../models/Barber.js';
import User from '../models/User.js';
import QueueEntry from '../models/QueueEntry.js';
import SalonSettings from '../models/SalonSettings.js';
import ServiceHistory from '../models/ServiceHistory.js';
import Counter from '../models/Counter.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import { businessDate, pastWithinToday, shiftDate } from '../utils/time.js';
import { formatToken } from '../services/queueRules.js';

dotenv.config();

const SERVICES = [
  ['Haircut', 'વાળ કાપવા', 'Classic cut and finish', 30, 150],
  ['Beard Trim', 'દાઢી', 'Shape and line-up', 15, 80],
  ['Hair Spa', 'હેર સ્પા', 'Nourishing spa treatment', 45, 400],
  ['Hair Wash', 'વાળ ધોવા', 'Wash and condition', 15, 100],
  ['Facial', 'ફેશિયલ', 'Cleanse and glow facial', 45, 500],
  ['Hair Coloring', 'વાળ રંગવા', 'Single-process color', 60, 800],
  ['Head Massage', 'માથાની માલિશ', 'Relaxing scalp massage', 20, 200],
  ['Styling', 'સ્ટાઇલિંગ', 'Blow-dry and style', 20, 150],
];

const PEOPLE = [
  ['Aarav Mehta', '9876501001'],
  ['Diya Shah', '9876501002'],
  ['Karan Joshi', '9876501003'],
  ['Neha Desai', '9876501004'],
  ['Rohan Trivedi', '9876501005'],
  ['Priya Nair', '9876501006'],
  ['Vikram Singh', '9876501007'],
  ['Ananya Rao', '9876501008'],
  ['Harsh Modi', '9876501009'],
  ['Sneha Iyer', '9876501010'],
  ['Manav Gupta', '9876501011'],
  ['Pooja Reddy', '9876501012'],
  ['Yash Chauhan', '9876501013'],
  ['Kavya Menon', '9876501014'],
  ['Arjun Kapoor', '9876501015'],
  ['Isha Bhatt', '9876501016'],
  ['Devansh Jain', '9876501017'],
  ['Meera Kulkarni', '9876501018'],
  ['Siddharth Das', '9876501019'],
  ['Tanvi Chopra', '9876501020'],
  ['Nikhil Bose', '9876501021'],
  ['Riya Malhotra', '9876501022'],
  ['Aditya Verma', '9876501023'],
  ['Shreya Pandey', '9876501024'],
];

function sumServices(catalog, names) {
  const picked = names.map((name) => catalog[name]);
  return {
    ids: picked.map((service) => service._id),
    duration: picked.reduce((sum, service) => sum + service.duration, 0),
    price: picked.reduce((sum, service) => sum + service.price, 0),
  };
}

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing. Copy server/.env.example to server/.env.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([
    Customer.deleteMany({}),
    Service.deleteMany({}),
    Barber.deleteMany({}),
    User.deleteMany({}),
    QueueEntry.deleteMany({}),
    SalonSettings.deleteMany({}),
    ServiceHistory.deleteMany({}),
    Counter.deleteMany({}),
    DailyAnalytics.deleteMany({}),
  ]);

  await SalonSettings.create({
    salonName: 'Aurelia Salon',
    openingTime: '09:00',
    closingTime: '21:00',
    onlineQueueOpen: true,
    onlineQueueClosingMinutes: 30,
    noShowGraceMinutes: 10,
    supportedLanguages: ['en', 'gu'],
  });

  const serviceDocs = await Service.insertMany(
    SERVICES.map(([name, nameGujarati, description, duration, price]) => ({
      name,
      nameGujarati,
      description,
      duration,
      price,
      isActive: true,
    }))
  );
  const catalog = Object.fromEntries(serviceDocs.map((service) => [service.name, service]));

  const [ravi, amit, imran] = await Barber.insertMany([
    { name: 'Ravi Sharma', availability: 'AVAILABLE', isActive: true, workingHours: { start: '09:00', end: '20:00' } },
    { name: 'Amit Patel', availability: 'AVAILABLE', isActive: true, workingHours: { start: '09:00', end: '20:00' } },
    { name: 'Imran Khan', availability: 'AVAILABLE', isActive: true, workingHours: { start: '11:00', end: '20:00' } },
  ]);
  const barberByName = { 'Ravi Sharma': ravi, 'Amit Patel': amit, 'Imran Khan': imran };

  const password = {
    admin: await bcrypt.hash('Admin@123', 10),
    reception: await bcrypt.hash('Reception@123', 10),
    barber: await bcrypt.hash('Barber@123', 10),
  };
  await User.insertMany([
    { name: 'Salon Owner', email: 'admin@salon.demo', password: password.admin, role: 'ADMIN' },
    { name: 'Reception Desk', email: 'reception@salon.demo', password: password.reception, role: 'RECEPTIONIST' },
    { name: 'Ravi Sharma', email: 'ravi@salon.demo', password: password.barber, role: 'BARBER', barberId: ravi._id },
    { name: 'Amit Patel', email: 'amit@salon.demo', password: password.barber, role: 'BARBER', barberId: amit._id },
    { name: 'Imran Khan', email: 'imran@salon.demo', password: password.barber, role: 'BARBER', barberId: imran._id },
  ]);

  const customers = await Customer.insertMany(PEOPLE.map(([name, phone]) => ({ name, phone })));
  const byPhone = Object.fromEntries(customers.map((customer) => [customer.phone, customer]));

  const queuePlan = [
    { phone: '9876501001', services: ['Haircut'], barber: 'Ravi Sharma', status: 'DONE', joined: 240, called: 200, started: 190, ended: 160 },
    { phone: '9876501002', services: ['Beard Trim'], barber: 'Amit Patel', status: 'DONE', joined: 230, called: 180, started: 170, ended: 155 },
    { phone: '9876501003', services: ['Hair Wash', 'Styling'], barber: 'Imran Khan', status: 'DONE', joined: 220, called: 160, started: 150, ended: 120 },
    { phone: '9876501004', services: ['Facial'], barber: 'Amit Patel', status: 'DONE', joined: 210, called: 140, started: 130, ended: 80 },
    { phone: '9876501005', services: ['Head Massage'], barber: 'Ravi Sharma', status: 'DONE', joined: 200, called: 120, started: 110, ended: 90 },
    { phone: '9876501006', services: ['Haircut', 'Beard Trim'], barber: 'Imran Khan', status: 'DONE', joined: 190, called: 100, started: 90, ended: 50 },
    { phone: '9876501007', services: ['Hair Spa'], barber: 'Ravi Sharma', status: 'NO_SHOW', joined: 170, called: 130 },
    { phone: '9876501008', services: ['Styling'], barber: null, status: 'CANCELLED', joined: 160 },
    { phone: '9876501009', services: ['Haircut'], barber: 'Ravi Sharma', status: 'IN_CHAIR', joined: 90, called: 20, started: 12 },
    { phone: '9876501010', services: ['Beard Trim', 'Hair Wash'], barber: 'Amit Patel', status: 'CALLED', joined: 80, called: 12 },
    { phone: '9876501011', services: ['Facial'], barber: 'Imran Khan', status: 'NO_SHOW', joined: 150, called: 100 },
    { phone: '9876501012', services: ['Hair Coloring'], barber: null, status: 'CANCELLED', joined: 140 },
    { phone: '9876501013', services: ['Haircut', 'Beard Trim'], barber: null, status: 'WAITING', joined: 70 },
    { phone: '9876501014', services: ['Hair Spa'], barber: 'Ravi Sharma', status: 'WAITING', joined: 40 },
    { phone: '9876501015', services: ['Facial'], barber: 'Amit Patel', status: 'WAITING', joined: 30 },
    { phone: '9876501016', services: ['Styling'], barber: 'Imran Khan', status: 'WAITING', joined: 22 },
    { phone: '9876501017', services: ['Hair Wash'], barber: null, status: 'WAITING', joined: 16 },
    { phone: '9876501018', services: ['Haircut'], barber: 'Ravi Sharma', status: 'WAITING', joined: 12 },
    { phone: '9876501019', services: ['Head Massage'], barber: null, status: 'WAITING', joined: 7 },
    { phone: '9876501020', services: ['Hair Coloring'], barber: 'Imran Khan', status: 'WAITING', joined: 3 },
  ];

  const ordered = [...queuePlan].sort((a, b) => b.joined - a.joined);
  const today = businessDate();
  const entries = ordered.map((item, index) => {
    const totals = sumServices(catalog, item.services);
    const assigned = item.status === 'WAITING' || item.status === 'CANCELLED' ? null : barberByName[item.barber];
    return {
      token: formatToken(index + 1),
      businessDate: today,
      customer: byPhone[item.phone]._id,
      services: totals.ids,
      preferredBarber: item.barber ? barberByName[item.barber]._id : null,
      assignedBarber: assigned ? assigned._id : null,
      totalDuration: totals.duration,
      totalPrice: totals.price,
      status: item.status,
      source: index % 4 === 0 ? 'WALK_IN' : 'ONLINE',
      joinedAt: pastWithinToday(item.joined),
      calledAt: item.called ? pastWithinToday(item.called) : null,
      serviceStartedAt: item.started ? pastWithinToday(item.started) : null,
      completedAt: item.ended ? pastWithinToday(item.ended) : null,
      cancelledAt: item.status === 'CANCELLED' ? pastWithinToday(item.joined - 5) : null,
    };
  });
  const saved = await QueueEntry.insertMany(entries);
  await Counter.create({ businessDate: today, seq: entries.length });

  const histories = saved
    .filter((entry) => entry.status === 'DONE')
    .map((entry) => ({
      queueEntry: entry._id,
      barber: entry.assignedBarber,
      services: entry.services,
      startTime: entry.serviceStartedAt,
      endTime: entry.completedAt,
      totalDuration: entry.totalDuration,
      totalAmount: entry.totalPrice,
      businessDate: today,
    }));
  await ServiceHistory.insertMany(histories);

  const priceByName = Object.fromEntries(SERVICES.map(([name, , , , price]) => [name, price]));
  const days = [];
  for (let offset = 7; offset >= 1; offset -= 1) {
    const services = SERVICES.map(([name], index) => {
      const count = 4 + ((offset + index) % 5);
      return { name, count, revenue: count * priceByName[name] };
    });
    const barbers = ['Ravi Sharma', 'Amit Patel', 'Imran Khan'].map((name, index) => {
      const completed = 6 + ((offset + index) % 4);
      return { name, completed, revenue: completed * (180 + index * 40), avgServiceMinutes: 24 + index * 4 };
    });
    days.push({
      date: shiftDate(-offset),
      customersServed: 16 + (offset % 6),
      revenue: services.reduce((sum, service) => sum + service.revenue, 0),
      avgWaitMinutes: 12 + offset,
      avgServiceMinutes: 28,
      noShows: offset % 3,
      cancelled: offset % 2,
      services,
      barbers,
    });
  }
  await DailyAnalytics.insertMany(days);

  console.log('Seed complete.');
  console.log('Salon: Aurelia Salon');
  console.log('Admin: admin@salon.demo / Admin@123');
  console.log('Reception: reception@salon.demo / Reception@123');
  console.log('Barbers: ravi@salon.demo, amit@salon.demo, imran@salon.demo / Barber@123');
  console.log(`Today's tokens: ${entries.length}. Demo phones are fictional and must not be contacted.`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error('Seed failed.');
  console.error(error);
  process.exit(1);
});
