import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Phone,
  Scissors,
  Clock,
  Check,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import TokenCard from '../../components/queue/TokenCard.jsx';
import { toast } from 'sonner';

export default function JoinQueuePage() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [salonSettings, setSalonSettings] = useState(null);
  const [onlineJoinOpen, setOnlineJoinOpen] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [preferredBarberId, setPreferredBarberId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [estimateData, setEstimateData] = useState({
    totalDuration: 0,
    totalPrice: 0,
    estimatedWait: 0,
  });

  // Successful submission result
  const [createdEntry, setCreatedEntry] = useState(null);

  useEffect(() => {
    // Fetch initial services & barbers & home status
    Promise.all([
      api.get('/services'),
      api.get('/barbers'),
      api.get('/public/home'),
    ])
      .then(([srvRes, brbRes, homeRes]) => {
        setServices(srvRes.data?.data || []);
        if (homeRes.data?.data) {
          setBarbers(homeRes.data.data.barbers || brbRes.data?.data || []);
          setOnlineJoinOpen(homeRes.data.data.onlineJoinOpen);
          setSalonSettings(homeRes.data.data.settings);
        } else {
          setBarbers(brbRes.data?.data || []);
        }
      })
      .catch((err) => {
        console.error('Error loading data:', err);
      });
  }, []);

  // Update estimate when services or barber preference changes
  useEffect(() => {
    if (selectedServices.length === 0) {
      setEstimateData({ totalDuration: 0, totalPrice: 0, estimatedWait: 0 });
      return;
    }

    api
      .post('/queue/estimate', {
        serviceIds: selectedServices,
        preferredBarberId: preferredBarberId || null,
      })
      .then((res) => {
        if (res.data?.data) {
          setEstimateData(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Estimate error:', err);
      });
  }, [selectedServices, preferredBarberId]);

  const toggleService = (id) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((sId) => sId !== id));
    } else {
      if (selectedServices.length >= 3) {
        toast.warning('Maximum 3 services can be selected per token');
        return;
      }
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      toast.error('Please enter a valid full name');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Please select at least 1 service');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        serviceIds: selectedServices,
        preferredBarberId: preferredBarberId || null,
      };

      const res = await api.post('/queue/join', payload);
      if (res.data?.data) {
        setCreatedEntry(res.data.data);
        if (res.data.alreadyActive) {
          toast.info(t('alreadyHasToken'));
        } else {
          toast.success('Successfully joined the queue!');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to join queue');
    } finally {
      setSubmitting(false);
    }
  };

  // If already created, render confirmation card
  if (createdEntry) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold text-cream">
            Token Confirmed!
          </h1>
          <p className="text-sm text-mute mt-1">
            Keep this screen open or save your token number to track progress live.
          </p>
        </div>

        <TokenCard entry={createdEntry} />

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate(`/track?q=${createdEntry.token}`)}
            className="flex-1 rounded-xl bg-gold py-3 text-center text-sm font-bold text-ink hover:brightness-110"
          >
            Go to Live Tracker
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatedEntry(null);
              setName('');
              setPhone('');
              setSelectedServices([]);
            }}
            className="flex-1 rounded-xl border border-gray-700 bg-panel py-3 text-center text-sm font-medium text-cream hover:bg-gray-800"
          >
            Book Another Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-widest text-gold font-semibold">
          {t('salonName')}
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-cream mt-1">
          {t('joinTitle')}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-mute">{t('joinSubtitle')}</p>
      </div>

      {!onlineJoinOpen && (
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-400 mb-2" />
          <h3 className="text-base font-bold text-amber-300">{t('onlineQueueClosed')}</h3>
          <p className="text-xs text-amber-200/80 mt-1 max-w-md mx-auto">
            Online queue reservations close 30 minutes before salon closing time. You can still visit our salon as a walk-in guest!
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-gray-800 bg-panel/80 p-6 sm:p-10 shadow-card"
      >
        <div className="space-y-8">
          {/* Section 1: Customer Details */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold mb-4 flex items-center gap-1.5">
              <User className="h-4 w-4" /> 1. Contact Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-ink px-4 py-3 text-sm text-cream placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  {t('phoneLabel')} *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder={t('phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-gray-700 bg-ink px-4 py-3 text-sm text-cream placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <span className="text-[11px] text-mute mt-1 block">
                  Token alerts and live progress link will be sent to this number.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Services Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <Scissors className="h-4 w-4" /> 2. {t('selectServices')} *
              </h2>
              <span className="text-xs text-mute font-medium">
                {selectedServices.length}/3 Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service._id);
                const sName =
                  language === 'gu' && service.nameGujarati
                    ? service.nameGujarati
                    : service.name;

                return (
                  <button
                    key={service._id}
                    type="button"
                    onClick={() => toggleService(service._id)}
                    className={`text-left rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-gold bg-gold/10 ring-1 ring-gold shadow-md'
                        : 'border-gray-800 bg-ink/70 hover:border-gray-700 hover:bg-ink'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-cream text-sm">{sName}</span>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-gold bg-gold text-ink'
                              : 'border-gray-700 bg-gray-800 text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      </div>
                      <p className="text-[11px] text-mute mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-800/80 pt-2 text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-400" />
                        {service.duration} {t('minutes')}
                      </span>
                      <span className="font-bold text-gold">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Stylist Preference */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold mb-3 flex items-center gap-1.5">
              <User className="h-4 w-4" /> 3. {t('preferredStylist')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setPreferredBarberId('')}
                className={`rounded-xl border p-3.5 text-center text-xs font-medium transition-all ${
                  preferredBarberId === ''
                    ? 'border-gold bg-gold/10 text-gold ring-1 ring-gold'
                    : 'border-gray-800 bg-ink/70 text-gray-300 hover:bg-ink'
                }`}
              >
                <div className="font-bold">{t('anyStylist')}</div>
                <div className="text-[10px] text-mute mt-0.5">Next available chair</div>
              </button>

              {barbers.map((barber) => {
                const bId = barber.id || barber._id;
                const isSelected = preferredBarberId === bId;
                const isBusy = barber.duty === 'BUSY';
                const isOnBreak = barber.duty === 'ON_BREAK' || barber.availability === 'ON_BREAK';

                return (
                  <button
                    key={bId}
                    type="button"
                    onClick={() => setPreferredBarberId(bId)}
                    className={`rounded-xl border p-3.5 text-center text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-gold bg-gold/10 text-gold ring-1 ring-gold'
                        : 'border-gray-800 bg-ink/70 text-gray-300 hover:bg-ink'
                    }`}
                  >
                    <div className="font-bold">{barber.name}</div>
                    <div className="text-[10px] text-mute mt-0.5">
                      {isBusy ? `In chair (${barber.currentToken})` : isOnBreak ? 'On Break' : 'Available now'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary & Live Estimate Card */}
          {selectedServices.length > 0 && (
            <div className="rounded-2xl border border-gray-700/80 bg-ink/90 p-5 shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-mute block">
                    {t('totalEstimatedTime')}
                  </span>
                  <span className="font-display text-2xl font-bold text-cream">
                    {estimateData.totalDuration} mins
                  </span>
                </div>
                <div className="sm:border-x border-gray-800">
                  <span className="text-[11px] uppercase tracking-wider text-mute block">
                    {t('totalEstimatedPrice')}
                  </span>
                  <span className="font-display text-2xl font-bold text-gold">
                    {formatCurrency(estimateData.totalPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-mute block">
                    {t('estimatedWaitTime')}
                  </span>
                  <span className="font-display text-2xl font-bold text-amber-400">
                    ~{estimateData.estimatedWait} mins
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !onlineJoinOpen}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 py-4 text-base font-bold text-ink shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 transition-all hover:scale-[1.01]"
          >
            {submitting ? 'Generating Token...' : t('joinSubmitBtn')}
          </button>
        </div>
      </form>
    </div>
  );
}
