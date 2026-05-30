'use client';

import React from 'react';
import { useDevDrawer } from '@/lib/devContext';
import { Database, ShieldCheck, Cpu, Clock, Terminal, X, Minimize2, Maximize2, Trash2 } from 'lucide-react';

export default function DevDrawer() {
  const { isOpen, setIsOpen, logs, clearLogs } = useDevDrawer();
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 bg-[#0f172a] border border-[#334155] text-slate-350 font-mono text-[10px] px-3 py-1.5 rounded shadow-md hover:bg-[#1e293b] hover:text-white transition-all duration-150"
      >
        <Terminal size={12} />
        <span>Visor de Auditoría Criptográfica</span>
        {logs.length > 1 && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0b0f19] border-t border-[#1e293b] text-slate-300 font-mono transition-all duration-150 shadow-2xl ${
        isExpanded ? 'h-[80vh]' : 'h-[320px]'
      } flex flex-col`}
    >
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#070a12] border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
            AUDITORÍA DE INTEGRIDAD DIGITAL Y TRAZABILIDAD REGULATORIA (BLOCKCHAIN)
          </span>
          <span className="px-2 py-0.5 rounded text-[8px] font-semibold bg-[#1e293b] text-slate-300 border border-[#334155]">
            LEY HIPAA / HASH LEDGER
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Colapsar' : 'Maximizar'}
            className="p-1 hover:bg-[#1e293b] rounded text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button
            onClick={clearLogs}
            title="Limpiar Auditoría"
            className="p-1 hover:bg-[#1e293b] rounded text-slate-400 hover:text-white transition-colors"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            title="Cerrar Consola"
            className="p-1 hover:bg-[#1e293b] rounded text-slate-400 hover:text-white transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Console Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#1e293b]">
        
        {/* Left Column: Visual flow (Invisible Blockchain) */}
        <div className="p-4 flex flex-col justify-between overflow-y-auto bg-[#070a12]/30 text-[10px] space-y-4">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase flex items-center gap-1.5 border-b border-[#1e293b] pb-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              ARQUITECTURA DE CUMPLIMIENTO NORM.
            </h3>
            
            <div className="space-y-3">
              <div className="bg-[#0b0f19] border border-[#1e293b] rounded p-2.5">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold mb-1">
                  <Database size={12} className="text-blue-500" />
                  <span>Base de Datos Privada (HIPAA)</span>
                </div>
                <p className="text-slate-400 leading-normal text-[9px]">
                  Almacena el historial clínico completo del paciente (Recetas, diagnóstico, identificadores personales). Datos privados inaccesibles públicamente.
                </p>
              </div>

              <div className="bg-[#0b0f19] border border-[#1e293b] rounded p-2.5">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold mb-1">
                  <Cpu size={12} className="text-blue-500" />
                  <span>Registro de Integridad Criptográfica</span>
                </div>
                <p className="text-slate-400 leading-normal text-[9px]">
                  Registra únicamente un hash matemático <code>keccak256</code> inmutable. No contiene datos médicos visibles. Valida autenticidad y evita duplicaciones.
                </p>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-550 border-t border-[#1e293b] pt-2 space-y-0.5">
            <div>• Motor Criptográfico: Asíncrono de Alta Velocidad (Monad)</div>
            <div>• Latencia de Firma: Hardcoded (52 Gwei Gas Price Limit)</div>
            <div>• Auditoría Estándar: ISO/IEC 27001 & RGPD</div>
          </div>
        </div>

        {/* Center & Right Column: Logs list and Details */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-[10px]">
                No hay operaciones registradas en el registro de auditoría.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded border text-[10px] transition-all duration-100 ${
                    idx === 0
                      ? 'bg-[#0f172a] border-[#334155]'
                      : 'bg-[#0b0f19] border-[#1e293b] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 border-b border-[#1e293b]/50 pb-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-100">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          log.type === 'emit'
                            ? 'bg-emerald-500'
                            : log.type === 'read'
                            ? 'bg-blue-500'
                            : log.type === 'redeem'
                            ? 'bg-slate-400'
                            : 'bg-slate-500'
                        }`}
                      ></span>
                      {log.title.replace('🩺', '').replace('🔍', '').replace('💊', '').trim()}
                    </span>
                    <span className="text-[9px] text-slate-500">{log.timestamp}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px] leading-relaxed">
                    <div className="bg-[#070a12] p-2 rounded border border-[#1e293b]">
                      <span className="text-slate-350 font-bold block border-b border-[#1e293b]/80 pb-0.5 mb-1 uppercase text-[8px]">
                        📂 METADATOS CLÍNICOS PRIVADOS
                      </span>
                      {log.privateMetadata ? (
                        <pre className="text-slate-400 overflow-x-auto text-[9px] whitespace-pre-wrap">
                          {JSON.stringify(log.privateMetadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-600 italic">No aplicable o datos privados ocultos</span>
                      )}
                    </div>

                    <div className="bg-[#070a12] p-2 rounded border border-[#1e293b] space-y-1 text-slate-400">
                      <span className="text-slate-350 font-bold block border-b border-[#1e293b]/80 pb-0.5 mb-1 uppercase text-[8px]">
                        ⛓️ TRAZABILIDAD ON-CHAIN (LEDGER)
                      </span>
                      <div className="truncate">
                        <strong className="text-slate-500">Hash de Seguridad:</strong> {log.onChainHash}
                      </div>
                      {log.txHash && (
                        <div className="truncate">
                          <strong className="text-slate-500">Hash de Transacción:</strong>{' '}
                          <span className="text-slate-300">{log.txHash}</span>
                        </div>
                      )}
                      {log.blockNumber && (
                        <div>
                          <strong className="text-slate-500">Bloque Inmutable:</strong> {log.blockNumber}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 border-t border-[#1e293b]/60 pt-1 text-[8px]">
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Clock size={10} />
                          <span>Finalidad: {log.executionTimeMs}ms (Tiempo Real)</span>
                        </span>
                        {log.gasUsed && (
                          <span className="text-slate-500">Límite Gas: {log.gasUsed.split('(')[0].trim()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
