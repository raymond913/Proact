// src/lib/notifications.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'proact_notifications_enabled';
const MEAL_ID_KEY = 'proact_meal_notif_id';
const WORKOUT_ID_KEY = 'proact_workout_notif_id';
const TIMES_KEY = 'proact_notif_times';

const DEFAULT_TIMES = { mealHour: 12, mealMinute: 0, workoutHour: 18, workoutMinute: 0 };

// How notifications look when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Permission ────────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('proact-reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Custom times ──────────────────────────────────────────────────────────────
export async function getNotificationTimes() {
  try {
    const stored = await AsyncStorage.getItem(TIMES_KEY);
    return stored ? JSON.parse(stored) : { ...DEFAULT_TIMES };
  } catch {
    return { ...DEFAULT_TIMES };
  }
}

export async function saveNotificationTimes(mealHour, mealMinute, workoutHour, workoutMinute) {
  await AsyncStorage.setItem(TIMES_KEY, JSON.stringify({ mealHour, mealMinute, workoutHour, workoutMinute }));
}

// ── Schedule both daily reminders ─────────────────────────────────────────────
export async function scheduleDailyReminders(mealHour, mealMinute, workoutHour, workoutMinute) {
  // Resolve values — use stored times for anything not passed
  const times = await getNotificationTimes();
  mealHour    = mealHour    ?? times.mealHour;
  mealMinute  = mealMinute  ?? times.mealMinute;
  workoutHour = workoutHour ?? times.workoutHour;
  workoutMinute = workoutMinute ?? times.workoutMinute;

  await cancelDailyReminders();

  const mealId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to cook! 🍽️',
      body: "Don't forget to log your meal and save $15 today.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: mealHour,
      minute: mealMinute,
    },
  });

  const workoutId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Workout time! 💪',
      body: 'Stay active and keep your streak alive.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: workoutHour,
      minute: workoutMinute,
    },
  });

  await AsyncStorage.setItem(MEAL_ID_KEY, mealId);
  await AsyncStorage.setItem(WORKOUT_ID_KEY, workoutId);
  await AsyncStorage.setItem(STORAGE_KEY, 'true');

  return { mealId, workoutId };
}

// ── Cancel both daily reminders ───────────────────────────────────────────────
export async function cancelDailyReminders() {
  const [mealId, workoutId] = await Promise.all([
    AsyncStorage.getItem(MEAL_ID_KEY),
    AsyncStorage.getItem(WORKOUT_ID_KEY),
  ]);

  if (mealId) await Notifications.cancelScheduledNotificationAsync(mealId);
  if (workoutId) await Notifications.cancelScheduledNotificationAsync(workoutId);

  await AsyncStorage.multiRemove([MEAL_ID_KEY, WORKOUT_ID_KEY]);
  await AsyncStorage.setItem(STORAGE_KEY, 'false');
}

// ── Read persisted preference ─────────────────────────────────────────────────
export async function getNotificationsEnabled() {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  return val === 'true';
}

// ── Send an immediate test notification (fires in 5 seconds) ─────────────────
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ProAct Notifications Working! ✅',
      body: 'Your daily reminders are set up correctly.',
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}

// ── Toggle helper ─────────────────────────────────────────────────────────────
export async function toggleNotifications(enable) {
  if (enable) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await scheduleDailyReminders();
    return true;
  } else {
    await cancelDailyReminders();
    return false;
  }
}
