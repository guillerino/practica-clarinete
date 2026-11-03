(function () {
  'use strict';

  const { NOTES, PRESETS } = window.NOTE_DATA;
  const SVGNS = 'http://www.w3.org/2000/svg';

  // ---------- Estado ----------
  const state = {
    playing: false,
    timer: null,
    count: 0,
    orderIndex: 0,
    current: null,
    wakeLockSentinel: null,
    settings: loadSettings(),
  };

  // ---------- Elementos ----------
  const el = {
    staffWrap: document.getElementById('staffWrap'),
    staff: document.getElementById('staff'),
    fingeringWrap: document.getElementById('fingeringWrap'),
    fingering: document.getElementById('fingering'),
    nameWrap: document.getElementById('nameWrap'),
    noteName: document.getElementById('noteName'),
    startHint: document.getElementById('startHint'),
    btnPlay: document.getElementById('btnPlay'),
    btnNext: document.getElementById('btnNext'),
    count: document.getElementById('count'),
    btnSettings: document.getElementById('btnSettings'),
    btnCloseSettings: document.getElementById('btnCloseSettings'),
    overlay: document.getElementById('settingsOverlay'),
    showStaff: document.getElementById('showStaff'),
    showFingering: document.getElementById('showFingering'),
    showName: document.getElementById('showName'),
    speed: document.getElementById('speed'),
    speedLabel: document.getElementById('speedLabel'),
    qStaff: document.getElementById('qStaff'),
    qFingering: document.getElementById('qFingering'),
    qName: document.getElementById('qName'),
    qSpeed: document.getElementById('qSpeed'),
    qSpeedLabel: document.getElementById('qSpeedLabel'),
    rangeFrom: document.getElementById('rangeFrom'),
    rangeTo: document.getElementById('rangeTo'),
    sound: document.getElementById('sound'),
    wakeLock: document.getElementById('wakeLock'),
  };

  // ---------- Ajustes persistentes ----------
  function loadSettings() {
    const defaults = {
      showStaff: true,
      showFingering: true,
      showName: true,
      speed: 3,
      order: 'random',
      accidentals: 'natural',
      from: 'G3',
      to: 'C5',
      sound: false,
      wakeLock: true,
    };
    try {
      const saved = JSON.parse(localStorage.getItem('clarinet-practice') || '{}');
      return Object.assign(defaults, saved);
    } catch (e) {
      return defaults;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem('clarinet-practice', JSON.stringify(state.settings));
    } catch (e) { /* almacenamiento no disponible */ }
  }

  // ---------- Rango activo ----------
  function activeNotes() {
    const fromStep = noteById(state.settings.from).step;
    const toStep = noteById(state.settings.to).step;
    const lo = Math.min(fromStep, toStep);
    const hi = Math.max(fromStep, toStep);
    const level = state.settings.accidentals;
    return NOTES.filter((n) => {
      if (n.step < lo || n.step > hi) return false;
      return allowedByAccidentals(n, level);
    });
  }

  // Filtro por nivel de alteraciones.
  //  'natural' -> solo notas sin sostenido/bemol
  //  'basic'   -> naturales + Fa# y Sib (las dos primeras que se aprenden)
  //  'all'     -> todas
  function allowedByAccidentals(n, level) {
    if (!n.accidental) return true;           // natural, siempre pasa
    if (level === 'all') return true;
    if (level === 'basic') {
      const key = n.letter + n.accidental;    // 'F#' = Fa#, 'A#' = Sib en estos datos
      return key === 'F#' || key === 'A#';
    }
    return false;                             // 'natural': se excluyen las alteradas
  }

  function noteById(id) {
    return NOTES.find((n) => n.id === id) || NOTES[0];
  }

  // ---------- Selección de la siguiente nota ----------
  function pickNext() {
    const pool = activeNotes();
    if (pool.length === 0) return null;

    if (state.settings.order === 'random') {
      if (pool.length === 1) return pool[0];
      let n;
      do {
        n = pool[Math.floor(Math.random() * pool.length)];
      } while (state.current && n.id === state.current.id);
      return n;
    }

    // Ascendente o descendente: recorre el pool en orden.
    const ordered = state.settings.order === 'desc' ? [...pool].reverse() : pool;
    const note = ordered[state.orderIndex % ordered.length];
    state.orderIndex++;
    return note;
  }

  // ---------- Mostrar una nota ----------
  function showNote(note) {
    if (!note) return;
    state.current = note;
    drawStaff(note);
    drawFingering(note);
    el.noteName.textContent = note.latin;

    [el.staff, el.fingering, el.noteName].forEach((n) => {
      n.classList.remove('pop');
      void n.offsetWidth; // reinicia animación
      n.classList.add('pop');
    });

    if (state.settings.sound) playTone(note.freq);

    state.count++;
    el.count.textContent = state.count;
  }

  // ---------- Dibujo del pentagrama ----------
  function drawStaff(note) {
    const svg = el.staff;
    svg.innerHTML = '';

    const W = 320, H = 200;
    const lineGap = 14;        // separación entre líneas
    const topLine = 60;        // y de la línea superior (5ª)
    const cx = 200;            // x de la cabeza de nota

    // Líneas del pentagrama (5)
    for (let i = 0; i < 5; i++) {
      const y = topLine + i * lineGap;
      line(svg, 30, y, 290, y, '#2d3748', 2);
    }

    // Clave de Sol (dibujada como texto musical)
    const clef = document.createElementNS(SVGNS, 'text');
    clef.setAttribute('x', 40);
    clef.setAttribute('y', topLine + 4 * lineGap + 10);
    clef.setAttribute('font-size', '96');
    clef.setAttribute('fill', '#2d3748');
    clef.textContent = '\uD834\uDD1E'; // 𝄞 clave de sol
    svg.appendChild(clef);

    // Posición vertical de la nota.
    // La línea inferior (1ª) del pentagrama en clave de Sol es Mi4 (step de E4).
    // Cada paso diatónico = medio lineGap.
    const bottomLineStep = noteStep('E', 4);   // Mi4
    const bottomLineY = topLine + 4 * lineGap; // y de la 1ª línea (inferior)
    const stepsAbove = note.step - bottomLineStep;
    const noteY = bottomLineY - stepsAbove * (lineGap / 2);

    // Líneas adicionales (ledger lines) por encima/debajo.
    drawLedgerLines(svg, cx, noteY, topLine, bottomLineY, lineGap);

    // Cabeza de nota (elipse)
    const head = document.createElementNS(SVGNS, 'ellipse');
    head.setAttribute('cx', cx);
    head.setAttribute('cy', noteY);
    head.setAttribute('rx', 9);
    head.setAttribute('ry', 7);
    head.setAttribute('fill', '#1a202c');
    head.setAttribute('transform', `rotate(-20 ${cx} ${noteY})`);
    svg.appendChild(head);

    // Plica (stem)
    const stemUp = noteY > topLine + 2 * lineGap;
    if (stemUp) {
      line(svg, cx + 8, noteY, cx + 8, noteY - 46, '#1a202c', 2.4);
    } else {
      line(svg, cx - 8, noteY, cx - 8, noteY + 46, '#1a202c', 2.4);
    }

    // Alteración (# o b) delante de la cabeza
    if (note.accidental) {
      const acc = document.createElementNS(SVGNS, 'text');
      acc.setAttribute('x', cx - 34);
      acc.setAttribute('y', noteY + 8);
      acc.setAttribute('font-size', '34');
      acc.setAttribute('fill', '#1a202c');
      acc.setAttribute('font-weight', 'bold');
      acc.textContent = note.accidental === '#' ? '\u266F' : '\u266D';
      svg.appendChild(acc);
    }
  }

  function drawLedgerLines(svg, cx, noteY, topLine, bottomLineY, lineGap) {
    const half = lineGap / 2;
    // Por debajo de la línea inferior
    let y = bottomLineY + lineGap;
    while (noteY >= y - 0.5) {
      line(svg, cx - 16, y, cx + 16, y, '#2d3748', 2);
      y += lineGap;
    }
    // Por encima de la línea superior
    y = topLine - lineGap;
    while (noteY <= y + 0.5) {
      line(svg, cx - 16, y, cx + 16, y, '#2d3748', 2);
      y -= lineGap;
    }
  }

  function noteStep(letter, octave) {
    const idx = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    return octave * 7 + idx[letter];
  }

  function line(svg, x1, y1, x2, y2, stroke, w) {
    const l = document.createElementNS(SVGNS, 'line');
    l.setAttribute('x1', x1);
    l.setAttribute('y1', y1);
    l.setAttribute('x2', x2);
    l.setAttribute('y2', y2);
    l.setAttribute('stroke', stroke);
    l.setAttribute('stroke-width', w);
    l.setAttribute('stroke-linecap', 'round');
    svg.appendChild(l);
  }

  // ---------- Dibujo de la digitación ----------
  // viewBox del SVG: 0 0 120 520. Dos "columnas": frontal (agujeros) y laterales.
  function drawFingering(note) {
    const svg = el.fingering;
    svg.innerHTML = '';
    const f = note.fingering;

    const bodyX = 62;        // eje central del cuerpo
    const topY = 24;
    const bottomY = 496;

    // Cuerpo del clarinete
    const body = document.createElementNS(SVGNS, 'rect');
    body.setAttribute('x', bodyX - 20);
    body.setAttribute('y', topY);
    body.setAttribute('width', 40);
    body.setAttribute('height', bottomY - topY);
    body.setAttribute('rx', 18);
    body.setAttribute('fill', '#2d3748');
    svg.appendChild(body);

    // Boquilla arriba
    const mp = document.createElementNS(SVGNS, 'path');
    mp.setAttribute('d', `M ${bodyX - 11} ${topY} Q ${bodyX} ${topY - 15} ${bodyX + 11} ${topY} Z`);
    mp.setAttribute('fill', '#4a5568');
    svg.appendChild(mp);

    // Campana abajo
    const bell = document.createElementNS(SVGNS, 'path');
    bell.setAttribute('d', `M ${bodyX - 20} ${bottomY} L ${bodyX - 30} ${bottomY + 14} L ${bodyX + 30} ${bottomY + 14} L ${bodyX + 20} ${bottomY} Z`);
    bell.setAttribute('fill', '#4a5568');
    svg.appendChild(bell);

    if (!f) return;

    // --- Trasera (pulgar izquierdo): registro + agujero del pulgar ---
    keyCircle(svg, bodyX - 34, 66, 8, f.reg, 'back', 'R');     // llave de registro
    hole(svg, bodyX - 30, 96, 7, f.thumb, true);               // agujero del pulgar

    // --- Llaves de garganta (lado, mano izquierda) ---
    keyCircle(svg, bodyX + 30, 86, 7, f.A, 'side');            // llave La de garganta
    keyCircle(svg, bodyX + 30, 112, 7, f.Gs, 'side');          // llave Sol#/Lab

    // --- Agujeros mano izquierda ---
    hole(svg, bodyX, 96, 10, f.L1);
    hole(svg, bodyX, 134, 10, f.L2);
    hole(svg, bodyX, 172, 10, f.L3);

    // --- Agujeros mano derecha ---
    hole(svg, bodyX, 296, 10, f.R1);
    hole(svg, bodyX, 334, 10, f.R2);
    hole(svg, bodyX, 372, 10, f.R3);

    // --- Meñique izquierdo (abajo-izquierda) ---
    keyCircle(svg, bodyX - 30, 224, 7, f.pL_EB, 'side');       // Mi/Si
    keyCircle(svg, bodyX - 30, 248, 7, f.pL_FsCs, 'side');     // Fa#/Do#

    // --- Meñique derecho (abajo-derecha) ---
    keyCircle(svg, bodyX + 30, 420, 7, f.pR_FC, 'side');       // Fa/Do
    keyCircle(svg, bodyX + 30, 444, 7, f.pR_AbEb, 'side');     // Lab/Mib
  }

  // Agujero principal: relleno (naranja) si está tapado
  function hole(svg, cx, cy, r, filled, back) {
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('stroke', '#fff');
    c.setAttribute('stroke-width', 2.2);
    c.setAttribute('fill', filled ? '#f6ad55' : 'rgba(255,255,255,0.10)');
    svg.appendChild(c);
  }

  // Llave lateral/trasera: resaltada (naranja) si está pulsada.
  // kind: 'side' (frontal lateral) o 'back' (trasera). label opcional ('R' para registro).
  function keyCircle(svg, cx, cy, r, active, kind, label) {
    const bodyX = 62;
    // conector al cuerpo
    const l = document.createElementNS(SVGNS, 'line');
    l.setAttribute('x1', cx < bodyX ? cx + r : cx - r);
    l.setAttribute('y1', cy);
    l.setAttribute('x2', bodyX);
    l.setAttribute('y2', cy);
    l.setAttribute('stroke', active ? '#f6ad55' : '#718096');
    l.setAttribute('stroke-width', 2);
    svg.appendChild(l);

    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('stroke', active ? '#f6ad55' : (kind === 'back' ? '#718096' : '#cbd5e0'));
    c.setAttribute('stroke-width', 2.2);
    c.setAttribute('fill', active ? '#f6ad55' : 'rgba(255,255,255,0.06)');
    svg.appendChild(c);

    if (label) {
      const t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', cx);
      t.setAttribute('y', cy + 3.5);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '9');
      t.setAttribute('font-weight', 'bold');
      t.setAttribute('fill', active ? '#2d3748' : '#a0aec0');
      t.textContent = label;
      svg.appendChild(t);
    }
  }

  // ---------- Audio (tono senoidal suave) ----------
  let audioCtx = null;
  function playTone(freq) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.9);
    } catch (e) { /* audio no disponible */ }
  }

  // ---------- Wake Lock ----------
  async function requestWakeLock() {
    if (!state.settings.wakeLock) return;
    if (!('wakeLock' in navigator)) return;
    try {
      state.wakeLockSentinel = await navigator.wakeLock.request('screen');
    } catch (e) { /* ignorado */ }
  }
  async function releaseWakeLock() {
    try {
      if (state.wakeLockSentinel) {
        await state.wakeLockSentinel.release();
        state.wakeLockSentinel = null;
      }
    } catch (e) { /* ignorado */ }
  }
  // Reactivar si se vuelve a la pestaña mientras se reproduce
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.playing) requestWakeLock();
  });

  // ---------- Play / pausa ----------
  function play() {
    if (state.playing) return;
    state.playing = true;
    state.orderIndex = 0;
    el.btnPlay.textContent = '⏸ Parar';
    el.btnPlay.classList.add('playing');
    el.startHint.classList.add('hidden');
    requestWakeLock();
    // Desbloquea el audio en el primer gesto
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    showNote(pickNext());
    scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(state.timer);
    const ms = state.settings.speed * 1000;
    state.timer = setTimeout(() => {
      showNote(pickNext());
      scheduleNext();
    }, ms);
  }

  function stop() {
    state.playing = false;
    clearTimeout(state.timer);
    el.btnPlay.textContent = '▶ Play';
    el.btnPlay.classList.remove('playing');
    releaseWakeLock();
  }

  function manualNext() {
    // Resume audio context if needed (user gesture)
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    showNote(pickNext());
    if (state.playing) scheduleNext(); // reinicia el temporizador
    el.startHint.classList.add('hidden');
  }

  // ---------- Aplicar visibilidad de tarjetas ----------
  function applyVisibility() {
    el.staffWrap.classList.toggle('hidden', !state.settings.showStaff);
    el.fingeringWrap.classList.toggle('hidden', !state.settings.showFingering);
    el.nameWrap.classList.toggle('hidden', !state.settings.showName);
  }

  // Cambia una visualización y mantiene sincronizados el toggle rápido,
  // la casilla de ajustes y el estado guardado.
  const VIS = {
    showStaff: { check: 'showStaff', quick: 'qStaff' },
    showFingering: { check: 'showFingering', quick: 'qFingering' },
    showName: { check: 'showName', quick: 'qName' },
  };
  function setVisibility(key, value) {
    state.settings[key] = value;
    el[VIS[key].check].checked = value;
    el[VIS[key].quick].setAttribute('aria-pressed', String(value));
    applyVisibility();
    saveSettings();
  }

  // Cambia la velocidad y sincroniza ambos sliders y etiquetas.
  function setSpeed(value) {
    state.settings.speed = value;
    el.speed.value = value;
    el.qSpeed.value = value;
    el.speedLabel.textContent = value;
    el.qSpeedLabel.textContent = value;
    saveSettings();
    if (state.playing) scheduleNext();
  }

  // ---------- Poblar selectores de rango ----------
  function populateRanges() {
    el.rangeFrom.innerHTML = '';
    el.rangeTo.innerHTML = '';
    NOTES.forEach((n) => {
      const label = `${n.latin}${n.octave}`;
      el.rangeFrom.appendChild(new Option(label, n.id));
      el.rangeTo.appendChild(new Option(label, n.id));
    });
    el.rangeFrom.value = state.settings.from;
    el.rangeTo.value = state.settings.to;
  }

  // ---------- Inicializar UI desde ajustes ----------
  function syncUI() {
    el.showStaff.checked = state.settings.showStaff;
    el.showFingering.checked = state.settings.showFingering;
    el.showName.checked = state.settings.showName;
    el.qStaff.setAttribute('aria-pressed', String(state.settings.showStaff));
    el.qFingering.setAttribute('aria-pressed', String(state.settings.showFingering));
    el.qName.setAttribute('aria-pressed', String(state.settings.showName));
    el.speed.value = state.settings.speed;
    el.speedLabel.textContent = state.settings.speed;
    el.qSpeed.value = state.settings.speed;
    el.qSpeedLabel.textContent = state.settings.speed;
    el.sound.checked = state.settings.sound;
    el.wakeLock.checked = state.settings.wakeLock;
    document.querySelector(`input[name="order"][value="${state.settings.order}"]`).checked = true;
    document.querySelector(`input[name="accidentals"][value="${state.settings.accidentals}"]`).checked = true;
    applyVisibility();
  }

  // ---------- Eventos ----------
  function bindEvents() {
    el.btnPlay.addEventListener('click', () => (state.playing ? stop() : play()));
    el.btnNext.addEventListener('click', manualNext);

    el.btnSettings.addEventListener('click', () => el.overlay.classList.remove('hidden'));
    el.btnCloseSettings.addEventListener('click', () => el.overlay.classList.add('hidden'));
    el.overlay.addEventListener('click', (e) => {
      if (e.target === el.overlay) el.overlay.classList.add('hidden');
    });

    // Casillas de ajustes
    el.showStaff.addEventListener('change', (e) => setVisibility('showStaff', e.target.checked));
    el.showFingering.addEventListener('change', (e) => setVisibility('showFingering', e.target.checked));
    el.showName.addEventListener('change', (e) => setVisibility('showName', e.target.checked));

    // Botones-toggle rápidos en pantalla
    el.qStaff.addEventListener('click', () => setVisibility('showStaff', !state.settings.showStaff));
    el.qFingering.addEventListener('click', () => setVisibility('showFingering', !state.settings.showFingering));
    el.qName.addEventListener('click', () => setVisibility('showName', !state.settings.showName));

    // Sliders de velocidad (ajustes + pantalla), sincronizados
    el.speed.addEventListener('input', (e) => setSpeed(parseInt(e.target.value, 10)));
    el.qSpeed.addEventListener('input', (e) => setSpeed(parseInt(e.target.value, 10)));

    document.querySelectorAll('input[name="order"]').forEach((r) => {
      r.addEventListener('change', (e) => {
        if (e.target.checked) { state.settings.order = e.target.value; state.orderIndex = 0; saveSettings(); }
      });
    });

    document.querySelectorAll('input[name="accidentals"]').forEach((r) => {
      r.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.settings.accidentals = e.target.value;
          state.orderIndex = 0;
          saveSettings();
          // Si la nota mostrada ya no entra en el filtro, refrescamos el ejemplo.
          const pool = activeNotes();
          if (pool.length && (!state.current || !pool.some((n) => n.id === state.current.id))) {
            const first = pool[0];
            drawStaff(first);
            drawFingering(first);
            el.noteName.textContent = first.latin;
            state.current = first;
          }
        }
      });
    });

    el.rangeFrom.addEventListener('change', (e) => { state.settings.from = e.target.value; state.orderIndex = 0; saveSettings(); });
    el.rangeTo.addEventListener('change', (e) => { state.settings.to = e.target.value; state.orderIndex = 0; saveSettings(); });

    el.sound.addEventListener('change', (e) => {
      state.settings.sound = e.target.checked;
      saveSettings();
      if (e.target.checked && !audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) {}
      }
    });
    el.wakeLock.addEventListener('change', (e) => {
      state.settings.wakeLock = e.target.checked;
      saveSettings();
      if (e.target.checked && state.playing) requestWakeLock();
      if (!e.target.checked) releaseWakeLock();
    });

    document.querySelectorAll('.presets button').forEach((b) => {
      b.addEventListener('click', () => {
        const p = PRESETS[b.dataset.preset];
        if (!p) return;
        state.settings.from = p.from;
        state.settings.to = p.to;
        el.rangeFrom.value = p.from;
        el.rangeTo.value = p.to;
        state.orderIndex = 0;
        saveSettings();
      });
    });

    // Barra espaciadora = siguiente nota (útil en ordenador)
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); manualNext(); }
      if (e.code === 'Enter') { e.preventDefault(); state.playing ? stop() : play(); }
    });
  }

  // ---------- Arranque ----------
  function init() {
    populateRanges();
    syncUI();
    bindEvents();
    // Muestra una nota inicial de ejemplo (sin contar)
    const first = activeNotes()[0];
    if (first) {
      drawStaff(first);
      drawFingering(first);
      el.noteName.textContent = first.latin;
    }
  }

  init();
})();
