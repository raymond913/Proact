// src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch, Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import { signOut } from '../lib/auth';
import {
  getNotificationTimes,
  saveNotificationTimes,
  scheduleDailyReminders,
  sendTestNotification,
} from '../lib/notifications';

const getWeekRangeLabel = (weekDays) => {
  if (!weekDays?.length) return '';
  const format = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return `${format(weekDays[0].date)} – ${format(weekDays[6].date)}`;
};

const formatTime = (h, m) => {
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

export default function DashboardScreen() {
  const {
    weekDays,
    totalMoneySaved,
    streak,
    weeklyMeals,
    weeklyWorkouts,
    bestStreak,
    notificationsEnabled,
    setNotificationsPreference,
    onSignOut,
  } = useAppContext();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mealHour, setMealHour] = useState(12);
  const [mealMinute, setMealMinute] = useState(0);
  const [workoutHour, setWorkoutHour] = useState(18);
  const [workoutMinute, setWorkoutMinute] = useState(0);

  useEffect(() => {
    getNotificationTimes().then(({ mealHour: mh, mealMinute: mm, workoutHour: wh, workoutMinute: wm }) => {
      setMealHour(mh);
      setMealMinute(mm ?? 0);
      setWorkoutHour(wh);
      setWorkoutMinute(wm ?? 0);
    });
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            onSignOut?.();
          },
        },
      ]
    );
  };

  const handleDayTap = (day) => {
    if (day.isFuture) {
      Alert.alert('Future day', "This day hasn't happened yet.");
      return;
    }
    const mealStatus = day.mealCompleted ? 'Done' : 'Not done';
    const workoutStatus = day.workoutCompleted ? 'Done' : 'Not done';
    Alert.alert(
      `${day.label}${day.isToday ? ' (Today)' : ''}`,
      `Meal: ${mealStatus}\nWorkout: ${workoutStatus}`,
      [{ text: 'Close' }]
    );
  };

  const handleNotificationToggle = async (value) => {
    const granted = await setNotificationsPreference(value);
    if (value && !granted) {
      Alert.alert(
        'Permission denied',
        'Enable notifications for ProAct in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSaveTimes = async () => {
    await saveNotificationTimes(mealHour, mealMinute, workoutHour, workoutMinute);
    if (notificationsEnabled) {
      await scheduleDailyReminders(mealHour, mealMinute, workoutHour, workoutMinute);
    }
    setShowTimePicker(false);
  };

  const nudgeHour = (delta, setter) => setter(h => (h + delta + 24) % 24);
  const nudgeMinute = (delta, setter) => setter(m => (m + delta + 60) % 60);

  // ── Time Picker Modal ─────────────────────────────────────────────────────
  const renderTimePicker = () => (
    <Modal
      visible={showTimePicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTimePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerModal}>
          <Text style={styles.timePickerTitle}>Reminder Times</Text>

          {[
            { label: 'MEAL', hour: mealHour, minute: mealMinute, setHour: setMealHour, setMinute: setMealMinute },
            { label: 'WORKOUT', hour: workoutHour, minute: workoutMinute, setHour: setWorkoutHour, setMinute: setWorkoutMinute },
          ].map(({ label, hour, minute, setHour, setMinute }) => (
            <View key={label} style={styles.timeRow}>
              <Text style={styles.timeRowLabel}>{label}</Text>
              <View style={styles.timeRowControls}>
                {/* Hour */}
                <View style={styles.timeUnit}>
                  <Text style={styles.timeUnitLabel}>Hour</Text>
                  <View style={styles.timeControls}>
                    <TouchableOpacity style={styles.timeBtn} onPress={() => nudgeHour(-1, setHour)} activeOpacity={0.7}>
                      <Text style={styles.timeBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>
                      {hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}
                    </Text>
                    <TouchableOpacity style={styles.timeBtn} onPress={() => nudgeHour(1, setHour)} activeOpacity={0.7}>
                      <Text style={styles.timeBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                {/* Minute */}
                <View style={styles.timeUnit}>
                  <Text style={styles.timeUnitLabel}>Min</Text>
                  <View style={styles.timeControls}>
                    <TouchableOpacity style={styles.timeBtn} onPress={() => nudgeMinute(-5, setMinute)} activeOpacity={0.7}>
                      <Text style={styles.timeBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{String(minute).padStart(2, '0')}</Text>
                    <TouchableOpacity style={styles.timeBtn} onPress={() => nudgeMinute(5, setMinute)} activeOpacity={0.7}>
                      <Text style={styles.timeBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.timePeriod}>{hour < 12 ? 'AM' : 'PM'}</Text>
              </View>
            </View>
          ))}

          <View style={styles.timePickerButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTimePicker(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTimes} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderTimePicker()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Progress</Text>
            {bestStreak > 0 && (
              <Text style={styles.headerSub}>Best streak: {bestStreak} days</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn} activeOpacity={0.7}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={[styles.statCell, styles.statCellBorderLeft]}>
            <Text style={styles.statNumber}>${totalMoneySaved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={[styles.statCell, styles.statCellBorderLeft]}>
            <Text style={styles.statNumber}>{weeklyMeals}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>
          <View style={[styles.statCell, styles.statCellBorderLeft]}>
            <Text style={styles.statNumber}>{weeklyWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
        </View>

        {/* ── Weekly progress bars ── */}
        <View style={styles.progressSection}>
          {[
            { label: 'Meals', count: weeklyMeals, color: colors.warning },
            { label: 'Workouts', count: weeklyWorkouts, color: colors.primary },
          ].map(({ label, count, color }) => (
            <View key={label} style={styles.progressRow}>
              <Text style={styles.progressLabel}>{label}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(count / 7) * 100}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.progressCount}>{count}/7</Text>
            </View>
          ))}
        </View>

        {/* ── This week ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This week</Text>
            <Text style={styles.sectionSub}>{getWeekRangeLabel(weekDays)}</Text>
          </View>

          <View style={styles.weekGrid}>
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={styles.dayCol}
                onPress={() => handleDayTap(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
                  {day.label}
                </Text>

                {/* Meal dot */}
                <View style={[
                  styles.dayDot,
                  day.isFuture
                    ? styles.dayDotFuture
                    : day.mealCompleted
                      ? styles.dayDotMeal
                      : styles.dayDotEmpty,
                ]} />

                {/* Workout dot */}
                <View style={[
                  styles.dayDot,
                  day.isFuture
                    ? styles.dayDotFuture
                    : day.workoutCompleted
                      ? styles.dayDotWorkout
                      : styles.dayDotEmpty,
                ]} />

                {day.isToday && <View style={styles.todayIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.weekLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dayDotMeal]} />
              <Text style={styles.legendText}>Meal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dayDotWorkout]} />
              <Text style={styles.legendText}>Workout</Text>
            </View>
          </View>
        </View>

        {/* ── Savings breakdown ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Meals cooked this week</Text>
            <Text style={styles.breakdownValue}>{weeklyMeals}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Average saved per meal</Text>
            <Text style={styles.breakdownValue}>$15.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.text, fontWeight: '600' }]}>Total saved</Text>
            <Text style={[styles.breakdownValue, { color: colors.success }]}>${totalMoneySaved}.00</Text>
          </View>
        </View>

        {/* ── Day by day ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Day by day</Text>

          {weekDays.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={[styles.dayRow, day.isToday && styles.dayRowToday]}
              onPress={() => handleDayTap(day)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={[styles.dayRowName, day.isToday && { color: colors.primary }]}>
                  {day.label}{day.isToday ? ' · Today' : ''}
                </Text>
                <Text style={styles.dayRowDate}>{day.date}</Text>
              </View>
              <View style={[
                styles.badge,
                day.isFuture ? styles.badgeFuture
                  : day.mealCompleted && day.workoutCompleted ? styles.badgeDone
                  : day.mealCompleted || day.workoutCompleted ? styles.badgePartial
                  : day.isToday ? styles.badgeInProgress
                  : styles.badgeMissed,
              ]}>
                <Text style={styles.badgeText}>
                  {day.isFuture ? 'Upcoming'
                    : day.mealCompleted && day.workoutCompleted ? 'Perfect'
                    : day.mealCompleted || day.workoutCompleted ? 'Partial'
                    : day.isToday ? 'In progress'
                    : 'Missed'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <Text style={styles.settingsLabel}>Daily reminders</Text>
              <Text style={styles.settingsSub}>
                {notificationsEnabled
                  ? `Meal ${formatTime(mealHour, mealMinute)} · Workout ${formatTime(workoutHour, workoutMinute)}`
                  : 'Off'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {notificationsEnabled && (
            <>
              <TouchableOpacity
                style={styles.settingsLink}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsLinkText}>Edit reminder times</Text>
                <Text style={styles.settingsChevron}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsLink}
                onPress={sendTestNotification}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsLinkText}>Send test notification (5s)</Text>
                <Text style={styles.settingsChevron}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: colors.subtext,
  },
  signOutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginTop: 6,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtext,
  },

  // ── Progress bars ──
  progressSection: {
    marginBottom: 16,
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtext,
    width: 72,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 4,
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    width: 28,
    textAlign: 'right',
  },

  // ── Stats grid ──
  statsGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
  },
  statCell: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statCellBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Sections ──
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.muted,
  },

  // ── Week grid ──
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.subtext,
    marginBottom: 2,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayDotFuture: {
    backgroundColor: colors.border,
  },
  dayDotEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayDotMeal: {
    backgroundColor: colors.warning,
  },
  dayDotWorkout: {
    backgroundColor: colors.primary,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  weekLegend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.subtext,
  },

  // ── Savings ──
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.subtext,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },

  // ── Day rows ──
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayRowToday: {},
  dayRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  dayRowDate: {
    fontSize: 12,
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDone: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
  },
  badgePartial: {
    borderColor: colors.warning,
    backgroundColor: '#FFFBEB',
  },
  badgeMissed: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  badgeInProgress: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  badgeFuture: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },

  // ── Settings ──
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  settingsLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingsSub: {
    fontSize: 12,
    color: colors.subtext,
  },
  settingsLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  settingsChevron: {
    fontSize: 20,
    color: colors.primary,
    lineHeight: 22,
  },

  // ── Time Picker Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '88%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  timeRow: {
    marginBottom: 20,
  },
  timeRowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  timeRowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeUnit: { flex: 1 },
  timeUnitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 6,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  timeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeBtnText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
    lineHeight: 22,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.subtext,
    marginTop: 20,
  },
  timePeriod: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 20,
    minWidth: 28,
    textAlign: 'center',
  },
  timePickerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtext,
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
