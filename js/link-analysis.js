/**
 * link-analysis.js — a more realistic phishing/malicious-link detection engine.
 *
 * Goes beyond naive substring matching by:
 *   - Actually parsing the URL (via the URL API) instead of regexing raw text
 *   - Detecting IP-address hosts in decimal, hex, and octal-obfuscated forms
 *   - Detecting brand typosquatting via edit-distance against well-known
 *     domains ("paypa1.com", "go0gle.com", "micros0ft-support.net", ...)
 *   - Detecting IDN/punycode homograph domains (xn--...)
 *   - Detecting the "@ trick" (https://real-site.com@evil.com/...)
 *   - Detecting known URL-shortener domains (which hide the real destination)
 *   - Flagging genuinely high-abuse TLDs rather than "not in an allow-list"
 *   - Producing a weighted 0-100 risk score and a low/medium/high verdict,
 *     the same way the password checker gives a structured result instead
 *     of just a flat list of strings.
 *
 * Exposes a single global: window.analyzeUrl(rawUrl) -> result object
 */
(function () {
  const SUSPICIOUS_TLDS = new Set([
    'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'work', 'click', 'link',
    'gdn', 'kim', 'cricket', 'science', 'party', 'review', 'faith', 'zip',
    'country', 'stream', 'download', 'racing', 'accountant', 'loan',
  ]);

  const URL_SHORTENERS = new Set([
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly',
    'adf.ly', 'shorte.st', 'cutt.ly', 'rebrand.ly', 'tiny.cc', 'rb.gy',
  ]);

  // A short list of frequently-impersonated brand domains, used only for
  // typosquat *distance* checks (not for anything else).
  const KNOWN_BRANDS = [
    'google.com', 'accounts.google.com', 'paypal.com', 'apple.com',
    'microsoft.com', 'amazon.com', 'facebook.com', 'instagram.com',
    'netflix.com', 'github.com', 'linkedin.com', 'bankofamerica.com',
    'wellsfargo.com', 'chase.com', 'outlook.com', 'live.com', 'icloud.com',
    'whatsapp.com', 'twitter.com', 'x.com', 'dropbox.com',
  ];

  const SUSPICIOUS_KEYWORDS = ['login', 'verify', 'account', 'update', 'confirm', 'secure', 'signin', 'billing', 'password', 'unlock'];

  /** Classic Levenshtein edit distance between two strings. */
  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  /** True if hostname looks like an IPv4 address written in dotted-decimal form. */
  function isDottedIPv4(host) {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) && host.split('.').every((p) => Number(p) <= 255);
  }

  /** True if hostname is a single large integer (decimal-encoded IP, e.g. http://3232235777/) or hex/octal-encoded. */
  function isObfuscatedIP(host) {
    if (/^0x[0-9a-f]+$/i.test(host)) return true; // hex, e.g. 0xC0A80001
    if (/^\d{7,}$/.test(host)) return true; // decimal, e.g. 3232235777
    if (/^0[0-7]{6,}$/.test(host)) return true; // octal-ish, e.g. 030052000001
    return false;
  }

  function countSubdomains(hostname) {
    const parts = hostname.split('.');
    // parts.length - 2 roughly = number of subdomain labels before "domain.tld"
    return Math.max(0, parts.length - 2);
  }

  function getRegistrableDomain(hostname) {
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    return parts.slice(-2).join('.');
  }

  function findTyposquatTarget(hostname) {
    const registrable = getRegistrableDomain(hostname).toLowerCase();
    let best = null;
    let bestDist = Infinity;
    for (const brand of KNOWN_BRANDS) {
      const brandRegistrable = getRegistrableDomain(brand);
      if (registrable === brandRegistrable) return null; // exact match: it IS the real domain
      const dist = levenshtein(registrable, brandRegistrable);
      if (dist < bestDist) {
        bestDist = dist;
        best = brandRegistrable;
      }
    }
    // Close enough to be a plausible typo (1-2 edits) but not identical.
    if (best && bestDist > 0 && bestDist <= 2 && registrable.length >= best.length - 2) {
      return best;
    }
    return null;
  }

  /**
   * Detect a known brand name appearing somewhere in the hostname (as a
   * subdomain label, or hyphenated into the registrable domain) of a domain
   * that is NOT actually that brand — e.g. "paypal-verify.example.com" or
   * "secure-paypal.login-portal.net". This is one of the most common real
   * phishing patterns and deserves a much stronger signal than a generic
   * keyword match.
   */
  function findBrandImpersonation(hostname) {
    const registrable = getRegistrableDomain(hostname).toLowerCase();
    for (const brand of KNOWN_BRANDS) {
      const brandRegistrable = getRegistrableDomain(brand);
      const brandName = brandRegistrable.split('.')[0]; // e.g. "paypal" from "paypal.com"
      if (brandName.length < 4) continue; // skip very short names to avoid false positives
      if (registrable === brandRegistrable) continue; // it's the real domain, not impersonation
      if (hostname.toLowerCase().includes(brandName)) {
        return brandName;
      }
    }
    return null;
  }

  /**
   * Analyze a URL string and return a structured result:
   * {
   *   valid, url, host, riskScore (0-100), riskLevel ('low'|'medium'|'high'),
   *   findings: [{ id, severity }],
   * }
   * `findings` ids are translation keys under `link.findings.*` so the
   * caller can localize messages; this module stays language-agnostic.
   */
  function analyzeUrl(rawUrl) {
    let input = (rawUrl || '').trim();
    if (!input) {
      return { valid: false, empty: true };
    }

    // Allow bare domains ("example.com") the way a user would naturally type them.
    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(input);
    const testInput = hasScheme ? input : `http://${input}`;

    let parsed;
    try {
      parsed = new URL(testInput);
    } catch (e) {
      return { valid: false, malformed: true };
    }

    const host = parsed.hostname.toLowerCase();
    const findings = [];
    let riskScore = 0;

    const add = (id, points, severity, extra) => {
      findings.push({ id, severity, extra });
      riskScore += points;
    };

    if (!hasScheme) {
      add('noScheme', 5, 'info');
    } else if (parsed.protocol === 'http:') {
      add('insecureHttp', 12, 'warn');
    }

    if (isDottedIPv4(host) || isObfuscatedIP(host)) {
      add('ipHost', 30, 'high');
    }

    if (host.startsWith('xn--') || host.includes('.xn--')) {
      add('punycode', 20, 'high');
    }

    if (parsed.username || (input.includes('@') && input.indexOf('@') < input.indexOf(host))) {
      add('atTrick', 30, 'high');
    }

    const subCount = countSubdomains(host);
    if (subCount >= 3) {
      add('manySubdomains', 15, 'warn');
    }

    const registrable = getRegistrableDomain(host);
    if (URL_SHORTENERS.has(registrable)) {
      add('shortener', 15, 'warn');
    }

    const typoTarget = findTyposquatTarget(host);
    if (typoTarget) {
      add('typosquat', 35, 'high', typoTarget);
    } else {
      // Only check brand-in-subdomain impersonation if it isn't already a
      // typosquat match, to avoid double-counting the same signal.
      const impersonated = findBrandImpersonation(host);
      if (impersonated) {
        add('brandImpersonation', 40, 'high', impersonated);
      }
    }

    const tld = host.split('.').pop();
    if (SUSPICIOUS_TLDS.has(tld)) {
      add('suspiciousTld', 15, 'warn');
    }

    const hyphenCount = (registrable.match(/-/g) || []).length;
    if (hyphenCount >= 2) {
      add('manyHyphens', 10, 'warn');
    }

    // A known brand's FULL domain appearing as a substring of a longer,
    // unrelated hostname (e.g. "paypal.com.verify-security.ru") is an even
    // more common and more dangerous phishing pattern than the brand name
    // alone, since it visually "looks like" the real domain at a glance.
    if (!typoTarget) {
      for (const brand of KNOWN_BRANDS) {
        const brandRegistrable = getRegistrableDomain(brand);
        if (host !== brandRegistrable && host.includes(brandRegistrable + '.')) {
          add('fakeSubdomainChain', 40, 'high', brandRegistrable);
          break;
        }
      }
    }

    // Query parameters that commonly carry an open-redirect target. If the
    // parameter's value is itself another absolute URL, this link could
    // silently forward the visitor somewhere else entirely.
    const REDIRECT_PARAMS = ['redirect', 'url', 'next', 'continue', 'dest', 'destination', 'return', 'returnurl', 'goto'];
    for (const [key, value] of parsed.searchParams) {
      if (REDIRECT_PARAMS.includes(key.toLowerCase()) && /^https?:\/\//i.test(value)) {
        add('openRedirect', 20, 'warn', value);
        break;
      }
    }

    // A path ending directly in an executable/installer extension means the
    // link itself triggers a file download, not a normal web page.
    const DOWNLOAD_EXTENSIONS = ['exe', 'scr', 'bat', 'cmd', 'msi', 'apk', 'jar', 'ps1'];
    const pathExtMatch = parsed.pathname.match(/\.([a-z0-9]+)$/i);
    if (pathExtMatch && DOWNLOAD_EXTENSIONS.includes(pathExtMatch[1].toLowerCase())) {
      add('directDownload', 20, 'warn', pathExtMatch[1]);
    }

    const fullPathLower = (parsed.pathname + parsed.search).toLowerCase();
    const matchedKeywords = SUSPICIOUS_KEYWORDS.filter((w) => fullPathLower.includes(w) || host.includes(w));
    if (matchedKeywords.length > 0) {
      add('suspiciousKeyword', 8 * Math.min(matchedKeywords.length, 3), 'info', matchedKeywords.slice(0, 3).join(', '));
    }

    if (parsed.port && !['80', '443', ''].includes(parsed.port)) {
      add('unusualPort', 10, 'warn', parsed.port);
    }

    if (input.length > 100) {
      add('veryLong', 8, 'info');
    }

    riskScore = Math.max(0, Math.min(100, riskScore));
    let riskLevel = 'low';
    if (riskScore >= 45) riskLevel = 'high';
    else if (riskScore >= 20) riskLevel = 'medium';

    const safetyScore = Math.max(0, 100 - riskScore);
    const verdict = riskScore >= 45 ? 'unsafe' : riskScore >= 20 ? 'suspicious' : 'safe';

    return {
      valid: true,
      url: parsed.href,
      host,
      registrableDomain: registrable,
      riskScore,
      riskLevel,
      safetyScore,
      verdict,
      findings,
    };
  }

  window.analyzeUrl = analyzeUrl;
})();
