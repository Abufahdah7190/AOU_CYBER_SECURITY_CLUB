'use strict';

/**
 * Escape HTML special characters. Used any time text that could originate
 * from user-controlled input (a scanned URL, a scanned file's name, etc.)
 * is inserted into innerHTML, so it can never be interpreted as markup or
 * script (stored/DOM-based XSS prevention). Plain data displayed via
 * .textContent doesn't need this - only string concatenation into HTML.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Cryptographically secure random integer in [0, max). Uses the Web Crypto
 * API instead of Math.random() (which is not a cryptographically secure PRNG
 * and should never be used to generate actual secrets like passwords).
 * Falls back to Math.random() only if crypto.getRandomValues is unavailable
 * (extremely old browsers), so the feature still works everywhere.
 */
function secureRandomInt(max) {
  if (window.crypto && window.crypto.getRandomValues) {
    const range = Math.floor(0xffffffff / max) * max;
    const buf = new Uint32Array(1);
    let value;
    do {
      window.crypto.getRandomValues(buf);
      value = buf[0];
    } while (value >= range); // reject-sample to avoid modulo bias
    return value % max;
  }
  return Math.floor(Math.random() * max);
}

// --- Contact Form ---
function initSuggestionForm() {
  const form = document.getElementById('suggestion-form');
  if (!form) return;

  const status = document.getElementById('suggestion-status');
  const submitButton = document.getElementById('suggestion-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.supabaseClient) {
      status.textContent = 'تعذر الاتصال بقاعدة البيانات. تحقق من إعدادات Supabase.';
      status.style.color = 'var(--bad)';
      return;
    }

    const payload = {
      name: document.getElementById('suggestion-name').value.trim(),
      email: document.getElementById('suggestion-email').value.trim(),
      message: document.getElementById('suggestion-message').value.trim()
    };

    if (!payload.name || !payload.email || !payload.message) {
      status.textContent = 'يرجى تعبئة جميع الحقول المطلوبة.';
      status.style.color = 'var(--bad)';
      return;
    }

    try {
      submitButton.disabled = true;
      const original = submitButton.textContent;
      submitButton.textContent = 'جارٍ الإرسال...';
      status.textContent = '';

      const { error } = await window.supabaseClient.from('suggestions').insert(payload);
      if (error) throw error;

      status.textContent = 'تم إرسال اقتراحك بنجاح. شكرًا لمساهمتك!';
      status.style.color = 'var(--good)';
      form.reset();
      submitButton.textContent = original;
    } catch (error) {
      console.error('Supabase suggestions error:', error);
      status.textContent = 'حدث خطأ أثناء الإرسال. تأكد من إعدادات الجدول وRLS ثم حاول مرة أخرى.';
      status.style.color = 'var(--bad)';
      submitButton.textContent = 'إرسال';
    } finally {
      submitButton.disabled = false;
    }
  });
}

function initJoinForm() {
  const openButton = document.getElementById('open-join-form');
  const closeButton = document.getElementById('close-join-form');
  const section = document.getElementById('join-form-section');
  const form = document.getElementById('join-form');
  if (!form || !section) return;

  const status = document.getElementById('join-status');
  const submitButton = document.getElementById('join-submit');

  openButton?.addEventListener('click', () => {
    section.hidden = false;
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('join-name')?.focus();
  });

  closeButton?.addEventListener('click', () => {
    section.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.supabaseClient) {
      status.textContent = 'تعذر الاتصال بقاعدة البيانات. تحقق من إعدادات Supabase.';
      status.style.color = 'var(--bad)';
      return;
    }

    const payload = {
      name: document.getElementById('join-name').value.trim(),
      email: document.getElementById('join-email').value.trim(),
      phone: document.getElementById('join-phone').value.trim() || null,
      major: document.getElementById('join-major').value.trim(),
      reason_to_join: document.getElementById('join-message').value.trim() || null
    };

    if (!payload.name || !payload.email || !payload.major) {
      status.textContent = 'يرجى تعبئة الحقول المطلوبة.';
      status.style.color = 'var(--bad)';
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.textContent = 'جارٍ إرسال الطلب...';
      status.textContent = '';

      const { error } = await window.supabaseClient.from('join_applications').insert(payload);
      if (error) throw error;

      status.textContent = 'تم إرسال طلب الانضمام بنجاح!';
      status.style.color = 'var(--good)';
      form.reset();
    } catch (error) {
      console.error('Supabase join applications error:', error);
      status.textContent = 'حدث خطأ أثناء إرسال الطلب. تأكد من إعدادات الجدول وRLS ثم حاول مرة أخرى.';
      status.style.color = 'var(--bad)';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'إرسال طلب الانضمام';
    }
  });
}

function initSuggestionButton() {
  const button = document.getElementById('open-suggestion-form');
  const form = document.getElementById('suggestion-form');
  if (!button || !form) return;
  button.addEventListener('click', () => {
    const contact = document.getElementById('tab-contact');
    if (contact) {
      contact.style.display = '';
      contact.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.getElementById('suggestion-name')?.focus();
  });
}


// --- Tab Navigation ---
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      const targetPanel = document.getElementById(`tab-${targetTab}`);

      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      panels.forEach((p) => (p.style.display = 'none'));
      if (targetPanel) {
        targetPanel.style.display = 'block';
      }

      document.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: targetTab } }));
    });
  });
}

// --- Theme Toggle ---
function initThemeToggle() {
  const modeToggle = document.getElementById('modeToggle');
  if (!modeToggle) return;

  const savedTheme = localStorage.getItem('club-theme');
  if (savedTheme) {
    document.documentElement.classList.toggle('theme-light', savedTheme === 'light');
  }

  modeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('theme-light');
    const isLight = document.documentElement.classList.contains('theme-light');
    localStorage.setItem('club-theme', isLight ? 'light' : 'dark');
  });
}

