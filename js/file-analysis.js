/**
 * file-analysis.js — a more realistic file-safety heuristic engine.
 *
 * Goes beyond trusting the filename extension (trivially spoofed) by:
 *   - Reading the file's actual binary signature ("magic numbers") to
 *     detect real executable/archive formats regardless of what the
 *     extension claims
 *   - Detecting double-extension disguises ("invoice.pdf.exe"), a classic
 *     malware-delivery trick
 *   - Flagging macro-capable Office formats (.docm/.xlsm/.pptm), a common
 *     real-world malware vector
 *   - Categorizing risk by severity rather than a flat warning list
 *
 * Exposes a single global: window.analyzeFile(file) -> Promise<result>
 */
(function () {
  const EXECUTABLE_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'msi', 'jar', 'vbs', 'vbe',
    'js', 'jse', 'wsf', 'wsh', 'ps1', 'psm1', 'hta', 'msc', 'reg', 'apk',
    'sh', 'command', 'app',
  ];

  const MACRO_OFFICE_EXTENSIONS = ['docm', 'xlsm', 'pptm', 'dotm', 'xltm', 'potm'];

  const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz'];

  // Document/media extensions that are safe to disguise an executable
  // behind in a double-extension trick (the FIRST extension in "name.X.exe").
  const COMMONLY_SPOOFED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg',
    'png', 'gif', 'mp3', 'mp4', 'zip',
  ];

  // A small table of binary signatures ("magic numbers") for common formats,
  // read from the first bytes of the file regardless of its extension.
  const SIGNATURES = [
    { bytes: [0x4d, 0x5a], format: 'PE executable (Windows .exe/.dll)', kind: 'executable' },
    { bytes: [0x7f, 0x45, 0x4c, 0x46], format: 'ELF executable (Linux)', kind: 'executable' },
    { bytes: [0xca, 0xfe, 0xba, 0xbe], format: 'Mach-O / Java class (macOS or JVM binary)', kind: 'executable' },
    { bytes: [0x50, 0x4b, 0x03, 0x04], format: 'ZIP-based archive (zip/docx/xlsx/jar/apk...)', kind: 'zip' },
    { bytes: [0x25, 0x50, 0x44, 0x46], format: 'PDF document', kind: 'pdf' },
    { bytes: [0xd0, 0xcf, 0x11, 0xe0], format: 'Legacy MS Office document (doc/xls/ppt)', kind: 'ole' },
    { bytes: [0x52, 0x61, 0x72, 0x21], format: 'RAR archive', kind: 'archive' },
    { bytes: [0x1f, 0x8b], format: 'GZIP archive', kind: 'archive' },
    { bytes: [0xff, 0xd8, 0xff], format: 'JPEG image', kind: 'image' },
    { bytes: [0x89, 0x50, 0x4e, 0x47], format: 'PNG image', kind: 'image' },
  ];

  function readSignature(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result);
        for (const sig of SIGNATURES) {
          if (sig.bytes.every((b, i) => bytes[i] === b)) {
            resolve(sig);
            return;
          }
        }
        resolve(null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file.slice(0, 16));
    });
  }

  /**
   * Compute the Shannon entropy (0-8 bits/byte) of a sample of the file's
   * content. This is a real technique used by antivirus/security tools:
   * normal text and typical document formats sit in the low-to-middle range,
   * while packed, compressed, or encrypted data (a common way malware hides
   * its real payload) pushes entropy close to the theoretical maximum of 8.
   * Reads up to 256KB so large files stay fast to analyze in the browser.
   */
  function readEntropy(file) {
    return new Promise((resolve) => {
      const sampleSize = Math.min(file.size, 256 * 1024);
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result);
        if (bytes.length === 0) {
          resolve(0);
          return;
        }
        const counts = new Array(256).fill(0);
        for (let i = 0; i < bytes.length; i++) counts[bytes[i]]++;
        let entropy = 0;
        for (let i = 0; i < 256; i++) {
          if (counts[i] === 0) continue;
          const p = counts[i] / bytes.length;
          entropy -= p * Math.log2(p);
        }
        resolve(entropy);
      };
      reader.onerror = () => resolve(0);
      reader.readAsArrayBuffer(file.slice(0, sampleSize));
    });
  }

  function getExtensionParts(filename) {
    const parts = filename.split('.');
    if (parts.length <= 1) return [];
    return parts.slice(1).map((p) => p.toLowerCase());
  }

  /**
   * Analyze a File object and return a structured result:
   * {
   *   name, size, sizeMB,
   *   extension, allExtensions,
   *   isExecutableExt, isMacroOffice, isDoubleExtensionTrick,
   *   isTooLarge,
   *   signature: { format, kind } | null,
   *   signatureMismatch: bool,
   *   findings: [{ id, severity, extra }],
   *   riskScore, riskLevel
   * }
   */
  async function analyzeFile(file) {
    const extensions = getExtensionParts(file.name);
    const finalExt = extensions[extensions.length - 1] || '';
    const isExecutableExt = EXECUTABLE_EXTENSIONS.includes(finalExt);
    const isMacroOffice = MACRO_OFFICE_EXTENSIONS.includes(finalExt);
    const isArchiveExt = ARCHIVE_EXTENSIONS.includes(finalExt);

    // Double-extension trick: an earlier segment looks like a safe document
    // type, but the FINAL extension is executable (e.g. "invoice.pdf.exe").
    const isDoubleExtensionTrick =
      extensions.length >= 2 &&
      isExecutableExt &&
      COMMONLY_SPOOFED_EXTENSIONS.includes(extensions[extensions.length - 2]);

    const isTooLarge = file.size > 25 * 1024 * 1024;

    const signature = await readSignature(file);
    const entropy = await readEntropy(file);
    // A mismatch worth flagging: the file's real binary signature is an
    // executable format, but the extension doesn't say so (extension lied,
    // or was stripped/renamed).
    const signatureMismatch = !!(signature && signature.kind === 'executable' && !isExecutableExt);

    const findings = [];
    let riskScore = 0;
    const add = (id, points, severity, extra) => {
      findings.push({ id, severity, extra });
      riskScore += points;
    };

    if (signatureMismatch) {
      add('signatureMismatch', 45, 'high', signature.format);
    }
    if (isDoubleExtensionTrick) {
      add('doubleExtension', 40, 'high', extensions.join('.'));
    }
    if (isExecutableExt && !isDoubleExtensionTrick) {
      add('executableExt', 30, 'high', finalExt);
    }
    if (isMacroOffice) {
      add('macroOffice', 20, 'warn', finalExt);
    }
    if (isArchiveExt) {
      add('archiveExt', 8, 'info', finalExt);
    }
    if (isTooLarge) {
      add('tooLarge', 8, 'info');
    }
    // Very high entropy (close to the theoretical max of 8 bits/byte) means
    // the content looks statistically random - typical of packed/encrypted/
    // compressed data. This is only a meaningful red flag for file types
    // that are not *expected* to be compressed already (archives, jpg/png,
    // zip-based Office formats are naturally high-entropy and are excluded).
    const expectedHighEntropy = isArchiveExt || signature?.kind === 'zip' || signature?.kind === 'image';
    if (!expectedHighEntropy && entropy >= 7.5) {
      add('highEntropy', isExecutableExt || signatureMismatch ? 25 : 12, isExecutableExt || signatureMismatch ? 'high' : 'warn', entropy.toFixed(2));
    }

    riskScore = Math.max(0, Math.min(100, riskScore));
    let riskLevel = 'low';
    if (riskScore >= 40) riskLevel = 'high';
    else if (riskScore >= 15) riskLevel = 'medium';

    const safetyScore = Math.max(0, 100 - riskScore);
    const verdict = riskScore >= 40 ? 'unsafe' : riskScore >= 15 ? 'suspicious' : 'safe';

    return {
      name: file.name,
      size: file.size,
      sizeMB: file.size / (1024 * 1024),
      extension: finalExt,
      allExtensions: extensions,
      isExecutableExt,
      isMacroOffice,
      isDoubleExtensionTrick,
      isTooLarge,
      signature,
      signatureMismatch,
      entropy,
      findings,
      riskScore,
      riskLevel,
      safetyScore,
      verdict,
    };
  }

  window.analyzeFile = analyzeFile;
})();
