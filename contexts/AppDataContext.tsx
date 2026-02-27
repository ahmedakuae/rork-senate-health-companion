import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Medication, Appointment, MedicationLog } from '@/types';
import {
  setupNotifications,
  scheduleMedicationReminders,
  cancelMedicationReminders,
  scheduleAppointmentReminder,
  cancelAppointmentReminders,
} from '@/services/notifications';
import {
  fetchMedications as fetchMedsRemote,
  fetchAppointments as fetchApptsRemote,
  fetchMedicationLogs as fetchLogsRemote,
  upsertMedication,
  deleteMedicationRemote,
  upsertAppointment,
  deleteAppointmentRemote,
  upsertMedicationLog,
  deleteMedicationLogRemote,
  bulkUpsertMedications,
  bulkUpsertAppointments,
  bulkUpsertMedicationLogs,
  subscribeToRealtime,
  unsubscribeFromRealtime,
} from '@/services/supabaseSync';
import { RealtimeChannel } from '@supabase/supabase-js';

const MEDICATIONS_KEY = 'senate_medications';
const APPOINTMENTS_KEY = 'senate_appointments';
const LOGS_KEY = 'senate_medication_logs';
const SEED_KEY = 'senate_seeded_v5';
const DEX_MIGRATION_KEY = 'senate_dex_schedule_migrated_v3';
const INITIAL_SYNC_KEY = 'senate_initial_sync_done';

