'use strict';
/* Music workspace, sound side: synthesised drums and instruments, the mixer graph, the playback scheduler
   (live, and offline for export), riff generators, waveform peaks and WAV encoding. Nothing here touches the page. */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
const SCALE_NAMES = { major: 'Major (bright)', minor: 'Minor (moody)', dorian: 'Dorian (jazzy)', mixolydian: 'Mixolydian (bluesy)', chromatic: 'All notes' };
const KIT = [['kick', 'Kick'], ['snare', 'Snare'], ['hat', 'Hi-hat'], ['clap', 'Clap'], ['ohat', 'Open hat'], ['tom', 'Tom'], ['rim', 'Rim'], ['shaker', 'Shaker']];
const STEPS = 16;   // steps in a bar (sixteenth notes)
const INSTR = {
  keys: { name: 'Keys', osc: [['triangle', 0, 1, .7], ['sine', 0, 2, .25]], a: .005, d: .35, s: .35, r: .25, c0: 5000, c1: 1800, fd: .3, gain: .5 },
  bass: { name: 'Bass', osc: [['sawtooth', 0, 1, .6], ['square', 0, .5, .5]], a: .005, d: .2, s: .7, r: .1, c0: 1400, c1: 380, fd: .12, q: 2, gain: .55 },
  pluck: { name: 'Pluck', osc: [['sawtooth', 0, 1, .6], ['square', 7, 1, .3]], a: .003, d: .12, s: .12, r: .15, c0: 6000, c1: 700, fd: .08, gain: .5 },
  pad: { name: 'Pad', osc: [['sawtooth', -9, 1, .4], ['sawtooth', 9, 1, .4], ['sine', 0, .5, .3]], a: .25, d: .6, s: .8, r: .7, c0: 1500, c1: 1900, fd: .5, gain: .28 },
  lead: { name: 'Lead', osc: [['square', 0, 1, .5], ['sawtooth', 5, 1, .3]], a: .01, d: .2, s: .7, r: .15, c0: 4500, c1: 2600, fd: .2, gain: .32 },
  bells: { name: 'Bells', osc: [['sine', 0, 1, .6], ['sine', 0, 3.01, .3], ['sine', 0, 5.4, .12]], a: .002, d: .5, s: 0, r: .6, c0: 9000, c1: 9000, fd: .5, gain: .45 },
};
const ROLES = {
  drums: { name: 'Drums', color: '#e8b86a' },
  bass: { name: 'Bass', preset: 'bass', base: 36, color: '#7d92ff' },
  chords: { name: 'Chords', preset: 'pad', base: 48, color: '#6fcf97' },
  melody: { name: 'Melody', preset: 'pluck', base: 60, color: '#f2789f' },
  audio: { name: 'Audio', color: '#9aa0a6' },
};

const stepDur = song => 60 / song.bpm / 4;
const songSteps = song => song.bars * STEPS;
const songDur = song => songSteps(song) * stepDur(song);
const keyOff = song => (song.key > 6 ? song.key - 12 : song.key);
/* the notes a riff track can use, low to high: two octaves of the song's scale from the track's base note */
function trackNotes(song, tr) {
  const sc = SCALES[song.scale] || SCALES.minor, base = ROLES[tr.role].base + keyOff(song), out = [];
  for (let o = 0; o < 2; o++) for (const s of sc) out.push(base + o * 12 + s);
  out.push(base + 24);
  return out;
}

