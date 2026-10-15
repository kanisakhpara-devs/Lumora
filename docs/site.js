'use strict';
/* Opia website: theme and language switches, things that appear as they scroll in, the hero picture that lies flat as you scroll,
   and the pinned window whose picture and colour follow the workspace being read about. */

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window: the choice lasts this visit */ } } };
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Spanish; English is what the page is written in */
const ES = {
  skip: 'Saltar al contenido', 'nav.ws': 'Espacios', 'nav.features': 'Funciones', 'nav.private': 'Privacidad', 'nav.faq': 'Preguntas', 'nav.new': 'Novedades', 'nav.download': 'Descargar',
  'theme.toLight': 'Cambiar al tema claro', 'theme.toDark': 'Cambiar al tema oscuro',
  'hero.title': 'Fotos, imágenes, vídeo, música y PDF.<br><span>Una app, todo en tu ordenador.</span>',
  'hero.lead': 'Cinco espacios creativos en una app de escritorio gratuita. Sin cuenta, sin subidas, sin suscripción.',
  'hero.download': 'Descargar para Windows', 'hero.github': 'Ver en GitHub',
  'ws.eyebrow': 'Cinco espacios de trabajo', 'ws.title': 'Un selector arriba. Todo lo que creas.',
  'lens.p': 'Importa, ordena y encuentra tus fotos, y edítalas sin cambiar nunca los originales.', 'lens.1': 'Valoraciones, banderas, etiquetas de color, colecciones y palabras clave', 'lens.2': 'Revelar: tono, color, curvas, máscaras, corrección y ajustes preestablecidos', 'lens.3': 'Caras, mapa, libro, presentación, impresión y galería web',
  'imagine.p': 'Un editor de imágenes por capas, al estilo de Photoshop.', 'imagine.1': 'Capas con modos de fusión, texto y formas editables', 'imagine.2': 'Selecciones, varita mágica, pincel, degradado y transformación libre', 'imagine.3': 'Niveles, curvas, tono y saturación con vista previa en directo',
  'motion.p': 'Un editor de vídeo con línea de tiempo que exporta MP4.', 'motion.1': 'Pistas de vídeo y audio; recorta, divide y ajusta', 'motion.2': 'Fundidos, fundidos encadenados, títulos e imagen en imagen', 'motion.3': 'Convierte las fotos seleccionadas en un vídeo con un clic',
  'groove.p': 'Un estudio de música para quien no lee partituras, y también para quien sí.', 'groove.1': 'Riffs de batería, bajo, acordes y melodía que siempre encajan', 'groove.2': 'Arrastra archivos de sonido, graba, corta y añade efectos', 'groove.3': 'Exporta WAV, MP3, pistas separadas o MIDI',
  'folio.p': 'Lee, rellena, firma y reordena archivos PDF.', 'folio.1': 'Escribe, resalta, dibuja, marca y firma donde quieras', 'folio.2': 'Reordena, gira, divide y combina páginas y archivos', 'folio.3': 'Números de página, marcas de agua y contraseñas',
  'f.eyebrow': 'Pensada para ser fácil', 'f.title': 'Sencilla al empezar. Completa cuando la necesitas.',
  'f1.t': 'Principiante y Avanzado', 'f1.p': 'Principiante muestra lo esencial con controles más grandes. Avanzado muestra todos los paneles y herramientas.',
  'f2.t': 'Cuatro temas', 'f2.p': 'Opia Dark, Midnight Teal, Porcelain y Lilac Haze, cada uno con su color para cada espacio.',
  'f3.t': 'Inglés y español', 'f3.p': 'Cambia de idioma cuando quieras, sin cerrar la app.',
  'f4.t': 'Cómoda con el teclado', 'f4.p': 'Todos los botones con Tab, los menús con F10 y atajos que puedes cambiar.',
  'f5.t': 'Modo panel táctil', 'f5.p': 'Dos dedos desplazan, al pellizcar se hace zoom y los controles son más grandes.',
  'f6.t': 'Todo conectado', 'f6.p': 'Abre una foto de Lens en Imagine o convierte un grupo de fotos en un vídeo de Motion.',
  'f7.t': 'Exporta a todo', 'f7.p': 'JPEG, PNG, TIFF, WebP y AVIF, MP4, WAV y MP3, PDF.',
  'f8.t': 'Complementos', 'f8.p': 'Añade tus propios comandos en Python, que se ejecutan tras cada importación o exportación.',
  'p.eyebrow': 'Privada desde el diseño', 'p.title': 'Tus archivos nunca salen de tu ordenador.',
  'p.p': 'Opia no tiene cuenta ni nube. Tus fotos, canciones, vídeos y documentos se quedan en tus carpetas, y los originales nunca cambian. Solo se conecta a internet para los mosaicos del mapa y para las subidas FTP que tú inicies.',
  'p.1': 'Sin registro, sin suscripción', 'p.2': 'Funciona sin conexión', 'p.3': 'Los originales no se tocan',
  'n.eyebrow': 'Novedades', 'n.title': 'Añadido recientemente',
  n1: 'Un editor de imágenes por capas: capas, selecciones, texto, ajustes y filtros.', n2: 'Un editor de vídeo con línea de tiempo, títulos y fundidos que exporta MP4.', n3: 'Arrastra archivos de sonido a la línea de tiempo donde quieras, mueve clips entre pistas y recórtalos por los extremos.',
  'n4.t': 'Accesibilidad', n4: 'Todo accesible con el teclado, nombres para lectores de pantalla y más contraste en todos los temas.', 'n5.t': 'Nombres nuevos', n5: 'Los espacios ahora se llaman Lens, Imagine, Motion, Groove y Folio.', 'n.more': 'Ver el registro de cambios completo →',
  'q.title': 'Preguntas, con respuestas sinceras',
  q1: '¿Es gratis?', a1: 'Sí. No hay nada que pagar ni cuenta que crear. El proyecto aún no ha elegido una licencia de código abierto, así que por ahora el código se comparte para verlo y ejecutarlo, no para reutilizarlo.',
  q2: '¿Funciona sin conexión?', a2: 'Sí. Todo se ejecuta en tu ordenador. Solo el mapa de Lens necesita internet, para descargar los mosaicos.',
  q3: '¿En qué ordenadores funciona?', a3: 'Está hecha y probada para Windows 10 y 11. Funciona desde el código en Python, pero algunas partes (la papelera de reciclaje, grabar discos, mostrar archivos en el Explorador) son solo de Windows, y otros sistemas no se han probado.',
  q4: '¿Puede abrir mi catálogo de Lightroom?', a4: 'No. Lens tiene su propio formato de catálogo. Sí lee archivos XMP, así que las valoraciones, palabras clave y ajustes guardados así se conservan.',
  q5: '¿Cambiará mis archivos originales?', a5: 'No. Los ajustes se guardan aparte, e Imagine, Motion y Folio siempre guardan archivos nuevos. Tus originales nunca se sobrescriben salvo que decidas guardar encima.',
  q6: '¿Qué no puede hacer?', a6: 'La edición de fotos es de 8 bits, Imagine no tiene compatibilidad con PSD ni máscaras de capa, Motion no cambia la velocidad ni usa fotogramas clave, y Folio no puede reescribir el texto de un PDF ni leer escaneos. El README enumera todos los límites.',
  'd.title': 'Consigue Opia', 'd.p': 'Gratis para Windows 10 y 11.', 'd.btn': 'Descargar para Windows',
  'd.note': 'La app lista para usar se publica en la página de versiones (Releases). Si todavía no hay ninguna, ejecútala desde el código como se indica abajo.',
  'd.src': 'O ejecútala desde el código con Python 3.10 o posterior:', 'd.copy': 'Copiar', 'd.copied': 'Copiado',
  'ft.p': 'Fotos, imágenes, vídeo, música y PDF, todo en tu ordenador.', 'ft.links': 'Enlaces', 'ft.changelog': 'Registro de cambios', 'ft.releases': 'Versiones', 'ft.credits': 'Créditos',
  'ft.c1': 'El vídeo usa FFmpeg del paquete imageio-ffmpeg (BSD-2-Clause). El programa ffmpeg que incluye suele ser una versión GPL; si compartes la app con él dentro, la GPL se aplica a esa parte.',
  'ft.c2': 'Muestras de instrumentos de la SoundFont Fluid R3 GM, CC BY 3.0. La tipografía Nunito, SIL Open Font License. Herramientas PDF con pypdf y pypdfium2.',
  'ft.c3': 'Las imágenes de las capturas se generaron para esta página; no son fotos reales.',
};
const EN = {};

