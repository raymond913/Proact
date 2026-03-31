// src/lib/onboarding.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'proact_onboarding_done';
const NAME_KEY = 'proact_user_name';

export async function getOnboardingComplete() {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function setOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function getUserName() {
  return await AsyncStorage.getItem(NAME_KEY);
}

export async function setUserName(name) {
  await AsyncStorage.setItem(NAME_KEY, name.trim());
}
