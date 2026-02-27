import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Pill,
  Clock,
  AlertCircle,
  Stethoscope,
  FileText,
  Trash2,
  Pencil,
  Calendar,
  CalendarDays,
  X,
} from 'lucide-react-native';
import ImageViewer from '@/components/ImageViewer';
import PillDosageIcon, { getDosageType } from '@/components/PillDosageIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useTheme } from '@/contexts/ThemeContext';

const MONTH_NAMES_EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MedicationDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL } = useLanguage();
  const { medications, deleteMedication } = useAppData();
  const { colors, isDark } = useTheme();
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string>('');

  const medication = medications.find((m) => m.id === id);

  if (!medication) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>Medication not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { backgroundColor: colors.primary }]}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleEdit = () => {
    router.push(`/add-medication?id=${medication.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      isRTL ? 'حذف الدواء' : 'Delete Medication',
      isRTL ? 'هل أنت متأكد؟' : 'Are you sure?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteMedication(medication.id);
            router.back();
          },
        },
      ]
    );
  };

  const getName = () => (isRTL ? medication.nameAr || medication.name : medication.name);
  const getDosage = () => (isRTL ? medication.dosageAr || medication.dosage : medication.dosage);
  const getFrequency = () => (isRTL ? medication.frequencyAr || medication.frequency : medication.frequency);
  const getInstructions = () => (isRTL ? medication.instructionsAr || medication.instructions : medication.instructions);
  const getDoctor = () => (isRTL ? medication.doctorAr || medication.doctor : medication.doctor);
  const getNotes = () => (isRTL ? medication.notesAr || medication.notes : medication.notes);

  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  const todayStr = new Date().toISOString().split('T')[0];

  const formatDateAr = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
  };

  const formatDateEnglish = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day} ${MONTH_NAMES_EN_FULL[d.getMonth()]}`;
  };

  const getMealTimingLabel = () => {
    if (!medication.mealTiming) return null;
    return medication.mealTiming === 'before_meal' ? t('beforeMeal') : t('afterMeal');
  };

  const getMealTimingColor = () => {
    if (medication.mealTiming === 'before_meal') return '#F59E0B';
    if (medication.mealTiming === 'after_meal') return '#3B82F6';
    return '#94A3B8';
  };

  const headerBgColor = isDark
    ? (medication.color ? medication.color + '99' : colors.primary)
    : (medication.color || colors.primary);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBgColor }]}>
        <View style={[styles.headerRow, { flexDirection: flexDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.white} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('details')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={handleEdit} style={styles.deleteBtn}>
              <Pencil size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Trash2 size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroSection}>
          {medication.imageUrl ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setViewerImageUrl(medication.imageUrl)}
            >
              <Image source={{ uri: medication.imageUrl }} style={styles.heroImage} contentFit="cover" />
            </TouchableOpacity>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Pill size={48} color={medication.color || colors.primary} />
            </View>
          )}
          <Text style={[styles.heroName, { textAlign: 'center' }]}>{getName()}</Text>
          <Text style={[styles.heroDosage, { textAlign: 'center' }]}>{getDosage()}</Text>
          {getDosageType(medication.dosage, medication.dosageAr) && (
            <View style={styles.heroPillIcon}>
              <PillDosageIcon
                dosage={medication.dosage}
                dosageAr={medication.dosageAr}
                size={100}
                color={medication.color || colors.primary}
              />
            </View>
          )}

          <View style={styles.heroBadges}>
            {medication.asNeededOnly && (
              <View style={styles.whenRequiredHeroBadge}>
                <AlertCircle size={14} color="#FFFFFF" />
                <Text style={styles.whenRequiredHeroText}>{t('whenRequired')}</Text>
              </View>
            )}
            {medication.mealTiming && (
              <View style={[styles.mealTimingHeroBadge, { backgroundColor: getMealTimingColor() }]}>
                <Text style={styles.mealTimingHeroText}>{getMealTimingLabel()}</Text>
              </View>
            )}
            {medication.specialSchedule && medication.specialSchedule.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowScheduleModal(true)}
                style={styles.specialScheduleHeroBadge}
              >
                <Calendar size={14} color="#FFFFFF" />
                <Text style={styles.specialScheduleHeroText}>{t('specialSchedule')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={[styles.infoRow, { flexDirection: flexDir }]}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
              <Clock size={18} color={colors.primary} />
            </View>
            <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.infoLabel, { textAlign, color: colors.textSecondary }]}>{t('frequency')}</Text>
              <Text style={[styles.infoValue, { textAlign, color: colors.text }]}>{getFrequency()}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={[styles.infoRow, { flexDirection: flexDir }]}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
              <Clock size={18} color={colors.primary} />
            </View>
            <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.infoLabel, { textAlign, color: colors.textSecondary }]}>{t('schedule')}</Text>
              <View style={[styles.timeChips, { flexDirection: flexDir }]}>
                {medication.timeSlots.map((time, i) => (
                  <View key={i} style={[styles.timeChip, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.timeChipText, { color: colors.primaryDark }]}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {medication.endDate ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <View style={[styles.infoRow, { flexDirection: flexDir }]}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                  <CalendarDays size={18} color={colors.primary} />
                </View>
                <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.infoLabel, { textAlign, color: colors.textSecondary }]}>{t('endDate')}</Text>
                  <Text style={[styles.infoValue, { textAlign, color: colors.text }]}>
                    {isRTL ? formatDateAr(medication.endDate) : formatDateEnglish(medication.endDate)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {getDoctor() ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <View style={[styles.infoRow, { flexDirection: flexDir }]}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                  <Stethoscope size={18} color={colors.primary} />
                </View>
                <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.infoLabel, { textAlign, color: colors.textSecondary }]}>{t('doctor')}</Text>
                  <Text style={[styles.infoValue, { textAlign, color: colors.text }]}>{getDoctor()}</Text>
                </View>
              </View>
            </>
          ) : null}

          {getInstructions() ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <View style={[styles.infoRow, { flexDirection: flexDir }]}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                  <FileText size={18} color={colors.primary} />
                </View>
                <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.infoLabel, { textAlign, color: colors.textSecondary }]}>{t('instructions')}</Text>
                  <Text style={[styles.infoValue, { textAlign, color: colors.text }]}>{getInstructions()}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {getNotes() ? (
          <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.notesLabel, { textAlign, color: colors.textSecondary }]}>{t('notes')}</Text>
            <Text style={[styles.notesText, { textAlign, color: colors.text }]}>{getNotes()}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBackground }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground }]}>
            <View style={[styles.modalHeader, { flexDirection: flexDir, borderBottomColor: colors.borderLight }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { textAlign, color: colors.text }]}>{t('specialSchedule')}</Text>
                <Text style={[styles.modalSubtitle, { textAlign, color: colors.textSecondary }]}>{getName()}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowScheduleModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.borderLight }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {medication.mealTiming && (
              <View style={[styles.modalMealBadge, { backgroundColor: getMealTimingColor() }]}>
                <Text style={styles.modalMealBadgeText}>{getMealTimingLabel()}</Text>
              </View>
            )}

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {medication.specialSchedule?.map((entry, idx) => {
                const isToday = entry.date === todayStr;
                return (
                  <View
                    key={entry.date}
                    style={[
                      styles.scheduleDay,
                      { backgroundColor: colors.scheduleDayBg, borderColor: colors.borderLight },
                      isToday && { backgroundColor: colors.scheduleDayTodayBg, borderColor: isDark ? '#2D6A4F' : '#86EFAC', borderWidth: 1.5 },
                      idx === 0 && { marginTop: 0 },
                    ]}
                  >
                    <View style={[styles.scheduleDateRow, { flexDirection: flexDir }]}>
                      <CalendarDays size={16} color={isToday ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.scheduleDateText, { textAlign, flex: 1, color: colors.text }, isToday && { color: colors.primary }]}>
                        {isRTL ? formatDateAr(entry.date) : formatDateEnglish(entry.date)}
                      </Text>
                      {isToday && (
                        <View style={[styles.todayTag, { backgroundColor: colors.primary }]}>
                          <Text style={styles.todayTagText}>{t('today')}</Text>
                        </View>
                      )}
                    </View>
                    {entry.doses.map((dose, dIdx) => (
                      <View key={dIdx} style={[styles.scheduleDose, { flexDirection: flexDir, borderTopColor: colors.borderLight }]}>
                        <View style={[styles.scheduleTimeBox, { backgroundColor: colors.primaryLight }]}>
                          <Clock size={12} color={colors.primary} />
                          <Text style={[styles.scheduleTimeText, { color: colors.primaryDark }]}>{dose.time}</Text>
                        </View>
                        <Text style={[styles.scheduleDoseText, { textAlign, flex: 1, color: colors.text }]}>
                          {isRTL ? dose.dosageAr || dose.dosage : dose.dosage}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ImageViewer
        visible={!!viewerImageUrl}
        imageUrl={viewerImageUrl}
        onClose={() => setViewerImageUrl('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFound: {
    fontSize: 17,
    textAlign: 'center',
    marginTop: 40,
  },
  backBtnCenter: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
  },
  heroImage: {
    width: 160,
    height: 160,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  heroPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  heroDosage: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
  },
  heroPillIcon: {
    marginTop: 8,
    alignItems: 'center',
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  whenRequiredHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  whenRequiredHeroText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  mealTimingHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mealTimingHeroText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  specialScheduleHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  specialScheduleHeroText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  timeChips: {
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timeChipText: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  notesCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  modalSubtitle: {
    fontSize: 15,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMealBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 12,
  },
  modalMealBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  scheduleDay: {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  scheduleDateRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  scheduleDateText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  todayTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayTagText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  scheduleDose: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  scheduleTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  scheduleTimeText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  scheduleDoseText: {
    fontSize: 15,
  },
});
