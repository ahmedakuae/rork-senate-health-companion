import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Bot, User, Heart, ImagePlus, Camera, X, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

interface AttachedImage {
  uri: string;
  mimeType: string;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const { medications, appointments } = useAppData();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [input, setInput] = useState<string>('');
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const medicationContext = medications.map((med) => ({
    name: med.name,
    nameAr: med.nameAr,
    dosage: med.dosage,
    frequency: med.frequency,
    timeSlots: med.timeSlots,
    sideEffects: med.sideEffects,
    instructions: med.instructions,
    doctor: med.doctor,
  }));

  const appointmentContext = appointments.map((appt) => ({
    title: appt.title,
    doctor: appt.doctor,
    date: appt.date,
    time: appt.time,
    location: appt.location,
  }));

  const systemContext = `You are a caring, helpful health assistant for a patient. 
You have access to their medication and appointment information.
Always be warm, supportive, and clear in your responses.
If asked in Arabic, respond in Arabic. If asked in English, respond in English.
Current language preference: ${language === 'ar' ? 'Arabic' : 'English'}

Patient's Medications: ${JSON.stringify(medicationContext)}
Patient's Appointments: ${JSON.stringify(appointmentContext)}

You can answer ANY question the patient has, including:
- Questions about ANY medication (even ones not in their list) - uses, side effects, dosage info
- Drug interactions between their current medications and any other medication they ask about
- Whether it's safe to take an additional medication with their current ones
- General health questions, symptoms, nutrition, and wellness advice
- Questions about medical procedures, tests, or conditions

When asked about drug interactions or safety of combining medications, provide helpful information based on commonly known interactions, but always remind them to confirm with their doctor or pharmacist.

Important: You are NOT a doctor. Always recommend consulting their doctor for medical decisions.
Be encouraging about medication adherence and appointment attendance.`;

  const { messages, sendMessage, error } = useRorkAgent({
    tools: {
      getMedicationInfo: createRorkTool({
        description: "Get information about the patient's medications",
        zodSchema: z.object({
          medicationName: z.string().describe("Name of the medication to look up").optional(),
        }),
        execute(toolInput) {
          if (toolInput.medicationName) {
            const med = medications.find(
              (m) =>
                m.name.toLowerCase().includes(toolInput.medicationName!.toLowerCase()) ||
                m.nameAr.includes(toolInput.medicationName!)
            );
            return med ? JSON.stringify(med) : "Medication not found";
          }
          return JSON.stringify(medicationContext);
        },
      }),
      getAppointmentInfo: createRorkTool({
        description: "Get information about the patient's appointments",
        zodSchema: z.object({
          upcoming: z.boolean().describe("Whether to get only upcoming appointments").optional(),
        }),
        execute() {
          return JSON.stringify(appointmentContext);
        },
      }),
    },
  });

