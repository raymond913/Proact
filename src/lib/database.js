// src/lib/database.js
// Re-exports all database functions from supabase.js
export {
  saveDailyLog,
  getWeeklyLogs,
  getUserStats,
  updateUserStats,
} from './supabase';