const Sound = {
  _noise: new WeakMap(), _ir: new WeakMap(),
  noise(ctx) {
    if (!this._noise.has(ctx)) { const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this._noise.set(ctx, b); }
    return this._noise.get(ctx);
  },
  impulse(ctx) {   // a plain decaying-noise room
    if (!this._ir.has(ctx)) { const n = Math.floor(ctx.sampleRate * 2.2), b = ctx.createBuffer(2, n, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3; } this._ir.set(ctx, b); }
    return this._ir.get(ctx);
  },
  drum(ctx, out, name, t, v = 1) {
    const g = ctx.createGain(); g.connect(out);
    const osc = (type, f0, f1, dur) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(g); o.start(t); o.stop(t + dur + .3); };
    const amp = (peak, dur) => { g.gain.setValueAtTime(peak * v, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); };
    const nz = (type, freq, q, dur, level, at = t) => {
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), e = ctx.createGain();
      s.buffer = this.noise(ctx); s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
      e.gain.setValueAtTime(level * v, at); e.gain.exponentialRampToValueAtTime(.001, at + dur);
      s.connect(f); f.connect(e); e.connect(out); s.start(at); s.stop(at + dur + .02);
    };
    switch (name) {
      case 'kick': osc('sine', 150, 42, .12); amp(1, .38); break;
      case 'snare': osc('triangle', 220, 150, .1); amp(.5, .14); nz('highpass', 1800, .7, .18, .7); break;
      case 'clap': for (const o of [0, .012, .024]) nz('bandpass', 1300, 1.2, o === .024 ? .18 : .03, .7, t + o); break;
      case 'hat': nz('highpass', 7500, .8, .05, .4); break;
      case 'ohat': nz('highpass', 7000, .8, .32, .35); break;
      case 'tom': osc('sine', 190, 95, .2); amp(.8, .3); break;
      case 'rim': osc('square', 820, 0, .03); amp(.3, .04); nz('bandpass', 2500, 3, .03, .3); break;
      case 'shaker': nz('bandpass', 5500, 1.5, .09, .28); break;
    }
  },
  note(ctx, out, preset, midi, t, dur, v = .8) {
    const P = INSTR[preset] || INSTR.keys, f = 440 * 2 ** ((midi - 69) / 12), end = t + Math.max(.04, dur), amp = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = P.q || .7; lp.frequency.setValueAtTime(P.c0, t); lp.frequency.setTargetAtTime(P.c1, t, P.fd);
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(v * P.gain, t + P.a); amp.gain.setTargetAtTime(v * P.gain * P.s, t + P.a, P.d); amp.gain.setTargetAtTime(0, end, P.r / 3);
    lp.connect(amp); amp.connect(out);
    for (const [type, detune, ratio, level] of P.osc) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f * ratio; o.detune.value = detune; g.gain.value = level;
      o.connect(g); g.connect(lp); o.start(t); o.stop(end + P.r * 2 + .1);
    }
  },
};

