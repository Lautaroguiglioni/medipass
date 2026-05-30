'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Stethoscope, Pill, UserSearch } from 'lucide-react';

export default function SidebarNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Panel General (EHR)',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Módulo Médico (Emisión)',
      href: '/dashboard/doctor',
      icon: Stethoscope,
    },
    {
      name: 'Módulo Farmacia (Canje)',
      href: '/dashboard/pharmacy',
      icon: Pill,
    },
    {
      name: 'Buscador de Pacientes',
      href: '/dashboard/patient',
      icon: UserSearch,
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-semibold transition-colors duration-150 ${
              isActive
                ? 'bg-[#1e293b] text-white border-l-4 border-blue-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/40'
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
