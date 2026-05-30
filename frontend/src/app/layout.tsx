import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import Web3Provider from '@/components/Web3Provider';
import { DevProvider } from '@/lib/devContext';
import DevDrawer from '@/components/DevDrawer';
import Link from 'next/link';
import { LayoutDashboard, Stethoscope, Pill, UserSearch, FileClock, ShieldCheck } from 'lucide-react';
import ConnectKitButtonWrapper from '@/components/ConnectKitButtonWrapper';
import SidebarNavigation from '@/components/SidebarNavigation';

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const inter = Inter({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'Sistema de Gestión Clínico EHR (MediPass)',
  description: 'Infraestructura institucional de recetas médicas portables con integridad criptográfica.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#f8fafc] text-slate-900 font-sans flex overflow-hidden">
        <DevProvider>
          <Web3Provider>
            
            {/* Fixed Left Sidebar - Epic/Cerner inspired */}
            <aside className="w-[260px] bg-[#0f172a] text-slate-200 border-r border-[#1e293b] flex flex-col justify-between flex-shrink-0 z-30">
              <div>
                
                {/* Institutional Hospital Header */}
                <div className="h-16 border-b border-[#1e293b] flex items-center px-5 gap-3 bg-[#0b0f19]">
                  <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    H
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-wider text-white uppercase">
                      SISTEMA EHR
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                      Ctro. Médico Metropolitano
                    </span>
                  </div>
                </div>

                {/* Sidebar Navigation Component */}
                <div className="px-3 py-4">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                    Módulos Asistenciales
                  </span>
                  <SidebarNavigation />
                </div>

              </div>

              {/* Sidebar Footer - Digital Signature Credential */}
              <div className="p-4 border-t border-[#1e293b] bg-[#0b0f19] space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Firma Digital de Médico
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Requerida para la emisión oficial de recetas y auditorías criptográficas.
                  </p>
                </div>
                
                {/* Connect Wallet rebranded as Activate Digital Signature */}
                <div className="w-full">
                  <ConnectKitButtonWrapper />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Servidor de Firmas: ACTIVO
                  </span>
                </div>
              </div>
            </aside>

            {/* Right Column: Top Bar + Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              
              {/* Top Banner (EHR Institutional Header) */}
              <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <h1 className="text-sm font-bold text-slate-700 tracking-tight">
                    Portal de Gestión de Recetas Electrónicas
                  </h1>
                  <span className="h-4 w-px bg-slate-200"></span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                    Entorno: Producción Interna
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <div>Fecha Operación: <span className="font-bold text-slate-700">30/05/2026</span></div>
                  <span className="h-3 w-px bg-slate-200"></span>
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <ShieldCheck size={12} />
                    <span>Cumplimiento HIPAA / Ley 25.326</span>
                  </div>
                </div>
              </header>

              {/* Main Workspace (Scrollable content) */}
              <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24">
                <div className="max-w-5xl mx-auto w-full">
                  {children}
                </div>
              </main>

            </div>

            {/* Global Compliance & Audit Logs (DevDrawer renamed) */}
            <DevDrawer />

          </Web3Provider>
        </DevProvider>
      </body>
    </html>
  );
}
