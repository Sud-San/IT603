import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { statusColor } from '../../utils/formatters.js';

export default function StatusBadge({ status, size = 'md' }) {
  const { t } = useLanguage();
  const colors = statusColor(status);

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-4 py-1.5 text-sm font-semibold tracking-wider'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${colors.badge}`} />
      <span>{t(status) || status}</span>
    </span>
  );
}
