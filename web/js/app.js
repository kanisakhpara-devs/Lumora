'use strict';
/* App shell: commands, menus, module picker, startup. */

const MODULES = [Lib, Dev, MapMod, Book, Slideshow, Print, WebMod];

function registerCommands() {
  const C = (...a) => App.cmd(...a), lib = { modules: ['library'] }, libdev = { modules: ['library', 'develop'] }, ld = v => () => { App.show('library'); Lib.setView(v); };
  C('file.import', 'Import Photos…', 'Ctrl+Shift+I', () => Import.open()); C('file.export', 'Export…', 'Ctrl+Shift+E', () => Exporter.dialog()); C('file.exportagain', 'Export with Previous', 'Ctrl+Alt+Shift+E', () => Exporter.again());
  C('file.catalogs', 'Open / Manage Catalogs…', '', () => Catalogs.manage('catalogs')); C('file.newcatalog', 'New Catalog…', '', () => Catalogs.create()); C('file.backup', 'Back Up Catalog…', '', () => Catalogs.manage('backup')); C('file.optimize', 'Optimize Catalog…', '', () => Catalogs.manage('general'));
  C('file.plugins', 'Plug-in Manager…', 'Ctrl+Alt+Shift+,', () => Plugins.manage()); C('file.tether', 'Tethered Capture…', '', () => Tether.start()); C('file.prefs', 'Preferences…', 'Ctrl+,', () => Prefs.open()); C('prefs.editors', 'External Editors…', '', () => Prefs.open('editors'));
  C('edit.identity', 'Identity Plate Setup…', '', () => Identity.edit()); C('edit.watermarks', 'Edit Watermarks…', '', () => Watermark.edit()); C('edit.templates', 'Filename Template Editor…', '', () => Naming.edit()); C('edit.metapresets', 'Edit Metadata Presets…', '', () => MetaUI.editPresets()); C('edit.keywordsets', 'Edit Keyword Sets…', '', () => Keywords.editSets());
  C('edit.selectall', 'Select All', 'Ctrl+A', () => App.selectAll()); C('edit.selectnone', 'Select None', 'Ctrl+D', () => App.selectNone());
  C('view.grid', 'Grid', 'G', ld('grid'), lib); C('view.loupe', 'Loupe', 'E', ld('loupe'), lib); C('view.compare', 'Compare', 'C', ld('compare'), lib); C('view.survey', 'Survey', 'N', ld('survey'), lib); C('view.people', 'People', 'O', ld('people'), lib);
  C('view.info', 'Loupe Info Overlay', 'Ctrl+I', () => { App.setPref('loupeInfo', !App.pref('loupeInfo', true)); Lib.refreshView(true); }, { checked: () => App.pref('loupeInfo', true) });
  C('view.panels', 'Show / Hide Side Panels', 'Tab', () => document.body.classList.toggle('nopanels')); C('view.film', 'Show / Hide Filmstrip', 'F6', () => { document.body.classList.toggle('nofilm'); dispatchEvent(new Event('resize')); });
  C('view.full', 'Full Screen', 'F11', () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()));
  C('go.grid', 'Library Grid', '', ld('grid')); C('go.loupe', 'Library Loupe', '', ld('loupe')); C('go.develop', 'Develop', 'D', () => App.show('develop'), lib);
  MODULES.forEach((m, i) => C('mod.' + m.id, m.name, 'Ctrl+Alt+' + (i + 1), () => App.show(m.id)));
  C('flag.pick', 'Flag as Pick', 'P', () => App.rate({ flag: 1 }), libdev); C('flag.none', 'Unflag', 'U', () => App.rate({ flag: 0 }), libdev); C('flag.reject', 'Set as Rejected', 'X', () => App.rate({ flag: -1 }), libdev);
  for (let r = 0; r <= 5; r++) C('rate.' + r, r ? 'Rating ' + '★'.repeat(r) : 'No Rating', String(r), () => App.rate({ rating: r }), libdev);
  Object.keys(LABELS).slice(0, 4).forEach((l, i) => C('label.' + l, 'Label ' + l[0].toUpperCase() + l.slice(1), String(6 + i), () => App.rate({ label: l }, true), libdev));
  C('label.purple', 'Label Purple', '', () => App.rate({ label: 'purple' }, true)); C('label.none', 'No Label', '', () => App.rate({ label: '' }));
  C('rate.auto', 'Auto Advance', '', () => { App.setPref('autoAdvance', !App.pref('autoAdvance', false)); Lib.toolbar(); }, { checked: () => App.pref('autoAdvance', false) });
  C('col.quick', 'Add to / Remove from Target Collection', 'B', () => App.quickToggle(App.selIds())); C('col.new', 'New Collection…', 'Ctrl+Shift+N', () => Collections.create('collection', null)); C('col.smart', 'New Smart Collection…', '', () => Collections.editSmart(null)); C('col.set', 'New Collection Set…', '', () => Collections.create('set', null));
  C('col.savequick', 'Save Quick Collection…', 'Ctrl+Alt+B', () => Collections.saveQuick()); C('col.showquick', 'Show Quick Collection', 'Ctrl+B', () => App.setSource({ type: 'quick' }));
  C('photo.vcopy', 'Create Virtual Copy', "Ctrl+'", () => Lib.virtualCopy()); C('stack.group', 'Group into Stack', 'Ctrl+G', () => Lib.stack()); C('stack.ungroup', 'Unstack', 'Ctrl+Shift+G', () => Lib.unstack()); C('stack.toggle', 'Expand / Collapse Stack', 'S', () => { const p = App.cur(); if (p && p.stack_id) Lib.toggleStack(p); }, lib); C('stack.auto', 'Auto-Stack by Capture Time…', '', () => Lib.autoStack());
  C('photo.rotl', 'Rotate Left (CCW)', 'Ctrl+[', () => Lib.rotate('ccw')); C('photo.rotr', 'Rotate Right (CW)', 'Ctrl+]', () => Lib.rotate('cw')); C('photo.fliph', 'Flip Horizontal', '', () => Lib.rotate('fliph')); C('photo.flipv', 'Flip Vertical', '', () => Lib.rotate('flipv'));
  C('photo.remove', 'Remove Photos…', 'Delete', () => Lib.remove(), lib); C('photo.rename', 'Rename Photos…', 'F2', () => Naming.rename()); C('photo.dng', 'Convert Photos to DNG…', '', () => Ext.dng()); C('photo.locate', 'Find Missing Photo…', '', () => Ext.locate());
  C('photo.smart', 'Build Smart Previews', '', async () => { const ids = App.selIds(); const r = await runJob(api('smart_previews_build', { ids }), 'Building Smart Previews'); await App.reloadPhotos(ids); UI.toast(r.built + ' Smart Preview(s) built'); });
  C('photo.smartdiscard', 'Discard Smart Previews', '', async () => { const ids = App.selIds(); await api('smart_previews_discard', { ids }); await App.reloadPhotos(ids); UI.toast('Smart Previews discarded'); });
  C('photo.explorer', 'Show in Explorer', 'Ctrl+R', () => App.cur() && api('fs_reveal', { path: App.cur().path }));
  C('dev.copy', 'Copy Settings…', 'Ctrl+Shift+C', () => Dev.copy()); C('dev.paste', 'Paste Settings', 'Ctrl+Shift+V', () => Dev.paste()); C('dev.sync', 'Sync Settings…', 'Ctrl+Shift+S', () => Dev.sync());
  C('dev.reset', 'Reset All Settings', 'Ctrl+Shift+R', () => (App.module === 'develop' ? Dev.reset() : Dev.resetMany())); C('dev.undo', 'Undo', 'Ctrl+Z', () => Dev.undo(), { modules: ['develop'] }); C('dev.redo', 'Redo', 'Ctrl+Y', () => Dev.redo(), { modules: ['develop'] });
  C('dev.snapshot', 'New Snapshot…', 'Ctrl+Shift+U', () => { App.show('develop'); Dev.createSnap(); }); C('dev.preset', 'New Preset…', '', () => { App.show('develop'); Dev.createPreset(); }); C('dev.auto', 'Auto Tone', 'Ctrl+U', () => Dev.autoTone(App.selIds()));
  C('dev.proof', 'Soft Proofing', '', () => { App.show('develop'); Dev.toggleProof(); }, { checked: () => Dev.proof.on }); C('dev.before', 'Before / After', '', () => { App.show('develop'); Dev.setMode(Dev.mode === 'before-lr' ? 'loupe' : 'before-lr'); }); C('dev.reference', 'Reference View', '', () => { App.show('develop'); Dev.setMode(Dev.mode === 'reference' ? 'loupe' : 'reference'); });
  for (const [id, label, fn] of [['crop', 'Crop & Straighten', () => Tools.set('crop')], ['spot', 'Spot Removal / Healing', () => Tools.set('spot')], ['redeye', 'Red Eye Correction', () => Tools.set('redeye')], ['brush', 'Masking: Brush', () => Tools.addMask('brush')], ['linear', 'Masking: Linear Gradient', () => Tools.addMask('linear')], ['radial', 'Masking: Radial Gradient', () => Tools.addMask('radial')], ['guided', 'Guided Upright', () => Tools.upright('guided')]]) C('tool.' + id, label, '', () => { App.show('develop'); setTimeout(fn, 80); });
  C('meta.xmpwrite', 'Save Metadata to XMP Sidecar', 'Ctrl+S', async () => { const r = await api('xmp_write', { ids: App.selIds() }); UI.toast(r.written.length + ' XMP sidecar file(s) written'); });
  C('meta.xmpread', 'Read Metadata from XMP Sidecar', '', async () => { const ids = App.selIds(), r = await api('xmp_read', { ids }); App.addPhotos(r.photos); App.setKeywords(r.keywords); App.emit('meta', ids); Render.thumbs(ids); if (App.module === 'develop') Dev.load(App.cur(), true); UI.toast(r.read + ' sidecar(s) read'); });
  C('meta.exif', 'Show All EXIF…', '', () => MetaUI.showExif()); C('meta.sync', 'Sync Metadata…', '', () => MetaUI.syncMeta()); C('meta.kwnew', 'New Keyword Tag…', '', () => Keywords.create(null));
  C('merge.pano', 'Panorama…', 'Ctrl+M', () => Merge.dialog('pano')); C('merge.hdr', 'HDR…', 'Ctrl+H', () => Merge.dialog('hdr'));
  C('people.find', 'Find Faces in These Photos', '', () => { App.show('library'); Lib.setView('people'); People.scan(); });
  C('filter.toggle', 'Enable Filters', 'Ctrl+L', () => { App.filter.on = !App.filter.on; App.refreshList(true); App.emit('filter'); }, { checked: () => App.filter.on }); C('filter.bar', 'Show Filter Bar', '', () => Lib.toggleFilterBar(), { checked: () => App.pref('filterBar', true) });
  C('paint.toggle', 'Painter (Spray Can)', 'Ctrl+Alt+K', () => { App.show('library'); Lib.setView('grid'); Painter.toggle(); });
  for (let i = 1; i <= 9; i++) C('kwset.' + i, 'Keyword Set ' + i, 'Alt+' + i, () => Keywords.toggle(Keywords.current()[i - 1]), libdev);
  C('help.keys', 'Keyboard Shortcuts…', 'Ctrl+/', () => { const rows = Object.values(App.commands).filter(c => c.key && !c.id.startsWith('kwset') && !c.id.startsWith('rate.')).map(c => h('tr', {}, h('td', {}, c.label.replace(/…$/, '')), h('td', {}, h('kbd', {}, c.key))));
    const extra = [['Rating 0–5 / Labels 6–9', '0 – 9'], ['Keyword Set shortcuts', 'Alt+1 – 9'], ['Develop: Crop / Heal / Brush / Linear / Radial', 'R / Q / K / M / Shift+M'], ['Develop: Before / Side-by-side / Split / Reference', '\\ / Y / Shift+Y / Shift+R'], ['Develop: WB picker / Clipping / Soft proof / Mask overlay', 'W / J / S / O'], ['Zoom', 'Z, Space, mouse wheel'], ['Move loupe guides', 'Ctrl+drag']].map(([a, b]) => h('tr', {}, h('td', {}, a), h('td', {}, h('kbd', {}, b))));
    UI.dialog({ title: 'Keyboard Shortcuts', width: 560, body: h('div', { class: 'scroll' }, h('table', { class: 'tbl' }, ...extra, ...rows)) }); });
  C('mode.beginner', 'Beginner Mode', '', () => Modes.set('beginner', !Modes.beginner), { checked: () => Modes.beginner }); C('mode.trackpad', 'Trackpad-Friendly Controls', '', () => Modes.set('trackpad', !Modes.trackpad), { checked: () => Modes.trackpad });
  const M = (id, label, key, fn) => C('music.' + id, label, key, () => { if (App.module === 'music') fn(); }, { modules: ['music'] });
  M('new', 'New Song', '', () => Music.save().then(() => Music.create())); M('rename', 'Rename Song…', '', () => Music.rename()); M('import', 'Import Audio…', '', () => Music.importAudio()); M('importmidi', 'Import MIDI…', '', () => Music.importMidi()); M('stems', 'Export Each Track (Stems)…', '', () => Music.exportStems()); M('midi', 'Export MIDI…', '', () => Music.exportMidi()); M('mp3', 'Export as MP3…', '', () => Music.exportAudio('.mp3')); M('record', 'Record', '', () => Music.toggleRec()); M('export', 'Export as WAV…', '', () => Music.exportWav());
  M('undo', 'Undo', '', () => Music.step(Music.undo, Music.redo)); M('redo', 'Redo', '', () => Music.step(Music.redo, Music.undo)); M('cut', 'Cut', '', () => Music.cut()); M('copy', 'Copy', '', () => Music.copy()); M('paste', 'Paste', '', () => Music.paste());
  M('delete', 'Delete', '', () => Music.remove(true)); M('silence', 'Silence', '', () => Music.remove(false)); M('split', 'Split', '', () => Music.splitHere()); M('trim', 'Trim to Selection', '', () => Music.trim());
    for (const r of ['drums', 'bass', 'chords', 'melody']) M('add.' + r, 'Add ' + ROLES[r].name, '', () => Music.addTrack(r));
  C('help.tour', 'Take the Tour', '', () => Tour.start());
  C('help.about', 'About Opia', '', () => UI.alert('About Opia', `Opia ${App.boot.version}\nA local-first photo organizer and editor.\n\nCatalog: ${App.info.path}\nRAW support: ${App.boot.raw ? 'yes (LibRaw)' : 'not installed'}   Face models: ${App.boot.faces ? 'installed' : 'missing'}\nEverything runs on this computer; map tiles are the only thing fetched from the internet.`));
}

