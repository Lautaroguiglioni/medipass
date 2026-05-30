'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useDevDrawer } from '@/lib/devContext';
import { 
  ShieldCheck, Globe, User, Stethoscope, Pill, CheckCircle2, AlertTriangle, ArrowRight, UserPlus, CreditCard 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoleCheckResponse {
  address: string;
  roles: {
    isAdmin: boolean;
    isDoctor: boolean;
    isPharmacist: boolean;
    isPatient: boolean;
  };
}

export default function GlobalPortal() {
  const { address, isConnected } = useAccount();
  const { addLog } = useDevDrawer();
  
  const [userRoles, setUserRoles] = useState<{
    isAdmin: boolean;
    isDoctor: boolean;
    isPharmacist: boolean;
    isPatient: boolean;
  } | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Mock directory of doctors
  const doctorsDirectory = [
    { name: 'Dr. Elena Rostova', specialty: 'General Practitioner', country: 'Germany', license: 'DE-GP-99382', address: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf', verified: true },
    { name: 'Dr. Mateo Silva', specialty: 'Cardiologist', country: 'Brazil', license: 'BR-CARD-05849', address: '0x8B9d442e9D7769CDc62d04a6015b67aEd5498498a', verified: true },
    { name: 'Dr. Yuki Sato', specialty: 'Dermatologist', country: 'Japan', license: 'JP-DERM-48291', address: '0x2b8e39f37c35d20b6f9e31d4ed8f902c08e50b81', verified: true },
    { name: 'Dr. Sofia Martinez', specialty: 'Pediatrician', country: 'Spain', license: 'ES-PED-84295', address: '0x498a442e9D7769CDc62d04a6015b67aEd5498B9d', verified: true },
  ];

  // Load roles from backend when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchRoles();
    } else {
      setUserRoles(null);
    }
  }, [isConnected, address]);

  const fetchRoles = async () => {
    if (!address) return;
    setLoadingRoles(true);
    const startTime = performance.now();
    try {
      const res = await fetch(`http://localhost:3001/api/roles/check/${address}`);
      const data: RoleCheckResponse = await res.json();
      if (res.ok) {
        setUserRoles(data.roles);
        addLog({
          title: `Loaded Roles for ${address.slice(0, 6)}...${address.slice(-4)} 🔐`,
          type: 'read',
          onChainHash: 'N/A',
          executionTimeMs: Math.round(performance.now() - startTime),
          privateMetadata: data.roles
        });
      }
    } catch (err) {
      console.error('Failed to load roles from backend API:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRegisterPatient = async () => {
    if (!address) return;
    setRegistering(true);
    const startTime = performance.now();
    try {
      const res = await fetch('http://localhost:3001/api/roles/grant/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: address }),
      });
      const data = await res.json();
      if (res.ok) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        addLog({
          title: `Registered Patient on Monad ⛓️`,
          type: 'emit',
          onChainHash: data.txHash,
          executionTimeMs: Math.round(performance.now() - startTime),
          privateMetadata: { address, message: data.message }
        });
        await fetchRoles();
      }
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    // Simulate payment process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    confetti({ particleCount: 150, spread: 80, colors: ['#06b6d4', '#10b981', '#ffffff'] });
    await handleRegisterPatient();
    setSubscribing(false);
  };

  return (
    <div className="space-y-12">
      {/* Hero Banner Section */}
      <div className="relative text-center py-10 rounded-2xl glass-panel bg-gradient-to-b from-[#0b0f19] to-transparent p-8">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
          <ShieldCheck size={12} pulse-glow-element />
          <span>Vetted Network</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-[#06b6d4]">
          Global Health History for Digital Nomads
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Maintain a secure, fully verifiable clinical history on the **Monad Blockchain** as you travel. Access remote video consultations with vetted international doctors, and get verified, compliant prescriptions anywhere.
        </p>
      </div>

      {/* Wallet State & Dashboards Access */}
      <div className="glass-panel p-6 space-y-6">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4]">
          🔒 Dynamic Access Control & On-Chain Roles
        </h2>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center p-8 border border-white/5 bg-slate-950/40 rounded-xl text-center space-y-4">
            <AlertTriangle size={24} className="text-amber-500" />
            <div>
              <p className="font-bold text-white text-sm">Wallet Disconnected</p>
              <p className="text-xs text-slate-500">Please connect your MetaMask wallet in the sidebar to authenticate and load your clinical dashboards.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">CONNECTED WALLET</span>
                <span className="font-bold text-white text-sm font-mono tracking-tight">{address}</span>
              </div>

              <div className="flex gap-2">
                {userRoles && Object.values(userRoles).some(Boolean) ? (
                  <span className="badge-emerald">Active Account</span>
                ) : (
                  <span className="badge-amber">Unregistered Address</span>
                )}
              </div>
            </div>

            {loadingRoles ? (
              <div className="text-center py-4">
                <div className="animate-spin inline-block rounded-full h-5 w-5 border-2 border-[#06b6d4] border-t-transparent mb-2"></div>
                <p className="text-xs text-slate-400">Verifying on-chain roles on Monad testnet...</p>
              </div>
            ) : userRoles ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Patient Portal Option */}
                <div className="border border-white/5 bg-slate-950/20 rounded-xl p-5 hover:border-[#06b6d4]/40 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <User className="text-[#06b6d4]" size={20} />
                      {userRoles.isPatient && <span className="text-[9px] font-bold text-emerald-400 uppercase">Granted</span>}
                    </div>
                    <h3 className="font-bold text-white text-sm">Patient Portal</h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      Update your encrypted personal health background, view your verifiable timeline, and manage prescriptions.
                    </p>
                  </div>
                  
                  {userRoles.isPatient ? (
                    <Link href="/dashboard/patient" className="glass-button-primary w-full text-center block text-xs font-bold mt-4">
                      Open Dashboard <ArrowRight className="inline-block ml-1" size={12} />
                    </Link>
                  ) : (
                    <button 
                      onClick={handleRegisterPatient}
                      disabled={registering}
                      className="glass-button-secondary w-full text-xs font-bold mt-4 flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={12} />
                      <span>{registering ? 'Registering...' : 'Register as Patient'}</span>
                    </button>
                  )}
                </div>

                {/* Doctor Portal Option */}
                <div className="border border-white/5 bg-slate-950/20 rounded-xl p-5 hover:border-[#06b6d4]/40 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Stethoscope className="text-violet-400" size={20} />
                      {userRoles.isDoctor && <span className="text-[9px] font-bold text-emerald-400 uppercase">Granted</span>}
                    </div>
                    <h3 className="font-bold text-white text-sm">Doctor Portal</h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      Consult patients' clinical histories, register diagnostics, and issue on-chain prescriptions to global pharmacies.
                    </p>
                  </div>
                  <Link 
                    href="/dashboard/doctor" 
                    className={`w-full text-center block text-xs font-bold mt-4 ${userRoles.isDoctor ? 'glass-button-primary' : 'glass-button-secondary'}`}
                  >
                    Open Doctor Portal <ArrowRight className="inline-block ml-1" size={12} />
                  </Link>
                </div>

                {/* Pharmacy Portal Option */}
                <div className="border border-white/5 bg-slate-950/20 rounded-xl p-5 hover:border-[#06b6d4]/40 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Pill className="text-amber-400" size={20} />
                      {userRoles.isPharmacist && <span className="text-[9px] font-bold text-emerald-400 uppercase">Granted</span>}
                    </div>
                    <h3 className="font-bold text-white text-sm">Pharmacy Dispensation</h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      Scan patient prescriptions, check issuing doctor validity status on-chain, and record dispensation.
                    </p>
                  </div>
                  <Link href="/dashboard/pharmacy" className="glass-button-primary w-full text-center block text-xs font-bold mt-4">
                    Open Pharmacy Portal <ArrowRight className="inline-block ml-1" size={12} />
                  </Link>
                </div>

              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Subscription Pricing Plans for Nomads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">✈️ Health Security for Digital Nomads</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Locally, digital health is solved. Internationally, medical records are fractured, and foreign pharmacies cannot verify doctor credentials. 
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 size={14} className="text-[#06b6d4] flex-shrink-0" />
              <span>Consolidate your clinical history under your own cryptographic address.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 size={14} className="text-[#06b6d4] flex-shrink-0" />
              <span>Consult with international doctors on demand via private video calls.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 size={14} className="text-[#06b6d4] flex-shrink-0" />
              <span>Get verifiable prescriptions valid for local health facilities.</span>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="glass-panel p-6 border-2 border-[#06b6d4]/30 bg-gradient-to-b from-[#0f172a]/80 to-[#070b13] rounded-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#06b6d4]/10 rounded-full blur-xl"></div>
          <span className="bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/30 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
            Most Popular
          </span>
          <h3 className="font-extrabold text-white text-lg mt-3">Nomad Global Health</h3>
          <p className="text-[11px] text-slate-450 mt-1">Full global coverage, record synchronization & doctor calls.</p>
          
          <div className="my-6">
            <span className="text-4xl font-extrabold text-white">$19</span>
            <span className="text-slate-450 text-xs font-semibold"> / month USD</span>
          </div>

          <button 
            onClick={handleSubscribe}
            disabled={subscribing || !isConnected || !!(userRoles && userRoles.isPatient)}
            className="glass-button-primary w-full flex items-center justify-center gap-2"
          >
            <CreditCard size={14} />
            <span>
              {subscribing ? 'Processing...' : (userRoles && userRoles.isPatient) ? 'Already Subscribed' : 'Subscribe Now'}
            </span>
          </button>
          <span className="block text-[8px] text-center text-slate-500 mt-2">Mock payment triggers patient role registration on Monad</span>
        </div>
      </div>

      {/* Vetted Doctor Network Directory */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4]">
            🩺 Directory of Vetted On-Chain Doctors
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">4 active physicians</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {doctorsDirectory.map((doc, idx) => (
            <div key={idx} className="border border-white/5 bg-slate-950/20 p-4 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">{doc.country}</span>
                  {doc.verified && <span className="text-[8px] font-bold text-[#06b6d4] uppercase tracking-wider">✔ Verified</span>}
                </div>
                <h4 className="font-bold text-white text-xs leading-normal">{doc.name}</h4>
                <p className="text-[10px] text-slate-400">{doc.specialty}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-1">Lic: {doc.license}</p>
              </div>
              <span className="block text-[8px] text-slate-500 truncate font-mono mt-2">{doc.address}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
