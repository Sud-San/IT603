import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';

export default function HomePage() {
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHome = async () => {
    try {
      const res = await api.get('/public/home');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHome();
    const socket = getSocket();
    const handleUpdate = () => fetchHome();

    socket.on('queue:updated', handleUpdate);
    socket.on('salon:settings-updated', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('salon:settings-updated', handleUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-800/80 bg-gradient-to-b from-[#131A26] to-[#0B0F17] py-16 sm:py-24">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          {/* Status Badges */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-gray-800 bg-panel/80 px-4 py-1.5 shadow-md mb-6">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              {data?.salonOpen ? t('statusOpen') : t('statusClosed')}
            </span>
            <span className="text-gray-700">•</span>
            <span
              className={`text-xs font-medium ${
                data?.onlineJoinOpen ? 'text-amber-400' : 'text-gray-400'
              }`}
            >
              {data?.onlineJoinOpen ? t('onlineQueueOpen') : t('onlineQueueClosed')}
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-cream max-w-4xl mx-auto leading-tight">
            {t('welcomeTitle')}
          </h1>
          <p className="mt-6 text-base sm:text-lg text-mute max-w-2xl mx-auto leading-relaxed">
            {t('welcomeSub')}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-10 mx-auto max-w-3xl grid grid-cols-2 sm:grid-cols-3 gap-3 p-2 rounded-2xl border border-gray-800 bg-panel/70 backdrop-blur-md shadow-card">
            <div className="p-4 text-center">
              <span className="flex items-center justify-center gap-1.5 text-xs text-mute mb-1">
                <Users className="h-3.5 w-3.5 text-gold" />
                {t('waitingNow')}
              </span>
              <span className="font-display text-3xl font-bold text-cream">
                {data?.waitingCount ?? 0}
              </span>
            </div>

            <div className="p-4 text-center sm:border-x border-gray-800">
              <span className="flex items-center justify-center gap-1.5 text-xs text-mute mb-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {t('approxWait')}
              </span>
              <span className="font-display text-3xl font-bold text-amber-400">
                ~{data?.approximateWait ?? 0}{' '}
                <span className="text-xs font-sans text-mute">{t('minutes')}</span>
              </span>
            </div>

            <div className="p-4 text-center col-span-2 sm:col-span-1 border-t sm:border-t-0 border-gray-800">
              <span className="flex items-center justify-center gap-1.5 text-xs text-mute mb-1">
                <Scissors className="h-3.5 w-3.5 text-gold" />
                {t('activeStylists')}
              </span>
              <span className="font-display text-3xl font-bold text-cream">
                {data?.barbers?.length ?? 0}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/join"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-base font-semibold text-ink shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="h-5 w-5" />
              {t('joinQueue')}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/track"
              className="flex items-center gap-2 rounded-xl border border-gray-700 bg-panel px-6 py-3.5 text-base font-medium text-cream hover:bg-gray-800 transition-colors"
            >
              <Search className="h-4 w-4 text-gold" />
              {t('trackToken')}
            </Link>

            <Link
              to="/board"
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-3.5 text-base font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Monitor className="h-4 w-4" />
              {t('liveBoard')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stylists Live Duty Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-gold font-semibold">
            {t('salonName')}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-cream mt-1">
            {t('meetBarbers')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.barbers || []).map((barber) => {
            const isAvailable = barber.duty === 'AVAILABLE';
            const isBusy = barber.duty === 'BUSY';
            const isOnBreak = barber.duty === 'ON_BREAK';

            return (
              <div
                key={barber.id}
                className="rounded-2xl border border-gray-800 bg-panel/70 p-6 shadow-card hover:border-gray-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 border border-gray-700 text-gold font-display text-xl font-bold">
                      {barber.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-cream text-base">{barber.name}</h3>
                      <p className="text-xs text-mute">
                        {barber.workingHours?.start} - {barber.workingHours?.end}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isBusy
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isAvailable ? t('available') : isBusy ? t('busy') : t('onBreak')}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-ink/60 p-3.5 border border-gray-800/80 flex items-center justify-between text-xs">
                  <span className="text-mute">{t('nowServing')}:</span>
                  {barber.currentToken ? (
                    <span className="font-display font-bold text-gold text-base tracking-wider animate-pulse">
                      {barber.currentToken}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-medium">{t('noActiveCustomer')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Services Showcase */}
      <section className="border-t border-gray-800 bg-[#090D14] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-gold font-semibold">
                Menu & Pricing
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-cream mt-1">
                {t('exploreServices')}
              </h2>
            </div>
            <Link
              to="/join"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:underline"
            >
              {t('joinQueue')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data?.services || []).map((service) => {
              const name =
                language === 'gu' && service.nameGujarati ? service.nameGujarati : service.name;
              return (
                <div
                  key={service._id}
                  className="rounded-2xl border border-gray-800 bg-panel/60 p-5 hover:border-gold/40 hover:bg-panel transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-cream text-base group-hover:text-gold transition-colors">
                      {name}
                    </h3>
                    <span className="font-bold text-gold text-base">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  <p className="text-xs text-mute line-clamp-2 mb-4">
                    {service.description || 'Premium salon experience'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 border-t border-gray-800/80 pt-3">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      {service.duration} {t('minutes')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
