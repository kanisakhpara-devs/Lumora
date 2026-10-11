'use strict';
/* Music workspace. Beginner is a jam board: riff cards (drums, bass, chords, melody, your own audio) that loop together.
   Advanced lays the same song out on a timeline, adds a mixer, and gives audio tracks range editing and effects.
   Both views edit one song object and play through the same engine (music-engine.js). */

const uid = () => Math.random().toString(36).slice(2, 9);
const MU_TIPS = {
  tempo: 'How fast the song is, in beats per minute. 80 to 100 feels relaxed, 120 and up feels like dancing.',
  key: 'The home note of the song. Change it to move everything higher or lower. If it sounds fine, leave it.',
  scale: 'The set of notes the riffs are allowed to use. Major sounds bright, Minor sounds moody. Because of it, no note you click will sound wrong.',
  bars: 'A bar is one count of four beats. This is how many bars the song lasts before it loops.',
  loop: 'When on, playback goes back to the start at the end of the song.',
  metro: 'A click on every beat while playing, to help you keep time when recording.',
  idea: 'Writes a fresh riff for this card that fits the rest of the song. Don’t like it? Press again, or Undo.',
  vol: 'How loud this part is.', pan: 'Places this part to the left or right.',
  room: 'Sends this part into a room echo (reverb) so it sounds further away and bigger.',
  echo: 'Repeats this part in time with the song (delay).',
  low: 'Boosts or cuts the deep, bassy end of this part.', high: 'Boosts or cuts the bright, crisp end of this part.',
};

