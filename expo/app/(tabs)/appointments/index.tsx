import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Calendar, ChevronRight, MapPin, Clock } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useTheme } from '@/contexts/ThemeContext';

const MONTH_NAMES_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { appointments, upcomingAppointments } = useAppData();
  const { colors, isDark } = useTheme();

  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  const pastAppointments = appointments
    .filter((a) => a.completed || new Date(a.date) < new Date(new Date().toISOString().split('T')[0]))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.headerContent, { flexDirection: flexDir }]}>
          <Text style={[styles.headerTitle, { textAlign, color: colors.text }]}>{t('appointments')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/add-appointment')}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            testID="add-appointment-btn"
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.borderLight }]}>
              <Calendar size={48} color={colors.textLight} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noAppointments')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('noApptYet')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/add-appointment')}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color={colors.white} />
              <Text style={styles.emptyButtonText}>{t('addAppointment')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {upcomingAppointments.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { textAlign, color: colors.textSecondary }]}>{t('upcomingAppointments')}</Text>
                {upcomingAppointments.map((appt) => {
                  const d = new Date(appt.date + 'T00:00:00');
                  return (
                    <TouchableOpacity
                      key={appt.id}
                      style={[styles.apptCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                      onPress={() => router.push(`/appointment-details?id=${appt.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.apptRow, { flexDirection: flexDir }]}>
                        <View style={[styles.dateBox, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.dateDay, { color: colors.primary }]}>
                            {String(d.getDate()).padStart(2, '0')}
                          </Text>
                          <Text style={[styles.dateMonth, { color: colors.primaryDark }]}>
                            {MONTH_NAMES_EN[d.getMonth()]}
                          </Text>
                        </View>
                        <View style={[styles.apptInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <Text style={[styles.apptTitle, { textAlign, color: colors.text }]}>
                            {isRTL ? appt.titleAr || appt.title : appt.title}
                          </Text>
                          <Text style={[styles.apptDoctor, { textAlign, color: colors.textSecondary }]}>
                            {isRTL ? appt.doctorAr || appt.doctor : appt.doctor}
                          </Text>
                          <View style={[styles.detailRow, { flexDirection: flexDir }]}>
                            <Clock size={13} color={colors.textSecondary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{appt.time}</Text>
                          </View>
                          {appt.location && (
                            <View style={[styles.detailRow, { flexDirection: flexDir }]}>
                              <MapPin size={13} color={colors.textSecondary} />
                              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                                {isRTL ? appt.locationAr || appt.location : appt.location}
                              </Text>
                            </View>
                          )}
                        </View>
                        <ChevronRight
                          size={20}
                          color={colors.textLight}
                          style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {pastAppointments.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { textAlign, marginTop: 24, color: colors.textSecondary }]}>{t('completed')}</Text>
                {pastAppointments.map((appt) => {
                  const d = new Date(appt.date + 'T00:00:00');
                  return (
                    <TouchableOpacity
                      key={appt.id}
                      style={[styles.apptCard, styles.pastCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                      onPress={() => router.push(`/appointment-details?id=${appt.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.apptRow, { flexDirection: flexDir }]}>
                        <View style={[styles.dateBox, { backgroundColor: colors.borderLight }]}>
                          <Text style={[styles.dateDay, { color: colors.textSecondary }]}>
                            {String(d.getDate()).padStart(2, '0')}
                          </Text>
                          <Text style={[styles.dateMonth, { color: colors.textSecondary }]}>
                            {MONTH_NAMES_EN[d.getMonth()]}
                          </Text>
                        </View>
                        <View style={[styles.apptInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <Text style={[styles.apptTitle, { textAlign, color: colors.textSecondary }]}>
                            {isRTL ? appt.titleAr || appt.title : appt.title}
                          </Text>
                          <Text style={[styles.apptDoctor, { textAlign, color: colors.textSecondary }]}>
                            {isRTL ? appt.doctorAr || appt.doctor : appt.doctor}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '600' as const,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  apptCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pastCard: {
    opacity: 0.7,
  },
  apptRow: {
    alignItems: 'center',
    gap: 14,
  },
  dateBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 21,
    fontWeight: '700' as const,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  apptInfo: {
    flex: 1,
    gap: 3,
  },
  apptTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  apptDoctor: {
    fontSize: 14,
  },
  detailRow: {
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  detailText: {
    fontSize: 13,
  },
});
