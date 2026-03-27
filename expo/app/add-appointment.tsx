import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function AddAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { t, isRTL } = useLanguage();
  const { addAppointment, updateAppointment, appointments } = useAppData();
  const { colors } = useTheme();

  const editingAppt = params.id ? appointments.find((a) => a.id === params.id) : null;
  const isEditing = !!editingAppt;

  const [title, setTitle] = useState<string>('');
  const [doctor, setDoctor] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingAppt) {
      setTitle(isRTL ? editingAppt.titleAr || editingAppt.title : editingAppt.title);
      setDoctor(isRTL ? editingAppt.doctorAr || editingAppt.doctor : editingAppt.doctor);
      setSpecialty(isRTL ? editingAppt.specialtyAr || editingAppt.specialty : editingAppt.specialty);
      setDate(editingAppt.date);
      setTime(editingAppt.time);
      setLocation(isRTL ? editingAppt.locationAr || editingAppt.location : editingAppt.location);
      setNotes(isRTL ? editingAppt.notesAr || editingAppt.notes : editingAppt.notes);
    }
  }, [editingAppt?.id]);

  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  const placeholders = isRTL
    ? {
        title: 'مثال: فحص القلب',
        doctor: 'اسم الطبيب',
        specialty: 'مثال: أمراض القلب',
        date: 'YYYY-MM-DD',
        time: 'مثال: 10:00 AM',
        location: 'اسم المستشفى أو العيادة',
        notes: 'أي ملاحظات للتذكير',
      }
    : {
        title: 'e.g. Cardiology Checkup',
        doctor: "Doctor's name",
        specialty: 'e.g. Cardiology',
        date: 'YYYY-MM-DD',
        time: 'e.g. 10:00 AM',
        location: 'Hospital or clinic name',
        notes: 'Any notes to remember',
      };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('', isRTL ? 'يرجى إدخال عنوان الموعد' : 'Please enter appointment title');
      return;
    }
    if (!date.trim()) {
      Alert.alert('', isRTL ? 'يرجى إدخال التاريخ' : 'Please enter date (YYYY-MM-DD)');
      return;
    }

    const titleVal = title.trim();
    const doctorVal = doctor.trim();
    const specialtyVal = specialty.trim();
    const locationVal = location.trim();
    const notesVal = notes.trim();

    if (isEditing && editingAppt) {
      updateAppointment({
        ...editingAppt,
        title: titleVal,
        titleAr: titleVal,
        doctor: doctorVal,
        doctorAr: doctorVal,
        specialty: specialtyVal,
        specialtyAr: specialtyVal,
        date: date.trim(),
        time: time.trim(),
        location: locationVal,
        locationAr: locationVal,
        notes: notesVal,
        notesAr: notesVal,
      });
    } else {
      addAppointment({
        id: Date.now().toString(),
        title: titleVal,
        titleAr: titleVal,
        doctor: doctorVal,
        doctorAr: doctorVal,
        specialty: specialtyVal,
        specialtyAr: specialtyVal,
        date: date.trim(),
        time: time.trim(),
        location: locationVal,
        locationAr: locationVal,
        notes: notesVal,
        notesAr: notesVal,
        completed: false,
      });
    }

    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.headerRow, { flexDirection: flexDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.borderLight }]}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEditing ? (isRTL ? 'تعديل الموعد' : 'Edit Appointment') : t('addAppointment')}
          </Text>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]} testID="save-appointment-btn">
            <Text style={styles.saveBtnText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('title')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={title}
          onChangeText={setTitle}
          placeholder={placeholders.title}
          placeholderTextColor={colors.textLight}
          testID="appt-title-input"
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('doctor')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={doctor}
          onChangeText={setDoctor}
          placeholder={placeholders.doctor}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('specialty')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={specialty}
          onChangeText={setSpecialty}
          placeholder={placeholders.specialty}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('date')}</Text>
        <TextInput
          style={[styles.input, { textAlign, backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={date}
          onChangeText={setDate}
          placeholder={placeholders.date}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('time')}</Text>
        <TextInput
          style={[styles.input, { textAlign, backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={time}
          onChangeText={setTime}
          placeholder={placeholders.time}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('location')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={location}
          onChangeText={setLocation}
          placeholder={placeholders.location}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('notes')}</Text>
        <TextInput
          style={[styles.input, styles.textArea, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={notes}
          onChangeText={setNotes}
          placeholder={placeholders.notes}
          placeholderTextColor={colors.textLight}
          multiline
        />

        <View style={{ height: 60 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700' as const,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  scrollContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
