'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useDevDrawer } from '@/lib/devContext';
import { 
  User, ClipboardList, ShieldCheck, QrCode, Video, Plus, CheckCircle, RefreshCw, X, Heart, ShieldAlert 
} from 'lucide-react';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';

interface ClinicalRecord {
  addedBy: string;
  ipfsCID: string;
  timestamp: number;
  recordType: string;
  details?: {
    patientName?: string;
    dob?: string;
    diagnosis?: string;
    treatment?: string;
    allergies?: string;
    notes?: string;
  };
}

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

export default function PatientPortal() {
  const { address, isConnected } = useAccount();
  const { addLog } = useDevDrawer();

  // Basic Patient Info State
  const [profile, setProfile] = useState<{
    name: string;
    dob: string;
    bloodType: string;
    allergies: string;
    conditions: string;
  }>({ name: '', dob: '', bloodType: '', allergies: '', conditions: '' });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileCID, setProfileCID] = useState<string | null>(null);

  // Verifiable timeline state
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [activeQrCode, setActiveQrCode] = useState<Prescription | null>(null);

  // Role state
  const [isPatientRole, setIsPatientRole] = useState<boolean>(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // Video call simulation modal
  const [activeCallDoc, setActiveCallDoc] = useState<string | null>(null);
  const [callConnected, setCallConnected] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  // Mock list of specialties & doctors
  const specialties = [
    { name: 'General Practitioner', doctor: 'Dr. Elena Rostova', country: 'Germany', license: 'DE-GP-99382', address: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf' },
    { name: 'Cardiologist', doctor: 'Dr. Mateo Silva', country: 'Brazil', license: 'BR-CARD-05849', address: '0x8B9d442e9D7769CDc62d04a6015b67aEd5498498a' },
    { name: 'Dermatologist', doctor: 'Dr. Yuki Sato', country: 'Japan', license: 'JP-DERM-48291', address: '0x2b8e39f37c35d20b6f9e31d4ed8f902c08e50b81' },
    { name: 'Pediatrician', doctor: 'Dr. Sofia Martinez', country: 'Spain', license: 'ES-PED-84295', address: '0x498a442e9D7769CDc62d04a6015b67aEd5498B9d' },
  ];

  useEffect(() => {
    if (isConnected && address) {
      checkRole();
    } else {
      setIsPatientRole(false);
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
        setIsPatientRole(data.roles.isPatient);
        if (data.roles.isPatient) {
          // If they are a registered patient, load all their clinical history data
          await Promise.all([
            loadClinicalHistoryOverview(),
            loadVerifiableTimeline(),
            loadPrescriptions()
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingRole(false);
    }
  };

  const loadClinicalHistoryOverview = async () => {
    if (!address) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`http://localhost:3001/api/history/${address}`);
      const data = await res.json();
      if (res.ok && data.clinicalHistoryCID) {
        setProfileCID(data.clinicalHistoryCID);
        
        // Fetch details from IPFS gateway
        const ipfsRes = await fetch(`http://localhost:3001/api/ipfs/fetch/${data.clinicalHistoryCID}`);
        const ipfsData = await ipfsRes.json();
        if (ipfsRes.ok && ipfsData.data) {
          setProfile({
            name: ipfsData.data.patientName || '',
            dob: ipfsData.data.dob || '',
            bloodType: ipfsData.data.bloodType || '',
            allergies: ipfsData.data.allergies || '',
            conditions: ipfsData.data.conditions || '',
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadVerifiableTimeline = async () => {
    if (!address) return;
    setLoadingTimeline(true);
    const startTime = performance.now();
    try {
      const res = await fetch(`http://localhost:3001/api/history/records/${address}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.records)) {
        const recordsList: ClinicalRecord[] = data.records;

        // Fetch individual details from IPFS in parallel
        const resolvedRecords = await Promise.all(
          recordsList.map(async (rec) => {
            try {
              const fetchRes = await fetch(`http://localhost:3001/api/ipfs/fetch/${rec.ipfsCID}`);
              const fetchData = await fetchRes.json();
              return {
                ...rec,
                details: fetchData.ok !== false ? fetchData.data : undefined
              };
            } catch {
              return rec;
            }
          })
        );
        setRecords(resolvedRecords);
        addLog({
          title: `Timeline clinical records synchronized ⛓️`,
          type: 'read',
          onChainHash: 'N/A',
          executionTimeMs: Math.round(performance.now() - startTime),
          privateMetadata: { count: resolvedRecords.length }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const loadPrescriptions = async () => {
    if (!address) return;
    setLoadingPrescriptions(true);
    try {
      const res = await fetch(`http://localhost:3001/api/prescriptions/patient/${address}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.tokenIds)) {
        const ids: string[] = data.tokenIds;

        const list = await Promise.all(
          ids.map(async (id) => {
            const detailRes = await fetch(`http://localhost:3001/api/prescriptions/${id}`);
            const detailData = await detailRes.json();
            if (detailRes.ok) {
              const rx: Prescription = detailData.prescription;
              // Fetch patient encrypted notes/metadata from IPFS if CID is present
              try {
                const ipfsRes = await fetch(`http://localhost:3001/api/ipfs/fetch/${rx.ipfsCID}`);
                const ipfsData = await ipfsRes.json();
                return {
                  ...rx,
                  details: ipfsData.ok !== false ? ipfsData.data : undefined
                };
              } catch {
                return rx;
              }
            }
            return null;
          })
        );

        setPrescriptions(list.filter((x): x is Prescription => x !== null));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setSavingProfile(true);
    const startTime = performance.now();

    try {
      // 1. Upload new metadata to IPFS
      const uploadRes = await fetch('http://localhost:3001/api/ipfs/upload-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            patientName: profile.name,
            dob: profile.dob,
            bloodType: profile.bloodType,
            allergies: profile.allergies,
            conditions: profile.conditions,
            patientAddress: address,
          },
          sensitiveFields: ['patientName', 'dob', 'allergies', 'conditions']
        })
      });
      const uploadData = await uploadRes.json();

      if (uploadRes.ok) {
        const newCID = uploadData.cid;

        // 2. Save overall history CID on-chain
        const updateRes = await fetch('http://localhost:3001/api/history/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ipfsCID: newCID }),
        });
        const updateData = await updateRes.json();

        if (updateRes.ok) {
          confetti({ particleCount: 80, spread: 60 });
          setProfileCID(newCID);
          addLog({
            title: `Updated Overall Health Record on-chain 🛡️`,
            type: 'emit',
            onChainHash: updateData.txHash,
            executionTimeMs: Math.round(performance.now() - startTime),
            privateMetadata: { cid: newCID }
          });
          await loadClinicalHistoryOverview();
        }
      }
    } catch (err) {
      console.error('Failed to update clinical profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Video call triggers
  const handleStartCall = (docName: string) => {
    setActiveCallDoc(docName);
    setCallConnected(false);
    setCallEnded(false);
    setTimeout(() => {
      setCallConnected(true);
    }, 2000);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 glass-panel max-w-md mx-auto my-12">
        <ShieldAlert size={48} className="text-amber-500 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Wallet Connection Required</h2>
        <p className="text-xs text-slate-400">
          Please connect your MetaMask wallet to view your patient profile and medical timeline.
        </p>
      </div>
    );
  }

  if (checkingRole) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin inline-block rounded-full h-8 w-8 border-4 border-[#06b6d4] border-t-transparent mb-4"></div>
        <p className="text-xs text-slate-400 font-medium">Verifying patient credentials on Monad Testnet...</p>
      </div>
    );
  }

  if (!isPatientRole) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-5 glass-panel max-w-lg mx-auto my-12 border-2 border-amber-500/20 bg-amber-500/5">
        <ShieldAlert size={48} className="text-amber-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Access Denied: Unregistered Wallet</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your wallet address (`{address}`) does not hold the patient credentials on the blockchain. 
            You must register or purchase a subscription to activate your clinical registry.
          </p>
        </div>
        <button 
          onClick={checkRole} 
          className="glass-button-primary w-full text-xs font-bold"
        >
          Check Subscription Status
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <User size={16} className="text-[#06b6d4]" />
            <span>Digital Nomad Medical Portal</span>
          </h2>
          <p className="text-xs text-slate-400">
            Secure, encrypted medical summaries and prescriptions on-chain. Valid globally.
          </p>
        </div>
        
        <button 
          onClick={async () => {
            await Promise.all([loadClinicalHistoryOverview(), loadVerifiableTimeline(), loadPrescriptions()]);
          }}
          className="glass-button-secondary text-xs flex items-center gap-1"
        >
          <RefreshCw size={12} />
          <span>Synchronize Ledger</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Overall Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5">
              <ClipboardList size={14} />
              <span>Personal Health Profile</span>
            </h3>

            {loadingProfile ? (
              <div className="text-center py-6">
                <div className="animate-spin inline-block rounded-full h-4 w-4 border-2 border-[#06b6d4] border-t-transparent mb-2"></div>
                <p className="text-[10px] text-slate-400">Loading profile CIDs...</p>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs text-slate-350">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.name} 
                    onChange={(e) => setProfile({...profile, name: e.target.value})} 
                    className="glass-input w-full"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={profile.dob} 
                      onChange={(e) => setProfile({...profile, dob: e.target.value})} 
                      className="glass-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Blood Type</label>
                    <input 
                      type="text" 
                      value={profile.bloodType} 
                      onChange={(e) => setProfile({...profile, bloodType: e.target.value})} 
                      className="glass-input w-full"
                      placeholder="e.g. O+"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Allergies (Encrypted)</label>
                  <textarea 
                    value={profile.allergies} 
                    onChange={(e) => setProfile({...profile, allergies: e.target.value})} 
                    className="glass-input w-full h-16 resize-none"
                    placeholder="List drug/food allergies"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Chronic Conditions (Encrypted)</label>
                  <textarea 
                    value={profile.conditions} 
                    onChange={(e) => setProfile({...profile, conditions: e.target.value})} 
                    className="glass-input w-full h-16 resize-none"
                    placeholder="List medical conditions"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="glass-button-primary w-full text-xs font-bold"
                >
                  {savingProfile ? 'Updating On-Chain...' : 'Save & Encrypt Record'}
                </button>
              </form>
            )}

            {profileCID && (
              <div className="border-t border-white/5 pt-3 mt-4">
                <span className="block text-[9px] text-slate-500 font-mono truncate">CID: {profileCID}</span>
              </div>
            )}
          </div>

          {/* Book Consultation / Telemedicine Cartilla */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5">
              <Video size={14} />
              <span>International Doctor Network</span>
            </h3>
            <p className="text-[11px] text-slate-450 leading-relaxed">
              Facing health issues abroad? Consult with verified on-chain doctors from our cartilla for remote diagnosis and prescription issuance.
            </p>

            <div className="space-y-3">
              {specialties.map((item, idx) => (
                <div key={idx} className="border border-white/5 bg-slate-950/20 p-3 rounded-lg flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-xs leading-none mb-1">{item.doctor}</h4>
                    <span className="text-[9px] text-slate-400 block">{item.name} ({item.country})</span>
                    <span className="text-[8px] text-slate-500 font-mono block">Lic: {item.license}</span>
                  </div>
                  <button 
                    onClick={() => handleStartCall(item.doctor)}
                    className="glass-button-primary py-1 px-3.5 text-[10px] font-bold shrink-0 flex items-center gap-1"
                  >
                    <Video size={10} />
                    <span>Call</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Medical Timeline & Prescriptions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Medical Record Timeline */}
          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5">
              <ClipboardList size={14} />
              <span>Your Verifiable Medical Timeline</span>
            </h3>

            {loadingTimeline ? (
              <div className="text-center py-10">
                <div className="animate-spin inline-block rounded-full h-6 w-6 border-2 border-[#06b6d4] border-t-transparent mb-2"></div>
                <p className="text-xs text-slate-400">Loading blockchain history...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/5 rounded-xl bg-slate-950/10">
                <p className="text-xs text-slate-500">No medical entries found in your blockchain history.</p>
              </div>
            ) : (
              <div className="relative timeline-border pl-6 space-y-6 ml-2">
                {records.map((rec, idx) => (
                  <div key={idx} className="relative space-y-2">
                    {/* Circle marker */}
                    <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#06b6d4] bg-[#0b0f19]"></div>
                    
                    <div className="border border-white/5 bg-slate-950/20 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="badge-cyan">{rec.recordType}</span>
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">
                            {new Date(rec.timestamp * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono truncate max-w-[120px]">
                          By: {rec.addedBy}
                        </span>
                      </div>

                      {rec.details ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                          <div>
                            <span className="text-[9px] text-[#06b6d4] font-bold block uppercase tracking-wider">Diagnosis</span>
                            <p className="text-white font-medium">{rec.details.diagnosis || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#06b6d4] font-bold block uppercase tracking-wider">Treatment / Meds</span>
                            <p className="text-white font-medium">{rec.details.treatment || 'N/A'}</p>
                          </div>
                          {rec.details.notes && (
                            <div className="md:col-span-2 border-t border-white/5 pt-2">
                              <span className="text-[9px] text-[#06b6d4] font-bold block uppercase tracking-wider">Clinical Notes</span>
                              <p className="text-slate-300 italic">"{rec.details.notes}"</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Record data encrypted on-chain. CID: {rec.ipfsCID}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescriptions Section */}
          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5">
              <QrCode size={14} />
              <span>Active Soulbound Prescriptions</span>
            </h3>

            {loadingPrescriptions ? (
              <div className="text-center py-6">
                <div className="animate-spin inline-block rounded-full h-5 w-5 border-2 border-[#06b6d4] border-t-transparent"></div>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/5 rounded-xl bg-slate-950/10">
                <p className="text-xs text-slate-500">No on-chain prescriptions found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prescriptions.map((rx, idx) => (
                  <div key={idx} className="border border-white/5 bg-slate-950/20 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-white font-mono">Token ID: #{rx.tokenId}</span>
                        {rx.isDispensed && rx.refillsUsed >= rx.refillsAllowed ? (
                          <span className="badge-amber">Fully Redeemed</span>
                        ) : (
                          <span className="badge-emerald">Active</span>
                        )}
                      </div>

                      <h4 className="font-bold text-white text-xs mt-2">{rx.medicationName}</h4>
                      <p className="text-[11px] text-slate-400">Dosage: {rx.dosageMg}mg</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Refills Used: {rx.refillsUsed} / {rx.refillsAllowed}
                      </p>
                      
                      {rx.details && rx.details.notes && (
                        <p className="text-[10px] text-slate-450 italic mt-2 border-t border-white/5 pt-2">"{rx.details.notes}"</p>
                      )}
                    </div>

                    <button 
                      onClick={() => setActiveQrCode(rx)}
                      className="glass-button-primary text-[10px] py-1.5 w-full flex items-center justify-center gap-1"
                    >
                      <QrCode size={11} />
                      <span>Show Dispense QR Code</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Video Call Modal */}
      {activeCallDoc && (
        <div className="fixed inset-0 bg-[#05070c]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-lg bg-[#0b0f19] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[420px] justify-between relative">
            <button 
              onClick={() => { setActiveCallDoc(null); setCallConnected(false); }}
              className="absolute top-4 right-4 bg-white/5 hover:bg-white/15 text-white p-1.5 rounded-full z-10"
            >
              <X size={16} />
            </button>

            {/* Video Call Screen */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 relative">
              {!callConnected ? (
                <div className="text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/30 flex items-center justify-center mx-auto text-[#06b6d4] animate-ping">
                    <Video size={20} />
                  </div>
                  <p className="text-xs text-[#06b6d4] font-semibold">Calling {activeCallDoc}...</p>
                  <span className="text-[10px] text-slate-550 block">Connecting video bridge</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-6">
                  {/* Doctor Video Feed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-[#06b6d4] flex items-center justify-center mx-auto text-slate-350 text-2xl font-bold font-mono shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        H
                      </div>
                      <p className="font-bold text-white text-sm">{activeCallDoc}</p>
                      <span className="badge-cyan">Consultation Active</span>
                    </div>
                  </div>
                  
                  {/* Patient mini feed */}
                  <div className="absolute bottom-4 right-4 h-24 w-18 border border-white/10 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase shadow-lg">
                    You
                  </div>

                  <span className="text-[10px] text-emerald-400 font-mono tracking-wider font-semibold z-10 select-none">
                    🔒 End-to-end encrypted medical feed
                  </span>
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="bg-[#05070c] p-4 flex items-center justify-center gap-4">
              <button 
                onClick={() => { setActiveCallDoc(null); setCallConnected(false); }}
                className="bg-red-650 hover:bg-red-800 text-white font-bold px-6 py-2 rounded-full text-xs transition-colors"
              >
                End Consultation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Dispensing */}
      {activeQrCode && (
        <div className="fixed inset-0 bg-[#05070c]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-sm bg-[#0b0f19] p-6 text-center space-y-4 relative">
            <button 
              onClick={() => setActiveQrCode(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
            
            <h3 className="font-bold text-white text-sm uppercase">Dispense Prescription</h3>
            <p className="text-xs text-slate-400">Present this QR code to the pharmacist. They will verify your active status on-chain.</p>
            
            <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
              <QRCode value={activeQrCode.tokenId} size={150} />
            </div>
            
            <div className="text-xs text-left bg-slate-950/20 p-3 rounded-lg border border-white/5 space-y-1">
              <p className="font-bold text-white text-[11px]">{activeQrCode.medicationName}</p>
              <p className="text-slate-400 text-[10px]">Dosage: {activeQrCode.dosageMg}mg</p>
              <p className="text-slate-500 text-[9px] font-mono">Token: {activeQrCode.tokenId}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
