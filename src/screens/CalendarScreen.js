// src/screens/CalendarScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, Animated, TouchableOpacity, Modal, FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Calendar } from 'react-native-calendars';
import colors from '../theme/colors';
import MealCard from '../components/MealCard';
import WorkoutCard from '../components/WorkoutCard';
import workoutsData from '../data/workouts.json';
import { useAppContext } from '../context/AppContext';

const CATEGORIES = ['All', 'Cardio', 'Strength', 'Core', 'Flexibility', 'Full Body'];

const getRandomWorkout = () => {
  const list = workoutsData.workouts;
  return list[Math.floor(Math.random() * list.length)];
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const getTodayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const getGreeting = (name) => {
  const hour = new Date().getHours();
  const suffix = name ? `, ${name}` : '';
  if (hour < 12) return `Good morning${suffix}`;
  if (hour < 17) return `Good afternoon${suffix}`;
  return `Good evening${suffix}`;
};

const getCategoryEmoji = (category) => {
  const map = { Cardio: '🏃', Strength: '🏋️', Core: '⚡', Flexibility: '🧘', 'Full Body': '💥' };
  return map[category] || '💪';
};

export default function CalendarScreen() {
  const {
    todayMeal, completeMeal, completeWorkout,
    updateTodayWorkout, todayData, streak,
    weekRecap, clearWeekRecap, userName,
  } = useAppContext();

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [workout, setWorkout] = useState(getRandomWorkout());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerCategory, setPickerCategory] = useState('All');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    updateTodayWorkout(workout);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Week recap alert
  useEffect(() => {
    if (!weekRecap) return;
    const { meals, workouts: wo, weekLabel } = weekRecap;
    Alert.alert(
      'Last Week',
      `${weekLabel}\n\nMeals: ${meals}/7\nWorkouts: ${wo}/7\n\n${meals === 7 && wo === 7 ? 'Perfect week!' : 'Keep it up this week!'}`,
      [{ text: 'Got it', onPress: clearWeekRecap }]
    );
  }, [weekRecap]);

  const mealCompleted    = todayData?.mealCompleted    || false;
  const workoutCompleted = todayData?.workoutCompleted || false;
  const bothCompleted    = mealCompleted && workoutCompleted;
  const completedCount   = (mealCompleted ? 1 : 0) + (workoutCompleted ? 1 : 0);

  const handleMealComplete = () => {
    if (mealCompleted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeMeal();
  };

  const handleMealReroll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Change your meal', 'Go to the Fridge tab to pick a new recipe.', [{ text: 'OK' }]);
  };

  const handleWorkoutComplete = () => {
    if (workoutCompleted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeWorkout(workout.name);
  };

  const handleWorkoutReroll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerCategory('All');
    setShowPicker(true);
  };

  const handlePickWorkout = (picked) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWorkout(picked);
    updateTodayWorkout(picked);
    setShowPicker(false);
  };

  const handlePickRandom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const w = getRandomWorkout();
    setWorkout(w);
    updateTodayWorkout(w);
    setShowPicker(false);
  };

  const filteredWorkouts = pickerCategory === 'All'
    ? workoutsData.workouts
    : workoutsData.workouts.filter(w => w.category === pickerCategory);

  // ── Workout Picker Modal ──────────────────────────────────────────────────
  const renderPickerModal = () => (
    <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerSheet}>

          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Choose a Workout</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)} activeOpacity={0.7}>
              <Text style={styles.pickerClose}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Random */}
          <TouchableOpacity style={styles.randomBtn} onPress={handlePickRandom} activeOpacity={0.8}>
            <Text style={styles.randomBtnText}>Pick Random</Text>
          </TouchableOpacity>

          {/* Category filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, pickerCategory === cat && styles.catChipActive]}
                onPress={() => setPickerCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catChipText, pickerCategory === cat && styles.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Workout list */}
          <FlatList
            data={filteredWorkouts}
            keyExtractor={item => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.workoutList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.workoutRow, workout.id === item.id && styles.workoutRowActive]}
                onPress={() => handlePickWorkout(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.workoutRowEmoji}>{getCategoryEmoji(item.category)}</Text>
                <View style={styles.workoutRowInfo}>
                  <Text style={styles.workoutRowName}>{item.name}</Text>
                  <Text style={styles.workoutRowMeta}>{item.category} · {item.duration} min</Text>
                </View>
                {workout.id === item.id && <Text style={styles.workoutRowCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderPickerModal()}

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting(userName)}</Text>
            <Text style={styles.dateLabel}>{getTodayLabel()}</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>{streak} day streak</Text>
            </View>
          )}
        </View>

        {/* ── Perfect day banner ── */}
        {bothCompleted && (
          <View style={styles.perfectBanner}>
            <Text style={styles.perfectText}>Perfect day — both done!</Text>
          </View>
        )}

        {/* ── Calendar ── */}
        <View style={styles.calendarWrap}>
          <Calendar
            current={getTodayString()}
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: colors.primary },
              [getTodayString()]: { marked: true, dotColor: colors.primary },
            }}
            theme={{
              backgroundColor: '#fff',
              calendarBackground: '#fff',
              textSectionTitleColor: colors.muted,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#fff',
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.border,
              arrowColor: colors.text,
              monthTextColor: colors.text,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 15,
            }}
          />
        </View>

        {/* ── Plan section header ── */}
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planTitle}>
              {selectedDate === getTodayString() ? "Today's plan" : selectedDate}
            </Text>
            <Text style={styles.planSub}>
              {bothCompleted ? 'All done!' : `${completedCount} of 2 completed`}
            </Text>
          </View>
          <View style={[styles.progressRing, bothCompleted && styles.progressRingDone]}>
            <Text style={styles.progressRingText}>{completedCount}/2</Text>
          </View>
        </View>

        {/* ── Meal ── */}
        {mealCompleted ? (
          <View style={styles.completedRow}>
            <Text style={styles.completedLabel}>Meal done</Text>
            <Text style={styles.completedSub}>+$15 saved</Text>
          </View>
        ) : (
          <MealCard meal={todayMeal} onComplete={handleMealComplete} onReroll={handleMealReroll} />
        )}

        {/* ── Workout ── */}
        {workoutCompleted ? (
          <View style={styles.completedRow}>
            <Text style={styles.completedLabel}>Workout done</Text>
            <Text style={styles.completedSub}>{workout.name}</Text>
          </View>
        ) : (
          <WorkoutCard workout={workout} onComplete={handleWorkoutComplete} onReroll={handleWorkoutReroll} />
        )}

        <View style={{ height: 32 }} />
      </Animated.ScrollView>
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
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.subtext,
    fontWeight: '400',
  },
  streakBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
    marginTop: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtext,
  },

  // ── Perfect banner ──
  perfectBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  perfectText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },

  // ── Calendar ──
  calendarWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 24,
  },

  // ── Plan header ──
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  planSub: {
    fontSize: 13,
    color: colors.subtext,
  },
  progressRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingDone: {
    borderColor: colors.success,
  },
  progressRingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  // ── Completed rows ──
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  completedLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success,
  },
  completedSub: {
    fontSize: 13,
    color: colors.subtext,
  },

  // ── Workout picker modal ──
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  pickerClose: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  randomBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  randomBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  catScroll: { marginBottom: 12 },
  catScrollContent: { gap: 8, paddingRight: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtext,
  },
  catChipTextActive: { color: '#FFFFFF' },
  workoutList: { paddingBottom: 48, gap: 2 },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  workoutRowActive: { },
  workoutRowEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  workoutRowInfo: { flex: 1 },
  workoutRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  workoutRowMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  workoutRowCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
});
