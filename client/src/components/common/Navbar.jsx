import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, Monitor, QrCode, Search, LogIn, LogOut, User, Menu, X, Shield, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-ink shadow-md shadow-amber-500/20 transition-transform group-hover:scale-105">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold tracking-tight text-cream">
              Aurelia <span className="text-gold">Salon</span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-mute">
              Smart Queue
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive('/') ? 'bg-panel text-gold' : 'text-gray-300 hover:text-white'
              }`}
          >
            {t('home')}
          </Link>
          <Link
            to="/join"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive('/join') ? 'bg-panel text-gold' : 'text-gray-300 hover:text-white'
              }`}
          >
            {t('joinQueue')}
          </Link>
          <Link
            to="/track"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive('/track') ? 'bg-panel text-gold' : 'text-gray-300 hover:text-white'
              }`}
          >
            {t('trackToken')}
          </Link>
          <Link
            to="/board"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive('/board') ? 'bg-amber-500/20 text-gold border border-amber-500/30' : 'text-gray-300 hover:text-white'
              }`}
          >
            <Monitor className="h-4 w-4" />
            {t('liveBoard')}
          </Link>

          {/* Staff shortcuts if logged in */}
          {user && (
            <div className="ml-2 flex items-center gap-1 border-l border-gray-800 pl-3">
              {(user.role === 'RECEPTIONIST') && (
                <Link
                  to="/reception"
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${isActive('/reception') ? 'bg-panel text-gold' : 'text-gray-400 hover:text-cream'
                    }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  {t('reception')}
                </Link>
              )}
              {(user.role === 'BARBER') && (
                <Link
                  to="/barber"
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${isActive('/barber') ? 'bg-panel text-gold' : 'text-gray-400 hover:text-cream'
                    }`}
                >
                  <Scissors className="h-3.5 w-3.5" />
                  {t('barberPortal')}
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${isActive('/admin') ? 'bg-panel text-gold' : 'text-gray-400 hover:text-cream'
                    }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  {t('adminDashboard')}
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Right side: Language Switch + User / Login */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Language selector */}
          <div className="flex items-center rounded-lg bg-panel p-1 border border-gray-800 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded px-2 py-1 transition-all ${language === 'en' ? 'bg-gold font-bold text-ink' : 'text-mute hover:text-cream'
                }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('gu')}
              className={`rounded px-2 py-1 transition-all font-gujarati ${language === 'gu' ? 'bg-gold font-bold text-ink' : 'text-mute hover:text-cream'
                }`}
            >
              ગુજરાતી
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-mute">
                <User className="h-3.5 w-3.5 text-gold" />
                <span className="max-w-[120px] truncate text-cream">{user.name}</span>
                <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gold uppercase">
                  {user.role}
                </span>
              </span>
              <button
                type="button"
                onClick={logout}
                title={t('logout')}
                className="rounded-lg border border-gray-700 p-2 text-mute hover:bg-gray-800 hover:text-cream transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-lg border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/10"
            >
              <LogIn className="h-3.5 w-3.5" />
              {t('staffLogin')}
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center rounded-lg bg-panel p-0.5 border border-gray-800 text-xs">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
              className="rounded px-2 py-1 font-bold text-gold"
            >
              {language === 'en' ? 'ગુજ' : 'EN'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-mute hover:bg-panel hover:text-cream"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-800 bg-[#0B0F17] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-cream hover:bg-panel"
            >
              {t('home')}
            </Link>
            <Link
              to="/join"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-gold hover:bg-panel"
            >
              {t('joinQueue')}
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-cream hover:bg-panel"
            >
              {t('trackToken')}
            </Link>
            <Link
              to="/board"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-amber-400 hover:bg-panel"
            >
              {t('liveBoard')}
            </Link>

            {user ? (
              <div className="mt-3 border-t border-gray-800 pt-3 flex flex-col gap-2">
                <div className="px-3 text-xs text-mute">
                  Signed in as <strong className="text-cream">{user.name}</strong> ({user.role})
                </div>
                {(user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                  <Link
                    to="/reception"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-cream hover:bg-panel"
                  >
                    {t('reception')}
                  </Link>
                )}
                {(user.role === 'ADMIN' || user.role === 'BARBER') && (
                  <Link
                    to="/barber"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-cream hover:bg-panel"
                  >
                    {t('barberPortal')}
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-cream hover:bg-panel"
                  >
                    {t('adminDashboard')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 text-left rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-panel"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="mt-3 border-t border-gray-800 pt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center rounded-lg border border-gold/40 py-2 text-sm font-semibold text-gold"
                >
                  {t('staffLogin')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
