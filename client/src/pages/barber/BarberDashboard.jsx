import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Coffee,
  CheckCircle,
  PhoneCall,
  User,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { formatCurrency, formatTime } from '../../utils/formatters.js';
import { toast } from 'sonner';

export default function BarberDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [barbersList, setBarbersList] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState(user?.barberId || '');
  const [barberData, setBarberData] = useState(null);
  const [loading, setLoading] = useState(true);

  // If user is admin/receptionist, let them select which barber chair to control
  useEffect(() => {
    api.get('/barbers').then((res) => {
      const list = res.data?.data || [];
      setBarbersList(list);
      if (!selectedBarberId && list.length > 0) {
        setSelectedBarberId(list[0]._id);
      }
    });
  }, []);

  const fetchBarberState = async () => {
    if (!selectedBarberId) return;
    try {
      const res = await api.get(`/barbers/${selectedBarberId}/current`);
      if (res.data?.data) {
        setBarberData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load barber details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarberState();

    const socket = getSocket();
    if (selectedBarberId) {
      socket.emit('watch:barber', selectedBarberId);
    }

    const handleUpdate = () => fetchBarberState();
    socket.on('queue:updated', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
    };
  }, [selectedBarberId]);

  const handleToggleAvailability = async () => {
    if (!barberData?.barber) return;
    const nextAvailability =
      barberData.barber.availability === 'AVAILABLE' ? 'ON_BREAK' : 'AVAILABLE';
    try {
      await api.put(`/barbers/${selectedBarberId}/availability`, {
        availability: nextAvailability,
      });
      toast.success(
        nextAvailability === 'AVAILABLE'
          ? 'You are now marked Available'
          : 'You are now On Break'
      );
      fetchBarberState();
    } catch (err) {
      toast.error(err.message || 'Failed to update availability');
    }
  };

  const handleCallNext = async () => {
    try {
      const res = await api.post('/queue/call-next', { barberId: selectedBarberId });
      toast.success(`Customer for token ${res.data.data.token} called!`);
      fetchBarberState();
    } catch (err) {
      toast.error(err.message || 'Cannot call next customer');
    }
  };

  const handleStartService = async () => {
    try {
      await api.put(`/barbers/${selectedBarberId}/start`);
      toast.success('Service started!');
      fetchBarberState();
    } catch (err) {
      toast.error(err.message || 'Could not start service');
    }
  };

  const handleCompleteService = async () => {
    try {
      await api.put(`/barbers/${selectedBarberId}/complete`);
      toast.success('Service completed successfully!');
      fetchBarberState();
    } catch (err) {
      toast.error(err.message || 'Could not complete service');
    }
  };

  const handleNoShow = async (id) => {
    try {
      await api.put(`/queue/${id}/no-show`);
      toast.info('Marked as No-Show');
      fetchBarberState();
    } catch (err) {
      toast.error(err.message || 'Could not update status');
    }
  };

  const current = barberData?.current;
  const isAvailable = barberData?.barber?.availability === 'AVAILABLE';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header & Stylist Chair Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold font-semibold">
            Stylist Workstation
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
            {barberData?.barber?.name || t('barberPortal')}
          </h1>
        </div>

        {/* Chair switcher for Admins and Receptionists */}
        {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-mute">Active Chair:</span>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="rounded-xl border border-gray-700 bg-panel px-3 py-2 text-xs text-cream focus:border-gold"
            >
              {barbersList.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.availability})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Duty Status Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-panel/80 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-mute'
            }`}
          >
            {isAvailable ? <Scissors className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
          </div>
          <div>
            <span className="text-xs text-mute uppercase font-semibold">
              Current Duty Status
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-cream">
                {isAvailable ? t('available') : t('onBreak')}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleAvailability}
          className={`rounded-xl border px-5 py-2.5 text-xs font-bold transition-colors ${
            isAvailable
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          {isAvailable ? t('setOnBreak') : t('setAvailable')}
        </button>
      </div>

      {/* Main Focus: Current Customer In Chair */}
      <div className="mb-8 rounded-3xl border border-gray-800 bg-panel/90 p-6 sm:p-8 shadow-card">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gold mb-6 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> {t('currentGuest')}
        </h2>

        {current ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-ink/80 p-6 border border-gray-800">
              <div>
                <span className="text-xs text-mute uppercase tracking-widest font-semibold">
                  Active Guest Token
                </span>
                <div className="font-display text-5xl font-extrabold text-gold tracking-wider my-1">
                  {current.token}
                </div>
                <div className="text-sm font-semibold text-cream">
                  {current.customer?.name} ({current.customer?.phone})
                </div>
              </div>

              <div className="sm:text-right">
                <StatusBadge status={current.status} size="lg" />
                <div className="mt-2 text-xs text-mute">
                  Joined: {formatTime(current.joinedAt)}
                </div>
              </div>
            </div>

            {/* Services checklist */}
            <div>
              <span className="text-xs font-semibold text-mute uppercase tracking-wider block mb-2">
                Requested Services:
              </span>
              <div className="flex flex-wrap gap-2">
                {(current.services || []).map((srv, idx) => (
                  <span
                    key={idx}
                    className="rounded-xl border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs text-gray-200"
                  >
                    {srv.name} • {srv.duration} mins • {formatCurrency(srv.price)}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons depending on state */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-800">
              {current.status === 'CALLED' && (
                <>
                  <button
                    type="button"
                    onClick={handleStartService}
                    className="flex-1 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-ink hover:brightness-110 shadow-md shadow-emerald-500/20"
                  >
                    {t('startService')} (In Chair)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNoShow(current.id)}
                    className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20"
                  >
                    {t('markNoShow')}
                  </button>
                </>
              )}

              {current.status === 'IN_CHAIR' && (
                <button
                  type="button"
                  onClick={handleCompleteService}
                  className="flex-1 rounded-xl bg-gold py-3.5 text-sm font-bold text-ink hover:brightness-110 shadow-md shadow-gold/20"
                >
                  <CheckCircle className="inline mr-1.5 h-4 w-4" />
                  {t('finishService')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-base font-semibold text-mute mb-4">
              Your chair is currently empty.
            </p>
            <button
              type="button"
              onClick={handleCallNext}
              disabled={!isAvailable}
              className="rounded-xl bg-gold px-8 py-3.5 text-sm font-bold text-ink hover:brightness-110 disabled:opacity-40 transition-all shadow-md shadow-gold/20"
            >
              <PhoneCall className="inline mr-2 h-4 w-4" />
              {t('callNextCustomer')}
            </button>
          </div>
        )}
      </div>

      {/* Up Next Preview for this Stylist */}
      {barberData?.next && (
        <div className="rounded-2xl border border-gray-800 bg-panel/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-mute block mb-2">
            {t('nextInLineForYou')}
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl font-bold text-gold">
                {barberData.next.token}
              </span>
              <span className="text-xs text-cream font-medium">
                {barberData.next.customer?.name}
              </span>
            </div>
            <span className="text-xs text-amber-400">
              Est. Duration: {barberData.next.totalDuration}m
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
