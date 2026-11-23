export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatTime(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function statusColor(status) {
  switch (status) {
    case 'WAITING':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500',
      };
    case 'CALLED':
      return {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-300 font-bold',
        border: 'border-yellow-400/50',
        badge: 'bg-yellow-400 animate-pulse',
      };
    case 'IN_CHAIR':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500',
      };
    case 'DONE':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        badge: 'bg-blue-500',
      };
    case 'NO_SHOW':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500',
      };
    case 'CANCELLED':
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        badge: 'bg-gray-500',
      };
    default:
      return {
        bg: 'bg-gray-700/20',
        text: 'text-gray-300',
        border: 'border-gray-700',
        badge: 'bg-gray-500',
      };
  }
}