const Music = {
  id: 'music', name: 'Music', exclusive: true, song: null, files: new Map(), sel: null, clipSel: null, range: null, cursor: 0, pps: 40, undo: [], redo: [], grids: [], clipboard: null, rec: null,

  /* ---- song lifecycle */
  blank(name) { return { name, bpm: 100, key: 9, scale: 'minor', bars: 4, vol: .9, prog: null, tracks: [] }; },
  async init(el) {
    el.left.remove(); el.right.remove(); el.center.classList.add('music');
    this.bar = h('div', { class: 'mu-bar' }); this.tools = h('div', { class: 'mu-tools' }); this.stage = h('div', { class: 'mu-stage' }); this.editor = h('div', { class: 'mu-editor' });
    el.center.append(this.bar, this.tools, this.stage, this.editor);
    Player.onstop = () => { if (this.song) this.drawBar(); };
    App.on('prefs', k => { if (k === 'beginner') this.draw(); });
    App.on('theme', () => this.draw());
    this.saveSoon = debounce(() => this.save().catch(UI.error), 900);
    const last = App.conf('music_last', null), data = last ? await api('music_load', { name: last }).catch(() => null) : null;
    if (data) await this.load(data); else await this.create(true);
    const frame = () => { if (App.module === 'music') this.frame(); requestAnimationFrame(frame); }; requestAnimationFrame(frame);
  },
  show() { if (this.song) this.draw(); },
  hide() { Player.stop(); this.stopRec(); },
  async create(quiet) {
    const taken = new Set((await api('music_list')).map(s => s.name.toLowerCase())); let name = 'Untitled Song', n = 1;
    while (taken.has(name.toLowerCase())) name = 'Untitled Song ' + ++n;
    await this.load(this.blank(name)); if (!quiet) this.changed();
  },
  async load(data) {
    Player.stop(); Player.bufs.clear(); this.files.clear(); this.undo = []; this.redo = []; this.sel = this.clipSel = this.range = null; this.cursor = Player.pos = 0;
    const bufs = data.bufs || {}; delete data.bufs;
    this.song = Player.song = data;
    for (const [id, path] of Object.entries(bufs)) { try { Player.bufs.set(id, await this.decode(path)); this.files.set(id, path); } catch (e) { UI.toast('Could not open ' + path.split(/[\\/]/).pop(), 'error'); } }
    App.setConf('music_last', data.name); this.draw();
  },
  async decode(path) { const r = await fetch('/img/audio?path=' + encodeURIComponent(path)); if (!r.ok) throw new Error('missing'); return Player.ready().decodeAudioData(await r.arrayBuffer()); },
  async save() {
    const song = this.song, used = new Set(song.tracks.flatMap(t => (t.clips || []).map(c => c.buf))), bufs = {};
    for (const id of used) {
      if (!this.files.has(id) && Player.bufs.has(id)) this.files.set(id, (await upload('music_audio_put', { song: song.name, file: id + '.wav' }, encodeWav(Player.bufs.get(id)))).path);
      if (this.files.has(id)) bufs[id] = this.files.get(id);
    }
    await api('music_save', { name: song.name, song: { ...song, bufs } });
  },
  changed() { this.saveSoon(); },
  /* remember the song as it is now, so the next change can be undone */
  mark() { this.undo.push(JSON.stringify(this.song)); if (this.undo.length > 80) this.undo.shift(); this.redo = []; },
  clipSig() { return JSON.stringify(this.song.tracks.map(t => t.clips || 0)); },
  edit(fn, redraw = true) { this.mark(); const before = this.clipSig(); fn(); this.changed(); if (before !== this.clipSig()) Player.refresh(); if (redraw) this.draw(); },
  step(from, to) {
    if (!from.length) return; to.push(JSON.stringify(this.song));
    const name = this.song.name; this.song = Player.song = { ...JSON.parse(from.pop()), name };
    if (!this.track(this.sel)) this.sel = null; this.range = this.clipSel = null; this.changed(); Player.refresh(); this.draw();
  },
  track(id) { return this.song.tracks.find(t => t.id === id); },
  get barDur() { return stepDur(this.song) * STEPS; },
  get end() { return Math.max(songDur(this.song), ...this.song.tracks.flatMap(t => (t.clips || []).map(c => c.start + c.dur))); },
  fit() { const need = Math.ceil(this.end / this.barDur - 1e-6); if (need > this.song.bars) this.song.bars = Math.min(400, need); },

  /* ---- tracks */
  newTrack(role) {
    const R = ROLES[role], n = this.song.tracks.filter(t => t.role === role).length, tr = { id: uid(), role, type: role === 'drums' ? 'drums' : 'synth', name: R.name + (n ? ' ' + (n + 1) : ''), vol: .8, len: 4 };
    if (role === 'drums') tr.steps = {}; else { tr.preset = R.preset; tr.notes = []; }
    Gen.fill(this.song, tr); this.song.tracks.push(tr); this.sel = tr.id;
  },
  addTrack(role) { this.edit(() => this.newTrack(role)); },
  /* a whole first draft: four parts written to fit each other */
  starter() { this.edit(() => { Gen.prog(this.song, true); for (const r of ['drums', 'bass', 'chords', 'melody']) this.newTrack(r); this.sel = null; }); if (!Player.playing) Player.play(0); this.drawBar(); },
  idea(tr) { this.edit(() => Gen.fill(this.song, tr)); },
  removeTrack(tr) { this.edit(() => { this.song.tracks = this.song.tracks.filter(t => t !== tr); if (this.sel === tr.id) this.sel = null; this.range = null; }); },
  duplicate(tr) { this.edit(() => { const c = clone(tr); c.id = uid(); c.name += ' copy'; delete c.x; delete c.y; (c.clips || []).forEach(k => { k.id = uid(); }); this.song.tracks.splice(this.song.tracks.indexOf(tr) + 1, 0, c); this.sel = c.id; }); },
  addAudio(buf, name, path, at = 0) {
    const id = uid(); Player.bufs.set(id, buf); if (path) this.files.set(id, path);
    this.edit(() => { const tr = { id: uid(), role: 'audio', type: 'audio', name, vol: .9, clips: [{ id: uid(), buf: id, start: at, off: 0, dur: buf.duration, gain: 1 }] }; this.song.tracks.push(tr); this.sel = tr.id; this.fit(); });
  },
  async importAudio() {
    const path = await UI.pickFile(App.conf('music_dir', App.boot.pictures) + '\\x', Object.keys({ '.wav': 1, '.mp3': 1, '.ogg': 1, '.flac': 1, '.m4a': 1, '.aac': 1, '.opus': 1, '.webm': 1 })); if (!path) return;
    App.setConf('music_dir', path.replace(/[\\/][^\\/]*$/, ''));
    try { this.addAudio(await this.decode(path), path.split(/[\\/]/).pop().replace(/\.[^.]+$/, ''), path, Modes.beginner ? 0 : this.cursor); } catch (e) { UI.toast('That file could not be read as audio.', 'error'); }
  },
  async toggleRec() {
    if (this.rec) return this.stopRec();
    let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return UI.toast('No microphone available, or permission was refused.', 'error'); }
    const mr = new MediaRecorder(stream), parts = [], at = Modes.beginner ? 0 : this.cursor, wasLoop = Player.loop;
    mr.ondataavailable = e => parts.push(e.data);
    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop()); Player.loop = wasLoop; Player.stop(); this.rec = null;
      try { const buf = await Player.ready().decodeAudioData(await new Blob(parts).arrayBuffer()); this.addAudio(buf, 'Recording ' + (this.song.tracks.filter(t => t.role === 'audio').length + 1), null, at); } catch (e) { UI.toast('The recording could not be read.', 'error'); this.drawBar(); }
    };
    this.rec = mr; Player.loop = false; mr.start(); Player.play(at); this.drawBar();
  },
  stopRec() { if (this.rec && this.rec.state !== 'inactive') this.rec.stop(); },
  async exportWav() {
    if (!this.song.tracks.length) return UI.toast('There is nothing to export yet.');
    const folder = await UI.pickFolder(App.conf('music_out', App.boot.pictures)); if (!folder) return;
    App.setConf('music_out', folder); UI.toast('Mixing down…');
    const r = await upload('music_export', { path: folder + '\\' + this.song.name + '.wav' }, encodeWav(await renderSong(this.song, Player.bufs)));
    UI.toast('Saved ' + r.path); api('fs_reveal', { path: r.path }).catch(() => {});
  },
  async rename() {
    const n = await UI.prompt('Rename Song', 'Song name', this.song.name); if (!n || n === this.song.name) return;
    await this.save(); const r = await api('music_rename', { old: this.song.name, new: n });
    for (const [id, p] of this.files) if (p.startsWith(r.folder.replace(/[\\/][^\\/]*$/, ''))) this.files.set(id, r.folder + '\\' + p.split(/[\\/]/).pop());
    this.song.name = r.name; App.setConf('music_last', r.name); await this.save(); this.drawBar();
  },
  async songsMenu(e) {
    const r = e.currentTarget.getBoundingClientRect(), list = await api('music_list');
    UI.menu(r.left, r.bottom + 4, [{ label: 'New Song', run: () => this.save().then(() => this.create()) }, { label: 'Rename Song…', run: () => this.rename() }, '-',
      ...list.map(s => ({ label: s.name, checked: s.name === this.song.name, run: async () => { await this.save(); const d = await api('music_load', { name: s.name }); if (d) this.load(d); } }))]);
  },
  retune(change) {
    this.edit(() => {
      const before = this.song.tracks.filter(t => t.type === 'synth').map(t => trackNotes(this.song, t)); change();
      this.song.tracks.filter(t => t.type === 'synth').forEach((t, i) => {
        const now = trackNotes(this.song, t), same = now.length === before[i].length;
        for (const n of t.notes) { const k = before[i].indexOf(n.n); n.n = same && k >= 0 ? now[k] : now.reduce((b, x) => (Math.abs(x - n.n) < Math.abs(b - n.n) ? x : b), now[0]); }
      });
    });
  },

  /* ---- audio editing (Advanced). Clips point into buffers, so cutting and moving never copies sound; effects write new buffers. */
  target() {
    const tr = this.track(this.range ? this.range.id : this.sel); if (!tr || tr.type !== 'audio') return null;
    if (this.range) return { tr, a: this.range.a, b: this.range.b };
    const c = tr.clips.find(k => k.id === this.clipSel); if (c) return { tr, a: c.start, b: c.start + c.dur };
    const e = Math.max(0, ...tr.clips.map(k => k.start + k.dur)); return e ? { tr, a: 0, b: e, whole: true } : null;
  },
  split(tr, t) { const c = tr.clips.find(k => t > k.start + .001 && t < k.start + k.dur - .001); if (c) { tr.clips.push({ ...c, id: uid(), start: t, off: c.off + t - c.start, dur: c.start + c.dur - t }); c.dur = t - c.start; } },
  inside(tr, a, b) { this.split(tr, a); this.split(tr, b); return tr.clips.filter(k => k.start >= a - .001 && k.start + k.dur <= b + .001); },
  need(msg = 'Select an audio track first, then drag across the part you want.') { const t = this.target(); if (!t) UI.toast(msg); return t; },
  remove(ripple) {
    const t = this.need(); if (!t || (t.whole && !this.range)) return t && UI.toast('Drag across the part of the audio you want to remove.');
    this.edit(() => { const gone = new Set(this.inside(t.tr, t.a, t.b)); t.tr.clips = t.tr.clips.filter(k => !gone.has(k)); if (ripple) for (const k of t.tr.clips) if (k.start >= t.b - .001) k.start -= t.b - t.a; this.cursor = t.a; this.range = this.clipSel = null; });
  },
  copy() {
    const t = this.need(); if (!t) return false;
    this.clipboard = { len: t.b - t.a, clips: t.tr.clips.filter(k => k.start < t.b && k.start + k.dur > t.a).map(k => { const s = Math.max(k.start, t.a), e = Math.min(k.start + k.dur, t.b); return { buf: k.buf, gain: k.gain, off: k.off + s - k.start, dur: e - s, rel: s - t.a }; }) };
    UI.toast('Copied ' + this.clipboard.len.toFixed(2) + ' s'); return true;
  },
  cut() { if (this.copy()) this.remove(true); },
  paste() {
    const tr = this.track(this.sel), cb = this.clipboard; if (!cb) return UI.toast('Nothing copied yet.'); if (!tr || tr.type !== 'audio') return UI.toast('Select the audio track to paste into.');
    this.edit(() => { const t = this.cursor; this.split(tr, t); for (const k of tr.clips) if (k.start >= t - .001) k.start += cb.len; for (const c of cb.clips) tr.clips.push({ id: uid(), buf: c.buf, gain: c.gain, off: c.off, dur: c.dur, start: t + c.rel }); this.range = { id: tr.id, a: t, b: t + cb.len }; this.fit(); });
  },
  splitHere() { const tr = this.track(this.sel); if (!tr || tr.type !== 'audio') return UI.toast('Select an audio track, click where to split, then press Split.'); this.edit(() => { if (this.range) { this.split(tr, this.range.a); this.split(tr, this.range.b); } else this.split(tr, this.cursor); }); },
  trim() { const t = this.need(); if (!t || t.whole) return t && UI.toast('Drag across the part you want to keep.'); this.edit(() => { t.tr.clips = this.inside(t.tr, t.a, t.b); }); },
  /* render each clip in the range through fn(channels, sampleRate, p0, p1), where p runs 0..1 across the whole range */
  fx(name, fn, prep) {
    const t = this.need(); if (!t) return;
    this.edit(() => {
      const clips = this.inside(t.tr, t.a, t.b), span = t.b - t.a || 1, slices = clips.map(c => { const src = Player.bufs.get(c.buf), i0 = Math.floor(c.off * src.sampleRate), n = Math.max(1, Math.min(src.length - i0, Math.round(c.dur * src.sampleRate))); return { c, sr: src.sampleRate, ch: Array.from({ length: src.numberOfChannels }, (_, k) => src.getChannelData(k).slice(i0, i0 + n)) }; });
      const ctx = prep ? prep(slices) : null;
      for (const s of slices) {
        fn(s.ch, s.sr, (s.c.start - t.a) / span, (s.c.start + s.c.dur - t.a) / span, ctx);
        const out = new AudioBuffer({ length: s.ch[0].length, numberOfChannels: s.ch.length, sampleRate: s.sr }); s.ch.forEach((d, k) => out.copyToChannel(d, k));
        const id = uid(); Player.bufs.set(id, out); s.c.buf = id; s.c.off = 0; s.c.dur = out.duration;
        if (name === 'Reverse') s.c.start = t.a + (t.b - (s.c.start + s.c.dur));
      }
    });
    UI.toast(name + ' applied');
  },
  fade(inward) { this.fx(inward ? 'Fade in' : 'Fade out', (ch, sr, p0, p1) => { for (const d of ch) for (let i = 0, n = d.length; i < n; i++) { const p = p0 + (p1 - p0) * i / n; d[i] *= inward ? p : 1 - p; } }); },
  gain(db) { const g = 10 ** (db / 20); this.fx('Amplify', ch => { for (const d of ch) for (let i = 0; i < d.length; i++) d[i] = clamp(d[i] * g, -1, 1); }); },
  async amplify() { const v = await UI.prompt('Amplify', 'Change in decibels (6 is about twice as loud, -6 about half)', '6'); if (v != null && isFinite(+v)) this.gain(+v); },
  normalize() { this.fx('Normalize', (ch, sr, p0, p1, g) => { for (const d of ch) for (let i = 0; i < d.length; i++) d[i] *= g; }, sl => { let pk = 1e-6; for (const s of sl) for (const d of s.ch) for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); return .97 / pk; }); },
  reverse() { this.fx('Reverse', ch => { for (const d of ch) d.reverse(); }); },
  mixer(tr) {
    const S = (label, key, min, max, step, def) => UI.slider({ label, min, max, step, value: tr[key] ?? def, def, tip: MU_TIPS[key], oninput: v => { tr[key] = v; }, onchange: () => { this.changed(); this.draw(); } });
    this.mark(); UI.dialog({ title: tr.name + ' — Mixer', width: 380, body: h('div', {}, S('Volume', 'vol', 0, 1, .01, .8), S('Pan', 'pan', -1, 1, .01, 0), S('Bass', 'low', -18, 18, 1, 0), S('Treble', 'high', -18, 18, 1, 0), S('Room', 'room', 0, 1, .01, 0), S('Echo', 'echo', 0, 1, .01, 0)) });
  },
  trackMenu(e, tr) {
    const r = e.currentTarget.getBoundingClientRect();
    UI.menu(r.left, r.bottom + 4, [{ label: 'Rename…', run: async () => { const n = await UI.prompt('Rename', 'Name', tr.name); if (n) this.edit(() => { tr.name = n; }); } }, { label: 'Mixer…', run: () => this.mixer(tr) },
      tr.type === 'drums' || tr.type === 'synth' ? { label: 'Riff Length', sub: [1, 2, 4].map(n => ({ label: n + (n > 1 ? ' bars' : ' bar'), checked: tr.len === n, run: () => this.edit(() => { tr.len = n; if (tr.notes) tr.notes = tr.notes.filter(k => k.s < n * STEPS); }) })) } : null,
      tr.type !== 'audio' ? { label: 'Clear Riff', run: () => this.edit(() => { if (tr.steps) tr.steps = {}; else tr.notes = []; }) } : null, { label: 'Duplicate', run: () => this.duplicate(tr) }, '-', { label: 'Delete', run: () => this.removeTrack(tr) }]);
  },

  /* ---- drawing */
  draw() {
    if (!this.bar) return;
    this.grids = []; this.drawBar(); this.drawTools();
    if (Modes.beginner) { this.editor.replaceChildren(); this.drawBoard(); } else { this.drawTimeline(); this.drawEditor(); }
  },
  tip(el, key, name) { el.dataset.tip = MU_TIPS[key]; if (name) el.dataset.tipName = name; return el; },
  mini(tr, key, min, max, def, name) { return this.tip(h('input', { type: 'range', class: 'mini', min, max, step: .01, value: tr[key] ?? def, onmousedown: () => this.mark(), oninput: e => { tr[key] = +e.target.value; this.changed(); }, ondblclick: e => { tr[key] = def; e.target.value = def; this.changed(); } }), key, name); },
  drawBar() {
    const s = this.song, adv = !Modes.beginner, lab = (text, key) => this.tip(h('span', { class: 'mu-lab' }, text), key);
    const num = (v, min, max, set) => h('input', { type: 'number', class: 'mu-num', value: v, min, max, onchange: e => { const n = clamp(Math.round(+e.target.value) || v, min, max); e.target.value = n; set(n); } });
    this.posEl = h('span', { class: 'mu-pos' });
    this.bar.replaceChildren(
      h('button', { class: 'btn primary mu-play', title: 'Play / Stop (Space)', onclick: () => this.toggle() }, Player.playing ? '■  Stop' : '▶  Play'),
      h('button', { class: 'btn mu-rec' + (this.rec ? ' on' : ''), title: 'Record from the microphone (R)', onclick: () => this.toggleRec() }, this.rec ? '●  Stop recording' : '●  Record'),
      adv ? this.tip(h('button', { class: 'tbtn' + (Player.loop ? ' on' : ''), onclick: () => { Player.loop = !Player.loop; Player.refresh(); this.drawBar(); } }, 'Loop'), 'loop') : null,
      adv ? this.tip(h('button', { class: 'tbtn' + (Player.metro ? ' on' : ''), onclick: () => { Player.metro = !Player.metro; this.drawBar(); } }, 'Click'), 'metro', 'Metronome') : null,
      this.posEl,
      h('span', { class: 'mu-group' }, lab('Tempo', 'tempo'), num(s.bpm, 40, 220, v => this.edit(() => { s.bpm = v; }))),
      h('span', { class: 'mu-group' }, lab('Key', 'key'), h('select', { onchange: e => this.retune(() => { s.key = e.target.selectedIndex; }) }, NOTE_NAMES.map((n, i) => h('option', { selected: i === s.key }, n))),
        this.tip(h('select', { onchange: e => this.retune(() => { s.scale = e.target.value; }) }, Object.entries(SCALE_NAMES).filter(([k]) => adv || k !== 'chromatic' || s.scale === k).map(([k, l]) => h('option', { value: k, selected: k === s.scale }, l))), 'scale', 'Scale')),
      h('span', { class: 'mu-group' }, lab('Bars', 'bars'), adv ? num(s.bars, 1, 400, v => this.edit(() => { s.bars = v; })) : h('select', { onchange: e => this.edit(() => { s.bars = +e.target.value; this.fit(); }) }, [...new Set([4, 8, 16, s.bars])].sort((a, b) => a - b).map(n => h('option', { selected: n === s.bars }, n)))),
      h('span', { class: 'tb-fill' }),
      h('button', { class: 'tbtn', title: 'Undo (Ctrl+Z)', disabled: !this.undo.length, onclick: () => this.step(this.undo, this.redo) }, '↶'), h('button', { class: 'tbtn', title: 'Redo (Ctrl+Y)', disabled: !this.redo.length, onclick: () => this.step(this.redo, this.undo) }, '↷'),
      h('button', { class: 'tbtn mu-name', title: 'Your songs', onclick: e => this.songsMenu(e) }, s.name + '  ▾'),
      h('button', { class: 'btn', title: 'Mix the song down to a .wav file', onclick: () => this.exportWav().catch(UI.error) }, 'Export'));
  },
  adders(big) {
    const b = (label, tipText, run) => { const el = h('button', { class: 'btn' + (big ? ' big' : ''), onclick: run }, label); el.dataset.tip = tipText; el.dataset.tipName = label.replace(/^\+\s*/, ''); return el; };
    return [b('+ Drums', 'A beat. Each row is a drum, each column a moment in the bar.', () => this.addTrack('drums')), b('+ Bass', 'The low notes that hold the song together.', () => this.addTrack('bass')),
      b('+ Chords', 'Several notes at once, giving the song its mood.', () => this.addTrack('chords')), b('+ Melody', 'The tune on top, the part you would hum.', () => this.addTrack('melody')),
      b('+ Audio file', 'Bring in a recording or a song from this computer.', () => this.importAudio())];
  },
  drawTools() {
    const adv = !Modes.beginner, t = (label, title, run) => h('button', { class: 'tbtn', title, onclick: run }, label);
    this.tools.replaceChildren(h('span', { class: 'mu-lab' }, 'Add'), ...this.adders(), ...(adv ? [h('span', { class: 'mu-sep' }), h('span', { class: 'mu-lab' }, 'Edit audio'),
      t('Split', 'Split at the cursor or at both ends of the selection (S)', () => this.splitHere()), t('Cut', 'Cut the selection and close the gap (Ctrl+X)', () => this.cut()), t('Copy', 'Copy the selection (Ctrl+C)', () => this.copy()), t('Paste', 'Insert the copied audio at the cursor (Ctrl+V)', () => this.paste()),
      t('Delete', 'Delete the selection and close the gap (Delete)', () => this.remove(true)), t('Silence', 'Remove the selection but leave the gap', () => this.remove(false)), t('Trim', 'Keep only the selection', () => this.trim()),
      h('span', { class: 'mu-sep' }), h('span', { class: 'mu-lab' }, 'Effects'), t('Fade in', 'Fade the selection in from silence', () => this.fade(true)), t('Fade out', 'Fade the selection out to silence', () => this.fade(false)), t('Amplify…', 'Make the selection louder or quieter', () => this.amplify()),
      t('Normalize', 'Raise the selection to full volume without distorting', () => this.normalize()), t('Reverse', 'Play the selection backwards', () => this.reverse()),
      h('span', { class: 'tb-fill' }), t('−', 'Zoom out', () => this.zoom(1 / 1.5)), t('+', 'Zoom in', () => this.zoom(1.5)), t('Fit', 'Show the whole song', () => this.zoom(0))] : []));
  },
  head(tr, board) {
    const sel = () => { if (this.sel !== tr.id) { this.sel = tr.id; this.clipSel = this.range = null; if (!board) this.draw(); } };
    return [h('i', { class: 'mu-dot' }), h('b', { class: 'mu-tname', title: tr.name, onclick: sel, ondblclick: async () => { const n = await UI.prompt('Rename', 'Name', tr.name); if (n) this.edit(() => { tr.name = n; }); } }, tr.name),
      tr.type === 'synth' ? h('select', { class: 'mu-preset', title: 'Instrument', onchange: e => this.edit(() => { tr.preset = e.target.value; }, false) }, Object.entries(INSTR).map(([k, p]) => h('option', { value: k, selected: k === tr.preset }, p.name))) : null,
      tr.type !== 'audio' ? this.tip(h('button', { class: 'tbtn', onclick: () => this.idea(tr) }, '🎲' + (board ? '  New idea' : '')), 'idea', 'New idea') : null,
      h('span', { class: 'tb-fill' }),
      h('button', { class: 'tbtn mu-m' + (tr.mute ? ' on' : ''), title: 'Mute', onclick: e => { tr.mute = !tr.mute; e.currentTarget.classList.toggle('on', tr.mute); if (board) e.currentTarget.textContent = tr.mute ? 'Muted' : 'On'; this.changed(); } }, board ? (tr.mute ? 'Muted' : 'On') : 'M'),
      board ? null : h('button', { class: 'tbtn mu-s' + (tr.solo ? ' on' : ''), title: 'Solo: hear only this track', onclick: e => { tr.solo = !tr.solo; e.currentTarget.classList.toggle('on', tr.solo); this.changed(); } }, 'S'),
      this.mini(tr, 'vol', 0, 1, .8, 'Volume'),
      h('button', { class: 'tbtn', title: 'More', onclick: e => this.trackMenu(e, tr) }, '⋯')];
  },

  /* Beginner: free-form board of cards */
  drawBoard() {
    const s = this.song, board = h('div', { class: 'mu-board' });
    if (!s.tracks.length) {
      board.append(h('div', { class: 'mu-empty' }, h('h2', {}, 'Make something'), h('p', {}, 'A song here is a few short riffs that loop together. Add them one at a time, or let Opia start you off and then change whatever you like.'),
        h('button', { class: 'btn primary big', onclick: () => this.starter() }, '✨  Start me off'), h('div', { class: 'mu-or' }, 'or add a part yourself'), h('div', { class: 'mu-row' }, this.adders(true))));
      return this.stage.replaceChildren(board);
    }
    let bottom = 16;
    for (const tr of s.tracks) {
      const body = tr.type === 'audio' ? this.audioCard(tr) : this.grid(tr, false).el;
      const card = h('div', { class: 'mu-card' + (tr.id === this.sel ? ' sel' : ''), style: { '--c': ROLES[tr.role].color }, onmousedown: () => { this.sel = tr.id; $$('.mu-card', board).forEach(c => c.classList.toggle('sel', c === card)); } }, h('div', { class: 'mc-head', onmousedown: e => this.dragCard(e, tr, card) }, this.head(tr, true)), body);
      card.style.setProperty('--c', ROLES[tr.role].color); board.append(card);
      if (tr.x == null) { tr.x = 20; tr.y = -1; }
      card.dataset.id = tr.id;
    }
    this.stage.replaceChildren(board);
    for (const card of $$('.mu-card', board)) { const tr = this.track(card.dataset.id); if (tr.y >= 0) bottom = Math.max(bottom, tr.y + card.offsetHeight + 16); }
    for (const card of $$('.mu-card', board)) { const tr = this.track(card.dataset.id); if (tr.y < 0) { tr.y = bottom; bottom += card.offsetHeight + 16; } Object.assign(card.style, { left: tr.x + 'px', top: tr.y + 'px' }); }
    board.append(h('div', { class: 'mu-pad', style: { top: bottom + 40 + 'px' } }));
  },
  dragCard(e, tr, card) {
    if (e.target.closest('button,select,input')) return;
    const x0 = e.clientX - tr.x, y0 = e.clientY - tr.y, mv = ev => { tr.x = Math.max(0, ev.clientX - x0); tr.y = Math.max(0, ev.clientY - y0); Object.assign(card.style, { left: tr.x + 'px', top: tr.y + 'px' }); };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); this.changed(); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); e.preventDefault();
  },
  audioCard(tr) {
    const c = tr.clips[0], buf = c && Player.bufs.get(c.buf), cv = h('canvas', { width: 420, height: 64, class: 'mu-wave' });
    if (buf) drawWave(cv, buf, c.off, c.dur, ROLES.audio.color);
    return h('div', { class: 'mc-audio' }, cv, h('div', { class: 'fnote' }, buf ? `${fmtTime(Math.max(...tr.clips.map(k => k.start + k.dur)))} of audio, playing from the start. Switch to Advanced to cut, move or fade it.` : 'The audio file for this part is missing.'));
  },
  grid(tr, big) { const g = new RiffGrid(tr, big); this.grids.push(g); return g; },

  /* Advanced: timeline */
  zoom(f) { const view = this.stage.clientWidth - 340; this.pps = f ? clamp(this.pps * f, 6, 400) : clamp(view / (this.end + 1), 6, 400); this.drawTimeline(); },
  drawTimeline() {
    const s = this.song, pps = this.pps, barW = this.barDur * pps, W = Math.max(this.end * pps + 240, 600), old = $('.tl-scroll', this.stage), keep = old ? [old.scrollLeft, old.scrollTop] : [0, 0];
    const ruler = h('div', { class: 'tl-lane tl-ruler', style: { width: W + 'px' }, onmousedown: e => this.seek(e, ruler) });
    for (let b = 0; b < s.bars; b++) ruler.append(h('span', { style: { left: b * barW + 'px', width: barW + 'px' } }, barW > 22 || b % 4 === 0 ? b + 1 : ''));
    ruler.append(h('i', { class: 'tl-end', style: { left: s.bars * barW + 'px' } }));
    const rows = [h('div', { class: 'tl-row top' }, h('div', { class: 'tl-head' }, h('span', { class: 'dim' }, 'Bars')), ruler)];
    for (const tr of s.tracks) {
      const lane = h('div', { class: 'tl-lane', style: { width: W + 'px' } });
      if (tr.type === 'audio') {
        lane.onmousedown = e => this.laneDown(e, tr, lane);
        for (const c of tr.clips) {
          const buf = Player.bufs.get(c.buf), w = Math.max(2, c.dur * pps), cv = h('canvas', { width: Math.min(16000, Math.ceil(w)), height: 52 });
          if (buf) drawWave(cv, buf, c.off, c.dur, ROLES.audio.color);
          lane.append(h('div', { class: 'tl-clip' + (c.id === this.clipSel ? ' sel' : ''), style: { left: c.start * pps + 'px', width: w + 'px' } }, h('div', { class: 'tl-grip', title: 'Drag to move this clip', onmousedown: e => this.clipDown(e, tr, c) }, buf ? tr.name : 'missing audio'), cv));
        }
        if (this.range && this.range.id === tr.id) lane.append(h('div', { class: 'tl-range', style: { left: this.range.a * pps + 'px', width: (this.range.b - this.range.a) * pps + 'px' } }));
      } else {
        lane.classList.add('riff');
        for (let b = 0; b < s.bars; b++) {
          const on = !tr.on || tr.on[b] !== false, cell = h('div', { class: 'tl-bar' + (on ? ' on' : ''), style: { left: b * barW + 'px', width: barW + 'px' }, title: on ? 'Click to silence this part in bar ' + (b + 1) : 'Click to play this part in bar ' + (b + 1),
            onclick: () => this.edit(() => { tr.on = Array.from({ length: s.bars }, (_, i) => !tr.on || tr.on[i] !== false); tr.on[b] = !on; this.sel = tr.id; }) });
          if (on) { const cv = h('canvas', { width: Math.max(4, Math.round(barW)), height: 52 }); RiffGrid.preview(cv, tr, b % tr.len); cell.append(cv); }
          lane.append(cell);
        }
      }
      rows.push(h('div', { class: 'tl-row' + (tr.id === this.sel ? ' sel' : ''), style: { '--c': ROLES[tr.role].color } }, h('div', { class: 'tl-head', onmousedown: e => { if (!e.target.closest('button,select,input') && this.sel !== tr.id) { this.sel = tr.id; this.clipSel = this.range = null; this.draw(); } } }, this.head(tr, false)), lane));
      rows[rows.length - 1].style.setProperty('--c', ROLES[tr.role].color);
    }
    this.headEl = h('div', { class: 'tl-play' }); this.curEl = h('div', { class: 'tl-cur' });
    const content = h('div', { class: 'tl-content' }, rows, this.headEl, this.curEl);
    if (!s.tracks.length) content.append(h('div', { class: 'mu-empty small' }, h('p', {}, 'Nothing here yet. Add a part with the buttons above, or'), h('button', { class: 'btn primary', onclick: () => this.starter() }, '✨  Start me off')));
    const scroll = h('div', { class: 'tl-scroll', onwheel: e => { if (e.ctrlKey) { e.preventDefault(); this.zoom(Math.exp(-e.deltaY * .01)); } } }, content);
    this.stage.replaceChildren(scroll); scroll.scrollLeft = keep[0]; scroll.scrollTop = keep[1]; this.frame();
  },
  timeAt(e, lane) { return Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pps); },
  seek(e, lane) { this.cursor = this.timeAt(e, lane); this.range = null; if (Player.playing) Player.play(this.cursor); else Player.pos = this.cursor; this.drawTimeline(); },
  laneDown(e, tr, lane) {
    if (e.button || e.target.closest('.tl-grip')) return;
    const a = this.timeAt(e, lane), box = h('div', { class: 'tl-range' }); let b = a, moved = false; lane.append(box);
    const mv = ev => { b = this.timeAt(ev, lane); if (Math.abs(b - a) * this.pps > 3) moved = true; Object.assign(box.style, { left: Math.min(a, b) * this.pps + 'px', width: Math.abs(b - a) * this.pps + 'px' }); };
    const up = () => {
      removeEventListener('mousemove', mv); removeEventListener('mouseup', up); this.sel = tr.id;
      if (moved) { this.range = { id: tr.id, a: Math.min(a, b), b: Math.max(a, b) }; this.cursor = this.range.a; this.clipSel = null; } else { this.range = null; this.cursor = a; const c = tr.clips.find(k => a >= k.start && a <= k.start + k.dur); this.clipSel = c ? c.id : null; }
      if (!Player.playing) Player.pos = this.cursor; this.draw();
    };
    addEventListener('mousemove', mv); addEventListener('mouseup', up); e.preventDefault();
  },
  clipDown(e, tr, c) {
    const x0 = e.clientX, s0 = c.start, el = e.currentTarget.parentNode; let moved = false; e.preventDefault(); e.stopPropagation(); this.mark();
    const mv = ev => { c.start = Math.max(0, s0 + (ev.clientX - x0) / this.pps); if (Math.abs(ev.clientX - x0) > 2) moved = true; el.style.left = c.start * this.pps + 'px'; };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); if (!moved) this.undo.pop(); else { this.fit(); this.changed(); Player.refresh(); } this.sel = tr.id; this.clipSel = c.id; this.range = null; this.draw(); };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  },
  drawEditor() {
    const tr = this.track(this.sel);
    if (!tr || tr.type === 'audio') return this.editor.replaceChildren(h('div', { class: 'mu-hint' }, tr ? 'Drag across the waveform to select a range, click to place the cursor, and drag a clip by its name strip to move it. The Edit and Effects buttons act on the selection.' : 'Select a drums, bass, chords or melody track to edit its riff here. Click the bars in its lane to choose where it plays.'));
    this.editor.replaceChildren(h('div', { class: 'mu-ed-head', style: { '--c': ROLES[tr.role].color } }, h('i', { class: 'mu-dot' }), h('b', {}, tr.name), h('span', { class: 'dim' }, `riff of ${tr.len} bar${tr.len > 1 ? 's' : ''}, repeating`)), this.grid(tr, true).el);
    this.editor.firstChild.style.setProperty('--c', ROLES[tr.role].color);
  },

  /* ---- transport */
  toggle() { if (this.rec) return this.stopRec(); if (Player.playing) Player.stop(); else Player.play(Modes.beginner ? 0 : this.cursor); this.drawBar(); },
  frame() {
    if (!this.song || !this.posEl) return;
    const t = Player.now(), sd = stepDur(this.song), step = Math.floor(t / sd + 1e-6);
    this.posEl.textContent = `Bar ${Math.floor(step / STEPS) + 1}.${Math.floor(step % STEPS / 4) + 1}   ${fmtTime(t)}`;
    for (const g of this.grids) g.tick(Player.playing ? step : -1);
    if (this.headEl && this.headEl.isConnected) { this.headEl.style.transform = `translateX(${t * this.pps}px)`; this.headEl.style.opacity = Player.playing ? 1 : 0; this.curEl.style.transform = `translateX(${this.cursor * this.pps}px)`; }
  },
  keys: {
    Space: () => Music.toggle(), R: () => Music.toggleRec(), L: () => { Player.loop = !Player.loop; Player.refresh(); Music.drawBar(); },
    'Ctrl+Z': () => Music.step(Music.undo, Music.redo), 'Ctrl+Y': () => Music.step(Music.redo, Music.undo), 'Ctrl+Shift+Z': () => Music.step(Music.redo, Music.undo),
    'Ctrl+X': () => Music.adv(() => Music.cut()), 'Ctrl+C': () => Music.adv(() => Music.copy()), 'Ctrl+V': () => Music.adv(() => Music.paste()), Delete: () => Music.adv(() => Music.remove(true)), Backspace: () => Music.adv(() => Music.remove(true)),
    S: () => Music.adv(() => Music.splitHere()), Home: () => { Music.cursor = 0; Music.range = null; if (Player.playing) Player.play(0); else Player.pos = 0; },
    'Ctrl+A': () => Music.adv(() => { const t = Music.track(Music.sel); if (t && t.type === 'audio') { Music.clipSel = null; Music.range = null; const w = Music.target(); if (w) { Music.range = { id: t.id, a: w.a, b: w.b }; Music.drawTimeline(); } } }),
  },
  adv(fn) { if (!Modes.beginner) fn(); },
};

