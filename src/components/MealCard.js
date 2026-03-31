// src/components/MealCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function MealCard({ meal, onComplete, onReroll }) {
  return (
    <View style={styles.card}>

      {/* Meta row */}
      <View style={styles.meta}>
        <Text style={styles.metaLabel}>MEAL</Text>
        <Text style={styles.metaTime}>{meal.prepTime} min</Text>
      </View>

      {/* Name & description */}
      <Text style={styles.name}>{meal.name}</Text>
      <Text style={styles.description}>{meal.description}</Text>

      {/* Ingredients */}
      <View style={styles.ingredientsRow}>
        {meal.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.chip}>
            <Text style={styles.chipText}>{ingredient}</Text>
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onReroll} activeOpacity={0.7}>
          <Text style={styles.secondaryBtnText}>Browse Fridge</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onComplete} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Mark Complete</Text>
        </TouchableOpacity>
      </View>

    </View>
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
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: colors.subtext,
    lineHeight: 21,
    marginBottom: 14,
  },
  ingredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: '500',
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
