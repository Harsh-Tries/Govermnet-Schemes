import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '../components/navigation/TopNav';
import { Sidebar } from '../components/navigation/Sidebar';

export const metadata: Metadata = {
  title: 'Indian Government Scheme & Scholarship Assistant',
  description: 'Discover government schemes and scholarships based on your profile, profession, location, and eligibility.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <TopNav />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-8 max-w-7xl overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
