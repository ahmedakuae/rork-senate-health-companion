import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  FileText,
  Trash2,
  CheckCircle,
  Pencil,
} from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useTheme } from '@/contexts/ThemeContext';

const MONTH_NAMES_EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AppointmentDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL } = useLanguage();
  const { appointments, deleteAppointment, updateAppointment } = useAppData();
  const { colors, isDark } = useTheme();

  const appointment = appointments.find((a) => a.id === id);

  if (!appointment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>Appointment not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { backgroundColor: colors.primary }]}>
          <Text style={styles.backBtnCenterText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleEdit = () => {
    router.push(`/add-appointment?id=${appointment.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      isRTL ? 'حذف الموعد' : 'Delete Appointment',
      isRTL ? 'هل أنت متأكد؟' : 'Are you sure?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteAppointment(appointment.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleMarkComplete = () => {
    updateAppointment({ ...appointment, completed: true });
  };

  const getTitle = () => (isRTL ? appointment.titleAr || appointment.title : appointment.title);
  const getDoctor = () => (isRTL ? appointment.doctorAr || appointment.doctor : appointment.doctor);
  const getSpecialty = () => (isRTL ? appointment.specialtyAr || appointment.specialty : appointment.specialty);
  const getLocation = () => (isRTL ? appointment.locationAr || appointment.location : appointment.location);
  const getNotes = () => (isRTL ? appointment.notesAr || appointment.notes : appointment.notes);

  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  const formatDateDisplay = () => {
    const d = new Date(appointment.date + 'T00:00:00');
    if (isRTL) {
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    return `${DAY_NAMES_EN[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MONTH_NAMES_EN_FULL[d.getMonth()]} ${d.getFullYear()}`;
  };

  const apptDate = new Date(appointment.date + 'T00:00:00');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? '#0B3D38' : colors.primary }]}>
        <View style={[styles.headerRow, { flexDirection: flexDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.white} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('details')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={handleEdit} style={styles.actionBtn}>
              <Pencil size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
              <Trash2 size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.dateCircle}>
            <Text style={[styles.dateDay, { color: colors.primary }]}>{String(apptDate.getDate()).padStart(2, '0')}</Text>
            <Text style={[styles.dateMonth, { color: colors.primaryDark }]}>
              {MONTH_NAMES_EN_FULL[apptDate.getMonth()].substring(0, 3).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{getTitle()}</Text>
          {getSpecialty() ? (
            <Text style={styles.heroSpecialty}>{getSpecialty()}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={[styles.infoRow, { flexDirection: flexDir }]}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
              <Calendar size={18} color={colors.primary} />
            </View>
            <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.infoLabel, { textAlign, color: colors.textSecondary }]}>{t('date')}</Text>
              <Text style={[styles.infoValue, { textAlign, color: colors.text }]}>{formatDateDisplay()}</Text>
            </View>
          </View>

          {appointment.time ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <View style={[styles.infoRow, { flexDirection: flexDir }]}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                  <Clock size={18} color={colors.primary} />
                </View>
                <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.infoLabel, { textAlign, color: colors.textSecondary }]}>{t('time')}</Text>
                  <Text style={[styles.infoValue, { textAlign, color: colors.text }]}>{appointment.time}</Text>
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

          {getLocation() ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <View style={[styles.infoRow, { flexDirection: flexDir }]}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                  <MapPin size={18} color={colors.primary} />
                </View>
                <View style={[styles.infoContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.infoLabel, { textAlign, color: colors.textSecondary }]}>{t('location')}</Text>
                  <Text style={[styles.infoValue, { textAlign, color: colors.text }]}>{getLocation()}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {getNotes() ? (
          <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={[styles.notesHeader, { flexDirection: flexDir }]}>
              <FileText size={16} color={colors.textSecondary} />
              <Text style={[styles.notesLabel, { textAlign, color: colors.textSecondary }]}>{t('notes')}</Text>
            </View>
            <Text style={[styles.notesText, { textAlign, color: colors.text }]}>{getNotes()}</Text>
          </View>
        ) : null}

        {!appointment.completed && (
          <TouchableOpacity onPress={handleMarkComplete} style={[styles.completeButton, { backgroundColor: colors.primary }]}>
            <CheckCircle size={20} color={colors.white} />
            <Text style={styles.completeButtonText}>{t('markComplete')}</Text>
          </TouchableOpacity>
        )}

        {appointment.completed && (
          <View style={[styles.completedBadge, { backgroundColor: colors.completedBadgeBg }]}>
            <CheckCircle size={20} color={colors.success} />
            <Text style={[styles.completedText, { color: colors.success }]}>{t('completed')}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backBtnCenterText: {
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
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    gap: 6,
  },
  dateCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSpecialty: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
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
  notesCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  notesHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600' as const,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
  },
  completedText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
