// src/lib/supabase.js
// Direct REST API calls to Supabase — no client library needed
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ── Save or update today's log ────────────────────────────────────────────────
export const saveDailyLog = async ({
  date, mealCompleted, workoutCompleted,
  mealName, workoutName, moneySaved, userId = 'user_default',
}) => {
  console.log('saveDailyLog called with:', {
    date, mealCompleted, workoutCompleted, mealName, workoutName
  });

  // First try to PATCH (update) existing row
  const updateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/daily_logs?user_id=eq.${userId}&date=eq.${date}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        meal_completed: mealCompleted,
        workout_completed: workoutCompleted,
        meal_name: mealName,
        workout_name: workoutName,
        money_saved: moneySaved,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  const updateText = await updateResponse.text();
  console.log('PATCH response:', updateText);
  const updateData = updateText ? JSON.parse(updateText) : [];

  // If no row was updated insert a new one
  if (!updateData || updateData.length === 0) {
    console.log('No existing row — inserting new one...');
    const insertResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_logs`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          date,
          meal_completed: mealCompleted,
          workout_completed: workoutCompleted,
          meal_name: mealName,
          workout_name: workoutName,
          money_saved: moneySaved,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    const insertText = await insertResponse.text();
    console.log('INSERT response:', insertText);
    return insertText ? JSON.parse(insertText) : null;
  }

  return updateData;
};

// ── Get all logs for the current week ────────────────────────────────────────
export const getWeeklyLogs = async (weekDates, userId = 'user_default') => {
  try {
    const datesQuery = weekDates.map(d => `"${d}"`).join(',');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_logs?user_id=eq.${userId}&date=in.(${datesQuery})&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error('Error fetching weekly logs:', error);
    return [];
  }
};

// ── Get user stats ────────────────────────────────────────────────────────────
export const getUserStats = async (userId = 'user_default') => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_stats?user_id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const text = await response.text();
    const data = text ? JSON.parse(text) : [];
    return data?.[0] || {
      total_money_saved: 0,
      total_meals: 0,
      total_workouts: 0,
      best_streak: 0,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      total_money_saved: 0,
      total_meals: 0,
      total_workouts: 0,
      best_streak: 0,
    };
  }
};

// ── Update user stats ─────────────────────────────────────────────────────────
export const updateUserStats = async ({
  totalMoneySaved, totalMeals, totalWorkouts,
  bestStreak, userId = 'user_default',
}) => {
  // Try PATCH first
  const updateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/user_stats?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        total_money_saved: totalMoneySaved,
        total_meals: totalMeals,
        total_workouts: totalWorkouts,
        best_streak: bestStreak,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  const updateText = await updateResponse.text();
  const updateData = updateText ? JSON.parse(updateText) : [];

  // If no row insert new one
  if (!updateData || updateData.length === 0) {
    const insertResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_stats`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          total_money_saved: totalMoneySaved,
          total_meals: totalMeals,
          total_workouts: totalWorkouts,
          best_streak: bestStreak,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    const insertText = await insertResponse.text();
    return insertText ? JSON.parse(insertText) : null;
  }

  return updateData;
};