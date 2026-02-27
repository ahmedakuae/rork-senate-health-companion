import { supabase } from './supabase';
import { Medication, Appointment, MedicationLog } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SupabaseMedication {
  id: string;
  data: Medication;
  updated_at: string;
}

export interface SupabaseAppointment {
  id: string;
  data: Appointment;
  updated_at: string;
}

export interface SupabaseMedicationLog {
  id: string;
  medication_id: string;
  scheduled_time: string;
  log_date: string;
  data: MedicationLog;
  updated_at: string;
}

export async function fetchMedications(): Promise<Medication[]> {
  try {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[SupabaseSync] Error fetching medications:', error.message);
      return [];
    }

    console.log('[SupabaseSync] Fetched medications:', data?.length ?? 0);
    return (data ?? []).map((row: SupabaseMedication) => row.data);
  } catch (err) {
    console.error('[SupabaseSync] fetchMedications exception:', err);
    return [];
  }
}

export async function fetchAppointments(): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[SupabaseSync] Error fetching appointments:', error.message);
      return [];
    }

    console.log('[SupabaseSync] Fetched appointments:', data?.length ?? 0);
    return (data ?? []).map((row: SupabaseAppointment) => row.data);
  } catch (err) {
    console.error('[SupabaseSync] fetchAppointments exception:', err);
    return [];
  }
}

export async function fetchMedicationLogs(): Promise<MedicationLog[]> {
  try {
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[SupabaseSync] Error fetching medication logs:', error.message);
      return [];
    }

    console.log('[SupabaseSync] Fetched medication logs:', data?.length ?? 0);
    return (data ?? []).map((row: SupabaseMedicationLog) => row.data);
  } catch (err) {
    console.error('[SupabaseSync] fetchMedicationLogs exception:', err);
    return [];
  }
}

export async function upsertMedication(med: Medication): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('medications')
      .upsert({
        id: med.id,
        data: med,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseSync] Error upserting medication:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Upserted medication:', med.id);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] upsertMedication exception:', err);
    return false;
  }
}

export async function deleteMedicationRemote(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseSync] Error deleting medication:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Deleted medication:', id);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] deleteMedicationRemote exception:', err);
    return false;
  }
}

export async function upsertAppointment(appt: Appointment): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .upsert({
        id: appt.id,
        data: appt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseSync] Error upserting appointment:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Upserted appointment:', appt.id);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] upsertAppointment exception:', err);
    return false;
  }
}

export async function deleteAppointmentRemote(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseSync] Error deleting appointment:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Deleted appointment:', id);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] deleteAppointmentRemote exception:', err);
    return false;
  }
}

export async function upsertMedicationLog(log: MedicationLog): Promise<boolean> {
  try {
    const compositeId = `${log.medicationId}_${log.scheduledTime}_${log.date}`;
    const { error } = await supabase
      .from('medication_logs')
      .upsert({
        id: compositeId,
        medication_id: log.medicationId,
        scheduled_time: log.scheduledTime,
        log_date: log.date,
        data: log,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseSync] Error upserting medication log:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Upserted medication log:', compositeId);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] upsertMedicationLog exception:', err);
    return false;
  }
}

export async function deleteMedicationLogRemote(medicationId: string, scheduledTime: string, date: string): Promise<boolean> {
  try {
    const compositeId = `${medicationId}_${scheduledTime}_${date}`;
    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('id', compositeId);

    if (error) {
      console.error('[SupabaseSync] Error deleting medication log:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Deleted medication log:', compositeId);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] deleteMedicationLogRemote exception:', err);
    return false;
  }
}

export async function bulkUpsertMedications(meds: Medication[]): Promise<boolean> {
  try {
    const rows = meds.map((med) => ({
      id: med.id,
      data: med,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('medications')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseSync] Error bulk upserting medications:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Bulk upserted medications:', meds.length);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] bulkUpsertMedications exception:', err);
    return false;
  }
}

export async function bulkUpsertAppointments(appts: Appointment[]): Promise<boolean> {
  try {
    const rows = appts.map((appt) => ({
      id: appt.id,
      data: appt,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('appointments')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseSync] Error bulk upserting appointments:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Bulk upserted appointments:', appts.length);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] bulkUpsertAppointments exception:', err);
    return false;
  }
}

export async function bulkUpsertMedicationLogs(logs: MedicationLog[]): Promise<boolean> {
  try {
    const rows = logs.map((log) => ({
      id: `${log.medicationId}_${log.scheduledTime}_${log.date}`,
      medication_id: log.medicationId,
      scheduled_time: log.scheduledTime,
      log_date: log.date,
      data: log,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('medication_logs')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseSync] Error bulk upserting medication logs:', error.message);
      return false;
    }
    console.log('[SupabaseSync] Bulk upserted medication logs:', logs.length);
    return true;
  } catch (err) {
    console.error('[SupabaseSync] bulkUpsertMedicationLogs exception:', err);
    return false;
  }
}

export type RealtimeCallback = {
  onMedicationsChange: () => void;
  onAppointmentsChange: () => void;
  onLogsChange: () => void;
};

export function subscribeToRealtime(callbacks: RealtimeCallback): RealtimeChannel {
  console.log('[SupabaseSync] Setting up realtime subscriptions...');

  const channel = supabase
    .channel('app-data-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'medications' },
      (payload) => {
        console.log('[SupabaseSync] Medications realtime event:', payload.eventType);
        callbacks.onMedicationsChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      (payload) => {
        console.log('[SupabaseSync] Appointments realtime event:', payload.eventType);
        callbacks.onAppointmentsChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'medication_logs' },
      (payload) => {
        console.log('[SupabaseSync] Medication logs realtime event:', payload.eventType);
        callbacks.onLogsChange();
      }
    )
    .subscribe((status) => {
      console.log('[SupabaseSync] Realtime subscription status:', status);
    });

  return channel;
}

export function unsubscribeFromRealtime(channel: RealtimeChannel) {
  console.log('[SupabaseSync] Unsubscribing from realtime...');
  supabase.removeChannel(channel);
}
