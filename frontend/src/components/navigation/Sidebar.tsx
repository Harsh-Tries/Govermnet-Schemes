'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Compass, 
  CheckCircle2, 
  Bookmark, 
  FileText, 
  Bot, 
  Settings,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore Schemes', href: '/explore', icon: Compass },
  { label: 'My Eligibility', href: '/eligibility', icon: CheckCircle2, badge: 'Live' },
  { label: 'AI Assistant', href: '/chat', icon: Bot, badge: 'Phase 4 AI' },
  { label: 'Saved Schemes', href: '/saved', icon: Bookmark },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Admin Portal', href: '/admin', icon: ShieldCheck, badge: 'Phase 2' },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-6">
        {/* Navigation Group */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gov-blue text-white shadow-md shadow-gov-blue/20 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badge === 'Live'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.badge === 'Phase 2'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Phase 2 Knowledge Base Status Banner */}
        <div className="p-3.5 bg-gov-lightBlue/60 border border-gov-blue/20 rounded-xl text-xs">
          <div className="flex items-center gap-2 font-semibold text-gov-blue mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Phase 2 Knowledge Base Live</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Structured rules, verification lifecycles & admin management enabled.
          </p>
        </div>
      </div>

      {/* Footer Support */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Help & Guidelines</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 px-3">
          © 2026 Govt Scheme Assistant
        </p>
      </div>
    </aside>
  );
};
