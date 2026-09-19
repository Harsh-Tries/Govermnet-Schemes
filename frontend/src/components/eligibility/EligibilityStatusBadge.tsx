import React from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface Props {
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN';
  size?: 'sm' | 'md' | 'lg';
}

export function EligibilityStatusBadge({ status, size = 'md' }: Props) {
  let badgeStyle = '';
  let icon = null;
  let text = '';

  switch (status) {
    case 'ELIGIBLE':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      icon = <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      text = 'ELIGIBLE';
      break;
    case 'NOT_ELIGIBLE':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      icon = <XCircle className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      text = 'NOT ELIGIBLE';
      break;
    case 'UNKNOWN':
    default:
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      icon = <HelpCircle className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      text = 'UNKNOWN (Needs Information)';
      break;
  }

  const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3.5 py-1.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${badgeStyle} ${textSize}`}>
      {icon}
      <span>{text}</span>
    </span>
  );
}
