// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '../theme/colors';
import { useAppContext } from '../context/AppContext';
import { setUserName } from '../lib/onboarding';
import { getHistoryLogs } from '../lib/supabase';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const getStartDate = (daysBack) => {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
};

export default function ProfileScreen() {
  const {
    userName, totalMeals, totalWorkouts,
    totalMoneySaved, bestStreak, streak, userId,
  } = useAppContext();

  const [name, setName] = useState(userName || '');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setName(userName || '');
  }, [userName]);

  useEffect(() => {
    if (!userId) return;
    getHistoryLogs(userId, getStartDate(30)).then(logs => {
      setHistory(logs);
      setLoadingHistory(false);
    });
  }, [userId]);

  const handleEditName = () => {
    setDraftName(name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    await setUserName(trimmed);
    setName(trimmed);
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setDraftName('');
  };

  const getBadge = (log) => {
    if (log.meal_completed && log.workout_completed) return { label: 'Perfect', style: styles.badgeDone };
    if (log.meal_completed || log.workout_completed) return { label: 'Partial', style: styles.badgePartial };
    return { label: 'Missed', style: styles.badgeMissed };
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* ── Name card ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NAME</Text>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={draftName}
                onChangeText={setDraftName}
                autoFocus
                autoCapitalize="words"
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelBtn} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={handleEditName} activeOpacity={0.7}>
              <Text style={styles.nameText}>{name || 'Set your name'}</Text>
              <Text style={styles.nameEdit}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── All-time stats ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL TIME</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statNumber}>{totalMeals}</Text>
              <Text style={styles.statLabel}>Meals</Text>
            </View>
            <View style={[styles.statCell, styles.statBorderLeft]}>
              <Text style={styles.statNumber}>{totalWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={[styles.statCell, styles.statBorderLeft]}>
              <Text style={styles.statNumber}>${totalMoneySaved}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={[styles.statCell, styles.statBorderLeft]}>
              <Text style={styles.statNumber}>{bestStreak}</Text>
              <Text style={styles.statLabel}>Best streak</Text>
            </View>
          </View>
        </View>

        {/* ── Current streak ── */}
        {streak > 0 && (
          <View style={styles.streakBanner}>
            <View>
              <Text style={styles.streakTitle}>Current streak</Text>
              <Text style={styles.streakSub}>Keep it going every day</Text>
            </View>
            <Text style={styles.streakCount}>{streak} days</Text>
          </View>
        )}

        {/* ── Activity history ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>LAST 30 DAYS</Text>
            {!loadingHistory && (
              <Text style={styles.sectionCount}>
                {history.filter(l => l.meal_completed && l.workout_completed).length} perfect days
              </Text>
            )}
          </View>

          {loadingHistory ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>No activity recorded yet. Start completing meals and workouts!</Text>
          ) : (
            history.map((log, i) => {
              const badge = getBadge(log);
              return (
                <View key={log.date} style={[styles.historyRow, i < history.length - 1 && styles.historyRowBorder]}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatDate(log.date)}</Text>
                    <Text style={styles.historyDetails}>
                      {[
                        log.meal_name && `Meal: ${log.meal_name}`,
                        log.workout_name && `Workout: ${log.workout_name}`,
                      ].filter(Boolean).join(' · ') || 'No details'}
                    </Text>
                    {log.money_saved > 0 && (
                      <Text style={styles.historySaved}>+${log.money_saved} saved</Text>
                    )}
                  </View>
                  <View style={[styles.badge, badge.style]}>
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },

  header: { marginBottom: 24 },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },

  // ── Sections ──
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: '500',
  },

  // ── Name ──
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  nameEdit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtext,
  },

  // ── Stats grid ──
  statsGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Streak banner ──
  streakBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#EEF2FF',
  },
  streakTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  streakSub: {
    fontSize: 12,
    color: colors.subtext,
  },
  streakCount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },

  // ── History ──
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLeft: { flex: 1, marginRight: 12 },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  historyDetails: {
    fontSize: 12,
    color: colors.subtext,
    lineHeight: 17,
  },
  historySaved: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDone: { borderColor: colors.success, backgroundColor: '#F0FDF4' },
  badgePartial: { borderColor: colors.warning, backgroundColor: '#FFFBEB' },
  badgeMissed: { borderColor: colors.border, backgroundColor: colors.surface },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 21,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