// --- Organizational Structure Toggle ---
function initOrgToggle() {
  const levels = [
    { btnId: 'toggle-leader', targetId: 'level-leader' },
    { btnId: 'toggle-vice', targetId: 'level-vice' },
    { btnId: 'toggle-depts', targetId: 'level-depts' },
  ];

  levels.forEach(({ btnId, targetId }) => {
    const btn = document.getElementById(btnId);
    const target = document.getElementById(targetId);
    if (!btn || !target) return;

    btn.addEventListener('click', () => {
      const isHidden = target.classList.contains('hidden');
      if (isHidden) {
        target.classList.remove('hidden');
        btn.classList.add('active');
      } else {
        const closeRecursively = (lvlId, bId) => {
          const t = document.getElementById(lvlId);
          const b = document.getElementById(bId);
          if (t) t.classList.add('hidden');
          if (b) {
            b.classList.remove('active');
          }
          if (lvlId === 'level-leader') closeRecursively('level-vice', 'toggle-vice');
          if (lvlId === 'level-vice') closeRecursively('level-depts', 'toggle-depts');
        };
        closeRecursively(targetId, btnId);
      }
    });
  });
}

// --- Link Checker ---
function initLinkChecker() {
  const scanBtn = document.getElementById('link-scan-btn');
  const clearBtn = document.getElementById('link-clear-btn');
  const urlInput = document.getElementById('link-urlInput');
  const resultDiv = document.getElementById('link-out');
  const sampleLinks = document.querySelectorAll('.sample-links button');

  sampleLinks.forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url && urlInput) urlInput.value = url;
    });
  });

  const VERDICT_COLORS = {
    safe: { text: 'var(--good)', bg: 'rgba(0,255,157,0.12)' },
    suspicious: { text: 'var(--warn)', bg: 'rgba(255,204,0,0.12)' },
    unsafe: { text: 'var(--bad)', bg: 'rgba(255,45,85,0.12)' },
  };

  function findingMessage(finding) {
    const template = D(`link.findings.${finding.id}`);
    if (typeof template === 'function') return template(escapeHtml(finding.extra));
    return template || finding.id;
  }

  function renderResult(container, result) {
    if (!result.valid) {
      container.innerHTML = `<p style="color: var(--warn);">${D('link.malformed')}</p>`;
      return;
    }

    const colors = VERDICT_COLORS[result.verdict] || { text: 'var(--muted)', bg: 'rgba(185,203,224,0.12)' };
    const verdictColor = colors.text;
    const verdictLabel = D('link.verdicts')[result.verdict];
    const levelLabel = D('link.riskLevels')[result.riskLevel];

    const verdictBanner = `<div style="display:flex; align-items:center; gap:12px; padding:14px 16px; margin-bottom:12px; border-radius:10px; background:${colors.bg}; border:1px solid ${verdictColor};">
      <span style="font-size:1.3em; font-weight:800; color:${verdictColor};">${verdictLabel}</span>
      <span style="color:${verdictColor}; font-weight:700;">${D('link.safetyPercent')} ${result.safetyScore}%</span>
    </div>`;

    const header = `<div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
      <strong>${D('link.riskLevelLabel')}</strong>
      <span style="color:${verdictColor}; font-weight:800;">${levelLabel} (${result.riskScore}/100)</span>
    </div>`;

    if (result.findings.length === 0) {
      container.innerHTML = `${verdictBanner}${header}<p style="color: var(--good);">${D('link.noFindingsSafe')}</p>`;
      return;
    }

    const items = result.findings
      .map((f) => {
        const color = f.severity === 'high' ? 'var(--bad)' : f.severity === 'warn' ? 'var(--warn)' : 'var(--muted)';
        return `<li style="color:${color};">${findingMessage(f)}</li>`;
      })
      .join('');

    container.innerHTML = `${verdictBanner}${header}<div><strong>${D('link.warningsTitle')}</strong><ul style="margin-top: 8px; padding-inline-start: 18px;">${items}</ul></div>`;
  }

  if (scanBtn && urlInput && resultDiv) {
    scanBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      resultDiv.style.display = 'block';
      if (!url) {
        resultDiv.innerHTML = `<p style="color: var(--warn);">${D('link.enterUrlFirst')}</p>`;
        return;
      }

      const result = window.analyzeUrl ? window.analyzeUrl(url) : { valid: false };
      renderResult(resultDiv, result);
    });
  }

  if (clearBtn && urlInput && resultDiv) {
    clearBtn.addEventListener('click', () => {
      urlInput.value = '';
      resultDiv.innerHTML = '';
      resultDiv.style.display = 'none';
    });
  }

  document.addEventListener('languagechange', () => {
    const url = urlInput ? urlInput.value.trim() : '';
    if (!url || !resultDiv || resultDiv.style.display === 'none') return;
    // Re-run the scan so the result re-renders in the new language.
    const result = window.analyzeUrl ? window.analyzeUrl(url) : { valid: false };
    renderResult(resultDiv, result);
  });
}

