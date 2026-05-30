import { keccak256, toHex } from 'viem';

// Hardcoded Smart Contract Address on Monad Testnet (simulated or real)
export const CONTRACT_ADDRESS = '0xeF648A369bEb32FF41F4846FDF1FCD2640Cd5D20';

// MultiCall3 Hardcoded for speed
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

export const CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'bytes32', name: 'prescriptionHash', type: 'bytes32' }],
    name: 'emitPrescription',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'prescriptionHash', type: 'bytes32' }],
    name: 'redeemPrescription',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'prescriptionHash', type: 'bytes32' }],
    name: 'getPrescription',
    outputs: [
      { internalType: 'bool', name: 'isValid', type: 'bool' },
      { internalType: 'bool', name: 'isRedeemed', type: 'bool' },
      { internalType: 'address', name: 'doctor', type: 'address' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface OnChainPrescriptionState {
  hash: string;
  isValid: boolean;
  isRedeemed: boolean;
  doctor: string;
  timestamp: number;
  blockNumber: number;
  txHash?: string;
}

// Client-side Mock Blockchain State Manager to allow instant interaction 
// without requiring real RPC/Wallet setup.
class MockMonadLedger {
  private key = 'medipass_mock_monad';

  private getLedger(): Record<string, OnChainPrescriptionState> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveLedger(ledger: Record<string, OnChainPrescriptionState>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(ledger));
    } catch (e) {
      console.error('Failed to write mock blockchain ledger', e);
    }
  }

  async emitPrescription(hash: string, doctorAddress: string): Promise<string> {
    // Monad Block time is 400ms, sub-second finality. 
    // We simulate a fast response
    await new Promise((resolve) => setTimeout(resolve, 300));
    const ledger = this.getLedger();
    const cleanHash = hash.toLowerCase();
    
    // Simulate transaction hash
    const txHash = keccak256(toHex(Math.random().toString() + Date.now().toString()));

    ledger[cleanHash] = {
      hash: cleanHash,
      isValid: true,
      isRedeemed: false,
      doctor: doctorAddress || '0x498a44...8B9d',
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: Math.floor(10243500 + Math.random() * 5000),
      txHash,
    };

    this.saveLedger(ledger);
    return txHash;
  }

  async redeemPrescription(hash: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const ledger = this.getLedger();
    const cleanHash = hash.toLowerCase();
    
    if (!ledger[cleanHash]) {
      throw new Error('Prescription not registered on chain');
    }
    
    if (ledger[cleanHash].isRedeemed) {
      throw new Error('Prescription already redeemed');
    }

    const txHash = keccak256(toHex('redeem_' + cleanHash + Date.now().toString()));

    ledger[cleanHash] = {
      ...ledger[cleanHash],
      isRedeemed: true,
      timestamp: Math.floor(Date.now() / 1000), // update timestamp to redemption time
      txHash,
    };

    this.saveLedger(ledger);
    return txHash;
  }

  async getPrescription(hash: string): Promise<OnChainPrescriptionState | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const ledger = this.getLedger();
    return ledger[hash.toLowerCase()] || null;
  }
}

export const mockMonadLedger = new MockMonadLedger();
