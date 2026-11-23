import React from 'react';
import { Scissors, Clock, MapPin, Phone, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-gray-800 bg-[#090D14] text-mute text-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand & info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink">
                <Scissors className="h-4 w-4" />
              </div>
              <span className="font-display text-xl font-bold text-cream">
                Aurelia <span className="text-gold">Salon</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Experience handcrafted hair styling and luxury beard grooming with zero waiting anxiety. Live real-time queues designed for modern salons.
            </p>
          </div>

          {/* Operating hours */}
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cream mb-3">
              <Clock className="h-4 w-4 text-gold" />
              Salon Hours
            </h4>
            <div className="space-y-1 text-xs text-gray-400">
              <p className="flex justify-between">
                <span>Monday – Sunday:</span>
                <span className="font-semibold text-cream">09:00 AM – 09:00 PM</span>
              </p>
              <p className="flex justify-between">
                <span>Online Queue Closes:</span>
                <span className="text-amber-400">30 mins before closing</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-2">
                * Walk-ins accepted during all operational hours.
              </p>
            </div>
          </div>

          {/* Contact / Location */}
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cream mb-3">
              <MapPin className="h-4 w-4 text-gold" />
              Location & Contact
            </h4>
            <p className="text-xs text-gray-400 mb-1">
              Main Avenue, Suite 104, Gujarat, India
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
              <Phone className="h-3.5 w-3.5 text-gold" />
              Front Desk: +91 98765 00000
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800/60 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Aurelia Salon. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            <Shield className="h-3.5 w-3.5 text-gold" />
            Live Queue Management Demo System
          </p>
        </div>
      </div>
    </footer>
  );
}