function buildMenus() {
  const recent = () => (App.cfg.recent_catalogs || []).slice(0, 6).map(p => ({ label: p.split(/[\\/]/).pop().replace(/\.(opiacat|lumcat|lrcat)$/i, ''), checked: p === App.info.path, run: () => Catalogs.switchTo(p) }));
  const rating = { label: 'Set Rating', sub: [0, 1, 2, 3, 4, 5].map(r => ({ label: r ? '★'.repeat(r) : 'None', key: String(r), run: () => App.rate({ rating: r }) })) };
  const looks = [{ label: 'Theme', sub: looksMenu('theme') }, { label: 'Language', sub: looksMenu('lang') }, '-', 'mode.beginner', 'mode.trackpad', '-'];
  if (App.module === 'music') return App.buildMenus([
    ['File', ['music.new', 'music.rename', '-', 'music.import', 'music.importmidi', 'music.record', '-', 'music.export', 'music.mp3', 'music.stems', 'music.midi', '-', 'file.prefs']],
    ['Edit', Modes.beginner ? ['music.undo', 'music.redo'] : ['music.undo', 'music.redo', '-', 'music.cut', 'music.copy', 'music.paste', 'music.delete', 'music.silence', '-', 'music.split', 'music.trim']],
    ['Track', ['music.add.drums', 'music.add.bass', 'music.add.chords', 'music.add.melody', 'music.import']],
    ...(Modes.beginner ? [] : [['Effects', () => Music.fxItems()], ['Generate', () => Music.genItems()]]),
    ['View', () => [...looks, 'view.full']],
    ['Help', ['help.tour', 'help.keys', 'help.about']],
  ]);
  if (Modes.beginner) return App.buildMenus([   // the short menus; Advanced has everything
    ['File', ['file.import', 'file.export', '-', 'file.prefs']],
    ['Edit', ['dev.undo', 'dev.redo', '-', 'edit.selectall', 'edit.selectnone']],
    ['Photo', ['flag.pick', 'flag.none', 'flag.reject', rating, '-', 'photo.rotl', 'photo.rotr', '-', 'dev.auto', 'dev.reset', '-', 'col.new', 'photo.remove']],
    ['View', () => [...looks, 'view.grid', 'view.loupe', 'go.develop', '-', 'view.full']],
    ['Help', ['help.tour', 'help.keys', 'help.about']],
  ]);
  App.buildMenus([
    ['File', () => ['file.newcatalog', 'file.catalogs', { label: 'Open Recent', sub: recent }, '-', 'file.import', 'file.tether', '-', 'file.export', 'file.exportagain', { label: 'Plug-in Extras', sub: () => Plugins.menu() }, '-', 'file.backup', 'file.optimize', 'file.plugins', '-', 'file.prefs']],
    ['Edit', ['dev.undo', 'dev.redo', '-', 'edit.selectall', 'edit.selectnone', '-', 'edit.identity', 'edit.watermarks', 'edit.templates', 'edit.metapresets', 'edit.keywordsets', 'prefs.editors']],
    ['Library', ['col.new', 'col.smart', 'col.set', '-', 'col.quick', 'col.showquick', 'col.savequick', '-', 'filter.toggle', 'filter.bar', 'paint.toggle', '-', 'people.find', 'photo.smart', 'photo.smartdiscard', 'photo.locate', '-', 'photo.rename', 'photo.dng']],
    ['Photo', () => ['photo.vcopy', '-', 'flag.pick', 'flag.none', 'flag.reject', rating,
      { label: 'Set Color Label', sub: [...Object.keys(LABELS).map(l => ({ label: l[0].toUpperCase() + l.slice(1), run: () => App.rate({ label: l }) })), { label: 'None', run: () => App.rate({ label: '' }) }] }, 'rate.auto', '-',
      'stack.group', 'stack.ungroup', 'stack.toggle', 'stack.auto', '-', 'photo.rotl', 'photo.rotr', 'photo.fliph', 'photo.flipv', '-',
      { label: 'Edit In', sub: () => [...App.conf('editors', []).map(ed => ({ label: ed.name, run: () => Ext.editIn(ed) })), { label: 'Configure External Editors…', run: () => App.run('prefs.editors') }] }, { label: 'Photo Merge', sub: [{ label: 'Panorama…', key: 'Ctrl+M', run: () => App.run('merge.pano') }, { label: 'HDR…', key: 'Ctrl+H', run: () => App.run('merge.hdr') }] }, '-', 'photo.explorer', 'photo.remove']],
    ['Develop', ['dev.copy', 'dev.paste', 'dev.sync', 'dev.auto', 'dev.reset', '-', 'dev.snapshot', 'dev.preset', '-', 'dev.before', 'dev.reference', 'dev.proof', '-', 'tool.crop', 'tool.spot', 'tool.redeye', 'tool.brush', 'tool.linear', 'tool.radial', 'tool.guided']],
    ['Metadata', ['meta.kwnew', 'edit.keywordsets', '-', 'meta.sync', 'edit.metapresets', '-', 'meta.xmpwrite', 'meta.xmpread', 'meta.exif']],
    ['View', () => [...looks, 'view.grid', 'view.loupe', 'view.compare', 'view.survey', 'view.people', '-', 'view.info', 'view.panels', 'view.film', 'view.full']],
    ['Window', MODULES.map(m => 'mod.' + m.id)],
    ['Help', ['help.tour', 'help.keys', 'help.about']],
  ]);
}