/* One mixer: a strip per track (tone, pan, level, echo and room sends) into a limited master. Works on a live or an offline context. */
class Rig {
  constructor(ctx, bufs) {
    this.ctx = ctx; this.bufs = bufs; this.strips = new Map(); this.live = !(ctx instanceof OfflineAudioContext);
    this.master = ctx.createGain(); const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.ratio.value = 12; lim.attack.value = .003; lim.release.value = .2;
    this.master.connect(lim); lim.connect(ctx.destination);
    this.room = ctx.createConvolver(); this.room.buffer = Sound.impulse(ctx); this.room.connect(this.master);
    this.echo = ctx.createDelay(2); const fb = ctx.createGain(); fb.gain.value = .35; this.echo.connect(fb); fb.connect(this.echo); this.echo.connect(this.master);
  }
  set(param, v) { if (this.live) param.setTargetAtTime(v, this.ctx.currentTime, .015); else param.value = v; }
  strip(tr) {
    let s = this.strips.get(tr.id);
    if (!s) {
      const c = this.ctx; s = { in: c.createGain(), low: c.createBiquadFilter(), high: c.createBiquadFilter(), pan: c.createStereoPanner(), vol: c.createGain(), room: c.createGain(), echo: c.createGain() };
      s.low.type = 'lowshelf'; s.low.frequency.value = 220; s.high.type = 'highshelf'; s.high.frequency.value = 4200; s.vol.gain.value = 0; s.room.gain.value = 0; s.echo.gain.value = 0;
      s.in.connect(s.low); s.low.connect(s.high); s.high.connect(s.pan); s.pan.connect(s.vol); s.vol.connect(this.master); s.vol.connect(s.room); s.room.connect(this.room); s.vol.connect(s.echo); s.echo.connect(this.echo);
      this.strips.set(tr.id, s);
    }
    return s;
  }
  sync(song) {
    const solo = song.tracks.some(t => t.solo);
    for (const tr of song.tracks) {
      const s = this.strip(tr);
      this.set(s.vol.gain, tr.mute || (solo && !tr.solo) ? 0 : tr.vol ?? .8); this.set(s.pan.pan, tr.pan || 0); this.set(s.room.gain, tr.room || 0); this.set(s.echo.gain, tr.echo || 0);
      this.set(s.low.gain, tr.low || 0); this.set(s.high.gain, tr.high || 0);
    }
    this.set(this.master.gain, song.vol ?? .9); this.set(this.echo.delayTime, clamp(60 / song.bpm * .75, .05, 1.9));
  }
  /* everything the riff tracks play on one step */
  fire(song, step, t) {
    const sd = stepDur(song), bar = Math.floor(step / STEPS);
    for (const tr of song.tracks) {
      if (tr.type === 'audio' || (tr.on && tr.on[bar] === false)) continue;
      const ps = step % (tr.len * STEPS), out = this.strip(tr).in;
      if (tr.type === 'drums') { for (const [name] of KIT) if (tr.steps[name] && tr.steps[name][ps]) Sound.drum(this.ctx, out, name, t); }
      else for (const n of tr.notes) if (n.s === ps) Sound.note(this.ctx, out, tr.preset, n.n, t, n.d * sd * .96);
    }
  }
  /* start every audio clip that is still to come from `from` seconds into the song; `when` is the context time of that moment */
  clips(song, from, when, until = Infinity) {
    const made = [];
    for (const tr of song.tracks) {
      if (tr.type !== 'audio') continue;
      for (const c of tr.clips) {
        const buf = this.bufs.get(c.buf), skip = Math.max(0, from - c.start), len = Math.min(c.dur - skip, until - Math.max(c.start, from));
        if (!buf || len <= 0) continue;
        const src = this.ctx.createBufferSource(), g = this.ctx.createGain(); src.buffer = buf; g.gain.value = c.gain ?? 1; src.connect(g); g.connect(this.strip(tr).in);
        src.start(when + Math.max(0, c.start - from), c.off + skip, len); made.push(src);
      }
    }
    return made;
  }
}

