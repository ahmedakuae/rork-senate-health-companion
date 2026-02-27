import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Globe,
  Plus,
  Check,
  X,
  Clock,
  ChevronRight,
  Heart,
  CalendarDays,
  Pill,
  AlertCircle,
  Calendar,
  Undo2,
  Moon,
  Sun,
} from 'lucide-react-native';
import ImageViewer from '@/components/ImageViewer';
import PillDosageIcon, { getDosageType } from '@/components/PillDosageIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Medication, SpecialScheduleEntry } from '@/types';

interface ScheduleItem {
  medicationId: string;
  medicationName: string;
  medicationNameAr: string;
  time: string;
  imageUrl: string;
  color: string;
  dosage: string;
  dosageAr: string;
  status: 'taken' | 'skipped' | 'pending';
  mealTiming?: 'before_meal' | 'after_meal';
  hasSpecialSchedule?: boolean;
  specialSchedule?: SpecialScheduleEntry[];
  specialDosage?: string;
  specialDosageAr?: string;
}

const MONTH_NAMES_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTH_NAMES_EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();
  const { medications, todayLogs, upcomingAppointments, logMedication, undoMedicationLog } = useAppData();
  const [scheduleModalMed, setScheduleModalMed] = useState<Medication | null>(null);
  const [viewerImageUrl, setViewerImageUrl] = useState<string>('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  }, [t]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaySchedule = useMemo(() => {
    const schedule: ScheduleItem[] = [];

    medications.forEach((med) => {
      if (med.asNeededOnly) return;

      if (med.specialSchedule && med.specialSchedule.length > 0) {
        const todayEntry = med.specialSchedule.find((s) => s.date === todayStr);
        if (!todayEntry) return;

        todayEntry.doses.forEach((dose) => {
          const log = todayLogs.find(
            (l) => l.medicationId === med.id && l.scheduledTime === dose.time
          );
          schedule.push({
            medicationId: med.id,
            medicationName: med.name,
            medicationNameAr: med.nameAr,
            time: dose.time,
            imageUrl: med.imageUrl,
            color: med.color,
            dosage: dose.dosage,
            dosageAr: dose.dosageAr,
            status: log?.status || 'pending',
            mealTiming: med.mealTiming,
            hasSpecialSchedule: true,
            specialSchedule: med.specialSchedule,
            specialDosage: dose.dosage,
            specialDosageAr: dose.dosageAr,
          });
        });
        return;
      }

      if (med.endDate && todayStr > med.endDate) return;

      med.timeSlots.forEach((time) => {
        const log = todayLogs.find(
          (l) => l.medicationId === med.id && l.scheduledTime === time
        );
        schedule.push({
          medicationId: med.id,
          medicationName: med.name,
          medicationNameAr: med.nameAr,
          time,
          imageUrl: med.imageUrl,
          color: med.color,
          dosage: med.dosage,
          dosageAr: med.dosageAr,
          status: log?.status || 'pending',
          mealTiming: med.mealTiming,
        });
      });
    });

    return schedule.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, todayLogs, todayStr]);

  const asNeededMeds = useMemo(() => {
    return medications.filter((m) => m.asNeededOnly);
  }, [medications]);

  const takenCount = todaySchedule.filter((s) => s.status === 'taken').length;
  const totalCount = todaySchedule.length;

  const handleLogMedication = useCallback((medicationId: string, time: string, status: 'taken' | 'skipped') => {
    const today = new Date().toISOString().split('T')[0];
    logMedication({
      id: `${medicationId}-${time}-${today}`,
      medicationId,
      scheduledTime: time,
      status,
      takenAt: status === 'taken' ? new Date().toISOString() : undefined,
      date: today,
    });
  }, [logMedication]);

  const handleUndoLog = useCallback((medicationId: string, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    undoMedicationLog(medicationId, time, today);
  }, [undoMedicationLog]);

  const openScheduleModal = useCallback((medId: string) => {
    const med = medications.find((m) => m.id === medId);
    if (med) setScheduleModalMed(med);
  }, [medications]);

  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  const formatDateAr = useCallback((dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
  }, []);

  const formatDateEnglish = useCallback((dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day} ${MONTH_NAMES_EN_FULL[d.getMonth()]}`;
  }, []);

  const getMealTimingLabel = useCallback((timing?: 'before_meal' | 'after_meal') => {
    if (!timing) return null;
    return timing === 'before_meal' ? t('beforeMeal') : t('afterMeal');
  }, [t]);

  const getMealTimingColor = useCallback((timing?: 'before_meal' | 'after_meal') => {
    if (timing === 'before_meal') return '#F59E0B';
    if (timing === 'after_meal') return '#3B82F6';
    return '#94A3B8';
  }, []);

  const navigateToMedDetail = useCallback((medicationId: string) => {
    router.push(`/medication-details?id=${medicationId}`);
  }, [router]);

  const headerGradientColors = isDark
    ? ['#0B3D38', '#0A2E2B', '#081F1D'] as const
    : ['#0D9488', '#0F766E', '#115E59'] as const;

  const renderMedCard = useCallback((item: ScheduleItem, index: number) => (
    <TouchableOpacity
      key={`${item.medicationId}-${item.time}-${index}`}
      onPress={() => navigateToMedDetail(item.medicationId)}
      activeOpacity={0.8}
      style={[
        styles.medCard,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        item.status === 'taken' && { opacity: 0.7, backgroundColor: colors.medCardTakenBg },
      ]}
    >
      {item.imageUrl ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={(e) => {
            e.stopPropagation?.();
            setViewerImageUrl(item.imageUrl);
          }}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.medImageLarge, { borderColor: item.color || colors.primary }]}
            contentFit="cover"
          />
        </TouchableOpacity>
      ) : (
        <View
          style={[
            styles.medImageLargePlaceholder,
            { backgroundColor: item.color ? item.color + '20' : colors.primaryLight },
          ]}
        >
          <Pill size={32} color={item.color || colors.primary} />
        </View>
      )}

      <View style={[styles.medCardBottom, { flexDirection: flexDir }]}>
        <View style={[styles.medInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1 }]}>
          <Text style={[styles.medName, { textAlign, color: colors.text }]} numberOfLines={2}>
            {isRTL ? item.medicationNameAr || item.medicationName : item.medicationName}
          </Text>
          <Text style={[styles.medDosage, { textAlign, color: colors.textSecondary }]}>
            {item.specialDosage
              ? (isRTL ? item.specialDosageAr || item.specialDosage : item.specialDosage)
              : (isRTL ? item.dosageAr || item.dosage : item.dosage)}
          </Text>
          {getDosageType(
            item.specialDosage || item.dosage,
            item.specialDosageAr || item.dosageAr
          ) && (
            <View style={styles.pillDosageIconRow}>
              <PillDosageIcon
                dosage={item.specialDosage || item.dosage}
                dosageAr={item.specialDosageAr || item.dosageAr}
                size={70}
                color={item.color || colors.primary}
              />
            </View>
          )}
          <View style={[styles.timeRow, { flexDirection: flexDir, backgroundColor: isDark ? colors.primaryLight : '#F0FDFA' }]}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.timeText, { color: colors.primary }]}>{item.time}</Text>
          </View>
          <View style={[styles.badgeRow, { flexDirection: flexDir }]}>
            {item.mealTiming && (
              <View style={[styles.mealBadge, { backgroundColor: getMealTimingColor(item.mealTiming) }]}>
                <Text style={styles.mealBadgeText}>{getMealTimingLabel(item.mealTiming)}</Text>
              </View>
            )}
            {item.hasSpecialSchedule && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  openScheduleModal(item.medicationId);
                }}
                style={styles.specialScheduleBadge}
              >
                <Calendar size={11} color="#FFFFFF" />
                <Text style={styles.specialScheduleBadgeText}>{t('specialSchedule')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {item.status === 'pending' ? (
          <View style={[styles.actionButtons, { flexDirection: flexDir }]}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleLogMedication(item.medicationId, item.time, 'taken');
              }}
              style={[styles.takenButton, { backgroundColor: colors.success }]}
              testID={`taken-btn-${item.medicationId}`}
            >
              <Check size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleLogMedication(item.medicationId, item.time, 'skipped');
              }}
              style={[styles.skipButton, { backgroundColor: colors.secondaryLight }]}
              testID={`skip-btn-${item.medicationId}`}
            >
              <X size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusWithUndo}>
            <View
              style={[
                styles.statusBadge,
                item.status === 'taken'
                  ? { backgroundColor: isDark ? '#1C3D2A' : '#DCFCE7' }
                  : { backgroundColor: isDark ? '#3D1C1C' : '#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status === 'taken' ? { color: colors.success } : { color: colors.error },
                ]}
              >
                {item.status === 'taken' ? t('taken') : t('skipped')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleUndoLog(item.medicationId, item.time);
              }}
              style={[styles.undoButton, { backgroundColor: colors.undoBg }]}
              testID={`undo-btn-${item.medicationId}`}
            >
              <Undo2 size={14} color={colors.textSecondary} />
              <Text style={[styles.undoText, { color: colors.textSecondary }]}>{t('undo')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [flexDir, isRTL, textAlign, t, handleLogMedication, handleUndoLog, getMealTimingLabel, getMealTimingColor, openScheduleModal, navigateToMedDetail, colors, isDark]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerRow, { flexDirection: flexDir }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { textAlign }]}>{greeting} يا أحلى أم 💚</Text>
            <Text style={[styles.headerSubtitle, { textAlign }]}>
              {t('todayOverview')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.langButton}
              testID="theme-toggle"
            >
              {isDark ? <Sun size={18} color={colors.white} /> : <Moon size={18} color={colors.white} />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleLanguage}
              style={styles.langButton}
              testID="language-toggle"
            >
              <Globe size={18} color={colors.white} />
              <Text style={styles.langText}>
                {language === 'en' ? 'عربي' : 'EN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.statsRow, { flexDirection: flexDir }]}>
          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Pill size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: isDark ? colors.white : colors.text }]}>
              {takenCount}/{totalCount}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>{t('medicationsTaken')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: isDark ? '#3D2E06' : '#FEF3C7' }]}>
              <CalendarDays size={18} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: isDark ? colors.white : colors.text }]}>
              {upcomingAppointments.length}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>{t('upcomingAppointments')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
          <Text style={[styles.sectionTitle, { textAlign, color: colors.text }]}>
            {t('todaysMedications')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/add-medication')}
            style={[styles.addButton, { backgroundColor: colors.primaryLight }]}
            testID="add-medication-btn"
          >
            <Plus size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {todaySchedule.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Heart size={32} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textLight }]}>{t('noMedsYet')}</Text>
          </View>
        ) : (
          todaySchedule.map((item, index) => renderMedCard(item, index))
        )}

        {asNeededMeds.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { flexDirection: flexDir, marginTop: 24 }]}>
              <View style={[styles.asNeededTitleRow, { flexDirection: flexDir }]}>
                <AlertCircle size={18} color="#EF4444" />
                <Text style={[styles.sectionTitle, { textAlign, color: '#EF4444' }]}>
                  {t('asNeededSection')}
                </Text>
              </View>
            </View>

            {asNeededMeds.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={[styles.asNeededCard, { backgroundColor: isDark ? '#2D1A1A' : '#FEF2F2', borderColor: isDark ? '#4C2020' : '#FECACA' }]}
                onPress={() => router.push(`/medication-details?id=${med.id}`)}
                activeOpacity={0.7}
              >
                {med.imageUrl ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setViewerImageUrl(med.imageUrl);
                    }}
                  >
                    <Image
                      source={{ uri: med.imageUrl }}
                      style={[styles.asNeededImage, { borderColor: med.color || '#EF4444' }]}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ) : null}
                <View style={[styles.medCardBottom, { flexDirection: flexDir }]}>
                  <View style={[styles.medInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1 }]}>
                    <Text style={[styles.medName, { textAlign, color: colors.text }]} numberOfLines={2}>
                      {isRTL ? med.nameAr || med.name : med.name}
                    </Text>
                    <Text style={[styles.medDosage, { textAlign, color: colors.textSecondary }]}>
                      {isRTL ? med.dosageAr || med.dosage : med.dosage}
                    </Text>
                    {getDosageType(med.dosage, med.dosageAr) && (
                      <View style={styles.pillDosageIconRow}>
                        <PillDosageIcon
                          dosage={med.dosage}
                          dosageAr={med.dosageAr}
                          size={70}
                          color={med.color || '#EF4444'}
                        />
                      </View>
                    )}
                    <View style={styles.whenRequiredBadge}>
                      <AlertCircle size={11} color="#FFFFFF" />
                      <Text style={styles.whenRequiredBadgeText}>{t('whenRequired')}</Text>
                    </View>
                  </View>
                  <ChevronRight
                    size={20}
                    color={colors.textLight}
                    style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={[styles.sectionHeader, { flexDirection: flexDir, marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { textAlign, color: colors.text }]}>
            {t('upcomingAppointments')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/add-appointment')}
            style={[styles.addButton, { backgroundColor: colors.primaryLight }]}
            testID="add-appointment-btn"
          >
            <Plus size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {upcomingAppointments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <CalendarDays size={32} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textLight }]}>{t('noApptYet')}</Text>
          </View>
        ) : (
          upcomingAppointments.slice(0, 3).map((appt) => (
            <TouchableOpacity
              key={appt.id}
              style={[styles.apptCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push(`/appointment-details?id=${appt.id}`)}
              testID={`appt-card-${appt.id}`}
            >
              <View style={[styles.apptContent, { flexDirection: flexDir }]}>
                <View style={[styles.apptDateBox, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.apptDateDay, { color: colors.primary }]}>
                    {String(new Date(appt.date + 'T00:00:00').getDate()).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.apptDateMonth, { color: colors.primaryDark }]}>
                    {MONTH_NAMES_EN[new Date(appt.date + 'T00:00:00').getMonth()]}
                  </Text>
                </View>
                <View style={[styles.apptInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.apptTitle, { textAlign, color: colors.text }]}>
                    {isRTL ? appt.titleAr || appt.title : appt.title}
                  </Text>
                  <Text style={[styles.apptDoctor, { textAlign, color: colors.textSecondary }]}>
                    {isRTL ? appt.doctorAr || appt.doctor : appt.doctor}
                  </Text>
                  <Text style={[styles.apptLocation, { textAlign, color: colors.textLight }]}>
                    {isRTL ? appt.locationAr || appt.location : appt.location}
                  </Text>
                  <Text style={[styles.apptTime, { textAlign, color: colors.textLight }]}>{appt.time}</Text>
                </View>
                <ChevronRight
                  size={20}
                  color={colors.textLight}
                  style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
                />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={!!scheduleModalMed}
        animationType="slide"
        transparent
        onRequestClose={() => setScheduleModalMed(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBackground }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground }]}>
            <View style={[styles.modalHeader, { flexDirection: flexDir, borderBottomColor: colors.borderLight }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { textAlign, color: colors.text }]}>{t('specialSchedule')}</Text>
                {scheduleModalMed && (
                  <Text style={[styles.modalSubtitle, { textAlign, color: colors.textSecondary }]}>
                    {isRTL ? scheduleModalMed.nameAr || scheduleModalMed.name : scheduleModalMed.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setScheduleModalMed(null)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.borderLight }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {scheduleModalMed?.mealTiming && (
              <View style={[styles.modalMealBadge, { backgroundColor: getMealTimingColor(scheduleModalMed.mealTiming) }]}>
                <Text style={styles.modalMealBadgeText}>{getMealTimingLabel(scheduleModalMed.mealTiming)}</Text>
              </View>
            )}

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {scheduleModalMed?.specialSchedule?.map((entry, idx) => {
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
                      <Text style={[styles.scheduleDateText, { color: colors.text }, isToday && { color: colors.primary }, { textAlign }]}>
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
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  langText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsRow: {
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  asNeededTitleRow: {
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  medCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  medImageLarge: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 2,
  },
  medImageLargePlaceholder: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medCardBottom: {
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  medInfo: {
    gap: 3,
  },
  medName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  medDosage: {
    fontSize: 14,
  },
  pillDosageIconRow: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  timeRow: {
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  badgeRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  mealBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  specialScheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  specialScheduleBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  actionButtons: {
    gap: 8,
  },
  takenButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statusWithUndo: {
    alignItems: 'center',
    gap: 6,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  undoText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  asNeededCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  asNeededImage: {
    width: '100%',
    height: 130,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomWidth: 2,
  },
  whenRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  whenRequiredBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  apptCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  apptContent: {
    alignItems: 'center',
    gap: 12,
  },
  apptDateBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptDateDay: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  apptDateMonth: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  apptInfo: {
    flex: 1,
    gap: 2,
  },
  apptTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  apptDoctor: {
    fontSize: 14,
  },
  apptLocation: {
    fontSize: 13,
  },
  apptTime: {
    fontSize: 13,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    flex: 1,
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
