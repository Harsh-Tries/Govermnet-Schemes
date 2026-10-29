import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '../components/navigation/TopNav';
import { Sidebar } from '../components/navigation/Sidebar';
import { NavigationProvider } from '../context/NavigationContext';

export const metadata: Metadata = {
  title: 'Government Scheme Assistant — Maharashtra Welfare & Scholarships',
  description: 'Discover verified Maharashtra government welfare schemes and student scholarships with deterministic eligibility evaluation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 antialiased">
        <NavigationProvider>
          <TopNav />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden w-full">
              {children}
            </main>
          </div>
        </NavigationProvider>
      </body>
    </html>
  );
}