/* Live playback. Steps are scheduled a little ahead of the clock so timing stays tight. */
const Player = {
  ctx: null, rig: null, bufs: new Map(), song: null, playing: false, loop: true, metro: false, pos: 0, sources: [], onstop: null,
  ready() {
    if (!this.ctx) { this.ctx = new AudioContext(); this.rig = new Rig(this.ctx, this.bufs); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  play(from = this.pos) {
    const song = this.song; if (!song) return;
    this.ready(); this.stop(true);
    if (from >= songDur(song) - .01) from = 0;
    this.rig.sync(song); this.bpm = song.bpm;
    const t0 = this.ctx.currentTime + .08;
    this.origin = this.prev = t0 - from; this.next = Math.ceil(from / stepDur(song) - 1e-6);
    this.sources = this.rig.clips(song, from, t0, this.loop ? songDur(song) : Infinity);
    this.playing = true; this.timer = setInterval(() => this.tick(), 25); this.tick();
  },
  stop(quiet) {
    if (this.playing) this.pos = this.now();
    clearInterval(this.timer); clearTimeout(this.ender); this.playing = false;
    for (const s of this.sources) { try { s.stop(); } catch (e) { /* already ended */ } } this.sources = [];
    if (this.rig && !quiet) { const m = this.rig.master, t = this.ctx.currentTime; m.gain.cancelScheduledValues(t); m.gain.setTargetAtTime(0, t, .01); setTimeout(() => { if (!this.playing && this.song) this.rig.set(m.gain, this.song.vol ?? .9); }, 400); }
    if (!quiet && this.onstop) this.onstop();
  },
  /* pick up edits (tempo, clips) without losing the place */
  refresh() { if (this.playing) this.play(this.now()); },
  now() {
    if (!this.playing) return this.pos;
    const t = this.ctx.currentTime, x = t - (t < this.origin ? this.prev : this.origin);
    return clamp(x, 0, songDur(this.song));
  },
  tick() {
    const song = this.song, sd = stepDur(song), total = songSteps(song);
    if (song.bpm !== this.bpm) return this.refresh();
    this.rig.sync(song);
    for (;;) {
      const t = this.origin + this.next * sd;
      if (t > this.ctx.currentTime + .15) break;
      if (this.next >= total) {
        if (!this.loop) { clearInterval(this.timer); this.ender = setTimeout(() => { this.playing = false; this.pos = 0; this.stop(); }, Math.max(0, (t - this.ctx.currentTime) * 1000)); return; }
        for (const s of this.sources) { try { s.stop(t); } catch (e) { /* already ended */ } }
        this.prev = this.origin; this.origin = t; this.next = 0; this.sources = this.rig.clips(song, 0, t, songDur(song));
        continue;
      }
      this.rig.fire(song, this.next, t);
      if (this.metro && this.next % 4 === 0) { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.value = this.next % STEPS ? 1000 : 1600; g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + .06); }
      this.next++;
    }
  },
  /* audition one sound while editing */
  tap(tr, what) {
    this.ready(); this.rig.sync(this.song); const out = this.rig.strip(tr).in, t = this.ctx.currentTime + .01;
    if (tr.type === 'drums') Sound.drum(this.ctx, out, what, t); else Sound.note(this.ctx, out, tr.preset, what, t, .3);
  },
};

/* the whole song as one AudioBuffer, for export */
function renderSong(song, bufs) {
  const sd = stepDur(song), total = songSteps(song), ctx = new OfflineAudioContext(2, Math.ceil((total * sd + 2.5) * 44100), 44100), rig = new Rig(ctx, bufs);
  rig.sync(song);
  for (let s = 0; s < total; s++) rig.fire(song, s, s * sd);
  rig.clips(song, 0, 0, total * sd);
  return ctx.startRendering();
}

function encodeWav(buf) {
  const ch = Math.min(2, buf.numberOfChannels), n = buf.length, out = new DataView(new ArrayBuffer(44 + n * ch * 2)), str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); str(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < ch; c++, o += 2) { const v = clamp(data[c][i], -1, 1); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); }
  return out.buffer;
}

/* min/max per 128 samples, for drawing waveforms at any zoom */
const _peaks = new WeakMap();
function peaksOf(buf) {
  if (_peaks.has(buf)) return _peaks.get(buf);
  const B = 128, n = Math.ceil(buf.length / B), lo = new Float32Array(n), hi = new Float32Array(n), a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a;
  for (let i = 0; i < n; i++) { let mn = 0, mx = 0; for (let j = i * B, e = Math.min(buf.length, j + B); j < e; j++) { const v = (a[j] + b[j]) / 2; if (v < mn) mn = v; if (v > mx) mx = v; } lo[i] = mn; hi[i] = mx; }
  const p = { lo, hi, per: B / buf.sampleRate }; _peaks.set(buf, p); return p;
}
function drawWave(cv, buf, off, dur, color) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, p = peaksOf(buf), mid = H / 2;
  g.clearRect(0, 0, W, H); g.fillStyle = color;
  for (let x = 0; x < W; x++) {
    const i0 = Math.floor((off + dur * x / W) / p.per), i1 = Math.max(i0 + 1, Math.floor((off + dur * (x + 1) / W) / p.per)); let mn = 0, mx = 0;
    for (let i = i0; i < i1 && i < p.lo.length; i++) { if (p.lo[i] < mn) mn = p.lo[i]; if (p.hi[i] > mx) mx = p.hi[i]; }
    g.fillRect(x, mid - mx * mid, 1, Math.max(1, (mx - mn) * mid));
  }
}

