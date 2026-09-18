import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface TrustIndicatorProps {
  compact?: boolean;
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200/60">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Verified Govt Sources</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-blue-50/50 border border-emerald-200/70 rounded-xl text-xs text-slate-700 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
            Verified Government Sourced Data
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">Official</span>
          </p>
          <p className="text-slate-600 text-[11px] mt-0.5">
            Information linked directly to official <code className="bg-slate-200/70 px-1 rounded text-[10px]">.gov.in</code> and <code className="bg-slate-200/70 px-1 rounded text-[10px]">.nic.in</code> portals. Zero unverified blogs or agents.
          </p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer">
        <Info className="w-3.5 h-3.5" />
        <span>Verification Policy</span>
      </div>
    </div>
  );
};