function looksMenu(kind) {
  const themes = Object.entries(THEMES).map(([k, n]) => ({ label: n, checked: Theme.cur === k, run: () => Theme.set(k) }));
  const langs = [['en', 'English'], ['es', 'Espa\u00f1ol']].map(([k, n]) => ({ label: n, checked: Lang.cur === k, run: () => Lang.set(k) }));
  return kind === 'theme' ? themes : kind === 'lang' ? langs : [...themes, '-', ...langs];
}

async function start() {
  const t0 = performance.now();
  try {
    App.boot = await api('boot'); App.cfg = App.boot.config || {};
    registerCommands(); Modes.init(); buildMenus();
    $('#looks').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); UI.menu(r.right - 220, r.bottom + 6, looksMenu()); };
    $('#brand').onclick = () => App.run('help.about');
    new MutationObserver(() => $('#brand').classList.toggle('busy', $('#activity').children.length > 0)).observe($('#activity'), { childList: true });
    $('#identity').replaceChildren(Identity.el()); $('#identity').ondblclick = () => Identity.edit(); $('#identity').title = 'Double-click to customise the identity plate';
    const pick = $('#modpick'); for (const m of MODULES) { App.addModule(m); pick.append(h('a', { data: { m: m.id }, onclick: () => App.show(m.id) }, m.name)); }
    App.addModule(Music);
    const apps = () => $('#apps').replaceChildren(h('span', { class: 'seg' }, h('a', { class: App.module !== 'music' ? 'on' : '', title: 'Organise and edit photos', onclick: () => App.show(App.lastPhoto || 'library') }, 'Photos'), h('a', { class: App.module === 'music' ? 'on' : '', title: 'Make and edit music', onclick: () => App.show('music') }, 'Music')));
    App.on('module', id => { if (id !== 'music') App.lastPhoto = id; apps(); buildMenus(); dispatchEvent(new Event('resize')); });
    Dev.el = UI.shell('develop'); Dev.init(Dev.el); GLR.init(Dev.cv);
    Film.init();
    await App.loadCatalog();
    App.show('library');
    const wait = Math.max(0, 1900 - (performance.now() - t0)), tour = !App.pref('tourDone', false);
    setTimeout(() => $('#splash').classList.add('gone'), wait);   // let the logo finish drawing itself
    if (tour) setTimeout(() => Tour.start(), wait + 650);
    App.on('catalog', () => { Lib.cells.clear(); });
    if (!App.photos.size && !tour) UI.toast('Welcome. Use File > Import Photos, or open Local Disk in the left panel to add a folder.');
  } catch (e) { console.error(e); $('#splash').classList.add('gone'); document.body.append(h('div', { class: 'fatal' }, h('h2', {}, 'Opia could not start'), h('pre', {}, String(e && e.stack || e)))); }
}
start();
