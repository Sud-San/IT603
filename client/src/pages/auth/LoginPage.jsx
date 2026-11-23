import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Scissors,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@salon.demo');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRolePreset, setSelectedRolePreset] = useState('ADMIN');

  const from = location.state?.from?.pathname || null;

  const handlePresetSelect = (role, presetEmail, presetPassword) => {
    setSelectedRolePreset(role);
    setEmail(presetEmail);
    setPassword(presetPassword);
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Authenticated with JWT as ${user.name} (${user.role})!`);

      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'RECEPTIONIST') navigate('/reception');
        else if (user.role === 'BARBER') navigate('/barber');
        else navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-ink shadow-lg shadow-amber-500/20">
            <Scissors className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold text-cream">Staff Portal Login</h1>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-amber-400 font-medium">
            <KeyRound className="h-3.5 w-3.5" />
            <span>JWT Bearer Authentication</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-gray-800 bg-panel/90 p-8 shadow-card backdrop-blur-md">
          {/* Quick Role Fill Tabs */}
          <div className="mb-6">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-mute mb-2 text-center">
              Quick Role Presets
            </span>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-ink/80 p-1 border border-gray-800 text-xs">
              <button
                type="button"
                onClick={() => handlePresetSelect('ADMIN', 'admin@salon.demo', 'Admin@123')}
                className={`rounded-lg py-2 font-medium transition-all ${selectedRolePreset === 'ADMIN'
                    ? 'bg-gold font-bold text-ink shadow-sm'
                    : 'text-gray-400 hover:text-cream'
                  }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('RECEPTION', 'reception@salon.demo', 'Reception@123')}
                className={`rounded-lg py-2 font-medium transition-all ${selectedRolePreset === 'RECEPTION'
                    ? 'bg-gold font-bold text-ink shadow-sm'
                    : 'text-gray-400 hover:text-cream'
                  }`}
              >
                Reception
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('BARBER', 'ravi@salon.demo', 'Barber@123')}
                className={`rounded-lg py-2 font-medium transition-all ${selectedRolePreset === 'BARBER'
                    ? 'bg-gold font-bold text-ink shadow-sm'
                    : 'text-gray-400 hover:text-cream'
                  }`}
              >
                Stylist
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedRolePreset('');
                  }}
                  placeholder="name@salon.demo"
                  className="w-full rounded-xl border border-gray-700 bg-ink pl-10 pr-4 py-3 text-sm text-cream placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedRolePreset('');
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-700 bg-ink pl-10 pr-10 py-3 text-sm text-cream placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cream focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-bold text-ink hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-gold/20"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In with JWT</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Architecture Info */}

        </div>
      </div>
    </div>
  );
}