// --- File Scanner ---
function initFileScanner() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-scan-input');
  const fileSelectBtn = document.getElementById('file-select-btn');
  const fileNameDisplay = document.getElementById('file-name-display');
  const fileSizeDisplay = document.getElementById('file-size-display');
  const fileInfoArea = document.getElementById('file-info-area');
  const fileScanBtn = document.getElementById('file-scan-btn');
  const fileScanResult = document.getElementById('file-scan-result');

  if (!dropZone) return;

  dropZone.addEventListener('click', () => fileInput?.click());
  fileSelectBtn?.addEventListener('click', () => fileInput?.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent)';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--glass-border)';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--glass-border)';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    if (fileNameDisplay) fileNameDisplay.textContent = file.name;
    if (fileSizeDisplay) fileSizeDisplay.textContent = `${(file.size / 1024).toFixed(2)} KB`;
    if (fileInfoArea) fileInfoArea.style.display = 'block';
    if (fileScanResult) fileScanResult.style.display = 'none';
  }

  const VERDICT_COLORS_FILE = {
    safe: { text: 'var(--good)', bg: 'rgba(0,255,157,0.12)' },
    suspicious: { text: 'var(--warn)', bg: 'rgba(255,204,0,0.12)' },
    unsafe: { text: 'var(--bad)', bg: 'rgba(255,45,85,0.12)' },
  };

  function fileFindingMessage(finding) {
    const template = D(`file.findings.${finding.id}`);
    if (typeof template === 'function') return template(escapeHtml(finding.extra));
    return template || finding.id;
  }

  function renderFileResult(result) {
    const colors = VERDICT_COLORS_FILE[result.verdict] || { text: 'var(--muted)', bg: 'rgba(185,203,224,0.12)' };
    const verdictColor = colors.text;
    const verdictLabel = D('file.verdicts')[result.verdict];
    const levelLabel = D('file.riskLevels')[result.riskLevel];

    const verdictBanner = `<div style="display:flex; align-items:center; gap:12px; padding:14px 16px; margin-bottom:12px; border-radius:10px; background:${colors.bg}; border:1px solid ${verdictColor};">
      <span style="font-size:1.3em; font-weight:800; color:${verdictColor};">${verdictLabel}</span>
      <span style="color:${verdictColor}; font-weight:700;">${D('file.safetyPercent')} ${result.safetyScore}%</span>
    </div>`;

    const detectedType = result.signature ? result.signature.format : D('file.unknownType');
    const header = `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap: wrap;">
        <strong>${D('file.riskLevelLabel')}</strong>
        <span style="color:${verdictColor}; font-weight:800;">${levelLabel} (${result.riskScore}/100)</span>
      </div>
      <div style="margin-bottom:4px; color: var(--muted); font-size: 0.9em;">${D('file.detectedType')} ${detectedType}</div>
      <div style="margin-bottom:10px; color: var(--muted); font-size: 0.9em;">${D('file.entropyLabel')} ${result.entropy.toFixed(2)} / 8</div>`;

    if (result.findings.length === 0) {
      fileScanResult.innerHTML = `${verdictBanner}${header}<p style="color: var(--good);">${D('file.safe')}</p>`;
      return;
    }

    const items = result.findings
      .map((f) => {
        const color = f.severity === 'high' ? 'var(--bad)' : f.severity === 'warn' ? 'var(--warn)' : 'var(--muted)';
        return `<li style="color:${color};">${fileFindingMessage(f)}</li>`;
      })
      .join('');

    fileScanResult.innerHTML = `${verdictBanner}${header}<div><strong>${D('file.warningsTitle')}</strong><ul style="margin-top: 8px; padding-inline-start: 18px;">${items}</ul></div>`;
  }

  let lastFileResult = null;

  fileScanBtn?.addEventListener('click', async () => {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      if (fileScanResult) {
        fileScanResult.style.display = 'block';
        fileScanResult.innerHTML = `<p style="color: var(--warn);">${D('file.selectFirst')}</p>`;
      }
      return;
    }
    const file = fileInput.files[0];

    if (!fileScanResult) return;
    fileScanResult.style.display = 'block';

    if (!window.analyzeFile) {
      fileScanResult.innerHTML = `<p style="color: var(--warn);">${D('file.selectFirst')}</p>`;
      return;
    }

    lastFileResult = await window.analyzeFile(file);
    renderFileResult(lastFileResult);
  });

  document.addEventListener('languagechange', () => {
    if (lastFileResult && fileScanResult && fileScanResult.style.display !== 'none') {
      renderFileResult(lastFileResult);
    }
  });
}

