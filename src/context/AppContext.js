// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveDailyLog,
  getWeeklyLogs,
  getUserStats,
  updateUserStats,
} from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';
import {
  getNotificationsEnabled,
  toggleNotifications,
} from '../lib/notifications';
import { getUserName } from '../lib/onboarding';

const WEEK_KEY = 'proact_week_start';

// ── Build this week's days ────────────────────────────────────────────────────
const getInitialWeekData = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(today.getDate() - daysFromMonday);

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    const isToday = dateString === today.toISOString().split('T')[0];
    const isFuture = date > today;

    days.push({
      id: i,
      label: dayLabels[i],
      date: dateString,
      isToday,
      isFuture,
      mealCompleted: false,
      workoutCompleted: false,
    });
  }
  return days;
};

// ── Last week's date strings (Mon–Sun before this week) ───────────────────────
const getLastWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMonday);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lastMonday);
    d.setDate(lastMonday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const formatRecapDate = (d) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const getTodayString = () => new Date().toISOString().split('T')[0];

const AppContext = createContext(null);

export function AppProvider({ children, onSignOut }) {
  const [weekDays, setWeekDays] = useState(getInitialWeekData());
  const [todayMeal, setTodayMeal] = useState({
    id: 1,
    name: 'Chicken & Rice Bowl',
    description: 'A quick and healthy meal using what you have in your fridge.',
    prepTime: 20,
    ingredients: ['Chicken', 'Rice', 'Broccoli'],
  });
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [totalMoneySaved, setTotalMoneySaved] = useState(0);
  const [totalMeals, setTotalMeals] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState('user_default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [weekRecap, setWeekRecap] = useState(null);
  const [userName, setUserName] = useState('');

  // ── Load data on startup ──────────────────────────────────────────────────
  useEffect(() => {
    loadDataFromSupabase();
    getNotificationsEnabled().then(setNotificationsEnabled);
    getUserName().then(n => { if (n) setUserName(n); });
  }, []);

  const loadDataFromSupabase = async () => {
    try {
      setIsLoading(true);

      const user = await getCurrentUser();
      const uid = user?.id || 'user_default';
      setUserId(uid);

      const weekDates = getInitialWeekData().map(d => d.date);
      const currentWeekStart = weekDates[0];

      const [logs, stats, storedWeekStart] = await Promise.all([
        getWeeklyLogs(weekDates, uid),
        getUserStats(uid),
        AsyncStorage.getItem(WEEK_KEY),
      ]);

      // ── Weekly reset recap ──────────────────────────────────────────────
      if (storedWeekStart && storedWeekStart !== currentWeekStart) {
        const lastWeekDates = getLastWeekDates();
        const lastWeekLogs = await getWeeklyLogs(lastWeekDates, uid);
        const lastWeekMeals = lastWeekLogs.filter(l => l.meal_completed).length;
        const lastWeekWorkouts = lastWeekLogs.filter(l => l.workout_completed).length;
        const lastMonday = new Date(storedWeekStart);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        setWeekRecap({
          meals: lastWeekMeals,
          workouts: lastWeekWorkouts,
          weekLabel: `${formatRecapDate(lastMonday)} – ${formatRecapDate(lastSunday)}`,
        });
      }
      await AsyncStorage.setItem(WEEK_KEY, currentWeekStart);

      // ── Apply logs ───────────────────────────────────────────────────────
      if (logs && logs.length > 0) {
        setWeekDays(prev => prev.map(day => {
          const log = logs.find(l => l.date === day.date);
          return log
            ? { ...day, mealCompleted: log.meal_completed, workoutCompleted: log.workout_completed }
            : day;
        }));
      } else {
        setWeekDays(getInitialWeekData());
      }

      // ── Apply stats ──────────────────────────────────────────────────────
      if (stats && stats.total_money_saved !== undefined) {
        setTotalMoneySaved(stats.total_money_saved || 0);
        setTotalMeals(stats.total_meals || 0);
        setTotalWorkouts(stats.total_workouts || 0);
        setBestStreak(stats.best_streak || 0);
      } else {
        setTotalMoneySaved(0);
        setTotalMeals(0);
        setTotalWorkouts(0);
        setBestStreak(0);
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      setWeekDays(getInitialWeekData());
      setTotalMoneySaved(0);
      setTotalMeals(0);
      setTotalWorkouts(0);
      setBestStreak(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Computed values ───────────────────────────────────────────────────────
  const calculateStreak = (days) => {
    let count = 0;
    const pastDays = [...days].filter(d => !d.isFuture).reverse();
    for (const day of pastDays) {
      if (day.mealCompleted || day.workoutCompleted) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  // ── Complete Meal ─────────────────────────────────────────────────────────
  const completeMeal = async () => {
    const newMoney = totalMoneySaved + 15;
    const newMeals = totalMeals + 1;

    const updatedDays = weekDays.map(day =>
      day.isToday ? { ...day, mealCompleted: true } : day
    );

    setWeekDays(updatedDays);
    setTotalMoneySaved(newMoney);
    setTotalMeals(newMeals);

    const newStreak = calculateStreak(updatedDays);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    try {
      const today = updatedDays.find(d => d.isToday);
      await saveDailyLog({
        date: getTodayString(),
        mealCompleted: true,
        workoutCompleted: today.workoutCompleted,
        mealName: todayMeal?.name || '',
        workoutName: todayWorkout?.name || '',
        moneySaved: 15,
        userId,
      });
      await updateUserStats({
        totalMoneySaved: newMoney,
        totalMeals: newMeals,
        totalWorkouts,
        bestStreak: Math.max(newStreak, bestStreak),
        userId,
      });
    } catch (error) {
      console.error('Error saving meal:', error.message);
    }
  };

  // ── Complete Workout ──────────────────────────────────────────────────────
  const completeWorkout = async (workoutName = '') => {
    const newWorkouts = totalWorkouts + 1;

    const updatedDays = weekDays.map(day =>
      day.isToday ? { ...day, workoutCompleted: true } : day
    );

    setWeekDays(updatedDays);
    setTotalWorkouts(newWorkouts);

    const newStreak = calculateStreak(updatedDays);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    try {
      const today = updatedDays.find(d => d.isToday);
      await saveDailyLog({
        date: getTodayString(),
        mealCompleted: today.mealCompleted,
        workoutCompleted: true,
        mealName: todayMeal?.name || '',
        workoutName: workoutName || todayWorkout?.name || '',
        moneySaved: today.mealCompleted ? 15 : 0,
        userId,
      });
      await updateUserStats({
        totalMoneySaved,
        totalMeals,
        totalWorkouts: newWorkouts,
        bestStreak: Math.max(newStreak, bestStreak),
        userId,
      });
    } catch (error) {
      console.error('Error saving workout:', error.message);
    }
  };

  // ── Update Today's Meal ───────────────────────────────────────────────────
  const updateTodayMeal = (meal) => {
    const todayWasCompleted = weekDays.find(d => d.isToday)?.mealCompleted || false;
    setTodayMeal(meal);
    setWeekDays(prev => prev.map(day =>
      day.isToday ? { ...day, mealCompleted: false } : day
    ));
    // Only subtract if the meal had already been marked complete
    if (todayWasCompleted) {
      setTotalMoneySaved(prev => Math.max(0, prev - 15));
      setTotalMeals(prev => Math.max(0, prev - 1));
    }
  };

  // ── Update Today's Workout ────────────────────────────────────────────────
  const updateTodayWorkout = (workout) => {
    setTodayWorkout(workout);
  };

  // ── Notifications preference ──────────────────────────────────────────────
  const setNotificationsPreference = async (enable) => {
    const result = await toggleNotifications(enable);
    setNotificationsEnabled(result);
    return result;
  };

  // ── Week recap ────────────────────────────────────────────────────────────
  const clearWeekRecap = () => setWeekRecap(null);

  const todayData = weekDays.find(d => d.isToday);
  const streak = calculateStreak(weekDays);
  const weeklyMeals = weekDays.filter(d => d.mealCompleted).length;
  const weeklyWorkouts = weekDays.filter(d => d.workoutCompleted).length;

  return (
    <AppContext.Provider value={{
      weekDays,
      todayMeal,
      todayWorkout,
      totalMoneySaved,
      totalMeals,
      totalWorkouts,
      bestStreak,
      isLoading,
      userId,
      notificationsEnabled,
      weekRecap,
      userName,
      completeMeal,
      completeWorkout,
      updateTodayMeal,
      updateTodayWorkout,
      setNotificationsPreference,
      clearWeekRecap,
      onSignOut,
      todayData,
      streak,
      weeklyMeals,
      weeklyWorkouts,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