function setLang(lang) {
  for (const el of $$('[data-i18n]')) {
    const k = el.dataset.i18n; if (!(k in EN)) EN[k] = el.innerHTML;
    el.innerHTML = lang === 'es' && ES[k] ? ES[k] : EN[k];
  }
  document.documentElement.lang = lang;
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  document.title = lang === 'es' ? 'Opia: fotos, imágenes, vídeo, música y PDF en una app' : 'Opia: photos, pictures, video, music and PDFs in one app';
  store.set('opia-site-lang', lang); themeLabel();
}
$$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

/* ---- theme: dark unless the visitor picked light here before */
const html = document.documentElement;
function themeLabel() { const es = html.lang === 'es', light = html.dataset.theme === 'light'; $('.theme').setAttribute('aria-label', light ? (es ? ES['theme.toDark'] : 'Switch to the dark theme') : (es ? ES['theme.toLight'] : 'Switch to the light theme')); }
html.dataset.theme = store.get('opia-site-theme') === 'light' ? 'light' : 'dark';
$('.theme').addEventListener('click', () => { html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light'; store.set('opia-site-theme', html.dataset.theme); themeLabel(); });
setLang(store.get('opia-site-lang') === 'es' ? 'es' : 'en');

/* ---- things that appear as they come into view */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
$$('.reveal, .vault').forEach(el => io.observe(el));

/* ---- the pinned window follows the workspace being read about */
const steps = $$('.step'), shots = $$('.shots img'), pills = $$('.switch b');
function activate(i) {
  steps.forEach((s, k) => s.classList.toggle('on', k === i));
  shots.forEach((s, k) => s.classList.toggle('on', k === i));
  pills.forEach((s, k) => s.classList.toggle('on', k === i));
  setAccent(steps[i].dataset.accent);
}
/* the accent and a text colour that reads on it: dark on the light accents (amber, sky, violet, coral), white on blue */
function setAccent(c) {
  const n = parseInt(c.slice(1), 16), lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }, L = .2126 * lin(n >> 16 & 255) + .7152 * lin(n >> 8 & 255) + .0722 * lin(n & 255);
  html.style.setProperty('--accent', c); html.style.setProperty('--onacc', L > .18 ? '#14100a' : '#ffffff');
}
const storyIo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) activate(steps.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
steps.forEach(s => storyIo.observe(s));
activate(0);
/* outside the story the page goes back to the Opia blue */
new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) setAccent('#3d5afe'); }), { rootMargin: '0px' }).observe($('.story'));

