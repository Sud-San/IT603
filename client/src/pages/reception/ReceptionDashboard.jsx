import React, { useState, useEffect } from 'react';
import {
  Users,
  Scissors,
  PlusCircle,
  PhoneCall,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import api from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { formatCurrency, formatTime } from '../../utils/formatters.js';
import { toast } from 'sonner';

export default function ReceptionDashboard() {
  const { t } = useLanguage();
  const [queueData, setQueueData] = useState({ entries: [], graceMinutes: 10 });
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Walk-in modal state
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServices, setWalkInServices] = useState([]);
  const [walkInBarber, setWalkInBarber] = useState('');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  const fetchQueue = async () => {
    try {
      const [qRes, homeRes] = await Promise.all([
        api.get('/queue'),
        api.get('/public/home'),
      ]);
      if (qRes.data?.data) {
        setQueueData(qRes.data.data);
      }
      if (homeRes.data?.data?.barbers) {
        setBarbers(homeRes.data.data.barbers);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [homeRes, servRes] = await Promise.all([
        api.get('/public/home'),
        api.get('/services'),
      ]);
      setBarbers(homeRes.data?.data?.barbers || []);
      setServices(servRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchMetadata();

    const socket = getSocket();
    socket.emit('watch:staff');

    const handleUpdate = () => {
      fetchQueue();
      fetchMetadata();
    };
    socket.on('queue:updated', handleUpdate);
    socket.on('token:called', handleUpdate);
    socket.on('service:started', handleUpdate);
    socket.on('service:completed', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('token:called', handleUpdate);
      socket.off('service:started', handleUpdate);
      socket.off('service:completed', handleUpdate);
    };
  }, []);

  const handleCallNext = async (barberId) => {
    try {
      const res = await api.post('/queue/call-next', { barberId });
      toast.success(`Called token ${res.data.data.token}`);
      fetchQueue();
    } catch (err) {
      toast.error(err.message || 'Cannot call next customer');
    }
  };

  const handleCallSpecific = async (id) => {
    try {
      const res = await api.post(`/queue/${id}/call`);
      toast.success(`Called customer for token ${res.data.data.token}`);
      fetchQueue();
    } catch (err) {
      toast.error(err.message || 'Error calling token');
    }
  };

  const handleNoShow = async (id) => {
    try {
      await api.put(`/queue/${id}/no-show`);
      toast.info('Marked as No-Show');
      fetchQueue();
    } catch (err) {
      toast.error(err.message || 'Error updating status');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this queue entry?')) return;
    try {
      await api.put(`/queue/${id}/cancel`);
      toast.success('Queue entry cancelled');
      fetchQueue();
    } catch (err) {
      toast.error(err.message || 'Error cancelling entry');
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (walkInServices.length === 0) {
      toast.error('Select at least 1 service');
      return;
    }
    setSubmittingWalkIn(true);
    try {
      const res = await api.post('/queue/walk-in', {
        name: walkInName.trim(),
        phone: walkInPhone.trim(),
        serviceIds: walkInServices,
        preferredBarberId: walkInBarber || null,
      });

      toast.success(`Walk-in token ${res.data.data.token} created!`);
      setWalkInOpen(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInServices([]);
      setWalkInBarber('');
      fetchQueue();
    } catch (err) {
      toast.error(err.message || 'Failed to create walk-in');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const filteredEntries = (queueData.entries || []).filter((entry) => {
    const matchesFilter =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'ACTIVE'
        ? ['WAITING', 'CALLED', 'IN_CHAIR'].includes(entry.status)
        : entry.status === filterStatus;

    const matchesSearch =
      !searchQuery.trim() ||
      entry.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.customer?.phone?.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold font-semibold">
            Operations
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
            {t('reception')}
          </h1>
          <p className="text-xs text-mute mt-1">Manage today's guest queue & walk-ins</p>
        </div>

        <button
          type="button"
          onClick={() => setWalkInOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-ink shadow-md shadow-gold/20 hover:brightness-110 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          {t('issueWalkInToken')}
        </button>
      </div>

      {/* Stylist Chairs Quick Action Bar */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gold mb-3 flex items-center gap-1.5">
          <Scissors className="h-4 w-4" /> Stylist Chairs On Duty
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {barbers.map((barber) => {
            const barberId = barber.id || barber._id;
            const isBusy = barber.duty === 'BUSY';
            const isOnBreak = barber.duty === 'ON_BREAK' || barber.availability === 'ON_BREAK';
            const isAvailable = barber.duty === 'AVAILABLE';

            return (
              <div
                key={barberId}
                className="rounded-2xl border border-gray-800 bg-panel/80 p-4 shadow-card flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-cream text-sm">{barber.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-block text-[10px] font-bold uppercase rounded px-2 py-0.5 ${
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isBusy
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {isAvailable ? 'Available (Ready)' : isBusy ? `Busy (${barber.currentToken})` : 'On Break'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCallNext(barberId)}
                  disabled={!isAvailable}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                    isAvailable
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-sm'
                      : 'border border-gray-800 bg-gray-900/40 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  {isBusy ? `In Chair (${barber.currentToken})` : isOnBreak ? 'On Break' : t('callNextCustomer')}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Queue Table Card */}
      <div className="rounded-3xl border border-gray-800 bg-panel/80 p-6 shadow-card">
        {/* Controls: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'ACTIVE', 'WAITING', 'CALLED', 'IN_CHAIR', 'DONE', 'NO_SHOW'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-gold font-bold text-ink'
                    : 'bg-ink text-gray-400 hover:text-cream'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search token or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-ink pl-9 pr-3 py-2 text-xs text-cream placeholder-gray-500 focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-800 text-[11px] uppercase tracking-wider text-mute">
              <tr>
                <th className="pb-3 font-semibold">Token</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Services</th>
                <th className="pb-3 font-semibold">Assigned / Pref</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Wait / Time</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-mute">
                    No entries match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-ink/40 transition-colors">
                    <td className="py-3 font-display text-base font-bold text-gold">
                      {entry.token}
                      <span className="block text-[10px] font-sans font-normal text-mute">
                        {entry.source}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-cream">{entry.customer?.name}</div>
                      <div className="text-[11px] text-mute">{entry.customer?.phone}</div>
                    </td>
                    <td className="py-3 max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {(entry.services || []).map((s, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-mute block mt-0.5">
                        {formatCurrency(entry.totalPrice)} • {entry.totalDuration}m
                      </span>
                    </td>
                    <td className="py-3 text-gray-300">
                      {entry.assignedBarber?.name || (
                        <span className="text-mute">
                          Pref: {entry.preferredBarber?.name || 'Any'}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={entry.status} size="sm" />
                    </td>
                    <td className="py-3 text-mute">
                      <div>{formatTime(entry.joinedAt)}</div>
                      {entry.status === 'WAITING' && (
                        <div className="text-[10px] text-amber-400">
                          Pos: #{entry.queuePosition} (~{entry.estimatedWait}m)
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {entry.status === 'WAITING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCallSpecific(entry.id)}
                              className="rounded bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/30"
                            >
                              Call
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(entry.id)}
                              className="rounded bg-gray-800 px-2.5 py-1 text-[11px] text-gray-400 hover:text-rose-400"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {entry.status === 'CALLED' && (
                          <button
                            type="button"
                            onClick={() => handleNoShow(entry.id)}
                            className="rounded bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/30"
                          >
                            No Show
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-In Modal */}
      {walkInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="font-display text-xl font-bold text-cream">
                {t('walkInTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setWalkInOpen(false)}
                className="rounded-lg p-1 text-mute hover:text-cream"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karan Joshi"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-sm text-cream"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="9876543210"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-sm text-cream"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Select Services (Max 3) *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {services.map((srv) => {
                    const isSel = walkInServices.includes(srv._id);
                    return (
                      <button
                        key={srv._id}
                        type="button"
                        onClick={() => {
                          if (isSel) setWalkInServices(walkInServices.filter((id) => id !== srv._id));
                          else if (walkInServices.length < 3)
                            setWalkInServices([...walkInServices, srv._id]);
                        }}
                        className={`rounded-lg border p-2 text-left text-xs ${
                          isSel
                            ? 'border-gold bg-gold/10 text-gold font-semibold'
                            : 'border-gray-700 bg-ink text-gray-300'
                        }`}
                      >
                        {srv.name} (₹{srv.price})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Assign Stylist Preference
                </label>
                <select
                  value={walkInBarber}
                  onChange={(e) => setWalkInBarber(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-sm text-cream"
                >
                  <option value="">Any Available Stylist</option>
                  {barbers.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.availability})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setWalkInOpen(false)}
                  className="rounded-xl border border-gray-700 px-4 py-2 text-xs text-mute hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="rounded-xl bg-gold px-5 py-2 text-xs font-bold text-ink hover:brightness-110 disabled:opacity-50"
                >
                  {submittingWalkIn ? 'Issuing...' : 'Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