// --- Password Checker ---
function initPasswordChecker() {
  const pwInput = document.getElementById('pw-pw');
  const pwMeterBar = document.getElementById('pw-meterBar');
  const pwScoreText = document.getElementById('pw-scoreText');
  const pwHint = document.getElementById('pw-hint');
  const pwEntropy = document.getElementById('pw-entropy');
  const pwGuesses = document.getElementById('pw-guesses');
  const pwScore100 = document.getElementById('pw-score100');
  const pwAdvice = document.getElementById('pw-advice');
  const pwTimes = document.getElementById('pw-times');
  const pwChecksEl = document.getElementById('pw-checks');
  const pwDebugEl = document.getElementById('pw-debug');
  const pwToggle = document.getElementById('pw-toggle');
  const pwCopy = document.getElementById('pw-copy');
  const pwClear = document.getElementById('pw-clear');
  const genBtn = document.getElementById('gen-btn');
  const genLengthRange = document.getElementById('gen-length-range');
  const genLengthInput = document.getElementById('gen-length');
  const genLower = document.getElementById('gen-lower');
  const genUpper = document.getElementById('gen-upper');
  const genDigits = document.getElementById('gen-digits');
  const genSymbols = document.getElementById('gen-symbols');
  const genArabic = document.getElementById('gen-arabic');
  const genPhraseBtn = document.getElementById('gen-phrase-btn');

  if (pwToggle) {
    pwToggle.addEventListener('click', () => {
      const type = pwInput.type === 'password' ? 'text' : 'password';
      pwInput.type = type;
      pwToggle.querySelector('span:last-child').textContent = type === 'password' ? D('pw.show') : D('pw.hide');
    });
  }

  if (pwCopy) {
    pwCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pwInput.value);
        const label = pwCopy.querySelector('span:last-child');
        const original = label.textContent;
        label.textContent = D('pw.copied');
        setTimeout(() => {
          label.textContent = original;
        }, 2000);
      } catch (err) {
        console.error('Copy failed', err);
      }
    });
  }

  if (pwClear) {
    pwClear.addEventListener('click', () => {
      pwInput.value = '';
      updatePasswordCheck();
    });
  }

  if (genLengthRange && genLengthInput) {
    genLengthRange.addEventListener('input', (e) => {
      genLengthInput.value = e.target.value;
    });
    genLengthInput.addEventListener('input', (e) => {
      genLengthRange.value = Math.max(8, Math.min(64, parseInt(e.target.value) || 8));
    });
  }

  function generatePassword() {
    const length = parseInt(genLengthInput?.value) || 16;
    const useLower = genLower?.checked ?? true;
    const useUpper = genUpper?.checked ?? true;
    const useDigits = genDigits?.checked ?? true;
    const useSymbols = genSymbols?.checked ?? true;
    const useArabic = genArabic?.checked ?? false;

    let chars = '';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useDigits) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    if (useArabic) chars += 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';

    if (chars === '') return '';

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(secureRandomInt(chars.length));
    }
    return password;
  }

  if (genBtn) {
    genBtn.addEventListener('click', () => {
      pwInput.value = generatePassword();
      updatePasswordCheck();
    });
  }

  if (genPhraseBtn) {
    genPhraseBtn.addEventListener('click', () => {
      const words = D('pw.phraseWords');
      const phrase = [];
      for (let i = 0; i < 4; i++) {
        phrase.push(words[secureRandomInt(words.length)]);
      }
      pwInput.value = phrase.join('-');
      updatePasswordCheck();
    });
  }

  function formatDuration(seconds) {
    if (!isFinite(seconds) || seconds > 100 * 365.25 * 24 * 3600) return D('pw.time.centuries');
    if (seconds < 1) return D('pw.time.instant');
    if (seconds < 60) return D('pw.time.seconds')(Math.round(seconds));
    if (seconds < 3600) return D('pw.time.minutes')(Math.round(seconds / 60));
    if (seconds < 86400) return D('pw.time.hours')(Math.round(seconds / 3600));
    if (seconds < 365.25 * 86400) return D('pw.time.days')(Math.round(seconds / 86400));
    return D('pw.time.years')(Math.round(seconds / (365.25 * 86400)).toLocaleString());
  }

  function updatePasswordCheck() {
    const password = pwInput.value;
    const result = window.analyzePassword ? window.analyzePassword(password) : null;

    const advice = [];
    if (!result || password.length === 0) {
      if (pwMeterBar) pwMeterBar.style.width = '0%';
      if (pwScoreText) pwScoreText.textContent = '—';
      if (pwHint) pwHint.textContent = D('pw.needLength');
      if (pwEntropy) pwEntropy.textContent = '—';
      if (pwGuesses) pwGuesses.textContent = '—';
      if (pwScore100) pwScore100.textContent = '—/100';
      if (pwAdvice) pwAdvice.innerHTML = '';
      if (pwTimes) pwTimes.innerHTML = '';
      if (pwChecksEl) pwChecksEl.innerHTML = '';
      if (pwDebugEl) pwDebugEl.textContent = D('passwordChecker.debugPlaceholder') || '';
      return;
    }

    const { score0to4, score100, entropyBits, guesses, checks, crackSeconds, isCommon, hasRepeats, hasSequential: seqFlag, hasKeyboardWalk: kbFlag, isDigitsOnly } = result;

    if (password.length < 8) advice.push(D('pw.needLength'));
    if (!/[a-z]/.test(password)) advice.push(D('pw.useLower'));
    if (!/[A-Z]/.test(password)) advice.push(D('pw.useUpper'));
    if (!/[0-9]/.test(password)) advice.push(D('pw.useDigits'));
    if (!/[^a-zA-Z0-9\u0621-\u064A]/.test(password)) advice.push(D('pw.useSymbols'));
    if (isCommon) advice.unshift(D('pw.warnCommon'));
    if (hasRepeats) advice.push(D('pw.warnRepeated'));
    if (seqFlag) advice.push(D('pw.warnSequential'));
    if (kbFlag) advice.push(D('pw.warnKeyboard'));
    if (isDigitsOnly) advice.push(D('pw.warnOnlyDigits'));

    if (pwMeterBar) {
      if (score0to4 < 2) pwMeterBar.style.background = 'var(--bad)';
      else if (score0to4 < 3) pwMeterBar.style.background = 'var(--warn)';
      else pwMeterBar.style.background = 'var(--good)';
      pwMeterBar.style.width = `${score100}%`;
    }

    if (pwScoreText) {
      const labels = D('pw.labels');
      pwScoreText.textContent = labels[score0to4] || labels[0];
    }
    if (pwHint) {
      if (advice.length === 0) pwHint.textContent = D('pw.excellent');
      else pwHint.innerHTML = advice[0];
    }
    if (pwEntropy) pwEntropy.textContent = `${entropyBits.toFixed(1)} bits`;
    if (pwGuesses) pwGuesses.textContent = guesses.toExponential(1);
    if (pwScore100) pwScore100.textContent = `${score100}/100`;
    if (pwAdvice) {
      const tips = advice.length > 0 ? advice : D('pw.tips');
      pwAdvice.innerHTML = tips.map((t) => `<li>${t}</li>`).join('');
    }

    if (pwTimes) {
      const scenarios = D('pw.scenarioLabels');
      pwTimes.innerHTML = Object.keys(scenarios)
        .map((key) => {
          const timeStr = formatDuration(crackSeconds[key]);
          return `<div class="stat"><div style="font-size:11px;color:var(--muted)">${scenarios[key]}</div><div style="font-weight:700">${timeStr}</div></div>`;
        })
        .join('');
    }

    if (pwChecksEl) {
      const checkLabels = D('pw.checks');
      const rows = [
        ['length12', checks.length12],
        ['upperLower', checks.upperLower],
        ['digits', checks.digits],
        ['symbols', checks.symbols],
        ['notCommon', checks.notCommon],
        ['noRepeats', checks.noRepeats],
      ];
      pwChecksEl.innerHTML = rows
        .map(([key, passed]) => {
          const icon = passed
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M20 6L9 17l-5-5"></path></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M18 6L6 18M6 6l12 12"></path></svg>';
          const color = passed ? 'var(--good)' : 'var(--bad)';
          return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;"><span style="color:${color};display:inline-flex;">${icon}</span><span style="color:${color}">${checkLabels[key]}</span></div>`;
        })
        .join('');
    }

    if (pwDebugEl) {
      pwDebugEl.textContent = JSON.stringify(
        {
          length: result.length,
          characterPoolSize: result.poolSize,
          theoreticalEntropyBits: Number(result.entropyBits.toFixed(2)),
          effectiveEntropyBits: Number(result.effectiveEntropyBits.toFixed(2)),
          estimatedGuesses: Number(result.guesses.toExponential(2)),
          isCommonPassword: isCommon,
          hasRepeatedRun: hasRepeats,
          hasSequentialRun: seqFlag,
          hasKeyboardWalk: kbFlag,
        },
        null,
        2
      );
    }
  }

  if (pwInput) {
    pwInput.addEventListener('input', updatePasswordCheck);
    updatePasswordCheck();
  }

  document.addEventListener('languagechange', updatePasswordCheck);
}

