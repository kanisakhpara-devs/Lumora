'use strict';
/* Themes and languages, both switchable while the app is running.
   Translation works on the finished page: every piece of interface text that has an entry below is swapped,
   and swapped back when the language changes. Text without an entry (and all of your own content) is left alone. */

const THEMES = { noir: 'Gold Noir', midnight: 'Midnight Teal', porcelain: 'Porcelain (light)', lilac: 'Lilac Haze (light)' };
const Theme = {
  get cur() { return localStorage.lumora_theme in THEMES ? localStorage.lumora_theme : 'noir'; },
  css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); },
  rgb(name, alpha = 1) { const m = this.css(name).match(/^#?([0-9a-f]{6})$/i); const n = m ? parseInt(m[1], 16) : 0x1a1a1b; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, alpha]; },
  set(name) {
    localStorage.lumora_theme = name; document.documentElement.dataset.theme = name;
    if (typeof App === 'undefined' || !App.module) return;   // still starting up
    App.emit('theme');
    if (Dev.cv) { Dev.render(); Dev.histoSoon(); }
    if (Panels.histC) Panels.drawHist();
    if (App.module === 'map') MapMod.draw();
  },
};
document.documentElement.dataset.theme = Theme.cur;

const ES = `
File=Archivo|Edit=Edición|Library=Biblioteca|Photo=Foto|Develop=Revelar|Metadata=Metadatos|View=Ver|Window=Ventana|Help=Ayuda|Map=Mapa|Book=Libro|Slideshow=Proyección|Print=Imprimir|Web=Web
Import Photos…=Importar fotos…|Import Photos=Importar fotos|Export…=Exportar…|Export=Exportar|Export with Previous=Exportar con ajustes anteriores|New Catalog…=Nuevo catálogo…|New Catalog=Nuevo catálogo|Open / Manage Catalogs…=Abrir / gestionar catálogos…|Open Recent=Abrir recientes
Back Up Catalog…=Copia de seguridad del catálogo…|Optimize Catalog…=Optimizar catálogo…|Optimize Catalog=Optimizar catálogo|Plug-in Manager…=Gestor de complementos…|Plug-in Manager=Gestor de complementos|Plug-in Extras=Extras de complementos|Tethered Capture…=Captura conectada…|Preferences…=Preferencias…|Preferences=Preferencias
External Editors…=Editores externos…|Identity Plate Setup…=Configurar placa de identidad…|Edit Watermarks…=Editar marcas de agua…|Filename Template Editor…=Editor de plantillas de nombre…|Filename Template Editor=Editor de plantillas de nombre|Edit Metadata Presets…=Editar ajustes de metadatos…|Edit Metadata Presets=Editar ajustes de metadatos|Edit Keyword Sets…=Editar conjuntos de palabras clave…
Select All=Seleccionar todo|Select None=No seleccionar nada|Grid=Cuadrícula|Loupe=Lupa|Compare=Comparar|Survey=Encuesta|People=Personas|Loupe Info Overlay=Información en la lupa|Full Screen=Pantalla completa|Show / Hide Side Panels=Mostrar / ocultar paneles|Show / Hide Filmstrip=Mostrar / ocultar tira de imágenes
Flag as Pick=Marcar como seleccionada|Unflag=Quitar indicador|Set as Rejected=Marcar como rechazada|No Rating=Sin clasificación|Auto Advance=Avance automático|Set Rating=Definir clasificación|Set Color Label=Definir etiqueta de color|Set Flag=Definir indicador|None=Ninguno|Edit In=Editar en|Photo Merge=Combinar fotos
New Collection…=Nueva colección…|New Smart Collection…=Nueva colección inteligente…|New Collection Set…=Nuevo conjunto de colecciones…|Save Quick Collection…=Guardar colección rápida…|Show Quick Collection=Mostrar colección rápida|Add to / Remove from Target Collection=Añadir / quitar de la colección de destino
Create Virtual Copy=Crear copia virtual|Group into Stack=Agrupar en pila|Unstack=Desapilar|Expand / Collapse Stack=Expandir / contraer pila|Auto-Stack by Capture Time…=Apilar automáticamente por hora de captura…|Stacking=Apilamiento
Rotate Left (CCW)=Girar a la izquierda|Rotate Right (CW)=Girar a la derecha|Flip Horizontal=Voltear horizontal|Flip Vertical=Voltear vertical|Remove Photos…=Quitar fotos…|Remove Photo…=Quitar foto…|Rename Photos…=Renombrar fotos…|Convert Photos to DNG…=Convertir fotos a DNG…|Find Missing Photo…=Buscar foto perdida…
Build Smart Previews=Crear previsualizaciones inteligentes|Discard Smart Previews=Descartar previsualizaciones inteligentes|Show in Explorer=Mostrar en el Explorador|Copy Settings…=Copiar ajustes…|Copy Settings=Copiar ajustes|Paste Settings=Pegar ajustes|Sync Settings…=Sincronizar ajustes…|Sync Settings=Sincronizar ajustes|Sync Metadata…=Sincronizar metadatos…|Sync Metadata=Sincronizar metadatos
Reset All Settings=Restaurar todos los ajustes|Undo=Deshacer|Redo=Rehacer|New Snapshot…=Nueva instantánea…|New Preset…=Nuevo ajuste preestablecido…|Auto Tone=Tono automático|Soft Proofing=Prueba en pantalla|Reference View=Vista de referencia|Before / After=Antes / después|Crop & Straighten=Recortar y enderezar
Spot Removal / Healing=Eliminación de manchas / corrección|Red Eye Correction=Corrección de ojos rojos|Masking: Brush=Máscara: pincel|Masking: Linear Gradient=Máscara: degradado lineal|Masking: Radial Gradient=Máscara: degradado radial|Guided Upright=Upright guiado
Save Metadata to XMP Sidecar=Guardar metadatos en archivo XMP|Read Metadata from XMP Sidecar=Leer metadatos del archivo XMP|Show All EXIF…=Mostrar todo el EXIF…|New Keyword Tag…=Nueva palabra clave…|Panorama…=Panorama…|Find Faces in These Photos=Buscar caras en estas fotos|Enable Filters=Activar filtros|Show Filter Bar=Mostrar barra de filtros|Painter (Spray Can)=Pintor (aerosol)
Keyboard Shortcuts…=Atajos de teclado…|Keyboard Shortcuts=Atajos de teclado|About Lumora=Acerca de Lumora|Theme=Tema|Language=Idioma|Appearance=Apariencia
Cancel=Cancelar|Close=Cerrar|Done=Hecho|Save=Guardar|Delete=Eliminar|Create=Crear|Open=Abrir|Choose=Elegir|Add=Añadir|Remove=Quitar|Rename=Renombrar|Reset=Restaurar|Copy=Copiar|Paste=Pegar|Clear=Borrar|Start=Iniciar|Import=Importar|Merge=Combinar|Convert=Convertir|Restore=Restaurar|Refresh=Actualizar|Duplicate=Duplicar|Move=Mover|Upload=Subir|Name=Nombre|Yes=Sí
New Folder=Nueva carpeta|Choose Folder=Elegir carpeta|Choose File=Elegir archivo|Preset…=Ajuste…|Preset=Ajuste|Save Preset=Guardar ajuste|Check All=Marcar todo|Check None=Desmarcar todo|Uncheck All=Desmarcar todo|Browse…=Examinar…|Edit…=Editar…|Add…=Añadir…|Manage…=Gestionar…|Customize…=Personalizar…|Choose…=Elegir…
Navigator=Navegador|Catalog=Catálogo|Folders=Carpetas|Local Disk=Disco local|Collections=Colecciones|Histogram=Histograma|Quick Develop=Revelado rápido|Keywording=Palabras clave|Keyword List=Lista de palabras clave|Presets=Ajustes preestablecidos|Snapshots=Instantáneas|History=Historial
All Photographs=Todas las fotografías|Quick Collection=Colección rápida|Previous Import=Importación anterior|Missing Photographs=Fotografías perdidas|Add Folder=Añadir carpeta|Import…=Importar…|Add Folder to Catalog=Añadir carpeta al catálogo|Synchronize Folder…=Sincronizar carpeta…|Find Missing Folder…=Buscar carpeta perdida…|Import into this Folder…=Importar a esta carpeta…
Keyword Tags=Etiquetas de palabras clave|Keyword Suggestions=Sugerencias de palabras clave|Keyword Set=Conjunto de palabras clave|Recent Keywords=Palabras clave recientes|Edit Set…=Editar conjunto…|Filter keywords=Filtrar palabras clave|Create Keyword Tag=Crear palabra clave|Edit Keyword Tag…=Editar palabra clave…|Edit Keyword Tag=Editar palabra clave|Keyword Name=Nombre de la palabra clave|Synonyms=Sinónimos|Put inside=Colocar dentro de|Include on export=Incluir al exportar|Add to selected photos=Añadir a las fotos seleccionadas
Assign to Selected Photos=Asignar a las fotos seleccionadas|Remove from Selected Photos=Quitar de las fotos seleccionadas|Use with Painter=Usar con el pintor|Move to Top Level=Mover al nivel superior|Delete…=Eliminar…|None (top level)=Ninguno (nivel superior)
Create Collection…=Crear colección…|Create Smart Collection…=Crear colección inteligente…|Create Collection Set…=Crear conjunto de colecciones…|Create Collection=Crear colección|Create Smart Collection=Crear colección inteligente|Create Collection Set=Crear conjunto de colecciones|Edit Smart Collection…=Editar colección inteligente…|Edit Smart Collection=Editar colección inteligente
Set as Target Collection=Definir como colección de destino|Add Selected Photos=Añadir fotos seleccionadas|Rename…=Renombrar…|Move into Set=Mover al conjunto|New Set…=Nuevo conjunto…|Export this Collection…=Exportar esta colección…|Inside Set=Dentro del conjunto|Match=Coincidir con|Add a rule=Añadir una regla|Clear Quick Collection=Vaciar colección rápida
Library Filter:=Filtro de biblioteca:|Text=Texto|Attribute=Atributo|Filters Off=Filtros desactivados|Custom Filter=Filtro personalizado|Filter:=Filtro:|Sort:=Ordenar:|Thumbnails=Miniaturas|Masters=Originales|Virtual Copies=Copias virtuales|Edited=Editadas|Unedited=Sin editar|Flagged=Con indicador|Unflagged=Sin indicador|Rejected=Rechazadas|Rated=Clasificadas
Capture Time=Hora de captura|Added Order=Orden de adición|File Name=Nombre de archivo|Rating=Clasificación|Pick=Selección|Label Color=Color de etiqueta|File Type=Tipo de archivo|Megapixels=Megapíxeles|File Size=Tamaño de archivo|Custom Order=Orden personalizado
Any Searchable Field=Cualquier campo|Filename=Nombre de archivo|Title=Título|Caption=Pie de foto|Keywords=Palabras clave|Creator=Autor|Camera=Cámara|Lens=Objetivo|Folder=Carpeta|Date=Fecha|Year=Año|Label=Etiqueta|Flag=Indicador|ISO Speed=Velocidad ISO|Aperture=Apertura|Focal Length=Distancia focal|Keyword=Palabra clave|Aspect Ratio=Proporción|City=Ciudad|Country=País
Find Faces=Buscar caras|Re-scan Selected=Volver a analizar selección|Link Focus=Vincular enfoque|X¦Y Swap=Intercambiar|Make Select=Hacer selección|Select=Selección|Candidate=Candidata|Add name=Añadir nombre|Show Photos=Mostrar fotos|Everyone is named.=Todas las personas tienen nombre.
Saved Preset=Ajuste guardado|Treatment=Tratamiento|Color=Color|Black & White=Blanco y negro|White Balance=Equilibrio de blancos|Reset All=Restaurar todo|Profile=Perfil|WB=EB|Temp=Temp.|Tint=Matiz|Tone=Tono|Auto=Automático|As Shot=Como se tomó|Daylight=Luz de día|Cloudy=Nublado|Shade=Sombra|Tungsten=Tungsteno|Fluorescent=Fluorescente|Flash=Flash|Custom=Personalizado
Exposure=Exposición|Contrast=Contraste|Highlights=Iluminaciones|Shadows=Sombras|Whites=Blancos|Blacks=Negros|Presence=Presencia|Texture=Textura|Clarity=Claridad|Dehaze=Borrar neblina|Vibrance=Intensidad|Saturation=Saturación
Basic=Básico|Tone Curve=Curva de tonos|HSL / Color=HSL / Color|Color Grading=Gradación de color|Detail=Detalle|Lens Corrections=Correcciones de lente|Transform=Transformar|Effects=Efectos|Calibration=Calibración|Previous=Anterior|Hue=Tono|Luminance=Luminancia|All=Todo|B&W Mix=Mezcla de B/N
Red=Rojo|Orange=Naranja|Yellow=Amarillo|Green=Verde|Aqua=Aguamarina|Blue=Azul|Purple=Púrpura|Magenta=Magenta|Midtones=Medios tonos|Global=Global|Blending=Fusión|Balance=Equilibrio|Lum=Lum
Sharpening=Enfoque|Amount=Cantidad|Radius=Radio|Masking=Máscara|Noise Reduction=Reducción de ruido|Smoothness=Suavizado|Remove Chromatic Aberration=Quitar aberración cromática|Enable Profile Corrections=Activar correcciones de perfil|Lens Profile=Perfil de lente|Save as Profile…=Guardar como perfil…|Import LCP…=Importar LCP…
Distortion=Distorsión|Vignetting=Viñeteado|Manual=Manual|Defringe=Eliminar halos|Purple Amt=Cant. púrpura|Purple Hue=Tono púrpura|Green Amt=Cant. verde|Green Hue=Tono verde|Midpoint=Punto medio|Off=Desactivado|Guided=Guiado|Level=Nivelar|Vertical=Vertical|Full=Completo|Horizontal=Horizontal|Rotate=Rotar|Aspect=Aspecto|Scale=Escala|X Offset=Desplazamiento X|Y Offset=Desplazamiento Y|Constrain Crop=Restringir recorte
Post-Crop Vignetting=Viñeta posterior al recorte|Roundness=Redondez|Feather=Desvanecer|Grain=Granulado|Size=Tamaño|Roughness=Rugosidad|Shadows Tint=Matiz de sombras|Red Primary=Primario rojo|Green Primary=Primario verde|Blue Primary=Primario azul|Save Camera Profile…=Guardar perfil de cámara…
Region=Región|Lights=Claros|Darks=Oscuros|Split Points=Puntos de división|Point Curve…=Curva de puntos…|Medium Contrast=Contraste medio|Strong Contrast=Contraste fuerte|Lift Shadows=Elevar sombras|Linear=Lineal|Negative=Negativo
Intent=Interpretación|Perceptual=Perceptual|Relative=Relativo|Simulate Paper & Ink=Simular papel y tinta|Show Destination Gamut Warning=Mostrar aviso de gama de destino|Create Proof Copy=Crear copia de prueba|Add Profile…=Añadir perfil…
Before ¦ After=Antes ¦ Después|Before=Antes|After=Después|Split=Dividida|Reference=Referencia|Set Reference=Fijar referencia|Active=Activa|Zoom=Zoom|Fit=Ajustar|Fill=Rellenar|Guides=Guías|User Presets=Ajustes de usuario|Lumora Presets=Ajustes de Lumora|Copy…=Copiar…
Crop=Recortar|Heal=Corregir|Red Eye=Ojos rojos|Clone=Clonar|Content-Aware=Según contenido|Opacity=Opacidad|Refresh Source=Actualizar origen|Pupil Size=Tamaño de pupila|Darken=Oscurecer|Angle=Ángulo|Flip H=Voltear H|Flip V=Voltear V|Original=Original|Free (unlocked)=Libre (desbloqueado)
Create New Mask=Crear máscara nueva|Masks=Máscaras|Brush=Pincel|Linear Gradient=Degradado lineal|Radial Gradient=Degradado radial|Range Mask=Máscara de rango|Depth (estimated)=Profundidad (estimada)|Target=Objetivo|Darkest=Más oscuro|Brightest=Más claro|Nearest=Más cercano|Farthest=Más lejano|Invert=Invertir|Brush Size=Tamaño de pincel|Flow=Flujo|Erase (or hold Alt)=Borrar (o mantener Alt)|Adjustments=Ajustes|Sharpness=Nitidez|Noise=Ruido|Color Hue=Tono de color|Color Amount=Cantidad de color|Overlay (O)=Superposición (O)|Clear Guides=Borrar guías
Upright=Upright|Straighten Tool=Herramienta enderezar|Apply to All Selected Photos=Aplicar a todas las fotos seleccionadas|Apply on Import=Aplicar al importar|Update with Current Settings=Actualizar con los ajustes actuales
From=Desde|Include Subfolders=Incluir subcarpetas|File Handling=Gestión de archivos|File Renaming=Cambio de nombre|Rename Files=Renombrar archivos|Template=Plantilla|Custom Text=Texto personalizado|Start Number=Número inicial|Apply During Import=Aplicar durante la importación|Develop Settings=Ajustes de revelado|Destination=Destino|Organize=Organizar|Into one folder=En una sola carpeta
Catalog Settings=Ajustes del catálogo|Catalogs=Catálogos|Backup=Copia de seguridad|Optimize & Info=Optimizar e información|Catalog Name=Nombre del catálogo|Location=Ubicación|Modified=Modificado|Open Other Catalog…=Abrir otro catálogo…|Back Up Catalog=Copia de seguridad del catálogo|Back Up Now=Hacer copia ahora|Backup Folder=Carpeta de copias|Existing Backups=Copias existentes|No backups yet=Aún no hay copias|Never=Nunca
Once a month, when exiting=Una vez al mes, al salir|Once a week, when exiting=Una vez a la semana, al salir|Once a day, when exiting=Una vez al día, al salir|Every time Lumora exits=Cada vez que se cierra Lumora|Photos=Fotos|Last Backup=Última copia|Last Optimized=Última optimización|Build All Smart Previews=Crear todas las previsualizaciones inteligentes
General=General|External Editing=Edición externa|Detect Installed Editors=Detectar editores instalados|Add Application…=Añadir aplicación…|DNG Converter=Conversor DNG|Converter Location=Ubicación del conversor|Map Tiles=Mosaicos del mapa|Enabled=Activado|Reload All=Recargar todo
Tethered Capture Settings=Ajustes de captura conectada|Session Name=Nombre de la sesión|Watched Folder=Carpeta vigilada|Auto-select each new capture=Seleccionar cada captura nueva|Disconnect Camera=Desconectar cámara|Open Folder=Abrir carpeta|Stop Tethering=Detener captura
Export To=Exportar a|Hard Drive=Disco duro|FTP Server=Servidor FTP|Export Location=Ubicación de exportación|Put in Subfolder=Colocar en subcarpeta|Existing Files=Archivos existentes|Skip=Omitir|Add to This Catalog=Añadir a este catálogo|Server=Servidor|Port=Puerto|User Name=Usuario|Password=Contraseña|Server Path=Ruta del servidor|Passive mode=Modo pasivo|Test Connection=Probar conexión|Disc Name=Nombre del disco|Recorder=Grabadora
File Naming=Nombre de archivo|Rename To=Renombrar a|File Settings=Ajustes de archivo|Quality=Calidad|Compression=Compresión|Color Space=Espacio de color|Rendering Intent=Interpretación|Image Sizing=Tamaño de imagen|Resize to Fit=Redimensionar|Long Edge=Lado largo|Short Edge=Lado corto|Width & Height=Anchura y altura|Percentage=Porcentaje|Value=Valor|Don't Enlarge=No ampliar
Output Sharpening=Enfoque de salida|Sharpen For=Enfocar para|Medium=Medio|Screen=Pantalla|Matte Paper=Papel mate|Glossy Paper=Papel brillante|Low=Bajo|Standard=Estándar|High=Alto|Include=Incluir|All Metadata=Todos los metadatos|Copyright Only=Solo copyright|Remove Location Info=Quitar información de ubicación|Watermarking=Marca de agua|Watermark=Marca de agua|Post-Processing=Posprocesamiento|After Export=Después de exportar|Do nothing=No hacer nada|Application=Aplicación
Watermark Editor=Editor de marcas de agua|Watermark Style=Estilo de marca de agua|Font=Fuente|Bold=Negrita|Italic=Cursiva|Colour=Color|Shadow=Sombra|Anchor=Anclaje|Rotate=Rotar|Identity Plate Editor=Editor de placa de identidad|Style=Estilo|Preview=Vista previa|Insert token=Insertar elemento
Saved Locations=Ubicaciones guardadas|GPS Tracklog=Registro de ruta GPS|Go to Selected=Ir a la selección|Fit All=Ajustar todo|Delete GPS Coordinates=Eliminar coordenadas GPS|Show on Map=Mostrar en el mapa|Load Tracklog…=Cargar registro de ruta…|Auto-Tag Photos=Etiquetar fotos automáticamente|Altitude=Altitud|Sublocation=Sububicación
Book Settings=Ajustes del libro|Page=Página|Text & Background=Texto y fondo|Export Book to PDF…=Exportar libro a PDF…|Export to JPEG…=Exportar a JPEG…|Multi-Page=Varias páginas|Single Page=Una página|Add Page=Añadir página|Remove Page=Quitar página|Auto Layout=Maquetación automática|Clear Book=Vaciar libro|Cell Padding=Relleno de celda|Page Numbers=Números de página|Text Size=Tamaño de texto|Align=Alinear|Text Colour=Color del texto|Page Background=Fondo de página
Template Browser=Plantillas|Slideshow Settings=Ajustes de proyección|Export PDF…=Exportar PDF…|Export Video…=Exportar vídeo…|Export JPEGs…=Exportar JPEG…|Options=Opciones|Layout=Maquetación|Overlays=Superposiciones|Backdrop=Fondo|Titles=Títulos|Music=Música|Playback=Reproducción|Left=Izquierda|Right=Derecha|Top=Arriba|Bottom=Abajo|Identity Plate=Placa de identidad|Rating Stars=Estrellas de clasificación|Text Overlay=Texto superpuesto|Background Colour=Color de fondo|Background Image=Imagen de fondo|Audio File=Archivo de audio|Random Order=Orden aleatorio|Repeat Slideshow=Repetir proyección|Pan and Zoom=Desplazamiento y zoom
Print Settings=Ajustes de impresión|Print…=Imprimir…|Print to File…=Imprimir a archivo…|Layout Style=Estilo de maquetación|Page Setup=Configurar página|Paper Size=Tamaño de papel|Landscape Orientation=Orientación horizontal|Image Settings=Ajustes de imagen|Zoom to Fill=Zoom para rellenar|Rotate to Fit=Rotar para encajar|Stroke Border=Borde de trazo|Rows=Filas|Columns=Columnas|Keep Square=Mantener cuadrado|Crop Marks=Marcas de recorte|Photo Info=Información de la foto|Print Job=Trabajo de impresión|Print to=Imprimir en|Printer=Impresora|Media Type=Tipo de papel|Glossy=Brillante|Matte=Mate|Colour Profile=Perfil de color|Print Sharpening=Enfoque de impresión
Web Gallery Settings=Ajustes de galería web|Preview in Browser…=Vista previa en el navegador…|Reload Preview=Recargar vista previa|Site Info=Información del sitio|Site Title=Título del sitio|Collection Title=Título de la colección|Description=Descripción|Contact Info=Contacto|Color Palette=Paleta de colores|Background=Fondo|Cells=Celdas|Borders=Bordes|Thumbnail Size=Tamaño de miniatura|Spacing=Espaciado|Drop Shadows=Sombras|Image Info=Información de imagen|Output Settings=Ajustes de salida|Gallery=Galería
Dimensions=Dimensiones|Cropped=Recortada|Copy Name=Nombre de la copia|Make=Marca|Model=Modelo|Software=Software|Date Added=Fecha de adición|Headline=Titular|Address=Dirección|Phone=Teléfono|Website=Sitio web|Category=Categoría|Event=Evento|Source=Fuente|Instructions=Instrucciones|State / Province=Estado / provincia|Job Title=Cargo|Credit Line=Crédito|Metadata Status=Estado de metadatos|Up to date=Actualizado|Default=Predeterminado|Minimal=Mínimo|Quick Describe=Descripción rápida|All EXIF…=Todo el EXIF…|Save to XMP=Guardar en XMP|Preset: None=Ajuste: ninguno|Edit Presets…=Editar ajustes…
No photo selected=Ninguna foto seleccionada|No keyword matches=Ninguna palabra clave coincide|Working=Trabajando|Importing=Importando|Exporting=Exportando|Finishing export=Finalizando exportación|Building Smart Previews=Creando previsualizaciones inteligentes|Finding faces=Buscando caras|Painter=Pintor|Landscape=Horizontal|Portrait=Vertical|Square=Cuadrado
Select a photo in the filmstrip to develop it.=Selecciona una foto en la tira de imágenes para revelarla.|Named People=Personas con nombre|Unnamed People=Personas sin nombre|Create Stack=Crear pila|Auto Crop=Recorte automático|Auto Align=Alinear automáticamente|Boundary Warp=Deformación de límite|Projection=Proyección
Use: Selected (or all)=Usar: seleccionadas (o todas)|Use: All Filmstrip Photos=Usar: todas las fotos de la tira|Use: Selected Photos=Usar: fotos seleccionadas|Use: Flagged Photos=Usar: fotos con indicador|Soft Proofing (S)=Prueba en pantalla (S)|Search…  (space = and, !word = exclude)=Buscar…  (espacio = y, !palabra = excluir)
Gold Noir=Oro noir|Midnight Teal=Turquesa medianoche|Porcelain (light)=Porcelana (claro)|Lilac Haze (light)=Bruma lila (claro)|Loading your catalog…=Cargando tu catálogo…|Double-click to reset=Doble clic para restaurar|Click here to add keywords  (Parent > Child)=Haz clic para añadir palabras clave  (Padre > Hija)
Take the Tour=Hacer el recorrido|Skip tour=Saltar recorrido|Back=Atrás|Next=Siguiente|Welcome to Lumora=Te damos la bienvenida a Lumora|A one-minute tour of where everything lives. Just follow the little gold ball.=Un recorrido de un minuto para saber dónde está cada cosa. Solo sigue la bolita dorada.|Seven modules=Siete módulos|Your sources=Tus orígenes|The grid=La cuadrícula|Find anything=Encuentra lo que sea|Details and quick edits=Detalles y ajustes rápidos|The filmstrip=La tira de imágenes|Make it yours=Hazlo tuyo
Library organises and Develop edits. Map, Book, Slideshow, Print and Web turn your photos into something to share. Switch here, or press Ctrl+Alt+1 to 7.=Biblioteca organiza y Revelar edita. Mapa, Libro, Proyección, Imprimir y Web convierten tus fotos en algo para compartir. Cambia aquí o pulsa Ctrl+Alt+1 a 7.
Catalog, Folders and Collections decide which photos you are looking at. Open Local Disk to add a folder, or use File > Import Photos.=Catálogo, Carpetas y Colecciones deciden qué fotos estás viendo. Abre Disco local para añadir una carpeta o usa Archivo > Importar fotos.
Every photo in the current source. Press 1 to 5 to rate, P to flag a pick and X to reject. G and E switch between Grid and Loupe.=Todas las fotos del origen actual. Pulsa 1 a 5 para puntuar, P para marcar una selección y X para rechazar. G y E cambian entre Cuadrícula y Lupa.
Narrow the grid by text, flags or stars. Ctrl+L turns the filters on and off.=Acota la cuadrícula por texto, indicadores o estrellas. Ctrl+L activa y desactiva los filtros.
Quick Develop, keywords and metadata for whatever is selected.=Revelado rápido, palabras clave y metadatos de lo que esté seleccionado.|Your current photos stay along the bottom in every module. F6 hides it and Tab hides the side panels.=Tus fotos actuales permanecen abajo en todos los módulos. F6 la oculta y Tab oculta los paneles laterales.
Press D to edit the selected photo. Edits are kept in the catalog, so your original files are never changed.=Pulsa D para editar la foto seleccionada. Los ajustes se guardan en el catálogo, así que tus archivos originales nunca se modifican.|Pick a theme and a language here. The Trackpad switch beside it makes two fingers pan and a pinch zoom.=Elige aquí un tema y un idioma. El interruptor Panel táctil de al lado hace que dos dedos desplacen y un pellizco amplíe.
Beginner=Principiante|Advanced=Avanzado|Trackpad=Panel táctil|Beginner Mode=Modo principiante|Trackpad-Friendly Controls=Controles para panel táctil|That was the Beginner tour=Este fue el recorrido para principiantes|Show the essentials and tuck specialist tools away=Muestra lo esencial y guarda las herramientas especializadas|Show every panel and tool=Muestra todos los paneles y herramientas
Beginner mode: the essentials, with specialist tools tucked away.=Modo principiante: lo esencial, con las herramientas especializadas guardadas.|Advanced mode: every panel and tool is showing.=Modo avanzado: se muestran todos los paneles y herramientas.|Trackpad controls on: two fingers pan, pinch to zoom.=Controles de panel táctil activados: dos dedos desplazan, pellizca para ampliar.|Trackpad controls off: the wheel zooms.=Controles de panel táctil desactivados: la rueda amplía.
Trackpad-friendly controls: two fingers pan, pinch zooms, bigger sliders=Controles para panel táctil: dos dedos desplazan, el pellizco amplía, reguladores más grandes|This tour covered Beginner mode, which keeps the essentials and tucks the specialist tools away. Switch to Advanced here whenever you want every panel and tool. You can replay the tour from Help > Take the Tour.=Este recorrido cubrió el modo principiante, que conserva lo esencial y guarda las herramientas especializadas. Cambia a Avanzado aquí cuando quieras ver todos los paneles y herramientas. Puedes repetir el recorrido desde Ayuda > Hacer el recorrido.
`;

const Lang = {
  dict: new Map(), orig: new WeakMap(), attrOrig: new WeakMap(), busy: false,
  get cur() { return localStorage.lumora_lang === 'es' ? 'es' : 'en'; },
  init() {
    // a literal bar inside an entry is written as ¦
    for (const line of ES.trim().split('\n')) for (const raw of line.split('|')) { const pair = raw.replace(/\u00a6/g, '|'), i = pair.indexOf('='); if (i > 0) this.dict.set(pair.slice(0, i), pair.slice(i + 1)); }
    new MutationObserver(muts => {
      if (this.busy || this.cur === 'en') return;
      this.busy = true;
      for (const m of muts) { if (m.type === 'characterData') this.node(m.target, true); else if (m.type === 'attributes') this.attrs(m.target); else m.addedNodes.forEach(n => this.walk(n)); }
      this.busy = false;
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder'] });
  },
  /* translate one English string, tolerating a leading icon and a trailing colon or ellipsis */
  tr(s) {
    if (this.cur === 'en') return s;
    const d = this.dict; let v = d.get(s); if (v !== undefined) return v;
    const m = s.match(/^([^A-Za-z(]*)(.*?)([:…]?\s*(?:\([A-Z\\+⇧]{1,9}\))?)$/);
    if (m && m[2] && (m[1] || m[3])) { v = d.get(m[2]) ?? d.get(m[2] + '…'); if (v !== undefined) return m[1] + v.replace(/…$/, '') + m[3]; }
    return null;
  },
  skip(el) { return !el || el.closest('.fn, .md-v, .kw, .lv-info, .imp-cell, textarea, script, style, [data-notr]'); },
  node(n, changed) {
    if (n.nodeType !== 3 || this.skip(n.parentElement)) return;
    const raw = n.nodeValue; if (!raw || !/[A-Za-z]{2}/.test(raw)) return;
    if (changed && this.orig.has(n) && this.orig.get(n).out === raw) return;
    const base = changed || !this.orig.has(n) ? raw : this.orig.get(n).src, t = base.trim(), es = this.tr(t);
    if (es == null) { this.orig.delete(n); return; }
    const out = base.replace(t, es); this.orig.set(n, { src: base, out }); n.nodeValue = out;
  },
  attrs(el) {
    if (el.nodeType !== 1) return;
    for (const a of ['title', 'placeholder']) {
      const v = el.getAttribute(a); if (!v) continue;
      const store = this.attrOrig.get(el) || {}; if (store[a] && store[a].out === v) continue;
      const es = this.tr(v); if (es == null) continue;
      store[a] = { src: v, out: es }; this.attrOrig.set(el, store); el.setAttribute(a, es);
    }
  },
  walk(root) {
    if (root.nodeType === 3) return this.node(root);
    if (root.nodeType !== 1) return;
    this.attrs(root); root.querySelectorAll('[title],[placeholder]').forEach(e => this.attrs(e));
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) this.node(n);
  },
  restore(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const o = this.orig.get(n); if (o && n.nodeValue === o.out) n.nodeValue = o.src; this.orig.delete(n); }
    root.querySelectorAll('[title],[placeholder]').forEach(el => { const s = this.attrOrig.get(el); if (!s) return; for (const [a, o] of Object.entries(s)) if (el.getAttribute(a) === o.out) el.setAttribute(a, o.src); this.attrOrig.delete(el); });
  },
  set(lang) {
    this.busy = true; this.restore(document.body);
    localStorage.lumora_lang = lang; document.documentElement.lang = lang;
    if (lang === 'es') this.walk(document.body);
    this.busy = false;
  },
};
Lang.init();
document.documentElement.lang = Lang.cur;
