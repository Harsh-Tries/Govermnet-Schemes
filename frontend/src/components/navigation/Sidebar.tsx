'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Compass, 
  CheckCircle2, 
  Bookmark, 
  Bot, 
  Settings,
  ShieldCheck,
  BarChart3,
  Clock,
  Sparkles,
  UserCheck,
  Phone,
  X,
  Landmark
} from 'lucide-react';
import { authStorage, UserSession } from '../../services/authApi';
import { useNavigation } from '../../context/NavigationContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isMobileSidebarOpen, closeMobileSidebar } = useNavigation();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const isOnboarded = Boolean(user?.is_onboarding_completed);
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const sections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Explore Schemes', href: '/explore', icon: Compass },
        { label: 'Personalized Matches', href: '/recommendations', icon: Sparkles },
        { label: 'My Eligibility', href: '/eligibility', icon: CheckCircle2 },
      ],
    },
    {
      title: 'Services',
      items: [
        { label: 'AI Assistant', href: '/assistant', icon: Bot },
        { label: 'Track Applications', href: '/applications', icon: Clock },
        { label: 'Saved Schemes', href: '/saved', icon: Bookmark },
      ],
    },
    {
      title: 'Account',
      items: [
        { 
          label: isOnboarded ? 'My Profile' : 'Citizen Onboarding', 
          href: '/onboarding', 
          icon: UserCheck 
        },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'Administration',
            items: [
              { label: 'Admin Portal', href: '/admin', icon: ShieldCheck },
              { label: 'Admin Analytics', href: '/admin/analytics', icon: BarChart3 },
            ],
          },
        ]
      : []),
  ];

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full">
      {/* Scrollable Navigation List */}
      <div className="px-4 py-3 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
              {section.title}
            </p>
            <nav className="space-y-1 pt-1" aria-label={section.title}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileSidebar}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex items-center gap-3 px-3.5 h-[44px] rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue focus-visible:ring-offset-1 ${
                      active
                        ? 'bg-gov-blue text-white font-semibold shadow-xs shadow-gov-blue/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Citizen Facilitation Support Footer */}
      <div className="p-4 mx-3 mb-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Phone className="w-4 h-4 text-gov-blue shrink-0" aria-hidden="true" />
          <span>Citizen Helpline</span>
        </div>
        <div className="space-y-1 text-slate-600 text-[11px] leading-relaxed">
          <p className="font-bold text-gov-blue font-mono text-xs">1800-120-8040</p>
          <p className="text-slate-500">MahaDBT &amp; Aaple Sarkar Facilitation</p>
          <p className="text-[10px] text-slate-400">Mon–Sat: 9:00 AM – 6:00 PM</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside 
        className="hidden md:flex flex-col w-[260px] bg-white border-r border-[#E2E8F0] sticky top-[61px] h-[calc(100vh-61px)] shrink-0 z-20"
        aria-label="Main Navigation"
      >
        {navContent}
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 flex flex-col justify-between shadow-2xl md:hidden transition-transform duration-200 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gov-blue text-white flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Scheme Assistant</p>
              <p className="text-[10px] font-semibold text-gov-blue">MAHARASHTRA</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gov-blue/20"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation */}
        <div className="flex-1 overflow-y-auto">
          {navContent}
        </div>
      </aside>
    </>
  );
};
