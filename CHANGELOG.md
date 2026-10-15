# Changelog

Every change to Opia is listed here, newest first, with what was tested and what was not.
Work done in a cloud session (no access to the Windows PC) says so: those changes were tested in headless Chromium on Linux, not in the packaged `Opia.exe` window.

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
- Tool icons in the toolbox are plain line glyphs drawn in CSS (move arrows, brush, crop marks...). They are not brand artwork. **The Image workspace has no icon of its own**: its welcome screen shows the normal Opia logo and the top-bar logo does not change. Supply an icon (like the Music and PDF ones) if you want one, and an accent colour; it currently uses the default gold.

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

**Packaging (needs doing on the PC)**: rebuild `dist\Opia.exe`. No new Python packages are needed for the Image workspace, so the PyInstaller command is unchanged by this entry (see the Video entry above it, if present, for new flags).
