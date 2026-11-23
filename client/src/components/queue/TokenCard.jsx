import React from 'react';
import { Clock, User, Scissors, Calendar, Share2, CheckCircle2, AlertCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency, formatTime } from '../../utils/formatters.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { toast } from 'sonner';

export default function TokenCard({ entry, onCancel, showActions = true }) {
  const { language, t } = useLanguage();

  if (!entry) return null;

  const isCalled = entry.status === 'CALLED';
  const isServing = entry.status === 'IN_CHAIR';
  const isDone = entry.status === 'DONE';
  const isWaiting = entry.status === 'WAITING';

  const copyTrackingLink = () => {
    const url = `${window.location.origin}/track?q=${entry.token}`;
    navigator.clipboard.writeText(url);
    toast.success('Tracking link copied to clipboard!');
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-panel/90 p-6 shadow-card transition-all ${
        isCalled
          ? 'border-yellow-400 animate-gold-pulse ring-2 ring-yellow-400/30'
          : isServing
          ? 'border-emerald-500/50'
          : 'border-gray-800'
      }`}
    >
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />

      {/* Header with Token & Status */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-mute">
            {t('tokenLabel')}
          </span>
          <div className="font-display text-4xl font-extrabold text-gold tracking-wider">
            {entry.token}
          </div>
        </div>
        <div className="text-right">
          <StatusBadge status={entry.status} size="lg" />
          <div className="mt-1 text-xs text-mute flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(entry.joinedAt)}
          </div>
        </div>
      </div>

      {/* Dynamic Announcement Banner if Called or Near */}
      {isCalled && (
        <div className="mb-4 rounded-xl bg-yellow-500/20 border border-yellow-400/40 p-3.5 text-center">
          <p className="text-sm font-bold text-yellow-300 animate-pulse">
            🔔 {t('calledAlert')}
          </p>
          {entry.assignedBarber?.name && (
            <p className="text-xs text-yellow-200 mt-0.5">
              Please proceed to <strong>{entry.assignedBarber.name}</strong>
            </p>
          )}
        </div>
      )}

      {isWaiting && entry.queuePosition === 1 && (
        <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-center">
          <p className="text-xs font-semibold text-amber-300">
            ⏳ {t('turnSoonAlert')}
          </p>
        </div>
      )}

      {/* Main Metrics: Position & Estimate */}
      {isWaiting && (
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-ink/60 p-3.5 border border-gray-800/80">
          <div className="text-center">
            <span className="block text-[10px] uppercase tracking-wider text-mute">
              {t('yourPosition')}
            </span>
            <span className="font-display text-2xl font-bold text-cream">
              #{entry.queuePosition || 1}
            </span>
          </div>
          <div className="text-center border-l border-gray-800">
            <span className="block text-[10px] uppercase tracking-wider text-mute">
              {t('approxWait')}
            </span>
            <span className="font-display text-2xl font-bold text-amber-400">
              ~{entry.estimatedWait != null ? entry.estimatedWait : 15}{' '}
              <span className="text-xs font-sans text-mute">{t('minutes')}</span>
            </span>
          </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="space-y-2.5 border-t border-gray-800/80 pt-4 text-xs">
        {entry.customer && (
          <div className="flex items-center justify-between text-mute">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-500" />
              Client
            </span>
            <span className="font-medium text-cream">{entry.customer.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-mute">
          <span className="flex items-center gap-1.5">
            <Scissors className="h-3.5 w-3.5 text-gray-500" />
            {t('assignedBarber')}
          </span>
          <span className="font-medium text-cream">
            {entry.assignedBarber?.name || entry.preferredBarber?.name || t('anyStylist')}
          </span>
        </div>

        {/* Services List */}
        <div className="pt-1">
          <span className="text-[11px] font-semibold text-mute uppercase tracking-wider block mb-1.5">
            {t('selectedServices')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(entry.services || []).map((service, index) => {
              const name =
                language === 'gu' && service.nameGujarati ? service.nameGujarati : service.name;
              return (
                <span
                  key={index}
                  className="rounded-lg bg-gray-800/70 border border-gray-700/60 px-2.5 py-1 text-xs text-gray-300"
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Pricing & Duration */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
          <span className="text-mute">
            Est. Duration: <strong className="text-cream">{entry.totalDuration} mins</strong>
          </span>
          <span className="font-bold text-gold text-sm">
            {formatCurrency(entry.totalPrice)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-5 flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={copyTrackingLink}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-mute hover:bg-gray-800 hover:text-cream transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Link
          </button>

          {isWaiting && onCancel && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('cancelConfirmPrompt'))) {
                  onCancel(entry.id || entry._id);
                }
              }}
              className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              {t('cancelTokenBtn')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