  const pickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Permission needed',
          language === 'ar' ? 'نحتاج إذن الوصول للصور' : 'We need permission to access your photos'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const newImages: AttachedImage[] = result.assets.map((asset) => ({
          uri: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
        }));
        setAttachedImages((prev) => [...prev, ...newImages]);
      }
    } catch (e) {
      console.log('Gallery picker error:', e);
    }
  }, [language]);

  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Permission needed',
          language === 'ar' ? 'نحتاج إذن الوصول للكاميرا' : 'We need permission to access your camera'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachedImages((prev) => [
          ...prev,
          {
            uri: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri,
            mimeType: asset.mimeType || 'image/jpeg',
          },
        ]);
      }
    } catch (e) {
      console.log('Camera error:', e);
    }
  }, [language]);

  const removeImage = useCallback((index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() && attachedImages.length === 0) return;
    const messageText = input.trim();
    setInput('');

    const textContent = messages.length === 0
      ? `${systemContext}\n\nUser message: ${messageText || '(see attached images)'}`
      : messageText || (language === 'ar' ? 'انظر للصور المرفقة' : 'See attached images');

    if (attachedImages.length > 0) {
      const files = attachedImages.map((img) => ({
        type: 'file' as const,
        mediaType: img.mimeType,
        url: img.uri,
      }));
      sendMessage({ text: textContent, files: files as any });
      setAttachedImages([]);
    } else {
      sendMessage(textContent);
    }

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [input, attachedImages, messages.length, sendMessage, systemContext, language]);

  const isLoading = messages.length > 0 && messages[messages.length - 1]?.role === 'user';
  const canSend = input.trim().length > 0 || attachedImages.length > 0;

  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.headerRow, { flexDirection: flexDir }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.primaryLight }]}
            testID="chat-back-btn"
          >
            <ChevronLeft size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { textAlign, color: colors.text }]}>{t('chat')}</Text>
            <Text style={[styles.headerSubtitle, { textAlign, color: colors.textSecondary }]}>
              {language === 'ar' ? 'مساعدك الصحي الشخصي' : 'Your personal health assistant'}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <View style={[styles.welcomeIcon, { backgroundColor: colors.primaryLight }]}>
                <Heart size={32} color={colors.primary} />
              </View>
              <Text style={[styles.welcomeText, { textAlign: 'center', color: colors.textSecondary }]}>
                {t('chatWelcome')}
              </Text>
              <View style={styles.suggestionsContainer}>
                {(language === 'ar'
                  ? [
                      'ما هي أدويتي؟',
                      'هل يوجد تعارض بين أدويتي؟',
                      'هل أقدر آخذ بنادول مع أدويتي؟',
                      'متى موعدي القادم؟',
                    ]
                  : [
                      'What medications am I taking?',
                      'Any interactions between my meds?',
                      'Can I take Panadol with my medications?',
                      'When is my next appointment?',
                    ]
                ).map((suggestion, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.primaryLight }]}
                    onPress={() => {
                      setInput(suggestion);
                    }}
                  >
                    <Text style={[styles.suggestionText, { color: colors.primary }]}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.messageBubbleWrap,
                m.role === 'user' ? styles.userWrap : styles.assistantWrap,
              ]}
            >
              {m.role === 'assistant' && (
                <View style={[styles.avatarBot, { backgroundColor: colors.primaryLight }]}>
                  <Bot size={16} color={colors.primary} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  m.role === 'user'
                    ? [styles.userBubble, { backgroundColor: colors.chatBubbleUser }]
                    : [styles.assistantBubble, { backgroundColor: colors.chatBubbleAI }],
                ]}
              >
                {m.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <Text
                        key={`${m.id}-${i}`}
                        style={[
                          styles.messageText,
                          m.role === 'user' ? { color: colors.white } : { color: colors.text },
                          { textAlign },
                        ]}
                      >
                        {part.text}
                      </Text>
                    );
                  }
                  if (part.type === 'tool') {
                    if (part.state === 'output-available' || part.state === 'input-available' || part.state === 'input-streaming') {
                      return null;
                    }
                  }
                  return null;
                })}
              </View>
              {m.role === 'user' && (
                <View style={[styles.avatarUser, { backgroundColor: colors.primary }]}>
                  <User size={16} color={colors.white} />
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubbleWrap, styles.assistantWrap]}>
              <View style={[styles.avatarBot, { backgroundColor: colors.primaryLight }]}>
                <Bot size={16} color={colors.primary} />
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.chatBubbleAI }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.'}
            </Text>
          </View>
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
          {attachedImages.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagePreviewRow}
              contentContainerStyle={styles.imagePreviewContent}
            >
              {attachedImages.map((img, idx) => (
                <View key={idx} style={styles.imagePreviewWrap}>
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    onPress={() => removeImage(idx)}
                    testID={`remove-img-${idx}`}
                  >
                    <X size={12} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={[styles.inputRow, { flexDirection: flexDir }]}>
            <TouchableOpacity
              onPress={pickFromGallery}
              style={[styles.attachButton, { backgroundColor: colors.primaryLight }]}
              testID="gallery-btn"
            >
              <ImagePlus size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={takePhoto}
              style={[styles.attachButton, { backgroundColor: colors.primaryLight }]}
              testID="camera-btn"
            >
              <Camera size={20} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { textAlign, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.borderLight }]}
              value={input}
              onChangeText={setInput}
              placeholder={t('chatPlaceholder')}
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={1000}
              testID="chat-input"
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendButton,
                { backgroundColor: canSend ? colors.primary : colors.borderLight },
              ]}
              disabled={!canSend}
              testID="send-btn"
            >
              <Send
                size={18}
                color={canSend ? colors.white : colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    gap: 16,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
  },
  suggestionsContainer: {
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  messageBubbleWrap: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  userWrap: {
    justifyContent: 'flex-end',
  },
  assistantWrap: {
    justifyContent: 'flex-start',
  },
  avatarBot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUser: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  errorBanner: {
    padding: 10,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputRow: {
    alignItems: 'flex-end',
    gap: 6,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewRow: {
    marginBottom: 8,
  },
  imagePreviewContent: {
    gap: 8,
    paddingVertical: 4,
  },
  imagePreviewWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  imagePreview: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  imageRemoveBtn: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
