'use client';

import React, { useState } from 'react';
import { dbService, PrescriptionMetadata } from '@/lib/supabase';
import { mockMonadLedger } from '@/config/contract';
import { useDevDrawer } from '@/lib/devContext';
import { User, QrCode, ClipboardList, Clock, ShieldCheck, Eye, X } from 'lucide-react';
import QRCode from 'react-qr-code';

interface PrescriptionWithChainState extends PrescriptionMetadata {
  isRedeemed: boolean;
  isValid: boolean;
}

export default function PatientPortal() {
  const { addLog } = useDevDrawer();

  // Search state
  const [patientId, setPatientId] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithChainState[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Modal Popover State for active QR Code
  const [activeQrPrescription, setActiveQrPrescription] = useState<PrescriptionWithChainState | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;

    setLoading(true);
    setSearched(true);
    setActiveQrPrescription(null);
    
    const startTime = performance.now();
    const query = patientId.trim().toLowerCase();

    try {
      const list = await dbService.getPrescriptionsByPatient(query);
      
      const fullListPromises = list.map(async (item) => {
        let isRedeemed = false;
        let isValid = false;

        const ledgerState = await mockMonadLedger.getPrescription(item.hash);
        if (ledgerState) {
          isRedeemed = ledgerState.isRedeemed;
          isValid = ledgerState.isValid;
        }

        return {
          ...item,
          isRedeemed,
          isValid,
        };
      });

      const fullList = await Promise.all(fullListPromises);
      setPrescriptions(fullList);

      const executionTimeMs = Math.round(performance.now() - startTime);

      addLog({
        title: `Paciente ID: ${query} cargó historial 🩺`,
        type: 'read',
        onChainHash: 'N/A',
        executionTimeMs,
        privateMetadata: {
          patientId: query,
          recordsLoaded: fullList.length,
          auditProtocol: 'ISO/IEC 27001 Secured'
        }
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <User size={16} className="text-blue-800" />
          <span>Portal Personal de Pacientes</span>
        </h2>
        <p className="text-xs text-slate-500">
          Consulte su historial de recetas autorizadas y acceda a las credenciales QR de entrega para farmacia.
        </p>
      </div>

      {/* Login / Search Bar */}
      <div className="bg-white border border-slate-250 rounded p-4 shadow-sm max-w-lg mx-auto mb-8">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-wider">
            Ingrese su ID de Paciente (DNI / RUT)
          </label>
          
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. juanperez o marialopez"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="ehr-input"
            />
            
            <button
              type="submit"
              disabled={loading}
              className="ehr-btn-primary py-1 px-4 text-[10px]"
            >
              {loading ? 'Consultando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded border border-slate-250 max-w-2xl mx-auto shadow-sm">
          <div className="animate-spin inline-block rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent mb-2"></div>
          <p className="text-xs text-slate-500">Cargando recetas clínicas...</p>
        </div>
      ) : searched && prescriptions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded border border-slate-250 max-w-lg mx-auto shadow-sm p-5">
          <ClipboardList size={30} className="text-slate-350 mx-auto mb-3" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Sin Historial de Recetas</h3>
          <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
            No se encontraron recetas activas ni despachadas bajo el identificador <strong>{patientId}</strong>.
          </p>
        </div>
      ) : prescriptions.length > 0 ? (
        <div className="space-y-6">
          
          {/* Grid Layout of tactile Double-Bordered EHR Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {prescriptions.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-300 rounded p-4 flex flex-col justify-between shadow-sm hover:border-slate-450 transition-colors">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-3">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">
                      CREDENCIAL CLÍNICA
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 mt-0.5">RECETA DIGITAL</span>
                  </div>
                  
                  {item.isRedeemed ? (
                    <span className="ehr-badge-redeemed">Canjeada</span>
                  ) : item.isValid ? (
                    <span className="ehr-badge-active">Activa / Vigente</span>
                  ) : (
                    <span className="ehr-badge-error">Inactiva</span>
                  )}
                </div>

                {/* Body Details */}
                <div className="space-y-3 flex-1 mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-bold">Medicamento Prescripto</span>
                    <strong className="text-slate-800 text-sm font-extrabold truncate block">{item.medication}</strong>
                  </div>
                  
                  <div>
                    <span className="text-slate-400 text-[9px] block uppercase font-bold">Dosificación</span>
                    <p className="text-slate-700 italic font-medium leading-normal mt-0.5">
                      {item.dosage}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9px] pt-1.5 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-bold">MATRÍCULA DR.</span>
                      <strong className="text-slate-650 font-semibold">{item.doctorLicense}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">EMISIÓN</span>
                      <strong className="text-slate-650 font-semibold">
                        {new Date(item.createdAt).toLocaleDateString('es-ES')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => setActiveQrPrescription(item)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <QrCode size={12} />
                  <span>Obtener Código QR de Canje</span>
                </button>

              </div>
            ))}
          </div>

          {/* Simple Modal Popover (Non-flashy, flat, black and white) */}
          {activeQrPrescription && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-350 rounded p-5 max-w-[320px] w-full text-slate-800 space-y-4 shadow-xl animate-scale-up">
                
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                      Código de Suministro
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">MUESTRA AL FARMACÉUTICO</span>
                  </div>
                  <button
                    onClick={() => setActiveQrPrescription(null)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center py-4 bg-slate-50 border border-slate-200 rounded">
                  <div className="p-2.5 bg-white border border-slate-300 rounded shadow-sm">
                    <QRCode value={activeQrPrescription.hash} size={140} />
                  </div>
                  
                  <span className="text-[8px] font-mono text-slate-450 mt-3 text-center px-3 truncate w-full">
                    HASH: {activeQrPrescription.hash}
                  </span>
                </div>

                {/* Popover Card Summary Details */}
                <div className="text-[10px] text-slate-650 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div>Medicamento: <strong className="text-slate-850">{activeQrPrescription.medication}</strong></div>
                  <div>Paciente DNI/RUT: <strong className="text-slate-850 font-mono">{activeQrPrescription.patientId}</strong></div>
                  <div className="flex items-center gap-1.5 pt-1 text-[9px] font-semibold text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${activeQrPrescription.isRedeemed ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>
                    <span>{activeQrPrescription.isRedeemed ? 'YA CANJEADA' : 'VIGENTE - AUTORIZADA'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveQrPrescription(null)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded transition-all"
                >
                  Cerrar Visualizador
                </button>

              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded border border-slate-250 max-w-md mx-auto shadow-sm p-6">
          <ClipboardList size={30} className="text-slate-350 mx-auto mb-3" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Acceso Registrado</h3>
          <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
            Ingrese su ID de paciente registrado (e.g. `juanperez` o `marialopez`) en el cuadro de búsqueda para acceder a su historial de recetas electrónicas activas y descargar sus códigos QR de canje farmacéutico.
          </p>
        </div>
      )}
    </div>
  );
}