const SEED_MEDICATIONS: Medication[] = [
  {
    id: 'coacetamol_seed',
    name: 'CO-ACETAMOL Paracetamol',
    nameAr: 'كو-أسيتامول باراسيتامول - للألم',
    dosage: '500mg + 30mg',
    dosageAr: '٥٠٠ مجم + ٣٠ مجم',
    frequency: 'As needed for pain',
    frequencyAr: 'عند اللزوم للألم',
    timeSlots: ['08:00'],
    instructions: 'Take with food when needed for pain.',
    instructionsAr: 'يؤخذ مع الطعام عند الحاجة للألم.',
    sideEffects: ['Drowsiness', 'Constipation', 'Nausea'],
    sideEffectsAr: ['نعاس', 'إمساك', 'غثيان'],
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0oj6abut8ruqqdp6zwqq9',
    color: '#EF4444',
    asNeededOnly: true,
  },
  {
    id: 'imatox_seed',
    name: 'IMATOX / ONDANSETRON 8 MG',
    nameAr: 'إيماتوكس / أوندانسيترون ٨ مجم - للمراجعة VOMITING',
    dosage: '8 MG - 3 times daily',
    dosageAr: '٨ مجم - ٣ مرات يومياً',
    frequency: '3 times daily for 7 days',
    frequencyAr: '٣ مرات يومياً لمدة ٧ أيام',
    timeSlots: ['08:00', '14:00', '20:00'],
    instructions: 'Take before meals for 7 days.',
    instructionsAr: 'يؤخذ قبل الأكل لمدة ٧ أيام.',
    sideEffects: ['Headache', 'Constipation', 'Fatigue'],
    sideEffectsAr: ['صداع', 'إمساك', 'إرهاق'],
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/35kk3uy8dr7k6gl1yyrm0',
    color: '#3B82F6',
    mealTiming: 'before_meal',
    endDate: '2026-03-04',
  },
  {
    id: 'pantolife_seed',
    name: 'PANTOLIFE - PANTOPRAZOLE 40 MG',
    nameAr: 'بانتولايف - بانتوبرازول ٤٠ مجم - للمعدة',
    dosage: '40 MG - once daily',
    dosageAr: '٤٠ مجم - مرة يومياً',
    frequency: 'Once daily for 7 days',
    frequencyAr: 'مرة يومياً لمدة ٧ أيام',
    timeSlots: ['08:00'],
    instructions: 'Take once daily in the morning for stomach.',
    instructionsAr: 'يؤخذ مرة واحدة صباحاً للمعدة.',
    sideEffects: ['Headache', 'Nausea', 'Stomach pain'],
    sideEffectsAr: ['صداع', 'غثيان', 'ألم في المعدة'],
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/lmrd2c5kmuqhk3ophcl5d',
    color: '#8B5CF6',
    endDate: '2026-03-04',
  },
  {
    id: 'glucophage_seed',
    name: 'GLUCOPHAGE / METFORMIN 1000 MG',
    nameAr: 'جلوكوفاج / ميتفورمين ١٠٠٠ مجم - دواء للسكر',
    dosage: '1000 MG - once daily',
    dosageAr: '١٠٠٠ مجم - مرة يومياً',
    frequency: 'Once daily',
    frequencyAr: 'مرة يومياً',
    timeSlots: ['09:00'],
    instructions: 'Take after breakfast for diabetes management.',
    instructionsAr: 'يؤخذ بعد الفطور لإدارة السكر.',
    sideEffects: ['Nausea', 'Diarrhea', 'Stomach upset'],
    sideEffectsAr: ['غثيان', 'إسهال', 'اضطراب في المعدة'],
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/9fp0eey9wz4r711imf1kk',
    color: '#10B981',
    mealTiming: 'after_meal',
  },
  {
    id: 'dexamethasone_seed',
    name: 'DEXAMETHASONE / NOVUDEX 4 MG',
    nameAr: 'ديكساميثازون / نوفيودكس ٤ مجم - دواء كورتيزون',
    dosage: '2-4 MG - special schedule',
    dosageAr: '٢-٤ مجم - جدول خاص',
    frequency: 'Special tapering schedule',
    frequencyAr: 'جدول تدريجي خاص',
    timeSlots: ['08:00', '21:00'],
    instructions: 'Take after meals. Follow the special tapering schedule carefully.',
    instructionsAr: 'يؤخذ بعد الأكل. اتبع الجدول التدريجي الخاص بعناية.',
    sideEffects: ['Increased appetite', 'Insomnia', 'Mood changes', 'Weight gain'],
    sideEffectsAr: ['زيادة الشهية', 'أرق', 'تغيرات مزاجية', 'زيادة الوزن'],
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2kqziaxpjrs64f4e949ak',
    color: '#F59E0B',
    mealTiming: 'after_meal',
    endDate: '2026-03-06',
    specialSchedule: [
      {
        date: '2026-02-27',
        doses: [
          { time: '08:00', dosage: 'One pill (4 MG)', dosageAr: 'حبة واحدة (٤ مجم)' },
          { time: '21:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
        ],
      },
      {
        date: '2026-02-28',
        doses: [
          { time: '08:00', dosage: 'One pill (4 MG)', dosageAr: 'حبة واحدة (٤ مجم)' },
          { time: '21:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
        ],
      },
      {
        date: '2026-03-01',
        doses: [
          { time: '08:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
          { time: '21:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
        ],
      },
      {
        date: '2026-03-02',
        doses: [
          { time: '08:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
          { time: '21:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
        ],
      },
      {
        date: '2026-03-03',
        doses: [
          { time: '08:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
          { time: '21:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
        ],
      },
      {
        date: '2026-03-04',
        doses: [
          { time: '08:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
        ],
      },
      {
        date: '2026-03-05',
        doses: [
          { time: '08:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
        ],
      },
      {
        date: '2026-03-06',
        doses: [
          { time: '08:00', dosage: 'Half pill (2 MG)', dosageAr: 'نصف حبة (٢ مجم)' },
        ],
      },
    ],
  },
];

const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt_dean_seed',
    title: 'Regular Appointment with Dr. Dean',
    titleAr: 'موعد عادي مع دكتور دين',
    doctor: 'Dr. Dean',
    doctorAr: 'دكتور دين',
    specialty: 'General',
    specialtyAr: 'عام',
    date: '2026-03-04',
    time: '10:00 AM',
    location: 'Cleveland Clinic',
    locationAr: 'كليفلاند كلينك',
    notes: '',
    notesAr: '',
    completed: false,
  },
  {
    id: 'appt_biopsy_seed',
    title: 'Biopsy (BIOPSY)',
    titleAr: 'خزعة BIOPSY',
    doctor: 'Cleveland Clinic',
    doctorAr: 'كليفلاند كلينك',
    specialty: 'Biopsy',
    specialtyAr: 'خزعة',
    date: '2026-03-11',
    time: '10:00 AM',
    location: 'Cleveland Clinic',
    locationAr: 'كليفلاند كلينك',
    notes: '',
    notesAr: '',
    completed: false,
  },
];

export const [AppDataProvider, useAppData] = createContextHook(() => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notificationsReady, setNotificationsReady] = useState<boolean>(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    setupNotifications().then((granted) => {
      setNotificationsReady(granted);
      console.log('[AppData] Notifications ready:', granted);
    });
  }, []);

  const refreshFromSupabase = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      console.log('[AppData] Refreshing from Supabase...');
      const [remoteMeds, remoteAppts, remoteLogs] = await Promise.all([
        fetchMedsRemote(),
        fetchApptsRemote(),
        fetchLogsRemote(),
      ]);

      if (remoteMeds.length > 0 || remoteAppts.length > 0 || remoteLogs.length > 0) {
        if (remoteMeds.length > 0) {
          setMedications(remoteMeds);
          AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(remoteMeds));
        }
        if (remoteAppts.length > 0) {
          setAppointments(remoteAppts);
          AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(remoteAppts));
        }
        if (remoteLogs.length > 0) {
          setMedicationLogs(remoteLogs);
          AsyncStorage.setItem(LOGS_KEY, JSON.stringify(remoteLogs));
        }
        console.log('[AppData] Synced from Supabase - meds:', remoteMeds.length, 'appts:', remoteAppts.length, 'logs:', remoteLogs.length);
      }
    } catch (err) {
      console.error('[AppData] Error refreshing from Supabase:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const refreshMedsFromSupabase = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const remoteMeds = await fetchMedsRemote();
      if (remoteMeds.length > 0) {
        setMedications(remoteMeds);
        AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(remoteMeds));
        console.log('[AppData] Realtime: updated medications from Supabase');
      }
    } catch (err) {
      console.error('[AppData] Error refreshing meds from Supabase:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const refreshApptsFromSupabase = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const remoteAppts = await fetchApptsRemote();
      if (remoteAppts.length > 0) {
        setAppointments(remoteAppts);
        AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(remoteAppts));
        console.log('[AppData] Realtime: updated appointments from Supabase');
      }
    } catch (err) {
      console.error('[AppData] Error refreshing appts from Supabase:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const refreshLogsFromSupabase = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const remoteLogs = await fetchLogsRemote();
      if (remoteLogs.length > 0) {
        setMedicationLogs(remoteLogs);
        AsyncStorage.setItem(LOGS_KEY, JSON.stringify(remoteLogs));
        console.log('[AppData] Realtime: updated logs from Supabase');
      }
    } catch (err) {
      console.error('[AppData] Error refreshing logs from Supabase:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [medsStr, apptsStr, logsStr, seeded, initialSyncDone] = await Promise.all([
        AsyncStorage.getItem(MEDICATIONS_KEY),
        AsyncStorage.getItem(APPOINTMENTS_KEY),
        AsyncStorage.getItem(LOGS_KEY),
        AsyncStorage.getItem(SEED_KEY),
        AsyncStorage.getItem(INITIAL_SYNC_KEY),
      ]);

      let meds: Medication[] = medsStr ? JSON.parse(medsStr) : [];
      let appts: Appointment[] = apptsStr ? JSON.parse(apptsStr) : [];
      const logs: MedicationLog[] = logsStr ? JSON.parse(logsStr) : [];

      if (!seeded) {
        const existingMedIds = new Set(meds.map((m) => m.id));
        const newMedSeeds = SEED_MEDICATIONS.filter((s) => !existingMedIds.has(s.id));
        if (newMedSeeds.length > 0) {
          meds = [...meds, ...newMedSeeds];
          AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(meds));
        }

        const existingApptIds = new Set(appts.map((a) => a.id));
        const newApptSeeds = SEED_APPOINTMENTS.filter((s) => !existingApptIds.has(s.id));
        if (newApptSeeds.length > 0) {
          appts = [...appts, ...newApptSeeds];
          AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appts));
        }

        AsyncStorage.setItem(SEED_KEY, 'true');
        console.log('[AppData] Seeded medications:', newMedSeeds.length, 'appointments:', newApptSeeds.length);
      }

      const dexMigrated = await AsyncStorage.getItem(DEX_MIGRATION_KEY);
      if (!dexMigrated) {
        const dexIdx = meds.findIndex((m) => m.id === 'dexamethasone_seed');
        if (dexIdx !== -1) {
          const seedDex = SEED_MEDICATIONS.find((s) => s.id === 'dexamethasone_seed');
          if (seedDex) {
            meds[dexIdx] = { ...meds[dexIdx], specialSchedule: seedDex.specialSchedule, dosage: seedDex.dosage, dosageAr: seedDex.dosageAr };
            AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(meds));
            console.log('[AppData] Migrated dexamethasone schedule to correct dosages');
          }
        }
        AsyncStorage.setItem(DEX_MIGRATION_KEY, 'true');
      }

      setMedications(meds);
      setAppointments(appts);
      setMedicationLogs(logs);
      setIsLoaded(true);

      if (!initialSyncDone && (meds.length > 0 || appts.length > 0 || logs.length > 0)) {
        setIsSyncing(true);
        console.log('[AppData] Performing initial sync to Supabase...');
        await Promise.all([
          meds.length > 0 ? bulkUpsertMedications(meds) : Promise.resolve(true),
          appts.length > 0 ? bulkUpsertAppointments(appts) : Promise.resolve(true),
          logs.length > 0 ? bulkUpsertMedicationLogs(logs) : Promise.resolve(true),
        ]);
        AsyncStorage.setItem(INITIAL_SYNC_KEY, 'true');
        setIsSyncing(false);
        console.log('[AppData] Initial sync to Supabase complete');
      }

      refreshFromSupabase();
    };

    loadData();
  }, [refreshFromSupabase]);

  useEffect(() => {
    channelRef.current = subscribeToRealtime({
      onMedicationsChange: refreshMedsFromSupabase,
      onAppointmentsChange: refreshApptsFromSupabase,
      onLogsChange: refreshLogsFromSupabase,
    });

    return () => {
      if (channelRef.current) {
        unsubscribeFromRealtime(channelRef.current);
      }
    };
  }, [refreshMedsFromSupabase, refreshApptsFromSupabase, refreshLogsFromSupabase]);

  useEffect(() => {
    if (isLoaded && notificationsReady) {
      medications.forEach((med) => {
        scheduleMedicationReminders(med);
      });
      appointments.forEach((appt) => {
        if (!appt.completed) {
          scheduleAppointmentReminder(appt);
        }
      });
      console.log('[AppData] Re-scheduled all notifications after load');
    }
  }, [isLoaded, notificationsReady]);

  const saveMedications = useCallback((meds: Medication[]) => {
    setMedications(meds);
    AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(meds));
  }, []);

  const saveAppointments = useCallback((appts: Appointment[]) => {
    setAppointments(appts);
    AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appts));
  }, []);

  const saveLogs = useCallback((logs: MedicationLog[]) => {
    setMedicationLogs(logs);
    AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, []);

  const addMedication = useCallback((med: Medication) => {
    const updated = [...medications, med];
    saveMedications(updated);
    scheduleMedicationReminders(med);
    upsertMedication(med);
  }, [medications, saveMedications]);

  const updateMedication = useCallback((med: Medication) => {
    const updated = medications.map((m) => (m.id === med.id ? med : m));
    saveMedications(updated);
    scheduleMedicationReminders(med);
    upsertMedication(med);
  }, [medications, saveMedications]);

  const deleteMedication = useCallback((id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    saveMedications(updated);
    cancelMedicationReminders(id);
    deleteMedicationRemote(id);
  }, [medications, saveMedications]);

  const addAppointment = useCallback((appt: Appointment) => {
    const updated = [...appointments, appt];
    saveAppointments(updated);
    scheduleAppointmentReminder(appt);
    upsertAppointment(appt);
  }, [appointments, saveAppointments]);

  const updateAppointment = useCallback((appt: Appointment) => {
    const updated = appointments.map((a) => (a.id === appt.id ? appt : a));
    saveAppointments(updated);
    if (appt.completed) {
      cancelAppointmentReminders(appt.id);
    } else {
      scheduleAppointmentReminder(appt);
    }
    upsertAppointment(appt);
  }, [appointments, saveAppointments]);

  const deleteAppointment = useCallback((id: string) => {
    const updated = appointments.filter((a) => a.id !== id);
    saveAppointments(updated);
    cancelAppointmentReminders(id);
    deleteAppointmentRemote(id);
  }, [appointments, saveAppointments]);

  const logMedication = useCallback((log: MedicationLog) => {
    const updated = [...medicationLogs.filter(
      (l) => !(l.medicationId === log.medicationId && l.scheduledTime === log.scheduledTime && l.date === log.date)
    ), log];
    saveLogs(updated);
    upsertMedicationLog(log);
  }, [medicationLogs, saveLogs]);

  const undoMedicationLog = useCallback((medicationId: string, scheduledTime: string, date: string) => {
    const updated = medicationLogs.filter(
      (l) => !(l.medicationId === medicationId && l.scheduledTime === scheduledTime && l.date === date)
    );
    saveLogs(updated);
    deleteMedicationLogRemote(medicationId, scheduledTime, date);
    console.log('[AppData] Undid medication log:', medicationId, scheduledTime, date);
  }, [medicationLogs, saveLogs]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return medicationLogs.filter((l) => l.date === today);
  }, [medicationLogs]);

  const todayLogs = useMemo(() => getTodayLogs(), [getTodayLogs]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => !a.completed && new Date(a.date) >= new Date(now.toISOString().split('T')[0]))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  return {
    medications,
    appointments,
    medicationLogs,
    todayLogs,
    upcomingAppointments,
    isLoaded,
    isSyncing,
    addMedication,
    updateMedication,
    deleteMedication,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    logMedication,
    undoMedicationLog,
    refreshFromSupabase,
  };
});
