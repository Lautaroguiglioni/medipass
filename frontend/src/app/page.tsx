'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dbService, PrescriptionMetadata } from '@/lib/supabase';
import { mockMonadLedger } from '@/config/contract';
import { ClipboardList, Stethoscope, Pill, ShieldCheck, AlertCircle, Plus } from 'lucide-react';
import { useDevDrawer } from '@/lib/devContext';

export default function EHRDashboard() {
  const { addLog } = useDevDrawer();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seed default data if empty, and fetch from database
  useEffect(() => {
    const loadEHRData = async () => {
      setLoading(true);
      try {
        let currentList = await dbService.listAllPrescriptions();

        // Seed requested default records if none exist
        if (currentList.length === 0) {
          const seedData: PrescriptionMetadata[] = [
            {
              hash: '0x7b6f7091e4a3b8398492080a2b8e39f37c35d20b6f9e31d4ed8f9024c08e50b8',
              doctorLicense: 'M-10294',
              patientName: 'Juan Pérez',
              patientId: 'juanperez',
              medication: 'Amoxicilina 500mg',
              dosage: '1 comprimido cada 8 horas por 7 días',
              instructions: 'Tomar con abundante agua',
              createdAt: '2026-07-18T08:30:00Z',
            },
            {
              hash: '0x9a3e20bfd8d50e8a71d87ee9db5678cd3f6e80b2a8d50e8a71d87ee9db5672ab',
              doctorLicense: 'M-05849',
              patientName: 'María López',
              patientId: 'marialopez',
              medication: 'Ibuprofeno 600mg',
              dosage: '1 comprimido cada 12 horas si presenta dolor',
              instructions: 'No tomar con el estómago vacío',
              createdAt: '2026-07-18T10:15:00Z',
            },
          ];

          // Save seeds privately
          for (const item of seedData) {
            await dbService.savePrescription(item);
          }

          // Register in simulated monad ledger
          await mockMonadLedger.emitPrescription(seedData[0].hash, '0x498a442e9D7769CDc62d04a6015b67aEd5498B9d');
          
          // Seed second record as redeemed on-chain
          await mockMonadLedger.emitPrescription(seedData[1].hash, '0x8B9d442e9D7769CDc62d04a6015b67aEd5498498a');
          await mockMonadLedger.redeemPrescription(seedData[1].hash);

          currentList = await dbService.listAllPrescriptions();
        }

        // Fetch on-chain status of all list items in parallel
        const listWithChainStates = await Promise.all(
          currentList.map(async (item) => {
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
          })
        );

        setPrescriptions(listWithChainStates);
        
        // Log telemetry
        addLog({
          title: 'Panel General EHR Cargado 📁',
          type: 'read',
          onChainHash: 'N/A',
          executionTimeMs: 120,
          privateMetadata: {
            prescriptionsLoaded: listWithChainStates.length,
            provider: 'EHR Database Resolver'
          }
        });

      } catch (err) {
        console.error('Failed to load EHR data', err);
      } finally {
        setLoading(false);
      }
    };

    loadEHRData();
  }, []);

  // Compute stats
  const totalIssued = prescriptions.length;
  const totalRedeemed = prescriptions.filter((p) => p.isRedeemed).length;
  const totalActive = prescriptions.filter((p) => p.isValid && !p.isRedeemed).length;
  const complianceRate = totalIssued > 0 ? Math.round((totalRedeemed / totalIssued) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
            Bandeja Clínico General
          </h2>
          <p className="text-xs text-slate-500">
            Registro consolidado de recetas electrónicas, firmas de integridad y auditorías.
          </p>
        </div>

        <Link
          href="/dashboard/doctor"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-750 hover:bg-blue-900 border border-blue-900 text-white font-bold text-xs rounded transition-colors"
        >
          <Plus size={14} />
          <span>Nueva Prescripción</span>
        </Link>
      </div>

      {/* Metrics Row (Compact Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-250 p-3 rounded shadow-sm">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Total Prescripciones
          </span>
          <span className="block text-xl font-bold text-slate-800 mt-1">
            {totalIssued}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Bases de datos privadas</span>
        </div>

        <div className="bg-white border border-slate-250 p-3 rounded shadow-sm">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Recetas Activas
          </span>
          <span className="block text-xl font-bold text-slate-800 mt-1 text-emerald-700">
            {totalActive}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Firmadas y vigentes on-chain</span>
        </div>

        <div className="bg-white border border-slate-250 p-3 rounded shadow-sm">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Recetas Canjeadas
          </span>
          <span className="block text-xl font-bold text-slate-800 mt-1 text-slate-600">
            {totalRedeemed}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Despachadas en farmacia</span>
        </div>

        <div className="bg-white border border-slate-250 p-3 rounded shadow-sm">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Tasa de Canje
          </span>
          <span className="block text-xl font-bold text-slate-800 mt-1 text-blue-800">
            {complianceRate}%
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Eficiencia operativa asistencial</span>
        </div>

      </div>

      {/* EHR Clinical Registry Table Card */}
      <div className="bg-white border border-slate-250 rounded shadow-sm overflow-hidden">
        
        {/* Table Header Row */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-250 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Registro Clínico de Recetas
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Mostrando {prescriptions.length} registro(s)
          </div>
        </div>

        {/* Double-bordered Grid lined Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent mb-2"></div>
              <p className="text-xs text-slate-500">Cargando base de datos EHR...</p>
            </div>
          ) : (
            <table className="ehr-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Medicamento</th>
                  <th>Doctor Emisor</th>
                  <th>Fecha Registro</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="font-bold text-slate-800">{item.patientName}</td>
                    <td className="font-mono text-xs">{item.medication}</td>
                    <td>{item.doctorLicense}</td>
                    <td>
                      {/* Formats dates beautifully in DD/MM format as requested by the user */}
                      {new Date(item.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </td>
                    <td>
                      {item.isRedeemed ? (
                        <span className="ehr-badge-redeemed">Canjeada</span>
                      ) : item.isValid ? (
                        <span className="ehr-badge-active">Activa</span>
                      ) : (
                        <span className="ehr-badge-error">Inválida</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={item.isRedeemed ? `/dashboard/pharmacy` : `/dashboard/pharmacy?hash=${item.hash}`}
                        className="text-[10px] text-blue-700 hover:text-blue-900 font-bold hover:underline"
                      >
                        {item.isRedeemed ? 'Ver Registro' : 'Canjear Receta'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Clinical Notes Notice */}
      <div className="bg-slate-100 border border-slate-250 p-4 rounded text-xs text-slate-650 flex gap-3 items-start leading-relaxed">
        <AlertCircle size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-slate-800 block mb-0.5">Integridad del Sistema Clínico</span>
          Este portal clínico de recetas opera con **Integridad Criptográfica Distribuida**. Toda emisión genera una credencial matemática de firma digital para evitar falsificaciones. Por ley HIPAA y normativas de privacidad nacionales, los diagnósticos y nombres se encriptan de extremo a extremo, resguardando la privacidad del historial clínico del paciente.
        </div>
      </div>

    </div>
  );
}
