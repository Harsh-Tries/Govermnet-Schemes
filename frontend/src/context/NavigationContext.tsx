'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isMobileSidebarOpen: false,
  openMobileSidebar: () => {},
  closeMobileSidebar: () => {},
  toggleMobileSidebar: () => {},
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close mobile sidebar whenever route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isMobileSidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isMobileSidebarOpen]);

  return (
    <NavigationContext.Provider
      value={{
        isMobileSidebarOpen,
        openMobileSidebar: () => setIsMobileSidebarOpen(true),
        closeMobileSidebar: () => setIsMobileSidebarOpen(false),
        toggleMobileSidebar: () => setIsMobileSidebarOpen((prev) => !prev),
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
