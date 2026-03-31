// src/screens/OnboardingScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Switch,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '../theme/colors';
import { setOnboardingComplete, setUserName } from '../lib/onboarding';
import {
  requestNotificationPermission,
  scheduleDailyReminders,
  saveNotificationTimes,
} from '../lib/notifications';

const STEPS = 4;

function ProgressDots({ step, total }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen({ onComplete, existingName }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(existingName || '');
  const [notifEnabled, setNotifEnabled] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Welcome screen entrance animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSlide   = useRef(new Animated.Value(16)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(logoSlide, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
      Animated.timing(bodyOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateToStep = (nextStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setStep(nextStep);
  };

  const handleNext = () => {
    if (step < STEPS - 1) animateToStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) animateToStep(step - 1);
  };

  const handleNotifToggle = async (value) => {
    if (value) {
      const granted = await requestNotificationPermission();
      setNotifEnabled(granted);
    } else {
      setNotifEnabled(false);
    }
  };

  const handleFinish = async () => {
    if (name.trim()) await setUserName(name);
    if (notifEnabled) {
      await saveNotificationTimes(12, 0, 18, 0);
      await scheduleDailyReminders(12, 0, 18, 0);
    }
    await setOnboardingComplete();
    onComplete(name.trim());
  };

  // ── Step 0: Welcome ──────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <View style={styles.welcomeContainer}>
        <StatusBar style="light" />

        <View style={styles.welcomeContent}>
          <Animated.View style={{ opacity: logoOpacity, transform: [{ translateY: logoSlide }] }}>
            <Text style={styles.welcomeLogo}>ProAct</Text>
            <Text style={styles.welcomeTagline}>Your daily health companion</Text>
          </Animated.View>

          <Animated.View style={[styles.welcomeFeatures, { opacity: bodyOpacity }]}>
            {[
              { label: 'Cook at home, save money' },
              { label: 'Build a consistent workout habit' },
              { label: 'Track your streak day by day' },
            ].map(({ label }) => (
              <View key={label} style={styles.welcomeFeatureRow}>
                <View style={styles.welcomeFeatureDot} />
                <Text style={styles.welcomeFeatureText}>{label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: btnOpacity }}>
          <TouchableOpacity style={styles.welcomeBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.welcomeBtnText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Steps 1–3 ────────────────────────────────────────────────────────────
  const stepTitles = [null, "What's your name?", 'Stay on track', "You're all set"];
  const stepSubs   = [null,
    "We'll use this to personalise your experience.",
    'Get daily reminders to complete your meals and workouts.',
    null,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <ProgressDots step={step} total={STEPS - 1} />
      </View>

      <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepTitle}>{stepTitles[step]}</Text>
          {stepSubs[step] && (
            <Text style={styles.stepSub}>{stepSubs[step]}</Text>
          )}

          {/* ── Step 1: Name ── */}
          {step === 1 && (
            <View style={styles.nameSection}>
              <TextInput
                style={styles.nameInput}
                placeholder="Your first name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleNext}
                maxLength={30}
              />
              <Text style={styles.hint}>This is how ProAct will greet you each day.</Text>
            </View>
          )}

          {/* ── Step 2: Notifications ── */}
          {step === 2 && (
            <View style={styles.notifSection}>
              <View style={styles.notifCard}>
                <View style={styles.notifLeft}>
                  <Text style={styles.notifLabel}>Daily reminders</Text>
                  <Text style={styles.notifSub}>Meal at 12:00 PM · Workout at 6:00 PM</Text>
                </View>
                <Switch
                  value={notifEnabled}
                  onValueChange={handleNotifToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Text style={styles.hint}>You can change reminder times anytime in the Progress tab.</Text>

              {[
                { label: 'Meal reminder', time: '12:00 PM' },
                { label: 'Workout reminder', time: '6:00 PM' },
              ].map(({ label, time }) => (
                <View key={label} style={[styles.previewRow, !notifEnabled && { opacity: 0.35 }]}>
                  <View>
                    <Text style={styles.previewLabel}>{label}</Text>
                    <Text style={styles.previewTime}>{time}</Text>
                  </View>
                  <Text style={styles.previewArrow}>›</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <View style={styles.doneSection}>
              <Text style={styles.doneGreeting}>
                {name.trim() ? `Welcome, ${name.trim()}` : 'Welcome to ProAct'}
              </Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryHeading}>YOUR SETUP</Text>

                {[
                  { label: 'Name', value: name.trim() || 'Not set' },
                  { label: 'Reminders', value: notifEnabled ? 'Meal 12:00 PM · Workout 6:00 PM' : 'Off' },
                  { label: 'Savings goal', value: '$15 per meal cooked' },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        {step < STEPS - 1 ? (
          <TouchableOpacity
            style={[styles.primaryBtn, step === 1 && !name.trim() && styles.primaryBtnDisabled]}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={step === 1 && !name.trim()}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Start ProAct</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── Welcome ──
  welcomeContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  welcomeContent: { flex: 1, justifyContent: 'center' },
  welcomeLogo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  welcomeTagline: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 48,
  },
  welcomeFeatures: { gap: 18 },
  welcomeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  welcomeFeatureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  welcomeFeatureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  welcomeBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  welcomeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.2,
  },

  // ── Steps container ──
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 24,
    top: 58,
  },
  backBtnText: {
    fontSize: 15,
    color: colors.subtext,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  stepContent: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 15,
    color: colors.subtext,
    lineHeight: 22,
    marginBottom: 32,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
  },

  // ── Step 1: Name ──
  nameSection: { gap: 14 },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },

  // ── Step 2: Notifications ──
  notifSection: { gap: 14 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  notifLeft: { flex: 1, marginRight: 12 },
  notifLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  notifSub: {
    fontSize: 12,
    color: colors.subtext,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  previewTime: {
    fontSize: 12,
    color: colors.subtext,
  },
  previewArrow: {
    fontSize: 20,
    color: colors.muted,
    lineHeight: 22,
  },

  // ── Step 3: Done ──
  doneSection: { gap: 24 },
  doneGreeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 20,
    gap: 14,
  },
  summaryHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.subtext,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  // ── Shared footer ──
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: colors.border,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