// --- Ghost Game ---
function initGhostGame() {
  const area = document.getElementById('ghostGameArea');
  const player = document.getElementById('ghostPlayer');
  const enemy = document.getElementById('ghostEnemy');
  const scoreEl = document.getElementById('ghostScore');
  const msgEl = document.getElementById('ghostMsg');

  if (!area || !player || !enemy || !scoreEl) return;

  let score = 0;
  let playerX = 50; // percent
  let enemyX = 10 + Math.random() * 80;
  let enemyY = 0; // percent, 0 = top, 100 = bottom
  let fallSpeed = 14; // percent per second
  let lastFrameTime = null;
  const CATCH_ZONE_MIN = 60; // enemy must be at least this far down to be "catchable"
  const CATCH_MARGIN = 14; // horizontal tolerance (percent) for a successful catch
  let caught = false;
  let rafId = null;

  function setPlayerX(x) {
    playerX = Math.max(6, Math.min(94, x));
    player.style.left = `${playerX}%`;
  }

  function resetEnemy(randomizeX = true) {
    if (randomizeX) enemyX = 8 + Math.random() * 84;
    enemyY = 0;
    enemy.style.left = `${enemyX}%`;
    enemy.style.top = '0%';
    caught = false;
  }

  area.addEventListener('mousemove', (e) => {
    const rect = area.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPlayerX(x);
  });

  area.addEventListener(
    'touchmove',
    (e) => {
      if (!e.touches || !e.touches[0]) return;
      const rect = area.getBoundingClientRect();
      const touch = e.touches[0];
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      setPlayerX(x);
      e.preventDefault();
    },
    { passive: false }
  );

  function tick(now) {
    if (lastFrameTime === null) lastFrameTime = now;
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000); // seconds, clamped to avoid big jumps on tab-switch
    lastFrameTime = now;

    if (!caught) {
      enemyY += fallSpeed * dt;
      enemy.style.top = `${Math.min(100, enemyY)}%`;

      // Check for a catch: enemy is low enough and horizontally close to the player.
      if (enemyY >= CATCH_ZONE_MIN && Math.abs(enemyX - playerX) < CATCH_MARGIN) {
        caught = true;
        score++;
        scoreEl.textContent = D('games.ghostScore')(score);
        if (msgEl) msgEl.textContent = D('games.ghostCaught');
        fallSpeed = Math.min(38, fallSpeed + 1.5); // gentle difficulty ramp
        setTimeout(() => resetEnemy(), 220);
      } else if (enemyY >= 100) {
        // Reached the bottom without being caught: reset the score to zero
        // and start over, so a miss carries a real consequence.
        score = 0;
        fallSpeed = 14;
        scoreEl.textContent = D('games.ghostScore')(score);
        if (msgEl && D('games.ghostMissed')) msgEl.textContent = D('games.ghostMissed');
        resetEnemy();
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  resetEnemy();
  setPlayerX(50);
  rafId = requestAnimationFrame(tick);

  document.addEventListener('languagechange', () => {
    scoreEl.textContent = D('games.ghostScore')(score);
  });

  // Pause the animation loop while its tab isn't visible, and resume cleanly
  // (avoids a huge dt jump / sudden "teleport" when the user comes back).
  document.addEventListener('tabchange', (e) => {
    if (e.detail && e.detail.tab !== 'games' && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (e.detail && e.detail.tab === 'games' && !rafId) {
      lastFrameTime = null;
      rafId = requestAnimationFrame(tick);
    }
  });
}

// --- Bow Game ---
function initBowGame() {
  const area = document.getElementById('bowGameArea');
  const arrow = document.getElementById('arrow');
  const target = document.getElementById('target');
  const msgEl = document.getElementById('bowFeedback');

  if (!area || !arrow || !target || !msgEl) return;

  let arrowY = 50;
  let arrowFlying = false;

  area.addEventListener('mousemove', (e) => {
    if (arrowFlying) return;
    const rect = area.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    arrowY = Math.max(10, Math.min(90, y));
    arrow.style.top = `${arrowY}%`;
  });

  area.addEventListener(
    'touchmove',
    (e) => {
      if (arrowFlying || !e.touches || !e.touches[0]) return;
      const rect = area.getBoundingClientRect();
      const touch = e.touches[0];
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      arrowY = Math.max(10, Math.min(90, y));
      arrow.style.top = `${arrowY}%`;
      e.preventDefault();
    },
    { passive: false }
  );

  area.addEventListener('click', () => {
    if (arrowFlying) return;
    arrowFlying = true;
    let arrowX = 10;

    function fly() {
      arrowX += 5;
      arrow.style.left = `${arrowX}%`;
      if (arrowX > 80) {
        const targetY = 50;
        const distance = Math.abs(arrowY - targetY);
        if (distance < 10) msgEl.textContent = D('games.bowCenter');
        else if (distance < 20) msgEl.textContent = D('games.bowClose');
        else msgEl.textContent = D('games.bowRetry');

        setTimeout(() => {
          arrowFlying = false;
          arrow.style.left = '10%';
        }, 1000);
      } else {
        requestAnimationFrame(fly);
      }
    }

    fly();
  });
}

// --- Link Game ---
function initLinkGame() {
  const taskEl = document.getElementById('linkGameTask');
  const optionsEl = document.getElementById('linkGameOptions');
  const scoreEl = document.getElementById('linkGameScore');
  const msgEl = document.getElementById('linkGameMsg');
  const newGameBtn = document.getElementById('linkGameStartBtn');

  if (!taskEl || !optionsEl || !scoreEl) return;

  let score = 0;
  let currentGame = null;

  function newGame() {
    const games = D('games.linkTasks');
    currentGame = games[Math.floor(Math.random() * games.length)];
    taskEl.textContent = currentGame.task;
    const allOptions = [currentGame.real, ...currentGame.fake].sort(() => Math.random() - 0.5);
    optionsEl.innerHTML = allOptions
      .map(
        (opt) =>
          `<button style="display:block;width:100%;padding:12px;margin:6px 0;background:rgba(0,229,255,0.1);border:1px solid var(--glass-border);border-radius:8px;color:var(--text);cursor:pointer;text-align:right;font-family:inherit;">${opt}</button>`
      )
      .join('');

    optionsEl.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.textContent === currentGame.real) {
          score++;
          scoreEl.textContent = D('games.linkScore')(score);
          if (msgEl) msgEl.textContent = D('games.correct');
        } else if (msgEl) {
          msgEl.textContent = D('games.wrongTryAgain');
        }
        setTimeout(newGame, 1500);
      });
    });
  }

  if (newGameBtn) {
    newGameBtn.addEventListener('click', newGame);
  }
  newGame();

  document.addEventListener('languagechange', () => {
    scoreEl.textContent = D('games.linkScore')(score);
    newGame();
  });
}

