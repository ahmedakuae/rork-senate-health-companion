import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, Appointment } from '@/types';

const MED_CATEGORY_ID = 'medication_reminder';

export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform - skipping setup');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('appointment-reminders', {
        name: 'Appointment Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    await Notifications.setNotificationCategoryAsync(MED_CATEGORY_ID, [
      {
        identifier: 'taken',
        buttonTitle: '✅ Yes, Taken',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'skipped',
        buttonTitle: '❌ No, Skip',
        options: { opensAppToForeground: false },
      },
    ]);

    console.log('[Notifications] Setup complete');
    return true;
  } catch (error) {
    console.log('[Notifications] Setup error:', error);
    return false;
  }
}

export async function scheduleMedicationReminders(medication: Medication): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await cancelMedicationReminders(medication.id);

    if (medication.asNeededOnly) {
      console.log(`[Notifications] Skipping as-needed medication: ${medication.name}`);
      return;
    }

    const medName = medication.nameAr || medication.name;
    const medDosage = medication.dosageAr || medication.dosage;
    const mealTimingText = medication.mealTiming === 'before_meal' ? 'قبل الأكل' : medication.mealTiming === 'after_meal' ? 'بعد الأكل' : '';

    if (medication.specialSchedule && medication.specialSchedule.length > 0) {
      for (const entry of medication.specialSchedule) {
        const entryDate = new Date(entry.date + 'T00:00:00');
        if (isNaN(entryDate.getTime())) continue;

        for (const dose of entry.doses) {
          const [hours, minutes] = dose.time.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) continue;

          const triggerDate = new Date(entry.date + 'T00:00:00');
          triggerDate.setHours(hours, minutes, 0, 0);

          if (triggerDate <= new Date()) continue;

          const identifier = `med-${medication.id}-${entry.date}-${dose.time}`;

          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              title: `💊 ${medName}`,
              body: `${dose.dosageAr || dose.dosage}${mealTimingText ? ' - ' + mealTimingText : ''} - هل تناولت دواءك؟`,
              data: {
                type: 'medication',
                medicationId: medication.id,
                scheduledTime: dose.time,
              },
              categoryIdentifier: MED_CATEGORY_ID,
              sound: 'default',
              ...(Platform.OS === 'android' ? { channelId: 'medication-reminders' } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });

          console.log(`[Notifications] Scheduled special: ${medName} on ${entry.date} at ${dose.time}`);
        }
      }
      return;
    }

    if (medication.endDate) {
      const endDate = new Date(medication.endDate + 'T23:59:59');
      const now = new Date();
      const currentDate = new Date(now.toISOString().split('T')[0] + 'T00:00:00');

      for (let d = new Date(currentDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        for (const timeSlot of medication.timeSlots) {
          const [hours, minutes] = timeSlot.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) continue;

          const triggerDate = new Date(dateStr + 'T00:00:00');
          triggerDate.setHours(hours, minutes, 0, 0);

          if (triggerDate <= now) continue;

          const identifier = `med-${medication.id}-${dateStr}-${timeSlot}`;

          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              title: `💊 ${medName}`,
              body: `${medDosage}${mealTimingText ? ' - ' + mealTimingText : ''} - هل تناولت دواءك؟`,
              data: {
                type: 'medication',
                medicationId: medication.id,
                scheduledTime: timeSlot,
              },
              categoryIdentifier: MED_CATEGORY_ID,
              sound: 'default',
              ...(Platform.OS === 'android' ? { channelId: 'medication-reminders' } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });

          console.log(`[Notifications] Scheduled dated: ${medName} on ${dateStr} at ${timeSlot}`);
        }
      }
      return;
    }

    for (const timeSlot of medication.timeSlots) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.log('[Notifications] Invalid time slot:', timeSlot);
        continue;
      }

      const identifier = `med-${medication.id}-${timeSlot}`;

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `💊 ${medName}`,
          body: `${medDosage}${mealTimingText ? ' - ' + mealTimingText : ''} - هل تناولت دواءك؟`,
          data: {
            type: 'medication',
            medicationId: medication.id,
            scheduledTime: timeSlot,
          },
          categoryIdentifier: MED_CATEGORY_ID,
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId: 'medication-reminders' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      console.log(`[Notifications] Scheduled daily: ${medName} at ${timeSlot}`);
    }
  } catch (error) {
    console.log('[Notifications] Error scheduling medication reminders:', error);
  }
}