/* Riff generators. Everything follows the song's four-bar chord pattern, so separately generated parts fit together. */
const Gen = {
  progs: { bright: [[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 4, 3], [5, 3, 0, 4]], moody: [[0, 5, 2, 6], [0, 3, 5, 4], [0, 6, 5, 6], [0, 2, 3, 5]] },
  pick(a) { return a[Math.floor(Math.random() * a.length)]; },
  prog(song, fresh) { if (fresh || !song.prog) song.prog = this.pick(this.progs[song.scale === 'major' || song.scale === 'mixolydian' ? 'bright' : 'moody']); return song.prog; },
  /* scale degree (0 = the key note; 7 = an octave up) to a note for this track */
  deg(song, tr, d) { const notes = trackNotes({ ...song, scale: song.scale === 'chromatic' ? 'minor' : song.scale }, tr); return notes[clamp(d, 0, notes.length - 1)]; },
  drums(tr) {
    const S = {}, on = (name, ...at) => { S[name] = S[name] || Array(STEPS).fill(false); for (const i of at) S[name][i] = true; }, style = this.pick(['four', 'boom', 'half', 'break']);
    if (style === 'four') { on('kick', 0, 4, 8, 12); on(this.pick(['clap', 'snare']), 4, 12); on('hat', 2, 6, 10, 14); if (Math.random() < .5) on('ohat', 14); }
    if (style === 'boom') { on('kick', 0, 7, 10); on('snare', 4, 12); on('hat', 0, 2, 4, 6, 8, 10, 12, 14); }
    if (style === 'half') { on('kick', 0, 10); on('snare', 8); on('hat', 0, 2, 4, 6, 8, 10, 12, 14, 15); if (Math.random() < .5) on('rim', 3, 13); }
    if (style === 'break') { on('kick', 0, 6, 10); on('snare', 4, 12); on('hat', 0, 2, 4, 6, 8, 10, 12, 14); if (Math.random() < .6) on('snare', 15); }
    if (Math.random() < .35) on('shaker', 1, 3, 5, 7, 9, 11, 13, 15);
    tr.len = 1; tr.steps = S;
  },
  bass(song, tr) {
    const prog = this.prog(song), rhythm = this.pick([[[0, 3], [6, 2], [10, 2], [14, 2]], [[0, 4], [8, 2], [11, 3]], [[0, 2], [4, 2], [8, 2], [12, 2]], [[0, 6], [10, 4]], [[0, 3], [3, 3], [6, 2], [10, 3], [14, 2]]]);
    tr.len = 4; tr.notes = [];
    prog.forEach((d, bar) => rhythm.forEach(([s, dur], i) => tr.notes.push({ s: bar * STEPS + s, d: dur, n: this.deg(song, tr, d + (i && Math.random() < .3 ? this.pick([7, 4]) : 0)) })));
  },
  chords(song, tr) {
    const prog = this.prog(song), hits = this.pick([[[0, 16]], [[0, 16]], [[0, 6], [6, 6], [12, 4]], [[0, 8], [8, 8]], [[0, 3], [4, 3], [10, 3]]]);
    tr.len = 4; tr.notes = [];
    prog.forEach((d, bar) => { for (const [s, dur] of hits) for (const k of [0, 2, 4]) tr.notes.push({ s: bar * STEPS + s, d: dur, n: this.deg(song, tr, d + k > 9 ? d + k - 7 : d + k) }); });
  },
  melody(song, tr) {
    const prog = this.prog(song), rhythms = [[[0, 2], [2, 2], [4, 4], [10, 2], [12, 4]], [[0, 4], [6, 2], [8, 4], [14, 2]], [[0, 2], [3, 2], [6, 2], [8, 6]], [[2, 2], [4, 2], [6, 2], [8, 4], [12, 2], [14, 2]], [[0, 6], [8, 3], [11, 5]]];
    const a = this.pick(rhythms), b = this.pick(rhythms); let cur = 7;
    tr.len = 4; tr.notes = [];
    prog.forEach((d, bar) => (bar % 2 ? b : a).forEach(([s, dur], i) => {
      if (i === 0) { const tones = [d, d + 2, d + 4, d + 7, d + 9].filter(x => x >= 3 && x <= 14); cur = tones.reduce((best, x) => (Math.abs(x - cur) < Math.abs(best - cur) ? x : best), tones[0]); }
      else cur = clamp(cur + this.pick([-2, -1, -1, 1, 1, 2]), 3, 14);
      tr.notes.push({ s: bar * STEPS + s, d: dur, n: this.deg(song, tr, cur) });
    }));
  },
  fill(song, tr) { this[tr.role](tr.role === 'drums' ? tr : song, tr); },
};
