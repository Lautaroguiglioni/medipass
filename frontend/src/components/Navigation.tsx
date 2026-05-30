'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stethoscope, Pill, ShieldAlert, User } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Portal Médico',
      href: '/dashboard/doctor',
      icon: Stethoscope,
      activeColor: 'text-sky-600 bg-sky-50 border-sky-150',
    },
    {
      name: 'Portal Farmacia',
      href: '/dashboard/pharmacy',
      icon: Pill,
      activeColor: 'text-purple-600 bg-purple-50 border-purple-150',
    },
    {
      name: 'Mis Recetas',
      href: '/dashboard/patient',
      icon: User,
      activeColor: 'text-teal-600 bg-teal-50 border-teal-150',
    },
  ];

  return (
    <nav className="flex items-center gap-1.5 md:gap-3 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
              isActive
                ? `${item.activeColor} shadow-sm font-bold scale-102`
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Icon size={14} className="flex-shrink-0" />
            <span className="hidden sm:inline-block">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
