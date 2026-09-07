/**
 * attack-map.js — 3D interactive cyber attack globe for the "Attack Map" tab.
 *
 * Built with Globe.gl (which bundles Three.js internally), vendored locally
 * at js/vendor/globe.gl.min.js so the globe works with zero external network
 * dependency (no CDN required).
 *
 * Features:
 *  - Realistic Earth texture with continents/oceans + bump-mapped terrain
 *  - Country border outlines (Natural Earth 110m dataset)
 *  - Subtle atmosphere glow
 *  - Slow auto-rotation (pauses while the user is dragging)
 *  - Mouse-drag rotation, scroll/pinch zoom, and touch controls (all provided
 *    by Globe.gl's built-in OrbitControls integration)
 *  - Animated attack arcs between world cities, colored by attack type to
 *    match the legend already in index.html (DDoS / Exploit / Malware /
 *    Phishing)
 *  - Glowing source/destination points for each active attack
 *  - Wired to the existing "إعادة ضبط" (reset) / "إيقاف مؤقت" (pause)
 *    buttons and the total/rate counters already in the page
 */
(function () {
  const CONTAINER_ID = 'globe-container';

  const ATTACK_TYPES = [
    { key: 'ddos', color: '#ef4444' },
    { key: 'exploit', color: '#0ea5a3' },
    { key: 'malware', color: '#10b981' },
    { key: 'phishing', color: '#f59e0b' },
  ];

  // A spread of major world cities used as plausible attack source/target points.
  const CITIES = [
    { name: 'New York', lat: 40.7128, lng: -74.006 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Sao Paulo', lat: -23.5505, lng: -46.6333 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
    { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
    { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
    { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
    { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
    { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Seoul', lat: 37.5665, lng: 126.978 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  ];

  let world = null;
  let container = null;
  let attackTimer = null;
  let paused = false;
  let total = 0;
  let ratePerSecond = 0;
  let rateCounter = 0;
  let initialized = false;

  const activeArcs = [];
  const activePoints = [];

  function pickTwoDistinctCities() {
    const a = CITIES[Math.floor(Math.random() * CITIES.length)];
    let b = CITIES[Math.floor(Math.random() * CITIES.length)];
    while (b === a) {
      b = CITIES[Math.floor(Math.random() * CITIES.length)];
    }
    return [a, b];
  }

  function spawnAttack() {
    if (!world || paused) return;
    const [source, target] = pickTwoDistinctCities();
    const type = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
    const id = `${Date.now()}-${Math.random()}`;

    const arc = {
      id,
      startLat: source.lat,
      startLng: source.lng,
      endLat: target.lat,
      endLng: target.lng,
      color: type.color,
    };
    activeArcs.push(arc);

    const startPoint = { id: `${id}-s`, lat: source.lat, lng: source.lng, color: type.color };
    const endPoint = { id: `${id}-e`, lat: target.lat, lng: target.lng, color: type.color };
    activePoints.push(startPoint, endPoint);

    world.arcsData(activeArcs);
    world.pointsData(activePoints);

    total += 1;
    rateCounter += 1;
    updateCounters();

    // Remove this arc & its points after the animation has had time to play.
    setTimeout(() => {
      const arcIdx = activeArcs.indexOf(arc);
      if (arcIdx !== -1) activeArcs.splice(arcIdx, 1);
      const sIdx = activePoints.indexOf(startPoint);
      if (sIdx !== -1) activePoints.splice(sIdx, 1);
      const eIdx = activePoints.indexOf(endPoint);
      if (eIdx !== -1) activePoints.splice(eIdx, 1);
      if (world) {
        world.arcsData(activeArcs);
        world.pointsData(activePoints);
      }
    }, 3000);
  }

  function updateCounters() {
    const totalEl = document.getElementById('cyber-total');
    const rpsEl = document.getElementById('cyber-rps');
    if (totalEl) totalEl.textContent = total;
    if (rpsEl) rpsEl.textContent = ratePerSecond;
  }

  function scheduleNextAttack() {
    if (attackTimer) clearTimeout(attackTimer);
    const delay = 350 + Math.random() * 550; // 0.35s - 0.9s between attacks
    attackTimer = setTimeout(() => {
      spawnAttack();
      scheduleNextAttack();
    }, delay);
  }

  function resetMap() {
    total = 0;
    rateCounter = 0;
    ratePerSecond = 0;
    activeArcs.length = 0;
    activePoints.length = 0;
    if (world) {
      world.arcsData([]);
      world.pointsData([]);
    }
    updateCounters();
  }

  function currentPauseLabel() {
    return window.i18n ? window.i18n.t(paused ? 'cybermap.resume' : 'cybermap.pause') : paused ? 'Resume' : 'Pause';
  }

  function wireControls() {
    const resetBtn = document.getElementById('cyber-reset');
    const pauseBtn = document.getElementById('cyber-pause');

    if (resetBtn) {
      resetBtn.addEventListener('click', resetMap);
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        paused = !paused;
        pauseBtn.setAttribute('data-paused', String(paused));
        pauseBtn.textContent = currentPauseLabel();
        if (world) world.controls().autoRotate = !paused;
        if (!paused) scheduleNextAttack();
        else if (attackTimer) clearTimeout(attackTimer);
      });
    }

    document.addEventListener('languagechange', () => {
      if (pauseBtn) pauseBtn.textContent = currentPauseLabel();
    });
  }

  function resizeGlobe() {
    if (!world || !container) return;
    const w = container.clientWidth || container.offsetWidth;
    const h = container.clientHeight || container.offsetHeight || 600;
    if (w > 0 && h > 0) {
      world.width(w);
      world.height(h);
    }
  }

  function buildGlobe() {
    if (typeof Globe === 'undefined') {
      console.error('[attack-map] Globe.gl failed to load (js/vendor/globe.gl.min.js). The 3D attack map cannot be shown.');
      if (container) {
        container.innerHTML =
          '<p style="color:#ff6b6b; padding:20px; text-align:center;">تعذر تحميل مكتبة الكرة الأرضية ثلاثية الأبعاد.</p>';
      }
      return;
    }

    if (!isWebGLAvailable()) {
      console.error('[attack-map] WebGL is not available in this browser.');
      if (container) {
        container.innerHTML =
          '<p style="color:#ff6b6b; padding:20px; text-align:center;">متصفحك لا يدعم WebGL، وهو مطلوب لعرض الكرة الأرضية التفاعلية. جرّب متصفحًا حديثًا مثل Chrome أو Edge أو Firefox.</p>';
      }
      return;
    }

    if (!window.GLOBE_ASSETS || !window.GLOBE_ASSETS.earthTextureDataUri) {
      console.error('[attack-map] js/globe-assets.js failed to load or is incomplete.');
      if (container) {
        container.innerHTML =
          '<p style="color:#ff6b6b; padding:20px; text-align:center;">تعذر تحميل بيانات الكرة الأرضية (js/globe-assets.js).</p>';
      }
      return;
    }

    try {
      world = Globe()(container)
        .globeImageUrl(window.GLOBE_ASSETS.earthTextureDataUri)
        .bumpImageUrl(window.GLOBE_ASSETS.earthBumpDataUri)
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor('#00e5ff')
        .atmosphereAltitude(0.2)
        .arcsData([])
        .arcColor('color')
        .arcDashLength(0.4)
        .arcDashGap(2)
        .arcDashInitialGap(() => Math.random() * 5)
        .arcDashAnimateTime(1400)
        .arcStroke(0.55)
        .arcAltitudeAutoScale(0.35)
        .pointsData([])
        .pointColor('color')
        .pointAltitude(0.012)
        .pointRadius(0.4)
        .pointsMerge(false)
        .pointResolution(12);

      resizeGlobe();
      window.__attackMapWorld = world; // exposed for debugging/testing

      // Slightly brighten the default lighting so the globe reads clearly
      // against the page's dark background.
      const lights = world.lights();
      lights.forEach((light) => {
        if (light.type === 'AmbientLight') light.intensity *= 1.25;
        if (light.type === 'DirectionalLight') light.intensity *= 1.15;
      });
      world.lights(lights);

      // Slow, gentle auto-rotation; pauses automatically while the user
      // drags, and resumes afterward (Globe.gl / OrbitControls default
      // behavior once autoRotate is enabled). Drag-to-rotate, scroll/pinch
      // zoom, and touch are all provided automatically by these controls.
      const controls = world.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = true;
      controls.enablePan = false;
      controls.minDistance = 150;
      controls.maxDistance = 600;

      // Country border outlines, from the bundled Natural Earth dataset
      // (embedded directly rather than fetched, so it works under file://).
      try {
        const geojson = window.GLOBE_ASSETS.countriesGeoJSON;
        world
          .polygonsData(geojson.features)
          .polygonCapColor(() => 'rgba(0,0,0,0)')
          .polygonSideColor(() => 'rgba(0,229,255,0.04)')
          .polygonStrokeColor(() => 'rgba(139,242,254,0.45)')
          .polygonAltitude(0.006);
      } catch (err) {
        console.warn('[attack-map] Could not load country borders geojson:', err);
      }

      window.addEventListener('resize', resizeGlobe);

      scheduleNextAttack();
    } catch (err) {
      console.error('[attack-map] Failed to initialize the 3D globe:', err);
      if (container) {
        container.innerHTML =
          '<p style="color:#ff6b6b; padding:20px; text-align:center;">حدث خطأ غير متوقع أثناء تحميل الكرة الأرضية. جرّب إعادة تحميل الصفحة.</p>';
      }
    }
  }

  /** Quick, defensive check for real WebGL support. */
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  function initOnce() {
    if (initialized) return;
    container = document.getElementById(CONTAINER_ID);
    if (!container) return;
    initialized = true;
    wireControls();
    buildGlobe();
  }

  // The globe container lives inside a `display:none` panel until the user
  // opens the "خريطة الهجمات" (Attack Map) tab. WebGL canvases need a
  // non-zero size at creation time, so we lazily build the globe the first
  // time that tab becomes visible, then just re-measure on later visits.
  document.addEventListener('tabchange', (e) => {
    if (e.detail && e.detail.tab === 'cybermap') {
      if (!initialized) {
        // Give the panel a frame to actually become visible/sized first.
        requestAnimationFrame(() => requestAnimationFrame(initOnce));
      } else {
        requestAnimationFrame(resizeGlobe);
      }
    }
  });

  // Fallback: if the cybermap tab is already active on page load (e.g. deep
  // link or browser restore), initialize immediately once the DOM is ready.
  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('tab-cybermap');
    if (panel && panel.style.display !== 'none') {
      requestAnimationFrame(() => requestAnimationFrame(initOnce));
    }
  });
})();
