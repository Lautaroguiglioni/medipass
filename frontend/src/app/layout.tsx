import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import Web3Provider from '@/components/Web3Provider';
import { DevProvider } from '@/lib/devContext';
import DevDrawer from '@/components/DevDrawer';
import Link from 'next/link';
import { ShieldCheck, Globe } from 'lucide-react';
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
  title: 'MediPass — Global Clinical History on Monad',
  description: 'Verifiable, encrypted health records and prescriptions for Digital Nomads on Monad blockchain.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#0b0f19] text-[#e2e8f0] font-sans flex overflow-hidden">
        <DevProvider>
          <Web3Provider>
            
            {/* Left Sidebar */}
            <aside className="w-[260px] bg-[#070b13] text-slate-200 border-r border-white/5 flex flex-col justify-between flex-shrink-0 z-30">
              <div>
                
                {/* Logo / Header */}
                <div className="h-16 border-b border-white/5 flex items-center px-5 gap-3 bg-[#05070c]">
                  <div className="h-8 w-8 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    M
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold tracking-wider text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                      MEDIPASS
                    </span>
                    <span className="text-[9px] text-[#06b6d4] font-bold tracking-widest uppercase">
                      Monad Blockchain
                    </span>
                  </div>
                </div>

                {/* Sidebar Navigation */}
                <div className="px-3 py-6">
                  <span className="block text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest px-3 mb-3">
                    Nomad Modules
                  </span>
                  <SidebarNavigation />
                </div>

              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-white/5 bg-[#05070c] space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe size={10} className="text-[#06b6d4]" />
                    <span>Global Coverage</span>
                  </span>
                  <p className="text-[10px] text-slate-550 leading-relaxed">
                    Verify credentials and signatures across borders instantly.
                  </p>
                </div>
                
                <div className="w-full">
                  <ConnectKitButtonWrapper />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-semibold tracking-wider">
                    MONAD TESTNET: ONLINE
                  </span>
                </div>
              </div>
            </aside>

            {/* Right Column: Top Bar + Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              
              {/* Top Banner */}
              <header className="h-16 bg-[#070b13] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <h1 className="text-sm font-bold text-white tracking-wide">
                    Clinical Portal for Digital Nomads
                  </h1>
                  <span className="h-4 w-px bg-white/10"></span>
                  <span className="text-[9px] font-bold text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Hackathon Demo
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck size={12} />
                    <span className="font-semibold text-[10px]">HIPAA Compliant / Encrypted</span>
                  </div>
                </div>
              </header>

              {/* Main Workspace */}
              <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24">
                <div className="max-w-5xl mx-auto w-full">
                  {children}
                </div>
              </main>

            </div>

            {/* Compliance & Audit Logs DevDrawer */}
            <DevDrawer />

          </Web3Provider>
        </DevProvider>
      </body>
    </html>
  );
}
