// Sons gerados via Web Audio API (sem arquivos externos).
// Precisa ser disparado a partir de um gesto do usuario (clique) para o navegador liberar audio.

let ctx;
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    // iPhone: toca mesmo com a chave do silencioso ligada (Safari 17+)
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch {
      /* sem suporte */
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// "Desbloqueia" o audio num clique (chamar em qualquer interacao)
export function unlockAudio() {
  try {
    ac();
  } catch {
    /* navegador sem suporte */
  }
}

// ---------- Musica da revelacao (arquivos fornecidos pelo usuario) ----------
// Toca um arquivo de audio (ex.: /hino-palmeiras.mp3 no menino,
// /musica-menina.mp3 na menina). Se o arquivo faltar/falhar, chama onFail()
// para cair no fallback sintetizado (fanfarra).
let songEl = null;

export function playSong(src, onFail, onEnded) {
  try {
    stopSong();
    songEl = new Audio(src);
    songEl.volume = 0.95;
    songEl.addEventListener('error', () => {
      if (onFail) onFail();
    });
    if (onEnded) songEl.addEventListener('ended', onEnded);
    const p = songEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (onFail) onFail();
      });
    }
    return songEl;
  } catch {
    if (onFail) onFail();
    return null;
  }
}

export function stopSong() {
  try {
    if (songEl) {
      songEl.pause();
      songEl.currentTime = 0;
      songEl = null;
    }
  } catch {
    /* ignore */
  }
}

// Batida grave de tambor (suspense)
function drum(time, { freq = 95, dur = 0.28, gain = 0.9 } = {}) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, time);
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, time + dur);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(g).connect(c.destination);
  o.start(time);
  o.stop(time + dur + 0.02);
}

// Um "tick" de tambor com pequeno rufar duplo
export function playTick() {
  try {
    const t = ac().currentTime;
    drum(t, { freq: 110, dur: 0.22, gain: 0.8 });
    drum(t + 0.09, { freq: 90, dur: 0.26, gain: 0.6 });
  } catch {
    /* ignore */
  }
}

// Rufar contínuo curto (usado no último segundo antes de revelar)
export function playRoll(duration = 1.0) {
  try {
    const c = ac();
    const start = c.currentTime;
    let t = start;
    const step = 0.06;
    while (t < start + duration) {
      drum(t, { freq: 130, dur: 0.08, gain: 0.35 });
      t += step;
    }
  } catch {
    /* ignore */
  }
}

// Fanfarra de comemoração + estouro de "confete" (ruído)
export function playCelebration() {
  try {
    const c = ac();
    const t0 = c.currentTime;

    // Arpejo alegre
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      const st = t0 + i * 0.12;
      o.frequency.setValueAtTime(f, st);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.5, st + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.5);
      o.connect(g).connect(c.destination);
      o.start(st);
      o.stop(st + 0.55);
    });

    // Acorde final sustentado
    [523.25, 659.25, 783.99].forEach((f) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      const st = t0 + 0.5;
      o.frequency.setValueAtTime(f, st);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.28, st + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 1.2);
      o.connect(g).connect(c.destination);
      o.start(st);
      o.stop(st + 1.25);
    });

    // "Psss" do estouro (ruído branco filtrado)
    const buffer = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.5, t0);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    noise.connect(filter).connect(ng).connect(c.destination);
    noise.start(t0);
    noise.stop(t0 + 0.6);
  } catch {
    /* ignore */
  }
}
