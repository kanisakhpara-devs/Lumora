# Changelog

Every change to Opia is listed here, newest first, with what was tested and what was not.
Work done in a cloud session (no access to the Windows PC) says so: those changes were tested in headless Chromium on Linux, not in the packaged `Opia.exe` window.

## Icons for Image and Video (cloud session, 2026-10-15)

Three icon options were drawn for each workspace in the style of the existing ones (dark tile, cream ring, one coloured accent). You picked **Image C (crop marks)** and **Video B (film strip)**.

**Added**
- `web/img/opia-image-icon.svg`: the Opia ring and dot inside four violet (#B57CFF) crop corners.
- `web/img/opia-video-icon.svg`: the Opia ring with an amber (#FFB020) dot, between two rows of film sprocket holes.
- Each icon is shown on its workspace's welcome screen, the way the PDF icon is.
- The top-bar logo changes with the workspace: in Image, the crop corners appear around the ring and the dot turns violet. In Video, the sprocket holes appear and the dot turns amber. These are extra shapes in the `#brand` logo in `web/index.html`, shown by CSS.
- Accent colours: violet for Image and amber for Video, replacing the default blue. Buttons, the workspace switch, selected items and section headings use them. The light themes (Porcelain, Lilac) use darker versions (#8A4FE0, #D98A00) so the colours keep their contrast.

**Tested**: screenshots in headless Chromium of both welcome screens and the top bar in Opia Dark, and the top bar in Porcelain; no page errors.
**Not tested**: the Midnight Teal and Lilac themes, and the packaged exe. No new packages; the icons ship inside `web/`, which the exe already includes.

## Video workspace (cloud session, 2026-10-15)

A new **Video** workspace on the top-bar switch (Photos | Image | Video | Music | PDF): a timeline editor that exports MP4.

**Added**
- `web/js/video.js` (new): projects (new, open, rename, delete; saved automatically a moment after each change), a media list, a preview with transport (play / pause, start, previous / next edit, time), a details panel, and the timeline.
- Timeline: video and audio tracks (add, rename, delete, hide, mute, track volume), clips that move along and between tracks with snapping (Alt places freely), trimming from either end (limited to the length of the file), split at the playhead (S), delete, delete and close the gap, duplicate, select all, crossfade with the clip before, detach a video clip's sound onto an audio track. Ruler scrubbing, zoom (Ctrl+wheel, slider, Show All), resizable timeline height, thumbnail strips on video clips and waveforms on sound.
- Clip settings: start, length, in point, fade in / out (picture and sound), crossfade, volume (0-200%), mute, fit or fill, and in Advanced size, position and opacity (picture-in-picture). Titles: text, typeface, size, colour, bold, position (top, centre, bottom, lower third), dark box.
- Project settings: size presets (1080p, 720p, 4K, square, vertical, 4:5) or custom, frame rate, background colour. The first video put on an empty timeline sets the project's size and frame rate.
- Import: file picker or drag and drop (files without a known location are copied into the project's `Media` folder as they arrive, without loading them into memory), Import from Disk (Advanced), and Add Selected Photos / Photos > *Make a Video from Selected Photos* (4 s each with 0.5 s crossfades, rendered with their Develop edits).
- Export: MP4, H.264 + AAC, project size or 1080p / 720p / 480p, three qualities, with progress and cancel in the activity area. Save Frame as Picture, Edit Frame in Image Editor.
- Preview copies: files the window cannot decode (AVI, WMV, HEVC, 10-bit or 4:2:2 H.264, larger than 4096 px, unknown audio codecs...) get a 720p H.264 copy in `Pictures\Opia\Video\.cache`. If a file that should play fails anyway, the copy is made then. Export always reads the original.
- `server/video.py` (new): finding ffmpeg (config.json `"ffmpeg"`, then imageio-ffmpeg, then the PATH), reading what a file holds, preview copies, thumbnail strips (one ffmpeg run per strip), waveforms (cached), projects, the export filter graph, and `video_ffmpeg` for the About box. On Windows ffmpeg runs without a console window.
- `server/app.py` / `server/core.py`: files can now be served with HTTP byte ranges (`FileRef`), which the browser needs to seek in audio and video, and streamed uploads (`/api/stream/...`) that write to disk as they arrive.
- Help > About now also says which FFmpeg is in use. Tour says five workspaces. Spanish strings for the Video workspace's labels, buttons, dialogs and menus (hover help is English only).
- README: Video section, the FFmpeg licence note, and the new `imageio-ffmpeg` requirement.
- Icon: added later the same day, see "Icons for Image and Video" above.

**FFmpeg licence**: imageio-ffmpeg's Python code is BSD-2-Clause. The ffmpeg program inside it is not covered by that: on Linux it is a GPL v3 build (checked: `--enable-gpl --enable-version3`, includes x264). The Windows one is very likely the same kind of build; check with `ffmpeg -version`. Fine for personal use; if `Opia.exe` is ever given to other people with that ffmpeg inside, the GPL's terms apply to the ffmpeg part. The README says this too.

**Tested** (headless Chromium on Linux, real server, Playwright; and the export graph run directly):
- Reading files: H.264 MP4 with AAC, MPEG-4 AVI (flagged for a preview copy, copy made), MP3, JPEG; VP9/Opus WebM.
- Putting clips on tracks, the project taking the first video's size and frame rate, crossfade (clip moved back 1 s, marked), title added and its text typed, split at 2 s (in points correct), trimming the end of a sound clip and moving a picture with the mouse, snapping, undo.
- Playback with a WebM clip: at 2.2 s on the timeline the right clip was playing at 2.20 s in its file, the picture was drawn, the sound clip was playing.
- Export from the UI to 640 × 360 (13 s) and, separately, a 1280 × 720 export whose frames were checked by eye: fade in from black, title over video, crossfade between two clips, fill vs fit, picture with fade out, and rising sound level during a fade in.
- Byte-range requests (206 with the right Content-Range), streamed import through the file picker, the photo slideshow from the catalog, reloading a saved project, Beginner / Advanced, Spanish, every menu; no page or console errors.

**Not tested**
- Anything inside the packaged `Opia.exe` / WebView2 window on Windows, including Windows paths. **H.264 playback in the preview could not be tested here**: the Chromium used for testing has no H.264 decoder (WebView2 / Edge does), so H.264 clips (and the H.264 preview copies) only showed as "cannot be shown in the preview" in testing. Export of H.264 sources was tested and works.
- Long or large files (hours, 4K), many tracks at once (preview smoothness), phone videos with rotation metadata, variable frame rate footage, files with several audio streams, and the speed of thumbnail strips on big files.

**Packaging (needs doing on the PC)**:
1. `pip install imageio-ffmpeg` on the PC.
2. Rebuild with one more flag so the bundled ffmpeg goes into the exe: `--collect-all imageio_ffmpeg`. The full command becomes:
   `python -m PyInstaller --noconfirm --onefile --windowed --name Opia --icon web/img/opia.ico --splash web/img/opia.png --add-data "web;web" --add-data "models;models" --add-data "plugins;plugins" --collect-submodules PIL --collect-all webview --collect-all soundfile --collect-all _soundfile_data --collect-all pillow_heif --collect-all pypdfium2 --collect-all pypdfium2_raw --collect-submodules pypdf --collect-submodules cryptography --collect-all imageio_ffmpeg`
   (that is the base command from the notes plus the last flag; if the PC's saved command has other flags, keep them and add this one).
3. Expect the exe to grow by roughly the size of ffmpeg (tens of MB). The one-file exe unpacks ffmpeg to a temporary folder at start-up; that worked for the other bundled binaries.

## Image workspace (cloud session, 2026-10-15)

A new **Image** workspace on the top-bar switch (Photos | Image | Music | PDF): a layered picture editor.

**Added**
- `web/js/image.js` (new): the editor. Layers (pixel, text, shape) with visibility, opacity, 16 blend modes, drag to reorder, rename, duplicate, delete, merge down, merge visible, flatten, turn into pixels.
- Tools: move (Ctrl-click picks the layer under the pointer, arrow keys nudge), rectangle and oval selections, lasso, magic wand, brush and eraser (size, hardness, opacity, pen pressure, Shift-click straight lines), fill bucket (tolerance, contiguous, sample all layers), gradient, eyedropper, text (editable, font / size / bold / italic / alignment / colour), shapes (rectangle with optional rounded corners, oval, line, arrow; editable), crop, hand. Space-drag and middle-drag pan; the wheel zooms (Trackpad mode: two fingers pan, pinch zooms).
- Selections: new / add / subtract / overlap (Shift and Alt as shortcuts), invert, feather, select layer pixels, fill, delete, copy, cut, paste, copy merged, layer via copy / cut, crop to selection. Marching-ants outline.
- Free Transform (Ctrl+T): corner handles resize (Shift stretches freely), drag outside turns (Shift snaps to 15°), drag inside moves. Text and shape layers keep a transform and stay editable; pixel layers are resampled when applied.
- Image menu: image size, canvas size (with anchor), rotate 90° / 180°, flip, crop to selection, trim empty edges.
- Adjustments with live preview, limited to the selection if there is one: brightness / contrast, levels (with histogram), curves (per channel, monotone curve), hue / saturation / lightness (with colorize), colour balance, auto tone, black & white, invert, posterize, threshold. Filters: blur (edges do not fade), sharpen (unsharp mask), add noise, pixelate.
- Undo / redo of every step (whole states that share layer canvases; a canvas is copied only when it changes; capped at about 60 steps or a rough memory budget).
- Files: opens PNG, JPEG, WebP, GIF, BMP directly in the browser; TIFF, HEIC and RAW go through the server. Paste a picture from the clipboard, drop files on the window (onto an open picture they become new layers), File > Place Picture as Layer.
- Export Picture: PNG, JPEG, WebP or TIFF, quality, optional downscale, optional "add to the Photos catalog".
- Projects: `.opiaimg` = a zip holding `project.json`, one PNG per pixel layer and a `preview.png`. Text and shape layers are stored as their settings and redrawn on open.
- Photos: *Photo > Edit in Image Editor* (both modes) opens the selected photo with its Develop edits applied (it uses the same renderer as Export). Exporting such a picture defaults to adding it to the catalog.
- Beginner / Advanced: Beginner hides Oval Select, Gradient, Eyedropper and Hand (choosing one switches to Advanced), blend modes, Merge Down / Flatten buttons and the longer menus. Menus: File, Edit, Image, Layer, Select, (Filter in Advanced), View, Help.
- `server/imageedit.py` (new): `/img/imgfile` (a file on disk in a form the browser can draw), uploads `image_decode`, `image_export`, `image_project_save`, `image_project_upload`, and `image_project_open`. Registered in `server/app.py`.
- Spanish strings for the Image workspace's labels, buttons, hints, dialogs and menus (hover-help cards are English only, as in the PDF workspace).
- Tour: the workspace step now says four workspaces and describes Image. README: new Image section and honest limits.
- Tool icons in the toolbox are plain line glyphs drawn in CSS (move arrows, brush, crop marks...), not brand artwork. The workspace icon was added later the same day, see "Icons for Image and Video" above.

**Tested** (headless Chromium (Playwright build 1194) on Linux against the real Python server, scripted with Playwright):
- Opening a JPEG; brush stroke changes the right pixels; rectangle selection + Ctrl+J; moving a layer; Multiply blend; text layer typed and named after its first line; multi-line text; changing text size / bold from the options bar; shape layer; Free Transform rotate + scale on a shape layer (matrix checked); undo twice / redo twice restores layers and the transform.
- Magic wand finds the right area; fill selection; Hue / Saturation and Curves dialogs (dragging a curve point) and OK; every other adjustment dialog opens and cancels; auto tone, invert, black & white.
- Rotate 90° both ways, flip, canvas size, crop, undo of crop, image size, undo.
- Lasso + Ctrl+C + Ctrl+V pastes in place; eraser makes pixels transparent; gradient end colours; layer opacity.
- Export PNG and JPEG through the server; export with "add to catalog" adds one photo; project save, then reopen: same layers, kinds, blend modes, positions and sizes.
- Photos > Edit in Image Editor on an imported photo with Develop exposure and saturation edits: the editor gets the edited pixels.
- Beginner and Advanced layouts, Spanish, every menu opens; no page errors or console errors during the runs.

**Not tested**
- Inside the packaged `Opia.exe` / pywebview window on Windows, and with Windows paths (the save dialogs build paths with `\`). Drag-and-drop of real files, the system clipboard (paste from another app, and whether Copy reaches the Windows clipboard), pen pressure, HEIC / TIFF / RAW opening, very large pictures (memory and speed), and the light themes.
- Whether `file.path` is available for files picked in the pywebview window (if it is not, opening still works by uploading the file, but "Save" defaults to the export folder instead of the picture's folder, and the file is not added to Opened recently).

**Packaging (needs doing on the PC)**: rebuild `dist\Opia.exe`. The Image workspace needs no new Python packages; see the Video entry above for the one new PyInstaller flag.
