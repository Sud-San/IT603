import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Clock, RefreshCw, AlertCircle, Scissors } from 'lucide-react';
import api from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { playChime } from '../../utils/sound.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import TokenCard from '../../components/queue/TokenCard.jsx';
import { toast } from 'sonner';

export default function TrackQueuePage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('token') || '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');

  const fetchTrack = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/queue/track?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.data?.data) {
        setEntry(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'No active queue token found for this search.');
      setEntry(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchTrack(initialQuery);
    }
  }, [initialQuery]);

  // Real-time socket listener
  useEffect(() => {
    if (!entry) return;

    const socket = getSocket();
    const entryId = entry.id || entry._id;

    // Join room for this customer entry
    socket.emit('watch:queue', entryId);

    const handleUpdate = (payload) => {
      // If called event
      if (payload?.event === 'token:called' || payload?.status === 'CALLED') {
        playChime();
        toast.success(`🔔 Your token ${entry.token} has been called!`);
      }
      // Re-fetch current position and status
      fetchTrack(query || entry.token);
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
  }, [entry?.id, entry?._id]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query.trim() });
    fetchTrack(query.trim());
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/queue/${id}/cancel`);
      toast.success('Your token has been cancelled');
      fetchTrack(query);
    } catch (err) {
      toast.error(err.message || 'Could not cancel token');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest text-gold font-semibold">
          {t('salonName')}
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream mt-1">
          {t('trackTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-mute mt-1.5">{t('trackSub')}</p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('trackPlaceholder')}
            className="w-full rounded-2xl border border-gray-700 bg-panel pl-12 pr-4 py-3.5 text-sm text-cream placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-gold px-6 py-3.5 text-sm font-bold text-ink hover:brightness-110 disabled:opacity-50 transition-all"
        >
          {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : t('trackSearchBtn')}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center text-sm text-rose-300">
          <AlertCircle className="mx-auto h-7 w-7 text-rose-400 mb-2" />
          {error}
        </div>
      )}

      {/* Result Token Card */}
      {entry && (
        <div>
          <TokenCard entry={entry} onCancel={handleCancel} />

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-mute">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live WebSocket sync active. Auto-refreshes when salon queue moves.
          </div>
        </div>
      )}
    </div>
  );
}
