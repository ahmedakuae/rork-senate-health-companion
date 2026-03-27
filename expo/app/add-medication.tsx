import React, { useState } from 'react';
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
import { X, Plus, Trash2, Camera, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useTheme } from '@/contexts/ThemeContext';

const COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#10B981', '#6366F1'];

type MealTimingOption = 'none' | 'before_meal' | 'after_meal';

export default function AddMedicationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, isRTL } = useLanguage();
  const { addMedication, updateMedication, medications } = useAppData();
  const { colors, isDark } = useTheme();

  const existingMed = id ? medications.find((m) => m.id === id) : undefined;
  const isEditing = !!existingMed;

  const [name, setName] = useState<string>(existingMed?.name ?? '');
  const [dosage, setDosage] = useState<string>(existingMed?.dosage ?? '');
  const [frequency, setFrequency] = useState<string>(existingMed?.frequency ?? '');
  const [timeSlots, setTimeSlots] = useState<string[]>(existingMed?.timeSlots ?? ['08:00']);
  const [instructions, setInstructions] = useState<string>(existingMed?.instructions ?? '');
  const [sideEffectsText, setSideEffectsText] = useState<string>(existingMed?.sideEffects?.join(', ') ?? '');
  const [imageUrl, setImageUrl] = useState<string>(existingMed?.imageUrl ?? '');
  const [selectedColor, setSelectedColor] = useState<string>(existingMed?.color ?? COLORS[0]);
  const [doctor, setDoctor] = useState<string>(existingMed?.doctor ?? '');
  const [notes, setNotes] = useState<string>(existingMed?.notes ?? '');
  const [newTime, setNewTime] = useState<string>('');
  const [asNeededOnly, setAsNeededOnly] = useState<boolean>(existingMed?.asNeededOnly ?? false);
  const [mealTiming, setMealTiming] = useState<MealTimingOption>(existingMed?.mealTiming ?? 'none');
  const [endDate, setEndDate] = useState<string>(existingMed?.endDate ?? '');

  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Image picker error:', e);
    }
  };

  const addTimeSlot = () => {
    const time = newTime.trim();
    if (time && /^\d{1,2}:\d{2}$/.test(time)) {
      setTimeSlots([...timeSlots, time]);
      setNewTime('');
    } else {
      Alert.alert('', isRTL ? 'أدخل الوقت بتنسيق HH:MM (مثال: 08:00)' : 'Enter time in HH:MM format (e.g. 08:00)');
    }
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('', isRTL ? 'يرجى إدخال اسم الدواء' : 'Please enter medication name');
      return;
    }

    const sideEffects = sideEffectsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const medValue = name.trim();
    const dosageValue = dosage.trim();
    const frequencyValue = frequency.trim();
    const instructionsValue = instructions.trim();
    const doctorValue = doctor.trim();
    const notesValue = notes.trim();

    const medData: import('@/types').Medication = {
      id: isEditing ? existingMed.id : Date.now().toString(),
      name: medValue,
      nameAr: medValue,
      dosage: dosageValue,
      dosageAr: dosageValue,
      frequency: frequencyValue,
      frequencyAr: frequencyValue,
      timeSlots,
      instructions: instructionsValue,
      instructionsAr: instructionsValue,
      sideEffects,
      sideEffectsAr: sideEffects,
      imageUrl,
      color: selectedColor,
      doctor: doctorValue,
      doctorAr: doctorValue,
      notes: notesValue,
      notesAr: notesValue,
      asNeededOnly,
      mealTiming: mealTiming === 'none' ? undefined : mealTiming,
      endDate: endDate.trim() || undefined,
      specialSchedule: isEditing ? existingMed.specialSchedule : undefined,
    };

    if (isEditing) {
      updateMedication(medData);
    } else {
      addMedication(medData);
    }

    router.back();
  };

  const placeholders = isRTL
    ? {
        name: 'اسم الدواء',
        dosage: 'مثال: ٥٠٠ مجم، حبة واحدة',
        frequency: 'مثال: مرة يومياً، مرتين يومياً',
        instructions: 'مثال: تناوله مع الطعام',
        sideEffects: 'مفصولة بفواصل: غثيان، دوخة',
        doctor: 'الطبيب المعالج',
        notes: 'أي ملاحظات إضافية',
        endDate: 'YYYY-MM-DD',
      }
    : {
        name: 'Medication name',
        dosage: 'e.g. 500mg, 1 tablet',
        frequency: 'e.g. Once daily, Twice daily',
        instructions: 'e.g. Take with food',
        sideEffects: 'Comma separated: nausea, dizziness',
        doctor: 'Prescribing doctor',
        notes: 'Any additional notes',
        endDate: 'YYYY-MM-DD',
      };

  const mealOptions: { value: MealTimingOption; label: string }[] = [
    { value: 'none', label: t('noMealTiming') },
    { value: 'before_meal', label: t('beforeMeal') },
    { value: 'after_meal', label: t('afterMeal') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.headerRow, { flexDirection: flexDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.borderLight }]}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? t('edit') : t('addMedication')}</Text>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]} testID="save-medication-btn">
            <Text style={styles.saveBtnText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <TouchableOpacity onPress={pickImage} style={styles.imageSection}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={[styles.previewImage, { borderColor: colors.primary }]} contentFit="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.borderLight, borderColor: colors.border }]}>
              <Camera size={28} color={colors.textLight} />
              <Text style={[styles.imageLabel, { color: colors.textLight }]}>{t('addPhoto')}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.imageUrlRow}>
          <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('imageUrl')}</Text>
          <TextInput
            style={[styles.input, { textAlign, backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder={t('imageUrlPlaceholder')}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.sectionLabel, { textAlign, color: colors.text }]}>{t('color')}</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setSelectedColor(c)}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                selectedColor === c && [styles.colorDotSelected, { borderColor: colors.text }],
              ]}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { textAlign, color: colors.text }]}>{t('details')}</Text>

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('name')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={name}
          onChangeText={setName}
          placeholder={placeholders.name}
          placeholderTextColor={colors.textLight}
          testID="med-name-input"
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('dosage')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={dosage}
          onChangeText={setDosage}
          placeholder={placeholders.dosage}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('frequency')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={frequency}
          onChangeText={setFrequency}
          placeholder={placeholders.frequency}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('instructions')}</Text>
        <TextInput
          style={[styles.input, styles.textArea, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={instructions}
          onChangeText={setInstructions}
          placeholder={placeholders.instructions}
          placeholderTextColor={colors.textLight}
          multiline
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('sideEffects')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={sideEffectsText}
          onChangeText={setSideEffectsText}
          placeholder={placeholders.sideEffects}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('doctor')}</Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={doctor}
          onChangeText={setDoctor}
          placeholder={placeholders.doctor}
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

        <Text style={[styles.sectionLabel, { textAlign, color: colors.text }]}>{t('mealTiming')}</Text>
        <View style={[styles.mealTimingRow, { flexDirection: flexDir }]}>
          {mealOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setMealTiming(opt.value)}
              style={[
                styles.mealTimingBtn,
                { borderColor: colors.borderLight, backgroundColor: colors.surface },
                mealTiming === opt.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                opt.value === 'before_meal' && mealTiming === opt.value && { backgroundColor: isDark ? '#3D2E06' : '#FEF3C7', borderColor: '#F59E0B' },
                opt.value === 'after_meal' && mealTiming === opt.value && { backgroundColor: isDark ? '#1E2D4A' : '#DBEAFE', borderColor: '#3B82F6' },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.mealTimingBtnText,
                  { color: colors.textSecondary },
                  mealTiming === opt.value && { color: colors.primaryDark },
                  opt.value === 'before_meal' && mealTiming === opt.value && { color: isDark ? '#F59E0B' : '#B45309' },
                  opt.value === 'after_meal' && mealTiming === opt.value && { color: isDark ? '#60A5FA' : '#1D4ED8' },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { textAlign, color: colors.textSecondary }]}>{t('endDate')}</Text>
        <TextInput
          style={[styles.input, { textAlign, backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          value={endDate}
          onChangeText={setEndDate}
          placeholder={placeholders.endDate}
          placeholderTextColor={colors.textLight}
        />

        <TouchableOpacity
          onPress={() => setAsNeededOnly(!asNeededOnly)}
          style={[
            styles.whenRequiredToggle,
            { borderColor: isDark ? '#4C2020' : '#FECACA', backgroundColor: isDark ? '#2D1A1A' : '#FEF2F2' },
            asNeededOnly && { borderColor: '#EF4444', backgroundColor: isDark ? '#3D1C1C' : '#FEE2E2' },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.whenRequiredInner, { flexDirection: flexDir }]}>
            <View style={[styles.whenRequiredIcon, { backgroundColor: isDark ? '#4C2020' : '#FEE2E2' }, asNeededOnly && { backgroundColor: '#EF4444' }]}>
              <AlertCircle size={20} color={asNeededOnly ? '#FFFFFF' : '#EF4444'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.whenRequiredText, { textAlign }, asNeededOnly && { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                {t('whenRequired')}
              </Text>
              <Text style={[styles.whenRequiredSubtext, { textAlign, color: isDark ? '#F87171' : '#EF4444' }, asNeededOnly && { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                {t('whenRequiredWarning')}
              </Text>
            </View>
            <View style={[styles.whenRequiredCheck, { borderColor: isDark ? '#4C2020' : '#FECACA' }, asNeededOnly && { borderColor: '#EF4444', backgroundColor: '#EF4444' }]}>
              {asNeededOnly && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { textAlign, color: colors.text }]}>{t('schedule')}</Text>

        <View style={styles.timeSlotsContainer}>
          {timeSlots.map((time, index) => (
            <View key={index} style={[styles.timeSlotChip, { flexDirection: flexDir, backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.timeSlotText, { color: colors.primaryDark }]}>{time}</Text>
              {timeSlots.length > 1 && (
                <TouchableOpacity onPress={() => removeTimeSlot(index)}>
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.addTimeRow, { flexDirection: flexDir }]}>
          <TextInput
            style={[styles.timeInput, { textAlign, backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
            value={newTime}
            onChangeText={setNewTime}
            placeholder="HH:MM"
            placeholderTextColor={colors.textLight}
            keyboardType="numbers-and-punctuation"
          />
          <TouchableOpacity onPress={addTimeSlot} style={[styles.addTimeBtn, { backgroundColor: colors.primary }]}>
            <Plus size={16} color={colors.white} />
            <Text style={styles.addTimeBtnText}>{t('addTime')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  scrollContent: {
    padding: 20,
  },
  imageSection: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 4,
  },
  imageLabel: {
    fontSize: 11,
  },
  imageUrlRow: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 20,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  mealTimingRow: {
    gap: 8,
    marginBottom: 8,
  },
  mealTimingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTimingBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  timeSlotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  addTimeRow: {
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  addTimeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  whenRequiredToggle: {
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden' as const,
  },
  whenRequiredInner: {
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  whenRequiredIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whenRequiredText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#DC2626',
  },
  whenRequiredSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  whenRequiredCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