// --- Packet Filter Game ---
function initPacketGame() {
  const area = document.getElementById('packetGameArea');
  const gate = document.getElementById('packetGate');
  const scoreEl = document.getElementById('packetScore');
  const msgEl = document.getElementById('packetMsg');

  if (!area || !gate || !scoreEl) return;

  const MALICIOUS_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"></path><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path></svg>';
  const SAFE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';

  let score = 0;
  let gateX = 50; // percent
  let packets = []; // { el, x, y, type }
  let lastFrameTime = null;
  let spawnTimer = 0;
  let fallSpeed = 22; // percent per second
  let rafId = null;
  const CATCH_ZONE = 88; // percent from top where the gate sits
  const CATCH_MARGIN = 12; // percent horizontal tolerance

  function setGateX(x) {
    gateX = Math.max(8, Math.min(92, x));
    gate.style.left = `${gateX}%`;
  }

  area.addEventListener('mousemove', (e) => {
    const rect = area.getBoundingClientRect();
    setGateX(((e.clientX - rect.left) / rect.width) * 100);
  });

  area.addEventListener(
    'touchmove',
    (e) => {
      if (!e.touches || !e.touches[0]) return;
      const rect = area.getBoundingClientRect();
      const touch = e.touches[0];
      setGateX(((touch.clientX - rect.left) / rect.width) * 100);
      e.preventDefault();
    },
    { passive: false }
  );

  function spawnPacket() {
    const isMalicious = Math.random() < 0.55;
    const el = document.createElement('div');
    el.className = `packet ${isMalicious ? 'malicious' : 'safe'}`;
    el.innerHTML = isMalicious ? MALICIOUS_ICON : SAFE_ICON;
    area.appendChild(el);
    const packet = { el, x: 10 + Math.random() * 80, y: -5, type: isMalicious ? 'malicious' : 'safe' };
    packets.push(packet);
    positionPacket(packet);
  }

  function positionPacket(p) {
    p.el.style.left = `${p.x}%`;
    p.el.style.top = `${p.y}%`;
  }

  function resolvePacket(p, caught) {
    p.el.remove();
    packets = packets.filter((x) => x !== p);

    if (p.type === 'malicious' && caught) {
      score++;
      if (msgEl) msgEl.textContent = D('games.packetBlocked');
    } else if (p.type === 'malicious' && !caught) {
      score = 0;
      if (msgEl) msgEl.textContent = D('games.packetLeaked');
    } else if (p.type === 'safe' && caught) {
      score = 0;
      if (msgEl) msgEl.textContent = D('games.packetBlockedSafe');
    }
    // safe packet passing through untouched: no message, no score change
    scoreEl.textContent = D('games.packetScore')(score);
  }

  function tick(now) {
    if (lastFrameTime === null) lastFrameTime = now;
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnPacket();
      spawnTimer = 0.9 + Math.random() * 0.6;
    }

    packets.slice().forEach((p) => {
      p.y += fallSpeed * dt;
      positionPacket(p);

      if (p.y >= CATCH_ZONE && Math.abs(p.x - gateX) < CATCH_MARGIN) {
        resolvePacket(p, true);
      } else if (p.y >= 102) {
        resolvePacket(p, false);
      }
    });

    rafId = requestAnimationFrame(tick);
  }

  setGateX(50);
  rafId = requestAnimationFrame(tick);

  document.addEventListener('languagechange', () => {
    scoreEl.textContent = D('games.packetScore')(score);
  });

  document.addEventListener('tabchange', (e) => {
    if (e.detail && e.detail.tab !== 'games' && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (e.detail && e.detail.tab === 'games' && !rafId) {
      lastFrameTime = null;
      rafId = requestAnimationFrame(tick);
    }
  });
}

// --- Malware Whack Game ---
function initWhackGame() {
  const grid = document.getElementById('whackGrid');
  const scoreEl = document.getElementById('whackScore');
  const msgEl = document.getElementById('whackMsg');

  if (!grid || !scoreEl) return;

  const MALWARE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="9" width="8" height="9" rx="4"></rect><path d="M9 9V7a3 3 0 016 0v2"></path><path d="M5 12h2M17 12h2M9 20l1-1M15 20l-1-1"></path></svg>';
  const SAFE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><path d="M14 2v6h6"></path></svg>';

  const CELL_COUNT = 9;
  let score = 0;
  let cells = [];
  let spawnTimer = null;
  let running = true;

  grid.innerHTML = '';
  for (let i = 0; i < CELL_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'whack-cell';
    cell.innerHTML = `
      <div class="whack-cell-icon malware">${MALWARE_ICON}</div>
      <div class="whack-cell-icon safe">${SAFE_ICON}</div>
    `;
    grid.appendChild(cell);
    cells.push({ el: cell, state: null, hideTimeout: null });
  }

  function clearCell(cellObj) {
    cellObj.el.classList.remove('show-malware', 'show-safe');
    cellObj.state = null;
    if (cellObj.hideTimeout) {
      clearTimeout(cellObj.hideTimeout);
      cellObj.hideTimeout = null;
    }
  }

  function spawnOne() {
    if (!running) return;
    const emptyCells = cells.filter((c) => c.state === null);
    if (emptyCells.length === 0) return;
    const cellObj = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const isMalware = Math.random() < 0.7;
    cellObj.state = isMalware ? 'malware' : 'safe';
    cellObj.el.classList.add(isMalware ? 'show-malware' : 'show-safe');
    cellObj.hideTimeout = setTimeout(() => clearCell(cellObj), 1100);
  }

  cells.forEach((cellObj) => {
    cellObj.el.addEventListener('click', () => {
      if (cellObj.state === 'malware') {
        score++;
        if (msgEl) msgEl.textContent = D('games.whackHit');
      } else if (cellObj.state === 'safe') {
        score = 0;
        if (msgEl) msgEl.textContent = D('games.whackWrongClick');
      } else {
        return; // clicking an empty cell has no effect
      }
      scoreEl.textContent = D('games.whackScore')(score);
      clearCell(cellObj);
    });
  });

  function startSpawning() {
    if (spawnTimer) return;
    spawnTimer = setInterval(spawnOne, 750);
  }

  function stopSpawning() {
    if (spawnTimer) {
      clearInterval(spawnTimer);
      spawnTimer = null;
    }
  }

  startSpawning();

  document.addEventListener('languagechange', () => {
    scoreEl.textContent = D('games.whackScore')(score);
  });

  document.addEventListener('tabchange', (e) => {
    if (e.detail && e.detail.tab !== 'games') {
      running = false;
      stopSpawning();
    } else if (e.detail && e.detail.tab === 'games') {
      running = true;
      startSpawning();
    }
  });
}

