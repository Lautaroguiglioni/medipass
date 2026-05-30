'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useDevDrawer } from '@/lib/devContext';
import { 
  Stethoscope, Search, User, ClipboardList, ShieldCheck, Plus, CheckCircle, RefreshCw, AlertCircle, ShieldAlert 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PatientProfile {
  name: string;
  dob: string;
  bloodType: string;
  allergies: string;
  conditions: string;
}

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

export default function DoctorPortal() {
  const { address, isConnected } = useAccount();
  const { addLog } = useDevDrawer();

  // Doctor Role State
  const [isDoctorRole, setIsDoctorRole] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [registeringDoctor, setRegisteringDoctor] = useState(false);

  // Search Patient State
  const [searchAddress, setSearchAddress] = useState('');
  const [activePatient, setActivePatient] = useState<string | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [patientRecords, setPatientRecords] = useState<ClinicalRecord[]>([]);
  const [searching, setSearching] = useState(false);

  // Write Clinical Record State
  const [recordType, setRecordType] = useState('Consultation');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [addingRecord, setAddingRecord] = useState(false);

  // Issue Prescription State
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [refills, setRefills] = useState(2);
  const [expiryDays, setExpiryDays] = useState(30);
  const [issuingPrescription, setIssuingPrescription] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      checkRole();
    } else {
      setIsDoctorRole(false);
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
        setIsDoctorRole(data.roles.isDoctor);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingRole(false);
    }
  };

  const handleRegisterDoctor = async () => {
    if (!address) return;
    setRegisteringDoctor(true);
    const startTime = performance.now();
    try {
      const res = await fetch('http://localhost:3001/api/roles/grant/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: address }),
      });
      const data = await res.json();
      if (res.ok) {
        confetti({ particleCount: 100, colors: ['#a78bfa', '#06b6d4', '#ffffff'] });
        addLog({
          title: `Registered Doctor License on Monad ⛓️`,
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
      setRegisteringDoctor(false);
    }
  };

  const handlePatientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAddress.trim()) return;
    
    setSearching(true);
    setActivePatient(null);
    setPatientProfile(null);
    setPatientRecords([]);

    const startTime = performance.now();
    const cleanAddress = searchAddress.trim();

    try {
      // 1. Fetch Patient's Profile Overview CID
      const profileRes = await fetch(`http://localhost:3001/api/history/${cleanAddress}`);
      const profileData = await profileRes.json();
      
      if (profileRes.ok && profileData.clinicalHistoryCID) {
        // Fetch profile JSON details from IPFS gateway
        const fetchRes = await fetch(`http://localhost:3001/api/ipfs/fetch/${profileData.clinicalHistoryCID}`);
        const fetchData = await fetchRes.json();
        if (fetchRes.ok && fetchData.data) {
          setPatientProfile({
            name: fetchData.data.patientName || '',
            dob: fetchData.data.dob || '',
            bloodType: fetchData.data.bloodType || '',
            allergies: fetchData.data.allergies || '',
            conditions: fetchData.data.conditions || '',
          });
        }
      }

      // 2. Fetch Patient's Clinical Records Timeline
      const timelineRes = await fetch(`http://localhost:3001/api/history/records/${cleanAddress}`);
      const timelineData = await timelineRes.json();

      if (timelineRes.ok && Array.isArray(timelineData.records)) {
        const recordsList: ClinicalRecord[] = timelineData.records;

        // Fetch decrypted record details in parallel
        const resolvedRecords = await Promise.all(
          recordsList.map(async (rec) => {
            try {
              const fetchRes = await fetch(`http://localhost:3001/api/ipfs/fetch/${rec.ipfsCID}`);
              const fetchData = await fetchRes.json();
              return {
                ...rec,
                details: fetchRes.ok ? fetchData.data : undefined
              };
            } catch {
              return rec;
            }
          })
        );
        setPatientRecords(resolvedRecords);
      }

      setActivePatient(cleanAddress);
      addLog({
        title: `Doctor consults patient EHR ${cleanAddress.slice(0, 6)}... 🔍`,
        type: 'read',
        onChainHash: 'N/A',
        executionTimeMs: Math.round(performance.now() - startTime),
        privateMetadata: { cleanAddress }
      });

    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    setAddingRecord(true);
    const startTime = performance.now();

    try {
      // 1. Upload new record detail to IPFS
      const uploadRes = await fetch('http://localhost:3001/api/ipfs/upload-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            patientAddress: activePatient,
            addedBy: address,
            recordType: recordType,
            diagnosis: diagnosis,
            treatment: treatment,
            notes: notes,
          },
          sensitiveFields: ['diagnosis', 'treatment', 'notes']
        })
      });
      const uploadData = await uploadRes.json();

      if (uploadRes.ok) {
        const recordCID = uploadData.cid;

        // 2. Add record on-chain to patient's timeline
        const addRes = await fetch('http://localhost:3001/api/history/records/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient: activePatient,
            ipfsCID: recordCID,
            recordType: recordType,
          })
        });
        const addData = await addRes.json();

        if (addRes.ok) {
          confetti({ particleCount: 80, spread: 60 });
          addLog({
            title: `Added Verifiable Record to patient timeline ⛓️`,
            type: 'emit',
            onChainHash: addData.txHash,
            executionTimeMs: Math.round(performance.now() - startTime),
            privateMetadata: { patient: activePatient, recordCID }
          });
          
          // Clear inputs & reload timeline
          setDiagnosis('');
          setTreatment('');
          setNotes('');
          
          // Reload timeline data
          const reloadRes = await fetch(`http://localhost:3001/api/history/records/${activePatient}`);
          const reloadData = await reloadRes.json();
          if (reloadRes.ok && Array.isArray(reloadData.records)) {
            const list: ClinicalRecord[] = reloadData.records;
            const resolved = await Promise.all(list.map(async (rec) => {
              const res = await fetch(`http://localhost:3001/api/ipfs/fetch/${rec.ipfsCID}`);
              const data = await res.json();
              return { ...rec, details: data.data };
            }));
            setPatientRecords(resolved);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingRecord(false);
    }
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    setIssuingPrescription(true);
    const startTime = performance.now();

    try {
      // 1. Upload prescription to IPFS
      const uploadRes = await fetch('http://localhost:3001/api/ipfs/upload-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientProfile?.name || 'Unknown Patient',
          patientAddress: activePatient,
          medicationName: medication,
          dosage: dosage,
          refills: refills,
          notes: `Prescribed by verified Doctor wallet: ${address}`,
          prescribedBy: address,
        })
      });
      const uploadData = await uploadRes.json();

      if (uploadRes.ok) {
        const rxCID = uploadData.cid;
        const expiryUnix = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60);

        // 2. Issue Soulbound Token on-chain
        const issueRes = await fetch('http://localhost:3001/api/prescriptions/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient: activePatient,
            ipfsCID: rxCID,
            medicationName: medication,
            dosageMg: 500, // standard mg for mock representation
            refillsAllowed: refills,
            expiresAt: expiryUnix,
          })
        });
        const issueData = await issueRes.json();

        if (issueRes.ok) {
          confetti({ particleCount: 120, colors: ['#10b981', '#06b6d4', '#ffffff'] });
          addLog({
            title: `Issued Soulbound Rx on-chain 🛡️`,
            type: 'emit',
            onChainHash: issueData.txHash,
            executionTimeMs: Math.round(performance.now() - startTime),
            privateMetadata: { patient: activePatient, tokenId: issueData.tokenId }
          });

          // Reset inputs
          setMedication('');
          setDosage('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIssuingPrescription(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 glass-panel max-w-md mx-auto my-12">
        <ShieldAlert size={48} className="text-amber-500 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Wallet Connection Required</h2>
        <p className="text-xs text-slate-400">
          Please connect your MetaMask wallet to access the Doctor clinical suite.
        </p>
      </div>
    );
  }

  if (checkingRole) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin inline-block rounded-full h-8 w-8 border-4 border-[#06b6d4] border-t-transparent mb-4"></div>
        <p className="text-xs text-slate-400 font-medium">Verifying license credentials on Monad Testnet...</p>
      </div>
    );
  }

  if (!isDoctorRole) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-5 glass-panel max-w-lg mx-auto my-12 border-2 border-[#8b5cf6]/20 bg-[#8b5cf6]/5">
        <Stethoscope size={48} className="text-[#8b5cf6]" />
        <div>
          <h2 className="text-xl font-bold text-white">Vetted Doctor Signature Required</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your wallet address (`{address}`) is not registered as an authorized medical professional on the blockchain. 
            For the demo, you can activate doctor mode below to grant your wallet the on-chain license.
          </p>
        </div>
        <button 
          onClick={handleRegisterDoctor} 
          disabled={registeringDoctor}
          className="glass-button-primary w-full text-xs font-bold bg-gradient-to-r from-violet-500 to-[#8b5cf6] shadow-[0_4px_14px_rgba(139,92,246,0.3)]"
        >
          {registeringDoctor ? 'Granting Doctor License...' : 'Activate Doctor Mode'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Stethoscope size={16} className="text-[#06b6d4]" />
          <span>Vetted Doctor Consultation Portal</span>
        </h2>
        <p className="text-xs text-slate-400">
          Search patient health history records and issue verified prescriptions directly onto the blockchain.
        </p>
      </div>

      {/* Patient Search Form */}
      <div className="glass-panel p-5 max-w-xl mx-auto space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5">
          <Search size={14} />
          <span>Patient Lookup</span>
        </h3>
        
        <form onSubmit={handlePatientSearch} className="flex gap-2">
          <input 
            type="text" 
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="glass-input flex-1 text-xs" 
            placeholder="Paste patient's Monad wallet address (e.g. 0x4840...)" 
            required
          />
          <button 
            type="submit" 
            disabled={searching}
            className="glass-button-primary py-2 text-xs font-bold flex items-center gap-1"
          >
            {searching ? 'Querying...' : 'Verify'}
          </button>
        </form>
      </div>

      {activePatient && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Patient Overview & Record forms */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Demographic Profile Card */}
            <div className="glass-panel p-5 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5 border-b border-white/5 pb-2">
                <User size={13} />
                <span>Patient Health Overview</span>
              </h4>

              {patientProfile ? (
                <div className="text-xs space-y-2.5 leading-normal text-slate-300">
                  <p><span className="text-[10px] text-slate-450 block font-bold uppercase">Name</span> {patientProfile.name}</p>
                  <p><span className="text-[10px] text-slate-450 block font-bold uppercase">DoB</span> {new Date(patientProfile.dob).toLocaleDateString()}</p>
                  <p><span className="text-[10px] text-slate-450 block font-bold uppercase">Blood Type</span> {patientProfile.bloodType}</p>
                  <p><span className="text-[10px] text-slate-450 block font-bold uppercase">Allergies</span> <span className="text-red-400 font-semibold">{patientProfile.allergies || 'None'}</span></p>
                  <p><span className="text-[10px] text-slate-450 block font-bold uppercase">Conditions</span> {patientProfile.conditions || 'None'}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No overall health record uploaded by patient yet.</p>
              )}
            </div>

            {/* Write Clinical Record form */}
            <div className="glass-panel p-5 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5 border-b border-white/5 pb-2">
                <ClipboardList size={13} />
                <span>Add Record Entry</span>
              </h4>

              <form onSubmit={handleAddRecord} className="space-y-3 text-xs text-slate-350">
                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Record Type</label>
                  <select 
                    value={recordType} 
                    onChange={(e) => setRecordType(e.target.value)} 
                    className="glass-input w-full bg-[#0b0f19]"
                  >
                    <option value="Consultation">Consultation Notes</option>
                    <option value="Lab Result">Lab Result / Test</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Prescription">Prescription</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Diagnosis / Indication</label>
                  <input 
                    type="text" 
                    value={diagnosis} 
                    onChange={(e) => setDiagnosis(e.target.value)} 
                    className="glass-input w-full"
                    placeholder="Enter diagnosis description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Treatment Plan</label>
                  <input 
                    type="text" 
                    value={treatment} 
                    onChange={(e) => setTreatment(e.target.value)} 
                    className="glass-input w-full"
                    placeholder="Enter prescribed treatment plan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Clinical Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    className="glass-input w-full h-16 resize-none"
                    placeholder="Enter clinical notes"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={addingRecord}
                  className="glass-button-primary w-full text-xs font-bold"
                >
                  {addingRecord ? 'Adding record...' : 'Sign & Record Entry'}
                </button>
              </form>
            </div>

          </div>

          {/* Right Columns: Timeline View & Issue Prescription */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Issue Prescription Card */}
            <div className="glass-panel p-6 space-y-4 bg-gradient-to-b from-[#0f172a]/30 to-transparent">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Plus size={14} />
                <span>Issue verified on-chain prescription</span>
              </h3>

              <form onSubmit={handleIssuePrescription} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-350">
                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Medication Name</label>
                  <input 
                    type="text" 
                    value={medication} 
                    onChange={(e) => setMedication(e.target.value)} 
                    className="glass-input w-full"
                    placeholder="e.g. Amoxicillin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Dosage Details</label>
                  <input 
                    type="text" 
                    value={dosage} 
                    onChange={(e) => setDosage(e.target.value)} 
                    className="glass-input w-full"
                    placeholder="e.g. 500mg - 3x daily"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Refills Allowed</label>
                  <input 
                    type="number" 
                    value={refills} 
                    onChange={(e) => setRefills(Number(e.target.value))} 
                    className="glass-input w-full"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Validity (Days)</label>
                  <input 
                    type="number" 
                    value={expiryDays} 
                    onChange={(e) => setExpiryDays(Number(e.target.value))} 
                    className="glass-input w-full"
                    min="1"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <button 
                    type="submit" 
                    disabled={issuingPrescription}
                    className="glass-button-primary w-full text-xs font-bold"
                  >
                    {issuingPrescription ? 'Issuing Soulbound token...' : 'Mint & Issue Prescription'}
                  </button>
                </div>
              </form>
            </div>

            {/* Patients Clinical history timeline */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#06b6d4] flex items-center gap-1.5 border-b border-white/5 pb-2">
                <ClipboardList size={14} />
                <span>Patient's Verifiable Timeline</span>
              </h3>

              {patientRecords.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No timeline records found for this patient address.</p>
              ) : (
                <div className="relative timeline-border pl-6 space-y-6 ml-2">
                  {patientRecords.map((rec, idx) => (
                    <div key={idx} className="relative space-y-2">
                      <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#06b6d4] bg-[#0b0f19]"></div>
                      
                      <div className="border border-white/5 bg-slate-950/20 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-2 flex-wrap text-xs">
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

          </div>

        </div>
      )}
    </div>
  );
}
