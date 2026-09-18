import React from 'react';
import { ArrowRight } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  colorScheme: 'blue' | 'emerald' | 'amber' | 'purple';
  countBadge?: string;
  onClick?: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon: Icon,
  colorScheme,
  countBadge,
  onClick
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50/80 hover:bg-blue-100/80',
      border: 'border-blue-200/80',
      iconBg: 'bg-blue-600 text-white',
      text: 'text-blue-950',
      subtext: 'text-blue-700/80',
      badge: 'bg-blue-200 text-blue-900',
    },
    emerald: {
      bg: 'bg-emerald-50/80 hover:bg-emerald-100/80',
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-600 text-white',
      text: 'text-emerald-950',
      subtext: 'text-emerald-700/80',
      badge: 'bg-emerald-200 text-emerald-900',
    },
    amber: {
      bg: 'bg-amber-50/80 hover:bg-amber-100/80',
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-600 text-white',
      text: 'text-amber-950',
      subtext: 'text-amber-700/80',
      badge: 'bg-amber-200 text-amber-900',
    },
    purple: {
      bg: 'bg-purple-50/80 hover:bg-purple-100/80',
      border: 'border-purple-200/80',
      iconBg: 'bg-purple-600 text-white',
      text: 'text-purple-950',
      subtext: 'text-purple-700/80',
      badge: 'bg-purple-200 text-purple-900',
    },
  };

  const style = colorStyles[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${style.bg} ${style.border} flex flex-col justify-between group`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
          {countBadge && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${style.badge}`}>
              {countBadge}
            </span>
          )}
        </div>
        <h3 className={`text-sm font-bold ${style.text} mb-1 group-hover:text-gov-blue transition-colors`}>
          {title}
        </h3>
        <p className={`text-xs ${style.subtext} leading-relaxed`}>
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/40 text-xs font-semibold text-slate-700 group-hover:text-gov-blue">
        <span>Explore</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};