// --- Quiz ---
// --- Multi-Layer Defense Game ---
function initDefenseGame() {
  const scenarioEl = document.getElementById('stackScenario');
  const controlsEl = document.getElementById('stackControls');
  const feedbackEl = document.getElementById('stackFeedback');

  if (!scenarioEl || !controlsEl || !feedbackEl) return;

  let currentIndex = 0;
  let answered = false;
  let score = 0;
  let total = 0;
  const order = [];

  function shuffledOrder(len) {
    const arr = Array.from({ length: len }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function renderScenario() {
    const scenarios = D('games.defenseScenarios');
    if (order.length !== scenarios.length) {
      order.length = 0;
      order.push(...shuffledOrder(scenarios.length));
    }
    const scenario = scenarios[order[currentIndex % order.length]];
    scenarioEl.textContent = scenario.text;
    answered = false;

    controlsEl.querySelectorAll('.control-pill').forEach((btn) => {
      btn.classList.remove('correct', 'wrong');
      btn.disabled = false;
    });

    feedbackEl.textContent = window.i18n ? window.i18n.t('games.defense.feedback') : '';
  }

  controlsEl.querySelectorAll('.control-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      total++;

      const scenarios = D('games.defenseScenarios');
      const scenario = scenarios[order[currentIndex % order.length]];
      const action = btn.getAttribute('data-action');
      const isBest = action === scenario.best;
      if (isBest) score++;

      controlsEl.querySelectorAll('.control-pill').forEach((b) => {
        b.disabled = true;
        if (b.getAttribute('data-action') === scenario.best) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
      });

      feedbackEl.textContent = scenario.feedback[action] || '';

      setTimeout(() => {
        currentIndex++;
        renderScenario();
      }, 2400);
    });
  });

  renderScenario();

  document.addEventListener('languagechange', () => {
    order.length = 0; // re-shuffle indices are still valid since scenario count is language-independent, but re-render text
    currentIndex = 0;
    score = 0;
    total = 0;
    renderScenario();
  });
}

function initQuiz() {
  const questionNumber = document.getElementById('question-number');
  const questionCategory = document.getElementById('question-category');
  const questionText = document.getElementById('question-text');
  const quizOptions = document.getElementById('quiz-options');
  const nextBtn = document.getElementById('next-question-btn');
  const resultContainer = document.getElementById('quiz-result');
  const correctCount = document.getElementById('correct-count');
  const totalCount = document.getElementById('total-count');
  const percentage = document.getElementById('percentage');
  const restartBtn = document.getElementById('restart-quiz-btn');

  if (!questionText || !quizOptions) return;

  let currentQuestion = 0;
  let correctAnswers = 0;
  let answered = false;

  function renderQuestion() {
    const questions = D('quiz.questions');
    const q = questions[currentQuestion];
    if (!q) {
      const percent = Math.round((correctAnswers / questions.length) * 100);
      if (resultContainer) resultContainer.style.display = 'block';
      if (correctCount) correctCount.textContent = correctAnswers;
      if (totalCount) totalCount.textContent = questions.length;
      if (percentage) percentage.textContent = `${percent}%`;
      if (quizOptions) quizOptions.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }

    if (questionNumber) questionNumber.textContent = D('quiz.questionOf')(currentQuestion + 1, questions.length);
    if (questionCategory) questionCategory.textContent = q.category;
    if (questionText) questionText.textContent = q.question;
    if (resultContainer) resultContainer.style.display = 'none';
    if (quizOptions) quizOptions.style.display = 'grid';
    if (nextBtn) nextBtn.style.display = 'none';
    answered = false;

    const letters = D('quiz.letters');
    quizOptions.innerHTML = '';
    q.options.forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.innerHTML = `<span class="option-letter">${letters[index]}</span><span class="option-text">${opt.text}</span>`;
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        if (opt.correct) {
          correctAnswers++;
          btn.style.borderColor = 'var(--good)';
          btn.style.background = 'rgba(0,255,157,0.1)';
        } else {
          btn.style.borderColor = 'var(--bad)';
          btn.style.background = 'rgba(255,45,85,0.1)';
        }
        quizOptions.querySelectorAll('.quiz-option').forEach((b) => (b.style.pointerEvents = 'none'));
        if (nextBtn) nextBtn.style.display = 'block';
      });
      quizOptions.appendChild(btn);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentQuestion++;
      renderQuestion();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      currentQuestion = 0;
      correctAnswers = 0;
      renderQuestion();
    });
  }

  renderQuestion();

  document.addEventListener('languagechange', () => {
    currentQuestion = 0;
    correctAnswers = 0;
    renderQuestion();
  });
}

