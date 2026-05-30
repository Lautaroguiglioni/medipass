import { createClient } from '@supabase/supabase-js';

// Supabase Configuration from Environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use the key provided by the user as a fallback or read from env
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LO2eT0aWoisbs9UGY1KytA_VTZo1ine';

export interface PrescriptionMetadata {
  hash: string;
  doctorLicense: string;
  patientName: string;
  patientId: string;
  medication: string;
  dosage: string;
  instructions: string;
  createdAt: string;
}

// Check if Supabase is fully configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Initialize real Supabase client (only if configured)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Persistent Local Fallback Store
class LocalMetadataDB {
  private key = 'medipass_prescriptions';

  private getStore(): Record<string, PrescriptionMetadata> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveStore(store: Record<string, PrescriptionMetadata>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(store));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }

  async save(metadata: PrescriptionMetadata): Promise<void> {
    // Simulate database network latency (e.g. 150ms)
    await new Promise((resolve) => setTimeout(resolve, 150));
    const store = this.getStore();
    store[metadata.hash.toLowerCase()] = metadata;
    this.saveStore(store);
  }

  async get(hash: string): Promise<PrescriptionMetadata | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const store = this.getStore();
    return store[hash.toLowerCase()] || null;
  }

  async getByPatientId(patientId: string): Promise<PrescriptionMetadata[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const store = this.getStore();
    return Object.values(store).filter(
      (item) => item.patientId.trim().toLowerCase() === patientId.trim().toLowerCase()
    );
  }

  async listAll(): Promise<PrescriptionMetadata[]> {
    const store = this.getStore();
    return Object.values(store).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

const localDB = new LocalMetadataDB();

/**
 * High-level Database interface to store private metadata
 */
export const dbService = {
  isUsingFallback: !isSupabaseConfigured,
  
  async savePrescription(metadata: PrescriptionMetadata): Promise<{ success: boolean; error?: any }> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('prescriptions')
          .insert([metadata]);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase insert failed, falling back to LocalStorage', err);
        await localDB.save(metadata);
        return { success: true, error: err.message };
      }
    } else {
      await localDB.save(metadata);
      return { success: true };
    }
  },

  async getPrescription(hash: string): Promise<PrescriptionMetadata | null> {
    const normalizedHash = hash.toLowerCase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('hash', normalizedHash)
          .single();
        if (error || !data) throw error || new Error('Not found');
        return data as PrescriptionMetadata;
      } catch {
        // Graceful fallback to local
        return await localDB.get(normalizedHash);
      }
    } else {
      return await localDB.get(normalizedHash);
    }
  },

  async getPrescriptionsByPatient(patientId: string): Promise<PrescriptionMetadata[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('patientId', patientId);
        if (error) throw error;
        return data as PrescriptionMetadata[];
      } catch {
        return await localDB.getByPatientId(patientId);
      }
    } else {
      return await localDB.getByPatientId(patientId);
    }
  },

  async listAllPrescriptions(): Promise<PrescriptionMetadata[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .order('createdAt', { ascending: false });
        if (error) throw error;
        return data as PrescriptionMetadata[];
      } catch {
        return await localDB.listAll();
      }
    } else {
      return await localDB.listAll();
    }
  }
};