export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith(`med-${medicationId}-`)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
    console.log(`[Notifications] Cancelled reminders for medication: ${medicationId}`);
  } catch (error) {
    console.log('[Notifications] Error cancelling medication reminders:', error);
  }
}

export async function scheduleAppointmentReminder(appointment: Appointment): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await cancelAppointmentReminders(appointment.id);

    const apptDate = new Date(appointment.date);
    if (isNaN(apptDate.getTime())) {
      console.log('[Notifications] Invalid appointment date:', appointment.date);
      return;
    }

    const apptTitle = appointment.titleAr || appointment.title;
    const apptDoctor = appointment.doctorAr || appointment.doctor;

    const dayBefore = new Date(apptDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(18, 0, 0, 0);

    if (dayBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `appt-eve-${appointment.id}`,
        content: {
          title: `📅 ${apptTitle} - غداً / Tomorrow`,
          body: apptDoctor
            ? `${apptDoctor} - ${appointment.time || ''}`
            : appointment.time || '',
          data: {
            type: 'appointment',
            appointmentId: appointment.id,
          },
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId: 'appointment-reminders' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dayBefore,
        },
      });
      console.log(`[Notifications] Scheduled day-before reminder for: ${apptTitle}`);
    }

    const morningOf = new Date(apptDate);
    morningOf.setHours(8, 0, 0, 0);

    if (morningOf > new Date()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `appt-day-${appointment.id}`,
        content: {
          title: `📅 ${apptTitle} - اليوم / Today`,
          body: apptDoctor
            ? `${apptDoctor} - ${appointment.time || ''} - ${appointment.locationAr || appointment.location || ''}`
            : `${appointment.time || ''} - ${appointment.locationAr || appointment.location || ''}`,
          data: {
            type: 'appointment',
            appointmentId: appointment.id,
          },
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId: 'appointment-reminders' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: morningOf,
        },
      });
      console.log(`[Notifications] Scheduled morning-of reminder for: ${apptTitle}`);
    }

    if (appointment.time) {
      const timeParts = appointment.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeParts) {
        let hour = parseInt(timeParts[1], 10);
        const minute = parseInt(timeParts[2], 10);
        const period = timeParts[3]?.toUpperCase();

        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        const hourBefore = new Date(apptDate);
        hourBefore.setHours(hour, minute, 0, 0);
        hourBefore.setHours(hourBefore.getHours() - 1);

        if (hourBefore > new Date()) {
          await Notifications.scheduleNotificationAsync({
            identifier: `appt-hour-${appointment.id}`,
            content: {
              title: `⏰ ${apptTitle} - بعد ساعة / In 1 Hour`,
              body: apptDoctor
                ? `${apptDoctor} - ${appointment.locationAr || appointment.location || ''}`
                : appointment.locationAr || appointment.location || '',
              data: {
                type: 'appointment',
                appointmentId: appointment.id,
              },
              sound: 'default',
              ...(Platform.OS === 'android' ? { channelId: 'appointment-reminders' } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: hourBefore,
            },
          });
          console.log(`[Notifications] Scheduled 1-hour-before reminder for: ${apptTitle}`);
        }
      }
    }
  } catch (error) {
    console.log('[Notifications] Error scheduling appointment reminders:', error);
  }
}

export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const identifiers = [
      `appt-eve-${appointmentId}`,
      `appt-day-${appointmentId}`,
      `appt-hour-${appointmentId}`,
    ];
    for (const id of identifiers) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    }
    console.log(`[Notifications] Cancelled reminders for appointment: ${appointmentId}`);
  } catch (error) {
    console.log('[Notifications] Error cancelling appointment reminders:', error);
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All reminders cancelled');
  } catch (error) {
    console.log('[Notifications] Error cancelling all reminders:', error);
  }
}
