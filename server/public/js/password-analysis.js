/**
 * password-analysis.js — a more realistic password strength engine.
 *
 * This intentionally goes beyond naive "character class counting" (which
 * scores "Passw0rd!" and a truly random string the same way) by additionally
 * detecting the patterns real cracking tools try first:
 *   - a list of extremely common passwords (checked instantly, worldwide)
 *   - repeated-character runs ("aaaa", "1111")
 *   - simple ascending/descending sequences ("abcd", "4321")
 *   - keyboard-adjacency walks ("qwerty", "asdfgh")
 *   - digit-only passwords
 *
 * Detected patterns reduce the *effective* entropy used for scoring and
 * crack-time estimates, on top of the theoretical entropy from character-set
 * size × length. This mirrors (at a much smaller scale) the approach used by
 * proper tools like zxcvbn, without needing a multi-megabyte dictionary.
 *
 * Exposes a single global: window.analyzePassword(password) -> result object
 */
(function () {
  // A compact list of the passwords that appear at the top of essentially
  // every "most common passwords" breach-analysis report, worldwide.
  const COMMON_PASSWORDS = new Set([
    '123456', '123456789', 'qwerty', 'password', '12345', '12345678',
    '111111', '123123', '1234567890', '1234567', 'qwerty123', '000000',
    '1q2w3e4r', 'iloveyou', 'admin', 'welcome', 'monkey', 'login',
    'abc123', 'starwars', 'dragon', 'passw0rd', 'master', 'hello',
    'freedom', 'whatever', 'qazwsx', 'trustno1', 'letmein', 'football',
    'baseball', 'superman', 'sunshine', 'princess', 'shadow', 'michael',
    'password1', 'password123', 'admin123', 'root', 'toor', 'changeme',
    '123321', '654321', '1qaz2wsx', 'zaq12wsx', 'qwertyuiop', 'asdfghjkl',
    'p@ssw0rd', 'p@ssword', 'passw0rd!', 'welcome1', 'test123', 'guest',
  ]);

  const KEYBOARD_ROWS = [
    '1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '`1234567890-=',
  ];

  function normalizedLower(str) {
    return str.toLowerCase();
  }

  /** Detect 3+ character runs that are ascending or descending in char code (e.g. "abcd", "4321"). */
  function hasSequentialRun(str, minRun = 3) {
    const s = normalizedLower(str);
    let ascRun = 1;
    let descRun = 1;
    for (let i = 1; i < s.length; i++) {
      const diff = s.charCodeAt(i) - s.charCodeAt(i - 1);
      ascRun = diff === 1 ? ascRun + 1 : 1;
      descRun = diff === -1 ? descRun + 1 : 1;
      if (ascRun >= minRun || descRun >= minRun) return true;
    }
    return false;
  }

  /** Detect 3+ repeated identical characters in a row (e.g. "aaa", "111"). */
  function hasRepeatedRun(str, minRun = 3) {
    let run = 1;
    for (let i = 1; i < str.length; i++) {
      run = str[i] === str[i - 1] ? run + 1 : 1;
      if (run >= minRun) return true;
    }
    return false;
  }

  /** Detect 3+ character runs that follow a physical keyboard row (e.g. "qwe", "asdf", reversed too). */
  function hasKeyboardWalk(str, minRun = 3) {
    const s = normalizedLower(str);
    for (const row of KEYBOARD_ROWS) {
      const rowRev = row.split('').reverse().join('');
      for (let i = 0; i <= s.length - minRun; i++) {
        const chunk = s.slice(i, i + minRun);
        if (row.includes(chunk) || rowRev.includes(chunk)) return true;
      }
    }
    return false;
  }

  function poolSizeFor(password) {
    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^a-zA-Z0-9\u0621-\u064A]/.test(password)) pool += 30;
    if (/[\u0621-\u064A]/.test(password)) pool += 36;
    return pool;
  }

  const LEET_MAP = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

  /** Normalize leet-speak substitutions and strip trailing digits/punctuation,
   *  so predictable dictionary-word variants (e.g. "P@ssw0rd!2024") are still
   *  recognized as based on a common password. Trailing "decoration" is
   *  stripped first (on the raw string) so it isn't corrupted by leet
   *  substitution before we can recognize it as a suffix. */
  function normalizeForDictionary(password) {
    const lower = normalizedLower(password);
    const leet = (s) => s.split('').map((ch) => LEET_MAP[ch] || ch).join('');

    const fullLeet = leet(lower).replace(/[^a-z0-9]/g, '');

    const withoutTrailingSymbols = lower.replace(/[^a-z0-9]+$/, '');
    const withoutTrailingDigits = withoutTrailingSymbols.replace(/[0-9]+$/, '');
    const stem = leet(withoutTrailingDigits).replace(/[^a-z]/g, '');

    return { full: fullLeet, stripped: stem };
  }

  /** How much of the string is made of a single repeated character run,
   *  used to more accurately cap entropy for strings like "aaaaaaaaaa". */
  function longestRepeatedRunLength(str) {
    let longest = 1;
    let run = 1;
    for (let i = 1; i < str.length; i++) {
      run = str[i] === str[i - 1] ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    return str.length ? longest : 0;
  }

  /**
   * Analyze a password and return a structured result:
   * {
   *   length, poolSize, entropyBits, effectiveEntropyBits, guesses,
   *   score0to4, score100,
   *   isCommon, hasRepeats, hasSequential, hasKeyboardWalk, isDigitsOnly,
   *   checks: { length12, upperLower, digits, symbols, notCommon, noRepeats },
   *   crackSeconds: { online, offlineSlow, offlineFast, cluster }
   * }
   */
  function analyzePassword(password) {
    const length = password.length;
    const poolSize = poolSizeFor(password);
    const entropyBits = length ? length * Math.log2(poolSize || 1) : 0;

    const lower = normalizedLower(password);
    const { full: normalizedFull, stripped: normalizedStripped } = normalizeForDictionary(password);
    const isCommon =
      COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(normalizedFull) || COMMON_PASSWORDS.has(normalizedStripped);
    const repeats = hasRepeatedRun(password);
    const sequential = hasSequentialRun(password);
    const keyboardWalk = hasKeyboardWalk(password);
    const digitsOnly = length > 0 && /^[0-9]+$/.test(password);
    const longestRun = longestRepeatedRunLength(password);

    // Effective entropy: theoretical entropy, penalized for predictable
    // patterns. A common password (including leet-speak/suffix variants)
    // effectively has ~0 bits (it's the very first guess any cracking tool
    // tries).
    let effectiveEntropyBits = entropyBits;
    if (isCommon) {
      effectiveEntropyBits = Math.min(effectiveEntropyBits, 4); // ~16 guesses
    } else {
      // A long run of the same character contributes almost no extra entropy
      // beyond picking that one character and a rough run-length guess.
      if (longestRun >= 3) {
        const runEntropy = Math.log2(poolSize || 1) + Math.log2(length - longestRun + 2);
        effectiveEntropyBits = Math.min(effectiveEntropyBits, runEntropy);
      }
      if (sequential) effectiveEntropyBits -= 8;
      if (keyboardWalk) effectiveEntropyBits -= 10;
      if (digitsOnly) effectiveEntropyBits = Math.min(effectiveEntropyBits, length * Math.log2(10));
    }
    effectiveEntropyBits = Math.max(0, effectiveEntropyBits);

    const guesses = effectiveEntropyBits ? Math.pow(2, effectiveEntropyBits - 1) : (length ? 1 : 0);

    // 0-4 score, mirroring the meter's five labels (Weak..Very strong).
    let score0to4;
    if (length === 0) score0to4 = 0;
    else if (isCommon || effectiveEntropyBits < 20) score0to4 = 0;
    else if (effectiveEntropyBits < 35) score0to4 = 1;
    else if (effectiveEntropyBits < 50) score0to4 = 2;
    else if (effectiveEntropyBits < 65) score0to4 = 3;
    else score0to4 = 4;

    const score100 = Math.max(0, Math.min(100, Math.round((effectiveEntropyBits / 80) * 100)));

    const checks = {
      length12: length >= 12,
      upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      digits: /[0-9]/.test(password),
      symbols: /[^a-zA-Z0-9\u0621-\u064A]/.test(password),
      notCommon: !isCommon,
      noRepeats: !repeats && !sequential && !keyboardWalk,
    };

    // Guesses-per-second for each realistic attack scenario.
    const RATES = {
      online: 10, // rate-limited login form
      offlineSlow: 1e4, // slow, salted hash (bcrypt/scrypt/argon2)
      offlineFast: 1e10, // fast hash cracked on a GPU rig
      cluster: 1e12, // large distributed/nation-state-scale compute
    };
    const crackSeconds = {};
    Object.keys(RATES).forEach((key) => {
      crackSeconds[key] = guesses / RATES[key];
    });

    return {
      length,
      poolSize,
      entropyBits,
      effectiveEntropyBits,
      guesses,
      score0to4,
      score100,
      isCommon,
      hasRepeats: repeats,
      hasSequential: sequential,
      hasKeyboardWalk: keyboardWalk,
      isDigitsOnly: digitsOnly,
      checks,
      crackSeconds,
    };
  }

  window.analyzePassword = analyzePassword;
})();
