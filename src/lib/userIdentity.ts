export interface UserProfile {
  userId: string; // e.g. "LUCAS-8492"
  userName: string; // e.g. "Lucas"
  avatarId: string; // e.g. "🚀"
}

const LOCAL_STORAGE_KEY = 'user_profile';

/**
 * Generates a short, unique Discord-style user tag based on user name
 * e.g. "LUCAS-8492" or "FACILITADOR-1024"
 */
export function generateUserId(name?: string): string {
  if (!name || !name.trim()) {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `USR-${num}`;
  }
  
  // Extract first word, uppercase, remove special chars
  const cleanFirstWord = name
    .trim()
    .split(/\s+/)[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const prefix = cleanFirstWord || 'USR';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

/**
 * Normalizes user ID string input (e.g. "lucas-8492" -> "LUCAS-8492", "#8492" -> "#8492")
 */
export function normalizeUserId(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (trimmed.startsWith('#')) {
    return trimmed;
  }
  return trimmed.toUpperCase();
}

/**
 * Retrieves the stored UserProfile from localStorage
 */
export function getStoredUserProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.userName === 'string') {
      return parsed as UserProfile;
    }
  } catch (err) {
    console.warn('Failed to parse user profile from localStorage:', err);
  }
  return null;
}

/**
 * Saves or updates UserProfile in localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save user profile to localStorage:', err);
  }
}

/**
 * Clears stored UserProfile from localStorage
 */
export function clearUserProfile(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear user profile from localStorage:', err);
  }
}