// --- Simulator ---
function initSimulator() {
  const startButtons = document.querySelectorAll('.start-scenario');
  const simulatorGame = document.getElementById('simulator-game');
  const closeGameBtn = document.getElementById('close-game');
  const gameTitle = document.getElementById('game-title');
  const gameContent = document.getElementById('game-content');

  function buildScenarioHtml(scenario) {
    const choiceButtons = scenario.choices
      .map(
        (c, i) =>
          `<button type="button" class="sim-choice-btn" data-choice-index="${i}" style="padding: 15px; border: 1px solid var(--glass-border); border-radius: 8px; background: rgba(0,229,255,0.05); color: var(--text); cursor: pointer; font-family: inherit; font-size: 16px;">${c.text}</button>`
      )
      .join('');
    return `
        <div style="padding: 20px 0;">
          <h3 style="color: var(--accent2); margin-bottom: 10px;">${scenario.situationLabel}</h3>
          <p style="margin-bottom: 20px;">${scenario.situationText}</p>
          <h3 style="color: var(--accent2); margin-bottom: 10px;">${scenario.promptLabel}</h3>
          <div style="display: grid; gap: 10px;">${choiceButtons}</div>
        </div>
      `;
  }

  function wireScenarioButtons(scenario) {
    if (!gameContent) return;
    gameContent.querySelectorAll('.sim-choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-choice-index'), 10);
        alert(scenario.choices[idx].alert);
      });
    });
  }

  startButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-scenario');
      const scenario = D('simulator.scenarios')[key];
      if (scenario && simulatorGame) {
        simulatorGame.style.display = 'block';
        if (gameTitle) gameTitle.textContent = scenario.title;
        if (gameContent) gameContent.innerHTML = buildScenarioHtml(scenario);
        wireScenarioButtons(scenario);
      } else if (simulatorGame) {
        simulatorGame.style.display = 'block';
        if (gameTitle) gameTitle.textContent = D('simulator.situation');
        if (gameContent) gameContent.innerHTML = `<p style="padding: 20px;">${D('simulator.underConstruction')}</p>`;
      }
    });
  });

  if (closeGameBtn && simulatorGame) {
    closeGameBtn.addEventListener('click', () => {
      simulatorGame.style.display = 'none';
    });
  }
}

// Note: the Attack Map tab's visualization (a 3D interactive globe) and its
// reset/pause controls are owned by js/attack-map.js, not this file.

// --- Challenges ---
function initChallenges() {
  const ctfDashboard = document.getElementById('ctf-dashboard');
  const ctfModelSelect = document.getElementById('ctf-model-select');
  const ctfShuffle = document.getElementById('ctf-shuffle');

  if (!ctfDashboard) return;

  let order = null; // null = default order; otherwise an array of indices

  function currentChallenges() {
    const items = D('challenges.items');
    if (!order) return items.map((ch, i) => ({ ch, i }));
    return order.map((i) => ({ ch: items[i], i }));
  }

  function renderSelect() {
    if (!ctfModelSelect) return;
    const items = D('challenges.items');
    const prevValue = ctfModelSelect.value;
    ctfModelSelect.innerHTML = items.map((ch, i) => `<option value="${i}">${i + 1}. ${ch.title}</option>`).join('');
    if (prevValue !== '' && items[prevValue]) ctfModelSelect.value = prevValue;
  }

  function renderChallenges() {
    const entries = currentChallenges();
    ctfDashboard.innerHTML = entries
      .map(
        ({ ch, i }, displayIndex) => `
      <div class="card" style="margin: 10px 0;" data-challenge-index="${i}">
        <h3 style="color: var(--accent2); margin: 0 0 8px 0;">${displayIndex + 1}. ${ch.title}</h3>
        <p style="color: var(--muted); margin-bottom: 12px;">${ch.description}</p>
        <div style="display: flex; gap: 10px;">
          <input type="text" id="ctf-input-${i}" placeholder="${D('challenges.solutionPlaceholder')}" style="flex: 1; padding: 10px; border: 1px solid var(--glass-border); border-radius: 8px; background: var(--panel); color: var(--text);">
          <button type="button" class="ctf-check-btn" data-index="${i}" data-flag="${ch.flag.replace(/"/g, '&quot;')}" style="padding: 10px 20px; border-radius: 8px; border: none; background: var(--accent2); color: #000; font-weight: bold; cursor: pointer;">${D('challenges.check')}</button>
        </div>
        <div id="ctf-result-${i}" style="margin-top: 8px;"></div>
      </div>
    `
      )
      .join('');

    ctfDashboard.querySelectorAll('.ctf-check-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        checkCtf(parseInt(btn.getAttribute('data-index'), 10), btn.getAttribute('data-flag'));
      });
    });
  }

  function checkCtf(index, flag) {
    const input = document.getElementById(`ctf-input-${index}`);
    const result = document.getElementById(`ctf-result-${index}`);
    if (!input || !result) return;

    if (input.value.trim() === flag) {
      result.innerHTML = `<p style="color: var(--good);">${D('challenges.correct')}</p>`;
    } else {
      result.innerHTML = `<p style="color: var(--bad);">${D('challenges.wrong')}</p>`;
    }
  }

  if (ctfShuffle) {
    ctfShuffle.addEventListener('click', () => {
      const items = D('challenges.items');
      const indices = items.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      order = indices;
      renderChallenges();
    });
  }

  if (ctfModelSelect) {
    ctfModelSelect.addEventListener('change', () => {
      const idx = parseInt(ctfModelSelect.value, 10);
      const card = ctfDashboard.querySelector(`[data-challenge-index="${idx}"]`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  renderSelect();
  renderChallenges();

  document.addEventListener('languagechange', () => {
    order = null;
    renderSelect();
    renderChallenges();
  });
}

// --- Initialize Everything ---
// We wait for the first `languagechange` event (fired by js/i18n.js once the
// saved language preference has loaded) so dynamic content like the quiz and
// games render in the correct language immediately, instead of flashing
// Arabic before switching to English. A short fallback timer covers the
// unlikely case that i18n.js fails to load.
let appStarted = false;
function startApp() {
  if (appStarted) return;
  appStarted = true;
  initTabs();
  initSuggestionForm();
  initJoinForm();
  initSuggestionButton();
  initThemeToggle();
  initOrgToggle();
  initLinkChecker();
  initFileScanner();
  initPasswordChecker();
  initGhostGame();
  initDefenseGame();
  initBowGame();
  initLinkGame();
  initPacketGame();
  initWhackGame();
  initQuiz();
  initSimulator();
  initChallenges();
}

document.addEventListener('languagechange', startApp, { once: true });
document.addEventListener('DOMContentLoaded', () => {
  startApp();
});
