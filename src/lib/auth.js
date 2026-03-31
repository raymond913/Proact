// src/lib/auth.js
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_KEY = 'proact_session';

// ── Session storage (in-memory + SecureStore) ─────────────────────────────────
let currentSession = null;

async function persistSession(session) {
  currentSession = session;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

async function clearSession() {
  currentSession = null;
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

// ── Try to restore session from SecureStore ───────────────────────────────────
async function loadStoredSession() {
  if (currentSession) return currentSession;
  try {
    const stored = await SecureStore.getItemAsync(SESSION_KEY);
    if (stored) {
      currentSession = JSON.parse(stored);
      return currentSession;
    }
  } catch {
    // corrupt store entry — ignore
  }
  return null;
}

// ── Refresh expired access token using refresh_token ─────────────────────────
async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      }
    );
    const data = await response.json();
    if (data.access_token) {
      await persistSession(data);
      return data;
    }
  } catch {
    // network error — leave existing session in place
  }
  return null;
}

// ── Sign Up ───────────────────────────────────────────────────────────────────
async function signUp(email, password, name) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      data: { name },
    }),
  });

  const data = await response.json();
  if (data.error || data.msg) {
    throw new Error(data.error?.message || data.msg || 'Signup failed');
  }
  if (data.access_token) {
    await persistSession(data);
  }
  return data;
}

// ── Sign In ───────────────────────────────────────────────────────────────────
async function signIn(email, password) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await response.json();
  if (data.error || data.error_description) {
    throw new Error(
      data.error_description || data.error || 'Invalid email or password'
    );
  }
  if (data.access_token) {
    await persistSession(data);
  }
  return data;
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
async function signOut() {
  await clearSession();
}

// ── Get Current User ──────────────────────────────────────────────────────────
// Loads from SecureStore if needed, refreshes token if expired.
async function getCurrentUser() {
  try {
    const session = await loadStoredSession();
    if (!session?.access_token) return null;

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const data = await response.json();

    // Token expired — try to refresh
    if (response.status === 401 || data.error) {
      const refreshed = await refreshSession(session);
      if (!refreshed) {
        await clearSession();
        return null;
      }
      // Retry once with new token
      const retry = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${refreshed.access_token}`,
        },
      });
      const retryData = await retry.json();
      if (retryData.error) {
        await clearSession();
        return null;
      }
      return { ...retryData, session: refreshed };
    }

    return { ...data, session };
  } catch {
    return null;
  }
}

// ── Get Session ───────────────────────────────────────────────────────────────
async function getSession() {
  return currentSession || loadStoredSession();
}

// ── Get User ID ───────────────────────────────────────────────────────────────
async function getUserId() {
  return currentSession?.user?.id || 'user_default';
}

export { signUp, signIn, signOut, getCurrentUser, getSession, getUserId };
