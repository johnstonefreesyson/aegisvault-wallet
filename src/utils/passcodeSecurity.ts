/**
 * Passcode security & strength evaluation utility.
 * Enforces strong PIN / passphrase standards to protect local encrypted vaults.
 */

export interface PasscodeStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0 = very weak, 4 = very strong
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  feedback: string[];
  isValid: boolean;
}

const COMMON_WEAK_PASSWORDS = new Set([
  '123456',
  '12345678',
  '123456789',
  '000000',
  '111111',
  '222222',
  '654321',
  'password',
  'passcode',
  'qwerty',
  'wallet',
  'crypto',
  'ethereum',
  'bitcoin',
  'aegisvault',
  'trustwallet',
  'admin123',
]);

/**
 * Checks if a string contains sequential digits (e.g. 1234, 4321)
 */
function hasSequentialPattern(str: string): boolean {
  if (str.length < 4) return false;
  for (let i = 0; i <= str.length - 4; i++) {
    const d0 = str.charCodeAt(i);
    const d1 = str.charCodeAt(i + 1);
    const d2 = str.charCodeAt(i + 2);
    const d3 = str.charCodeAt(i + 3);
    if (d1 === d0 + 1 && d2 === d1 + 1 && d3 === d2 + 1) return true; // ascending
    if (d1 === d0 - 1 && d2 === d1 - 1 && d3 === d2 - 1) return true; // descending
  }
  return false;
}

/**
 * Checks if a string consists of a single repeated character
 */
function hasRepeatedChars(str: string): boolean {
  if (str.length < 4) return false;
  return /^(.)\1+$/.test(str);
}

export function evaluatePasscode(passcode: string): PasscodeStrength {
  const clean = passcode.trim();
  const feedback: string[] = [];

  if (!clean) {
    return {
      score: 0,
      label: 'Very Weak',
      color: '#ef4444',
      feedback: ['Passcode cannot be empty'],
      isValid: false,
    };
  }

  // Check blacklist
  if (COMMON_WEAK_PASSWORDS.has(clean.toLowerCase())) {
    return {
      score: 0,
      label: 'Very Weak',
      color: '#ef4444',
      feedback: ['Passcode is in the list of commonly used weak passwords'],
      isValid: false,
    };
  }

  if (hasRepeatedChars(clean)) {
    return {
      score: 0,
      label: 'Very Weak',
      color: '#ef4444',
      feedback: ['Do not use repeated single characters (e.g. 000000)'],
      isValid: false,
    };
  }

  if (hasSequentialPattern(clean)) {
    feedback.push('Avoid sequential sequences (e.g. 1234 or 4321)');
  }

  // Base length requirements
  if (clean.length < 8) {
    feedback.push(`Minimum 8 characters recommended (currently ${clean.length})`);
  }

  const hasLower = /[a-z]/.test(clean);
  const hasUpper = /[A-Z]/.test(clean);
  const hasDigit = /[0-9]/.test(clean);
  const hasSpecial = /[^A-Za-z0-9]/.test(clean);

  let scoreVal = 0;
  if (clean.length >= 8) scoreVal++;
  if (clean.length >= 12) scoreVal++;
  if (hasLower && hasUpper) scoreVal++;
  if (hasDigit) scoreVal++;
  if (hasSpecial) scoreVal++;

  // Penalty for sequential
  if (hasSequentialPattern(clean) && scoreVal > 1) {
    scoreVal--;
  }

  // Clamp to 0-4
  const finalScore = Math.min(4, Math.max(0, scoreVal)) as 0 | 1 | 2 | 3 | 4;

  const labels: Record<number, { label: PasscodeStrength['label']; color: string }> = {
    0: { label: 'Very Weak', color: '#ef4444' },
    1: { label: 'Weak', color: '#f97316' },
    2: { label: 'Fair', color: '#f59e0b' },
    3: { label: 'Good', color: '#10b981' },
    4: { label: 'Strong', color: '#059669' },
  };

  // Valid if minimum length >= 8 and not in blacklist, or >= 6 digits with fair complexity
  const isValid = clean.length >= 8 && finalScore >= 2 && !COMMON_WEAK_PASSWORDS.has(clean.toLowerCase());

  return {
    score: finalScore,
    label: labels[finalScore].label,
    color: labels[finalScore].color,
    feedback,
    isValid,
  };
}
