// src/components/WorkoutCard.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import colors from '../theme/colors';

const CATEGORY_COLORS = {
  Cardio:      '#EEF2FF',
  Strength:    '#F0FDF4',
  Core:        '#FFF7ED',
  Flexibility: '#F5F3FF',
  'Full Body': '#FFF1F2',
};

const CATEGORY_TEXT = {
  Cardio:      colors.primary,
  Strength:    '#059669',
  Core:        '#D97706',
  Flexibility: '#7C3AED',
  'Full Body': '#E11D48',
};

export default function WorkoutCard({ workout, onComplete, onReroll }) {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [workout]);

  const catBg   = CATEGORY_COLORS[workout.category] || '#F3F4F6';
  const catText = CATEGORY_TEXT[workout.category]   || colors.subtext;

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>

      {/* Meta row */}
      <View style={styles.meta}>
        <Text style={styles.metaLabel}>WORKOUT</Text>
        <Text style={styles.metaTime}>{workout.duration} min</Text>
      </View>

      {/* Name */}
      <Text style={styles.name}>{workout.name}</Text>

      {/* Category + difficulty chips */}
      <View style={styles.tagsRow}>
        <View style={[styles.tag, { backgroundColor: catBg }]}>
          <Text style={[styles.tagText, { color: catText }]}>{workout.category}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{workout.difficulty}</Text>
        </View>
      </View>

      {/* Exercises toggle */}
      <TouchableOpacity
        style={styles.exercisesToggle}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.exercisesToggleText}>
          {expanded ? 'Hide exercises' : 'Show exercises'}
        </Text>
        <Text style={styles.exerciseCount}>{workout.exercises.length} exercises  {expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.exercisesList}>
          {workout.exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseRow}>
              <Text style={styles.exerciseNum}>{index + 1}</Text>
              <Text style={styles.exerciseText}>{exercise}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onReroll} activeOpacity={0.7}>
          <Text style={styles.secondaryBtnText}>Choose Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onComplete} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Mark Complete</Text>
        </TouchableOpacity>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
  },
  metaTime: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtext,
  },
  exercisesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  exercisesToggleText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  exerciseCount: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  exercisesList: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  exerciseNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    width: 18,
    marginTop: 1,
  },
  exerciseText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtext,
  },
  primaryBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
