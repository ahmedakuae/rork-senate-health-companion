export interface SpecialScheduleDose {
  time: string;
  dosage: string;
  dosageAr: string;
}

export interface SpecialScheduleEntry {
  date: string;
  doses: SpecialScheduleDose[];
}

export interface Medication {
  id: string;
  name: string;
  nameAr: string;
  dosage: string;
  dosageAr: string;
  frequency: string;
  frequencyAr: string;
  timeSlots: string[];
  instructions: string;
  instructionsAr: string;
  sideEffects: string[];
  sideEffectsAr: string[];
  imageUrl: string;
  color: string;
  pillsRemaining?: number;
  refillDate?: string;
  doctor?: string;
  doctorAr?: string;
  notes?: string;
  notesAr?: string;
  asNeededOnly?: boolean;
  mealTiming?: 'before_meal' | 'after_meal';
  specialSchedule?: SpecialScheduleEntry[];
  endDate?: string;
}

export interface Appointment {
  id: string;
  title: string;
  titleAr: string;
  doctor: string;
  doctorAr: string;
  specialty: string;
  specialtyAr: string;
  date: string;
  time: string;
  location: string;
  locationAr: string;
  notes: string;
  notesAr: string;
  completed: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string;
  status: 'taken' | 'skipped' | 'pending';
  takenAt?: string;
  date: string;
}

export type Language = 'en' | 'ar';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
