'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, Stethoscope, Pill } from 'lucide-react';

export default function SidebarNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Global Portal',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Patient Portal',
      href: '/dashboard/patient',
      icon: User,
    },
    {
      name: 'Doctor Portal',
      href: '/dashboard/doctor',
      icon: Stethoscope,
    },
    {
      name: 'Dispensation (Pharmacy)',
      href: '/dashboard/pharmacy',
      icon: Pill,
    },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-white/10 text-white border-l-4 border-[#06b6d4]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Icon size={14} className="flex-shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
