'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useDevDrawer } from '@/lib/devContext';
import { 
  Pill, Search, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, ClipboardCheck, ShieldAlert 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Prescription {
  tokenId: string;
  patient: string;
  doctor: string;
  ipfsCID: string;
  medicationName: string;
  dosageMg: string;
  refillsAllowed: number;
  refillsUsed: number;
  isActive: boolean;
  isDispensed: boolean;
  issuedAt: number;
  expiresAt: number;
  details?: {
    patientName?: string;
    dob?: string;
    notes?: string;
  };
}

function PharmacyPortalContent() {
  const { address, isConnected } = useAccount();
  const { addLog } = useDevDrawer();
  const searchParams = useSearchParams();

  // Roles state
  const [isPharmacistRole, setIsPharmacistRole] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [registeringPharmacist, setRegisteringPharmacist] = useState(false);

  // Search Prescription State
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [doctorVerifiedOnChain, setDoctorVerifiedOnChain] = useState<boolean | null>(null);

  // Dispense State
  const [dispensing, setDispensing] = useState(false);

  // Auto-search if Token ID is in URL query
  useEffect(() => {
    const urlTokenId = searchParams.get('id');
    if (urlTokenId) {
      setTokenIdInput(urlTokenId);
      verifyPrescription(urlTokenId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isConnected && address) {
      checkRole();
    } else {
      setIsPharmacistRole(false);
      setCheckingRole(false);
    }
  }, [isConnected, address]);

  const checkRole = async () => {
    if (!address) return;
    setCheckingRole(true);
    try {
      const res = await fetch(`http://localhost:3001/api/roles/check/${address}`);
      const data = await res.json();
      if (res.ok) {
        setIsPharmacistRole(data.roles.isPharmacist);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingRole(false);
    }
  };

  const handleRegisterPharmacist = async () => {
    if (!address) return;
    setRegisteringPharmacist(true);
    const startTime = performance.now();
    try {
      const res = await fetch('http://localhost:3001/api/roles/grant/pharmacist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: address }),
      });
      const data = await res.json();
      if (res.ok) {
        confetti({ particleCount: 100, colors: ['#f59e0b', '#06b6d4', '#ffffff'] });
        addLog({
          title: `Registered Pharmacy Credentials on Monad ⛓️`,
          type: 'emit',
          onChainHash: data.txHash,
          executionTimeMs: Math.round(performance.now() - startTime),
          privateMetadata: { address, message: data.message }
        });
        await checkRole();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegisteringPharmacist(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenIdInput.trim()) {
      verifyPrescription(tokenIdInput.trim());
    }
  };

  const verifyPrescription = async (id: string) => {
    setSearching(true);
    setSearched(true);
    setPrescription(null);
    setDoctorVerifiedOnChain(null);

    const startTime = performance.now();

    try {
      // 1. Fetch prescription details from on-chain via backend
      const res = await fetch(`http://localhost:3001/api/prescriptions/${id}`);
      const data = await res.json();

      if (res.ok && data.prescription) {
        const rx: Prescription = data.prescription;

        // 2. Fetch encrypted patient metadata from IPFS
        try {
          const ipfsRes = await fetch(`http://localhost:3001/api/ipfs/fetch/${rx.ipfsCID}`);
          const ipfsData = await ipfsRes.json();
          if (ipfsRes.ok) {
            rx.details = ipfsData.data;
          }
        } catch (err) {
          console.warn('Failed to fetch IPFS details:', err);
        }

        // 3. Verify on-chain status of the issuing Doctor
        const doctorRoleRes = await fetch(`http://localhost:3001/api/roles/check/${rx.doctor}`);
        const doctorRoleData = await doctorRoleRes.json();
        if (doctorRoleRes.ok) {
          setDoctorVerifiedOnChain(doctorRoleData.roles.isDoctor);
        }

        setPrescription(rx);
        addLog({
          title: `Pharmacist verified Prescription #${id} on-chain 📁`,
          type: 'read',
          onChainHash: 'N/A',
          executionTimeMs: Math.round(performance.now() - startTime),
          privateMetadata: { tokenId: id, doctor: rx.doctor }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleDispense = async () => {
    if (!prescription) return;
    setDispensing(true);
    const startTime = performance.now();

    try {
      const res = await fetch(`http://localhost:3001/api/prescriptions/${prescription.tokenId}/dispense`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        confetti({ particleCount: 120, colors: ['#10b981', '#ffffff'] });
        addLog({
          title: `Dispensed Prescription #${prescription.tokenId} on-chain ⛓️`,
          type: 'redeem',
          onChainHash: data.txHash,
          executionTimeMs: Math.round(performance.now() - startTime),
          privateMetadata: { tokenId: prescription.tokenId }
        });

        // Reload prescription details
        await verifyPrescription(prescription.tokenId);
      } else {
        alert(`Dispensation failed: ${data.message || 'Verification Error'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDispensing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 glass-panel max-w-md mx-auto my-12">
        <ShieldAlert size={48} className="text-amber-500 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Wallet Connection Required</h2>
        <p className="text-xs text-slate-400">
          Please connect your MetaMask wallet to access the Pharmacy verification dashboard.
        </p>
      </div>
    );
  }

  if (checkingRole) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin inline-block rounded-full h-8 w-8 border-4 border-[#06b6d4] border-t-transparent mb-4"></div>
        <p className="text-xs text-slate-400 font-medium">Verifying Pharmacy credentials on Monad Testnet...</p>
      </div>
    );
  }

  if (!isPharmacistRole) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-5 glass-panel max-w-lg mx-auto my-12 border-2 border-amber-500/20 bg-amber-500/5">
        <Pill size={48} className="text-amber-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Pharmacy Dispensation Credentials Required</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your wallet address (`{address}`) is not registered as an authorized pharmacy on the blockchain. 
            For the demo, you can activate pharmacy mode below to grant your wallet dispensation rights.
          </p>
        </div>
        <button 
          onClick={handleRegisterPharmacist} 
          disabled={registeringPharmacist}
          className="glass-button-primary w-full text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_4px_14px_rgba(245,158,11,0.3)]"
        >
          {registeringPharmacist ? 'Activating Pharmacy Credentials...' : 'Activate Pharmacy Mode'}
        </button>
      </div>
    );
  }

  const isExpired = prescription ? (prescription.expiresAt < Math.floor(Date.now() / 1000)) : false;
  const noRefillsLeft = prescription ? (prescription.isDispensed && prescription.refillsUsed >= prescription.refillsAllowed) : false;

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Pill size={16} className="text-[#06b6d4]" />
          <span>Pharmacy Dispensation & Verification Portal</span>
        </h2>
        <p className="text-xs text-slate-400">
          Verify digital doctor signatures, patient information, and dispense soulbound medication tokens on the Monad blockchain.
        </p>
      </div>

      {/* Verify Prescription Form */}
      <div className="glass-panel p-5 max-w-xl mx-auto space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5">
          <Search size={14} />
          <span>Scan or Enter Prescription ID</span>
        </h3>
        
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input 
            type="number" 
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
            className="glass-input flex-1 text-xs" 
            placeholder="Enter prescription Token ID (e.g. 1)" 
            min="1"
            required
          />
          <button 
            type="submit" 
            disabled={searching}
            className="glass-button-primary py-2 text-xs font-bold flex items-center gap-1"
          >
            {searching ? 'Verifying...' : 'Verify Signature'}
          </button>
        </form>
      </div>

      {searched && !searching && !prescription && (
        <div className="flex flex-col items-center justify-center p-8 glass-panel max-w-md mx-auto text-center space-y-2 border-2 border-red-500/20 bg-red-500/5">
          <AlertCircle size={24} className="text-red-500" />
          <h4 className="font-bold text-white text-sm">Prescription Not Found</h4>
          <p className="text-xs text-slate-450 leading-relaxed">
            Prescription Token #{tokenIdInput} could not be resolved. Either the token has not been minted, or the contract addresses are misconfigured.
          </p>
        </div>
      )}

      {prescription && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Rx Details */}
          <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] font-bold text-[#06b6d4] font-mono uppercase tracking-wider">Verification Summary</span>
              <span className="text-[10px] text-slate-400 font-mono">Token ID: #{prescription.tokenId}</span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-450 font-bold uppercase block mb-0.5">Medication</span>
                <p className="text-base font-bold text-white">{prescription.medicationName}</p>
                <p className="text-slate-400">Dosage: {prescription.dosageMg}mg</p>
              </div>

              {prescription.details && (
                <div className="grid grid-cols-2 gap-4 bg-slate-950/20 p-3 rounded-lg border border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Patient Name</span>
                    <p className="font-bold text-white text-xs">{prescription.details.patientName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Date of Birth</span>
                    <p className="font-bold text-white text-xs">
                      {prescription.details.dob ? new Date(prescription.details.dob).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase block mb-0.5">Refills Remaining</span>
                  <p className="text-sm font-extrabold text-white">
                    {prescription.refillsAllowed - prescription.refillsUsed} / {prescription.refillsAllowed}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase block mb-0.5">Expiry Date</span>
                  <p className="text-sm font-bold text-white">
                    {new Date(prescription.expiresAt * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 space-y-2">
                <span className="text-[10px] text-slate-450 font-bold uppercase block">On-Chain Cryptographic Pointers</span>
                <p className="text-[8px] text-slate-500 font-mono truncate">Patient: {prescription.patient}</p>
                <p className="text-[8px] text-slate-500 font-mono truncate">CID: {prescription.ipfsCID}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Signature Verification & Dispense Button */}
          <div className="glass-panel p-6 space-y-6">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5 border-b border-white/5 pb-2">
              <ClipboardCheck size={14} />
              <span>Doctor Signature Integrity Check</span>
            </h3>

            <div className="space-y-4">
              {/* Doctor Status Badge */}
              <div className="border border-white/5 bg-slate-950/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Signature Status</span>
                  {doctorVerifiedOnChain ? (
                    <span className="badge-emerald">AUTHENTIC</span>
                  ) : (
                    <span className="badge-amber">UNVERIFIED LICENSE</span>
                  )}
                </div>

                <div className="text-xs space-y-1 text-slate-400 leading-normal">
                  <p>Issuing Address: <span className="font-mono text-white text-[10px] block truncate">{prescription.doctor}</span></p>
                  
                  {doctorVerifiedOnChain ? (
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 pt-1 select-none">
                      <CheckCircle2 size={12} />
                      <span>This doctor holds a verified medical license role on the Monad blockchain.</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 pt-1">
                      <AlertTriangle size={12} />
                      <span>WARNING: This signature cannot be authenticated. The issuing address does not have DOCTOR_ROLE.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {isExpired ? (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center text-xs text-red-400 space-y-1">
                  <AlertCircle size={20} className="mx-auto" />
                  <p className="font-bold">Prescription Expired</p>
                  <p className="text-[10px] text-slate-500">The expiration date for this medication token has passed.</p>
                </div>
              ) : noRefillsLeft ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center text-xs text-amber-400 space-y-1">
                  <AlertCircle size={20} className="mx-auto" />
                  <p className="font-bold">No Refills Remaining</p>
                  <p className="text-[10px] text-slate-500">This prescription has been fully dispensed.</p>
                </div>
              ) : (
                <button 
                  onClick={handleDispense}
                  disabled={dispensing || !doctorVerifiedOnChain}
                  className="glass-button-primary w-full py-3 text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  <span>{dispensing ? 'Recording Dispensation...' : 'Dispense Medication'}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default function PharmacyPortal() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs text-slate-400">Loading verified portal...</div>}>
      <PharmacyPortalContent />
    </Suspense>
  );
}
