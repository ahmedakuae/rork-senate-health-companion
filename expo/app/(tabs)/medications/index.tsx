import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Plus, Pill, ChevronRight, AlertCircle } from 'lucide-react-native';
import ImageViewer from '@/components/ImageViewer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { medications } = useAppData();
  const { colors, isDark } = useTheme();

  const [viewerImageUrl, setViewerImageUrl] = useState<string>('');
  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.headerContent, { flexDirection: flexDir }]}>
          <Text style={[styles.headerTitle, { textAlign, color: colors.text }]}>{t('medications')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/add-medication')}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            testID="add-medication-btn"
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.borderLight }]}>
              <Pill size={48} color={colors.textLight} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noMedications')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('noMedsYet')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/add-medication')}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color={colors.white} />
              <Text style={styles.emptyButtonText}>{t('addMedication')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          medications.map((med) => (
            <TouchableOpacity
              key={med.id}
              style={[styles.medCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push(`/medication-details?id=${med.id}`)}
              testID={`med-card-${med.id}`}
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
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: med.imageUrl }}
                      style={styles.medImage}
                      contentFit="cover"
                    />
                    <View style={[styles.imageOverlay, { backgroundColor: med.color ? `${med.color}40` : 'rgba(0,0,0,0.05)' }]} />
                  </View>
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.medImagePlaceholder,
                    { backgroundColor: med.color ? `${med.color}15` : colors.primaryLight },
                  ]}
                >
                  <Pill size={44} color={med.color || colors.primary} />
                </View>
              )}

              <View style={styles.cardContent}>
                <View style={[styles.cardTop, { flexDirection: flexDir }]}>
                  <View style={[styles.medInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.medName, { textAlign, color: colors.text }]}>
                      {isRTL ? med.nameAr || med.name : med.name}
                    </Text>
                    {med.asNeededOnly && (
                      <View style={[styles.whenRequiredBadge, { flexDirection: flexDir }]}>
                        <AlertCircle size={12} color="#FFFFFF" />
                        <Text style={styles.whenRequiredBadgeText}>{t('whenRequired')}</Text>
                      </View>
                    )}
                    <Text style={[styles.medDosage, { textAlign, color: colors.textSecondary }]}>
                      {isRTL ? med.dosageAr || med.dosage : med.dosage}
                    </Text>
                    <Text style={[styles.medFrequency, { textAlign, color: colors.textLight }]}>
                      {isRTL ? med.frequencyAr || med.frequency : med.frequency}
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color={colors.textLight}
                    style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
                  />
                </View>

                <View style={[styles.cardBottom, { borderTopColor: colors.borderLight }]}>
                  <View style={[styles.timeChips, { flexDirection: flexDir }]}>
                    {med.timeSlots.map((time, i) => (
                      <View key={i} style={[styles.timeChip, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.timeChipText, { color: colors.primaryDark }]}>{time}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

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
  medCard: {
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden' as const,
  },
  imageContainer: {
    width: '100%' as const,
    height: 180,
    position: 'relative' as const,
  },
  medImage: {
    width: '100%' as const,
    height: 180,
  },
  imageOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  medImagePlaceholder: {
    width: '100%' as const,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardTop: {
    alignItems: 'center',
    gap: 8,
  },
  medInfo: {
    flex: 1,
    gap: 3,
  },
  medName: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  medDosage: {
    fontSize: 15,
  },
  medFrequency: {
    fontSize: 14,
  },
  cardBottom: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  timeChips: {
    flexWrap: 'wrap',
    gap: 6,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  whenRequiredBadge: {
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
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
});