const fmtTime = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/* The riff editor: a drum grid (rows are drums) or a note grid (rows are the notes of the scale), sixteen steps to the bar. */
class RiffGrid {
  constructor(tr, big) {
    this.tr = tr; this.big = big; this.drums = tr.type === 'drums'; this.step = -1;
    this.cw = this.drums ? (big ? 30 : 22) : (big ? 16 : 10); this.ch = this.drums ? (big ? 26 : 22) : (big ? 15 : 11);
    this.keys = h('div', { class: 'rg-keys' }); this.cv = h('canvas', { class: 'rg-cv', onmousedown: e => this.down(e) });
    this.el = h('div', { class: 'rg' + (this.drums ? ' drums' : '') }, this.keys, h('div', { class: 'rg-scroll' }, this.cv));
    this.layout();
  }
  layout() {
    const tr = this.tr, song = Music.song;
    this.rows = this.drums ? KIT.filter(([k], i) => this.big || !Modes.beginner || i < 4 || (tr.steps[k] || []).some(Boolean)).map(([k, label]) => ({ k, label }))
      : trackNotes(song, tr).reverse().map(n => ({ k: n, label: NOTE_NAMES[n % 12], root: n % 12 === song.key }));
    this.cols = tr.len * STEPS;
    const w = this.cols * this.cw, hh = this.rows.length * this.ch, r = devicePixelRatio || 1;
    this.cv.width = w * r; this.cv.height = hh * r; Object.assign(this.cv.style, { width: w + 'px', height: hh + 'px' });
    this.keys.replaceChildren(...this.rows.map(o => h('div', { class: o.root ? 'root' : '', style: { height: this.ch + 'px', lineHeight: this.ch + 'px' }, onmousedown: () => Player.tap(tr, o.k) }, o.label)));
    this.draw();
  }
  draw() {
    const g = this.cv.getContext('2d'), r = devicePixelRatio || 1, { cw, ch, cols, rows, tr } = this, W = cols * cw, H = rows.length * ch, col = ROLES[tr.role].color;
    g.setTransform(r, 0, 0, r, 0, 0); g.fillStyle = Theme.css('--input'); g.fillRect(0, 0, W, H);
    g.fillStyle = Theme.css('--cell'); for (let c = 0; c < cols; c += 8) g.fillRect(c * cw, 0, cw * 4, H);
    if (!this.drums) { g.fillStyle = 'rgba(128,128,128,.13)'; rows.forEach((o, i) => { if (o.root) g.fillRect(0, i * ch, W, ch); }); }
    g.strokeStyle = Theme.css('--line2'); g.lineWidth = 1; g.beginPath();
    for (let c = 0; c <= cols; c++) { g.moveTo(c * cw + .5, 0); g.lineTo(c * cw + .5, H); } for (let i = 0; i <= rows.length; i++) { g.moveTo(0, i * ch + .5); g.lineTo(W, i * ch + .5); } g.globalAlpha = .55; g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = Theme.css('--dim'); g.beginPath(); for (let c = STEPS; c < cols; c += STEPS) { g.moveTo(c * cw + .5, 0); g.lineTo(c * cw + .5, H); } g.stroke();
    g.fillStyle = col;
    const box = (c, i, n) => { g.beginPath(); g.roundRect(c * cw + 2, i * ch + 2, n * cw - 3, ch - 3, 3); g.fill(); };
    if (this.drums) rows.forEach((o, i) => (tr.steps[o.k] || []).forEach((on, c) => { if (on && c < cols) box(c, i, 1); }));
    else for (const n of tr.notes) { const i = rows.findIndex(o => o.k === n.n); if (i >= 0) box(n.s, i, Math.min(n.d, cols - n.s)); }
    if (this.step >= 0) { g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(this.step * cw, 0, cw, H); }
  }
  tick(step) { const s = step < 0 ? -1 : step % this.cols; if (s !== this.step) { this.step = s; this.draw(); } }
  at(e) { const b = this.cv.getBoundingClientRect(); return [clamp(Math.floor((e.clientX - b.left) / this.cw), 0, this.cols - 1), clamp(Math.floor((e.clientY - b.top) / this.ch), 0, this.rows.length - 1)]; }
  down(e) {
    if (e.button) return; e.preventDefault(); Music.mark();
    const tr = this.tr, [c0, r0] = this.at(e), key = this.rows[r0].k; let move;
    if (this.drums) {
      const row = tr.steps[key] = (tr.steps[key] || []).slice(); while (row.length < this.cols) row.push(false);
      const val = !row[c0]; row[c0] = val; if (val) Player.tap(tr, key);
      move = ev => { const [c] = this.at(ev); if (row[c] !== val) { row[c] = val; this.draw(); } };
    } else {
      const hit = tr.notes.find(n => n.n === key && c0 >= n.s && c0 < n.s + n.d);
      if (hit) tr.notes = tr.notes.filter(n => n !== hit);
      else { const n = { s: c0, d: Math.min({ bass: 2, chords: 4, melody: 2 }[tr.role], this.cols - c0), n: key }; let dragged = false; tr.notes.push(n); Player.tap(tr, key); move = ev => { const [c] = this.at(ev), d = clamp(c - c0 + 1, 1, this.cols - c0); if (c !== c0) dragged = true; if (dragged && d !== n.d) { n.d = d; this.draw(); } }; }
    }
    this.draw();
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); Music.changed(); if (!Modes.beginner) Music.drawTimeline(); Music.drawBar(); };
    const mv = ev => move && move(ev); addEventListener('mousemove', mv); addEventListener('mouseup', up);
  }
  /* a thumbnail of one bar of a riff, for the timeline */
  static preview(cv, tr, bar) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, sw = W / STEPS, lo = bar * STEPS; g.fillStyle = ROLES[tr.role].color;
    if (tr.type === 'drums') { const names = KIT.map(k => k[0]); names.forEach((k, i) => (tr.steps[k] || []).forEach((on, c) => { if (on && c >= lo && c < lo + STEPS) g.fillRect((c - lo) * sw + 1, 4 + i * (H - 8) / names.length, Math.max(1, sw - 2), Math.max(2, (H - 8) / names.length - 1)); })); }
    else { const ns = tr.notes.map(n => n.n), mn = Math.min(...ns, 127), mx = Math.max(...ns, 0), span = Math.max(6, mx - mn); for (const n of tr.notes) if (n.s + n.d > lo && n.s < lo + STEPS) g.fillRect((Math.max(n.s, lo) - lo) * sw + 1, 4 + (H - 12) * (1 - (n.n - mn) / span), Math.max(2, (Math.min(n.s + n.d, lo + STEPS) - Math.max(n.s, lo)) * sw - 2), 4); }
  }
}
