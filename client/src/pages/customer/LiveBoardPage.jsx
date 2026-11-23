import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Clock,
  Maximize2,
  Minimize2,
  Scissors,
  Users,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { playChime } from '../../utils/sound.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function LiveBoardPage() {
  const { t } = useLanguage();
  const [boardData, setBoardData] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchBoard = async () => {
    try {
      const res = await api.get('/public/board');
      if (res.data?.data) {
        setBoardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load board:', err);
    }
  };

  useEffect(() => {
    fetchBoard();

    // Clock ticker every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const socket = getSocket();
    socket.emit('watch:display');

    const handleUpdate = (payload) => {
      if (payload?.event === 'token:called' || payload?.status === 'CALLED') {
        if (soundEnabled) playChime();
      }
      fetchBoard();
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('token:called', handleUpdate);
    socket.on('service:started', handleUpdate);
    socket.on('service:completed', handleUpdate);

    return () => {
      clearInterval(timer);
      socket.off('queue:updated', handleUpdate);
      socket.off('token:called', handleUpdate);
      socket.off('service:started', handleUpdate);
      socket.off('service:completed', handleUpdate);
    };
  }, [soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-cream flex flex-col p-4 sm:p-8">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between border-b border-gray-800/80 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-ink shadow-lg shadow-amber-500/20">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-cream tracking-tight">
              {boardData?.salonName || 'Aurelia Salon'}
            </h1>
            <p className="text-xs uppercase tracking-widest text-gold font-semibold">
              Live Queue Display Board
            </p>
          </div>
        </div>

        {/* Center / Right controls: Sound Toggle, Clock, Fullscreen */}
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
              soundEnabled
                ? 'border-gold/40 bg-gold/10 text-gold'
                : 'border-gray-800 bg-panel text-mute'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? 'Chime ON' : 'Chime Muted'}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-xl border border-gray-800 bg-panel p-2.5 text-mute hover:text-cream transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <div className="rounded-2xl border border-gray-800 bg-panel/80 px-5 py-2 text-right">
            <span className="block text-[10px] uppercase tracking-wider text-mute">
              Local Time
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-cream">
              {currentTime.toLocaleTimeString([], { hour12: true })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid: Now Serving (Barbers) vs Up Next */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: Stylist Chairs (Now Serving) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm uppercase tracking-wider text-gold font-bold">
              <Sparkles className="h-4 w-4" />
              {t('nowServing')}
            </h2>
            <span className="text-xs text-mute">
              {boardData?.barbers?.length || 0} Chairs Configured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(boardData?.barbers || []).map((barber) => {
              const serving = barber.nowServing;
              const isCalled = serving?.status === 'CALLED';

              return (
                <div
                  key={barber.id}
                  className={`relative flex flex-col justify-between rounded-3xl border bg-panel/90 p-6 shadow-card transition-all ${
                    isCalled
                      ? 'border-yellow-400 ring-4 ring-yellow-400/20 animate-gold-pulse'
                      : serving
                      ? 'border-emerald-500/40'
                      : 'border-gray-800/80'
                  }`}
                >
                  {/* Top: Barber name and duty badge */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-mute font-semibold">
                          Stylist Chair
                        </span>
                        <h3 className="font-display text-2xl font-bold text-cream">
                          {barber.name}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                          barber.duty === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : barber.duty === 'ON_BREAK'
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {barber.duty}
                      </span>
                    </div>

                    {/* Middle: Active Token Display */}
                    <div className="my-6 rounded-2xl bg-ink/80 p-5 text-center border border-gray-800">
                      {serving ? (
                        <>
                          <span className="text-[11px] uppercase tracking-widest text-mute block mb-1">
                            Token In Chair
                          </span>
                          <span className="font-display text-5xl font-extrabold text-gold tracking-widest">
                            {serving.token}
                          </span>
                          <div className="mt-3">
                            <StatusBadge status={serving.status} size="sm" />
                          </div>
                        </>
                      ) : (
                        <div className="py-4">
                          <span className="font-display text-2xl font-bold text-gray-500">
                            Available
                          </span>
                          <span className="block text-xs text-gray-600 mt-1">
                            Ready for next guest
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Services */}
                  {serving?.services && (
                    <div className="border-t border-gray-800/80 pt-3">
                      <span className="text-[10px] text-mute uppercase tracking-wider block mb-1">
                        Services
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {serving.services.map((s, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Up Next in Queue */}
        <div className="lg:col-span-4 flex flex-col gap-4 rounded-3xl border border-gray-800 bg-panel/70 p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="flex items-center gap-2 text-sm uppercase tracking-wider text-amber-400 font-bold">
              <Users className="h-4 w-4" />
              {t('upNext')}
            </h2>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              {boardData?.waitingCount || 0} Waiting
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {(boardData?.nextTokens || []).length === 0 ? (
              <div className="py-12 text-center text-xs text-mute">
                No guests currently in queue line.
              </div>
            ) : (
              (boardData?.nextTokens || []).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-gray-800 bg-ink/70 p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800 font-mono text-xs font-bold text-mute">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="font-display text-2xl font-bold text-gold tracking-wide">
                        {item.token}
                      </span>
                      <span className="block text-xs text-mute mt-0.5">
                        Pref: {item.preferredBarber || 'Any'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-amber-400">
                      ~{item.estimatedWait != null ? item.estimatedWait : 10}m
                    </span>
                    <span className="block text-[10px] text-mute uppercase">Wait Est.</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Join Callout */}
          <div className="mt-auto border-t border-gray-800 pt-4 text-center">
            <p className="text-xs text-mute">
              Scan QR code in salon or visit <strong className="text-gold">our website</strong> to join the line from your phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
