import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  Scissors,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { toast } from 'sonner';

const PIE_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6B7280'];

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('analytics');

  const [analytics, setAnalytics] = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // New Service modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    nameGujarati: '',
    description: '',
    duration: 30,
    price: 150,
  });

  const fetchDashboardData = async () => {
    try {
      const [anRes, srvRes, brbRes, setRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/services?all=1'),
        api.get('/barbers?all=1'),
        api.get('/admin/settings'),
      ]);
      setAnalytics(anRes.data?.data);
      setServices(srvRes.data?.data || []);
      setBarbers(brbRes.data?.data || []);
      setSettings(setRes.data?.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Salon operational settings saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.put(`/services/${editingService._id}`, serviceForm);
        toast.success('Service updated');
      } else {
        await api.post('/services', serviceForm);
        toast.success('New service created');
      }
      setServiceModalOpen(false);
      setEditingService(null);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Error saving service');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Deactivate this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Service deactivated');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Error deleting service');
    }
  };

  const today = analytics?.today || {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold font-semibold">
            Executive Control
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
            {t('adminDashboard')}
          </h1>
          <p className="text-xs text-mute mt-1">Real-time salon metrics and resource settings</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-2xl border border-gray-800 bg-panel/80 p-1.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`rounded-xl px-4 py-2 transition-all ${
              activeTab === 'analytics' ? 'bg-gold font-bold text-ink' : 'text-mute hover:text-cream'
            }`}
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`rounded-xl px-4 py-2 transition-all ${
              activeTab === 'services' ? 'bg-gold font-bold text-ink' : 'text-mute hover:text-cream'
            }`}
          >
            {t('manageServicesTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('barbers')}
            className={`rounded-xl px-4 py-2 transition-all ${
              activeTab === 'barbers' ? 'bg-gold font-bold text-ink' : 'text-mute hover:text-cream'
            }`}
          >
            {t('manageBarbersTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`rounded-xl px-4 py-2 transition-all ${
              activeTab === 'settings' ? 'bg-gold font-bold text-ink' : 'text-mute hover:text-cream'
            }`}
          >
            {t('salonSettingsTab')}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-800 bg-panel/70 p-5 shadow-card">
          <span className="flex items-center gap-1 text-xs text-mute mb-1">
            <DollarSign className="h-4 w-4 text-gold" />
            {t('todayRevenue')}
          </span>
          <span className="font-display text-3xl font-bold text-gold">
            {formatCurrency(today.revenue || 0)}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-panel/70 p-5 shadow-card">
          <span className="flex items-center gap-1 text-xs text-mute mb-1">
            <Users className="h-4 w-4 text-emerald-400" />
            Completed Guests
          </span>
          <span className="font-display text-3xl font-bold text-cream">
            {today.completed || 0}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-panel/70 p-5 shadow-card">
          <span className="flex items-center gap-1 text-xs text-mute mb-1">
            <Clock className="h-4 w-4 text-amber-400" />
            {t('averageWaitTime')}
          </span>
          <span className="font-display text-3xl font-bold text-amber-400">
            {today.averageWait || 0}m
          </span>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-panel/70 p-5 shadow-card">
          <span className="flex items-center gap-1 text-xs text-mute mb-1">
            <Scissors className="h-4 w-4 text-blue-400" />
            Avg Service Time
          </span>
          <span className="font-display text-3xl font-bold text-blue-400">
            {today.averageService || 0}m
          </span>
        </div>
      </div>

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Revenue Trend */}
            <div className="rounded-3xl border border-gray-800 bg-panel/80 p-6 shadow-card">
              <h3 className="font-semibold text-cream text-sm mb-4">
                7-Day Daily Revenue & Volume
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.daily || []}>
                    <XAxis dataKey="date" stroke="#6B7280" fontSize={11} />
                    <YAxis stroke="#6B7280" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }}
                    />
                    <Bar dataKey="revenue" fill="#D4A017" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Breakdown Pie */}
            <div className="rounded-3xl border border-gray-800 bg-panel/80 p-6 shadow-card">
              <h3 className="font-semibold text-cream text-sm mb-4">
                Today's Queue Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.statusDistribution || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {(analytics?.statusDistribution || []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Services Manager */}
      {activeTab === 'services' && (
        <div className="rounded-3xl border border-gray-800 bg-panel/80 p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-bold text-cream">
              Services Catalog ({services.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingService(null);
                setServiceForm({
                  name: '',
                  nameGujarati: '',
                  description: '',
                  duration: 30,
                  price: 150,
                });
                setServiceModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              {t('addService')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-800 text-mute uppercase text-[11px]">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Gujarati Name</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {services.map((s) => (
                  <tr key={s._id} className="hover:bg-ink/30">
                    <td className="py-3 font-semibold text-cream">{s.name}</td>
                    <td className="py-3 font-gujarati text-gray-300">{s.nameGujarati}</td>
                    <td className="py-3 text-mute">{s.duration} mins</td>
                    <td className="py-3 font-bold text-gold">{formatCurrency(s.price)}</td>
                    <td className="py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          s.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-mute'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingService(s);
                            setServiceForm({
                              name: s.name,
                              nameGujarati: s.nameGujarati,
                              description: s.description || '',
                              duration: s.duration,
                              price: s.price,
                            });
                            setServiceModalOpen(true);
                          }}
                          className="rounded p-1 text-gray-400 hover:text-gold"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {s.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteService(s._id)}
                            className="rounded p-1 text-gray-400 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Barbers Manager */}
      {activeTab === 'barbers' && (
        <div className="rounded-3xl border border-gray-800 bg-panel/80 p-6 shadow-card">
          <h3 className="font-display text-xl font-bold text-cream mb-6">
            Stylist Team Roster
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {barbers.map((b) => (
              <div
                key={b._id}
                className="rounded-2xl border border-gray-800 bg-ink/70 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-cream text-base">{b.name}</h4>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        b.availability === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gray-800 text-mute'
                      }`}
                    >
                      {b.availability}
                    </span>
                  </div>
                  <p className="text-xs text-mute">
                    Hours: {b.workingHours?.start} - {b.workingHours?.end}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && settings && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-3xl border border-gray-800 bg-panel/80 p-6 sm:p-8 shadow-card max-w-2xl space-y-5"
        >
          <h3 className="font-display text-xl font-bold text-cream mb-4">
            Salon Operational Rules
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Salon Name
            </label>
            <input
              type="text"
              value={settings.salonName || ''}
              onChange={(e) => setSettings({ ...settings, salonName: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-sm text-cream"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Opening Time (HH:mm)
              </label>
              <input
                type="text"
                value={settings.openingTime || ''}
                onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-sm text-cream"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Closing Time (HH:mm)
              </label>
              <input
                type="text"
                value={settings.closingTime || ''}
                onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-sm text-cream"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="onlineQueueOpen"
              checked={settings.onlineQueueOpen}
              onChange={(e) => setSettings({ ...settings, onlineQueueOpen: e.target.checked })}
              className="h-4 w-4 rounded border-gray-700 bg-ink text-gold focus:ring-gold"
            />
            <label htmlFor="onlineQueueOpen" className="text-xs text-gray-300 font-medium">
              Accept Online Queue Registrations
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Online Cutoff Before Close (mins)
              </label>
              <input
                type="number"
                value={settings.onlineQueueClosingMinutes || 30}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    onlineQueueClosingMinutes: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-sm text-cream"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                No-Show Grace Period (mins)
              </label>
              <input
                type="number"
                value={settings.noShowGraceMinutes || 10}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    noShowGraceMinutes: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-sm text-cream"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="mt-6 flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-xs font-bold text-ink hover:brightness-110 shadow-md shadow-gold/20"
          >
            <Save className="h-4 w-4" />
            {savingSettings ? 'Saving...' : t('saveChanges')}
          </button>
        </form>
      )}

      {/* Add / Edit Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-panel p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-cream mb-4">
              {editingService ? 'Edit Service' : t('addService')}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 uppercase mb-1">
                  Service Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-cream"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase mb-1">
                  Service Name (Gujarati) *
                </label>
                <input
                  type="text"
                  required
                  value={serviceForm.nameGujarati}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, nameGujarati: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-cream font-gujarati"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 uppercase mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={serviceForm.duration}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, duration: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-cream"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 uppercase mb-1">
                    Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, price: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-cream"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-700 bg-ink px-3 py-2 text-cream"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="rounded-xl border border-gray-700 px-4 py-2 text-mute hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gold px-5 py-2 font-bold text-ink hover:brightness-110"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
