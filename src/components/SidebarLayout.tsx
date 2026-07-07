'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Tv, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/channels', label: 'Channels', icon: Tv },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1120] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-[220px] bg-[#111827] border-r border-[rgba(255,255,255,.06)] flex flex-col flex-shrink-0 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 h-[72px] border-b border-[rgba(255,255,255,.06)]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <span className="text-white font-bold text-xs">Z</span>
            </div>
            <span className="font-bold text-sm text-[#F8FAFC]">Zenty<span className="text-[#7C3AED]">TV</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md text-[#64748B] hover:text-[#94A3B8]"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 px-3 pt-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[rgba(124,58,237,.15)] text-[#8B5CF6]'
                    : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,.04)] hover:text-[#CBD5E1]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-20 bg-[#0B1120]/80 backdrop-blur border-b border-[rgba(255,255,255,.06)] px-4 h-[56px] flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md text-[#64748B] hover:text-[#94A3B8]"><Menu className="w-5 h-5" /></button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">Z</span>
            </div>
            <span className="font-bold text-sm text-[#F8FAFC]">Zenty<span className="text-[#7C3AED]">TV</span></span>
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
