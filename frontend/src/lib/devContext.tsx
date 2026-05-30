'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DevLog {
  title: string;
  type: 'emit' | 'read' | 'redeem' | 'info';
  timestamp: string;
  privateMetadata?: any;
  onChainHash: string;
  txHash?: string;
  gasUsed?: string;
  executionTimeMs: number;
  blockNumber?: number;
}

interface DevContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  logs: DevLog[];
  addLog: (log: Omit<DevLog, 'timestamp'>) => void;
  clearLogs: () => void;
  lastLog: DevLog | null;
}

const DevContext = createContext<DevContextType | undefined>(undefined);

export function DevProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [lastLog, setLastLog] = useState<DevLog | null>(null);

  const addLog = (log: Omit<DevLog, 'timestamp'>) => {
    const newLog: DevLog = {
      ...log,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 20)); // Keep last 20 logs
    setLastLog(newLog);
    // Auto-open drawer on first action to guide the user's attention
    setIsOpen(true);
  };

  const clearLogs = () => {
    setLogs([]);
    setLastLog(null);
  };

  // Add initial welcome log
  useEffect(() => {
    addLog({
      title: 'MediPass Inicializado ⚡',
      type: 'info',
      onChainHash: 'N/A',
      executionTimeMs: 0,
      privateMetadata: {
        network: 'Monad Testnet (Chain ID 10143)',
        gasPrice: '52 gwei (hardcoded for speed)',
        database: 'Supabase Metadatos Privados',
        rpcUrl: 'https://testnet-rpc.monad.xyz'
      }
    });
    // Don't auto-open on initial load
    setIsOpen(false);
  }, []);

  return (
    <DevContext.Provider value={{ isOpen, setIsOpen, logs, addLog, clearLogs, lastLog }}>
      {children}
    </DevContext.Provider>
  );
}

export function useDevDrawer() {
  const context = useContext(DevContext);
  if (!context) {
    throw new Error('useDevDrawer must be used within a DevProvider');
  }
  return context;
}
