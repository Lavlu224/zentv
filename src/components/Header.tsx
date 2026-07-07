'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-50 h-[72px]">
      <div className="container-main h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <span className="text-white font-bold text-base">Z</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-[#F8FAFC]">
              Zenty<span className="text-[#7C3AED]">TV</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" pathname={pathname}>Home</NavLink>
            <NavLink href="/channels" pathname={pathname}>Live TV</NavLink>
            <NavLink href="/search" pathname={pathname}>Search</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="hidden md:inline-flex items-center gap-2.5 px-4 py-2 rounded-[14px] bg-[#1F2937] text-[#94A3B8] text-sm border border-[rgba(255,255,255,.08)] hover:border-[#06B6D4] hover:shadow-[0_0_0_4px_rgba(6,182,212,.15)] transition-all duration-300"
          >
            <Search className="w-4 h-4" />
            <span>Search channels...</span>
            <kbd className="hidden lg:inline-flex px-1.5 py-0.5 rounded bg-[rgba(255,255,255,.06)] text-[10px] text-[#64748B]">⌘K</kbd>
          </Link>
          <Link href="/admin/login" className="btn-primary px-5 py-2 text-sm font-semibold rounded-[14px]">
            Sign In
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#94A3B8] hover:bg-[rgba(255,255,255,.06)] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1120] border-t border-[rgba(255,255,255,.06)] animate-fade-in">
          <div className="container-main py-3 space-y-1">
            <MobileNavLink href="/" pathname={pathname}>Home</MobileNavLink>
            <MobileNavLink href="/channels" pathname={pathname}>Live TV</MobileNavLink>
            <MobileNavLink href="/search" pathname={pathname}>Search</MobileNavLink>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`relative px-4 py-2 text-sm font-medium rounded-[14px] transition-all duration-300 ${
        isActive
          ? 'text-[#8B5CF6] bg-[rgba(124,58,237,.1)]'
          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(255,255,255,.05)]'
      }`}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-full" />
      )}
    </Link>
  );
}

function MobileNavLink({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block px-4 py-3 rounded-[14px] text-sm font-medium transition-colors ${
        isActive
          ? 'text-[#8B5CF6] bg-[rgba(124,58,237,.1)]'
          : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,.05)]'
      }`}
    >
      {children}
    </Link>
  );
}