/* ---- scrolling: the hero picture lies flat, the header gets a line, the nav marks where you are */
const shot = $('.hero-shot'), topBar = $('.top'), stageWin = $('.stage .window');
const sections = $$('.links a').map(a => [a, $(a.getAttribute('href'))]);
let ticking = false;
function onScroll() {
  ticking = false; const y = scrollY, vh = innerHeight;
  topBar.classList.toggle('scrolled', y > 10);
  if (!still && shot) { const r = shot.getBoundingClientRect(), p = Math.min(1, Math.max(0, 1 - (r.top - vh * .2) / (vh * .7))); shot.style.setProperty('--tilt', (22 * (1 - p)).toFixed(2) + 'deg'); shot.style.setProperty('--sc', (.92 + .08 * p).toFixed(3)); }
  let cur = null; for (const [a, s] of sections) if (s && s.getBoundingClientRect().top < vh * .4) cur = a;
  sections.forEach(([a]) => a.classList.toggle('on', a === cur));
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
function fitStage() { if (stageWin) document.documentElement.style.setProperty('--wh', stageWin.offsetHeight + 'px'); }
addEventListener('resize', fitStage); addEventListener('load', fitStage); fitStage(); onScroll();

/* ---- copy the commands */
$('.copy').addEventListener('click', async e => {
  const b = e.currentTarget, text = $('.code code').textContent;
  try { await navigator.clipboard.writeText(text); } catch (err) { const r = document.createRange(); r.selectNodeContents($('.code code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  const es = html.lang === 'es'; b.textContent = es ? ES['d.copied'] : 'Copied'; setTimeout(() => { b.textContent = es ? ES['d.copy'] : 'Copy'; }, 1600);
});
