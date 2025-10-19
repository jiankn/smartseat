import type { Metadata } from 'next';
import './globals.css';
import Header from '@components/Header';
import Sidebar from '@components/Sidebar';
import Providers from '@components/Providers';

export const metadata: Metadata = {
  title: 'SmartSeat',
  description: 'Smart seat planner MVP'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <div className="mx-auto max-w-7xl grid grid-cols-12 gap-4 p-4">
            <aside className="col-span-3">
              <Sidebar />
            </aside>
            <main className="col-span-9 bg-white/5 rounded-xl p-4 min-h-[60vh]">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
