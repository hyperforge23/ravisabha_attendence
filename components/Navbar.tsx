'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!isAuthenticated) return null;

  const navItems = [
    { name: 'Home', href: '/ravisabha' },
    { name: 'Export', href: '/export' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white font-bold text-lg shadow-sm">
            D
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Divyabaug
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-gray-900",
                pathname === item.href || (item.href === '/ravisabha' && pathname === '/')
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500"
              )}
            >
              {item.name}
            </Link>
          ))}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="User menu"
            >
              <User className="w-5 h-5 text-gray-700" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                </div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
