# Opia

A local photo organizer and editor: Library, Develop, Map, Book, Slideshow, Print and Web modules.
A Python engine handles the disk, catalogs, colour management and export; the interface renders every edit on the GPU (WebGL 2).

## Five workspaces

**Photos** is the organizer and editor described below. **Image**, **Video**, **Music** and **PDF** sit beside it on the switch next to the logo.

**Image** is a layered picture editor, in the spirit of Photoshop:

- Layers: add, duplicate, delete, reorder by dragging, hide, opacity, 16 blend modes, merge down, merge visible, flatten.
- Tools: move, rectangle / oval / lasso selections and a magic wand (Shift adds, Alt takes away), brush and eraser (size, hardness, opacity, pen pressure), fill bucket, gradient, eyedropper, text, shapes (rectangle, rounded rectangle, oval, line, arrow), crop, hand.
- Selections: fill, delete, copy, cut, paste, copy merged, layer via copy / cut, invert, feather, crop to selection.
- Free Transform (Ctrl+T): resize, turn and move a layer with handles. Text and shape layers stay editable after transforming.
- Image: image size, canvas size, rotate, flip, trim empty edges.
- Adjustments with a live preview, inside the selection if there is one: brightness / contrast, levels, curves, hue / saturation (with colorize), colour balance, auto tone, black & white, invert, posterize, threshold. Filters: blur, sharpen, add noise, pixelate.
- Opens PNG, JPEG, WebP, GIF, BMP, TIFF, HEIC and RAW files, and pictures pasted from the clipboard. Exports PNG, JPEG, WebP or TIFF, optionally straight into the Photos catalog. Projects (`.opiaimg`, a zip with one PNG per layer and a JSON description) keep the layers and editable text.
- In Photos, *Photo > Edit in Image Editor* opens the selected photo with its Develop edits applied.

Editing is 8 bits per channel in sRGB, in the browser engine, so very large pictures (well over 100 megapixels) are slow. There are no layer masks, adjustment layers, layer styles, smart objects, healing or clone brushes, or PSD support; adjustments and filters change the layer's pixels (undo takes them back).

**Video** is a timeline editor:

- Projects with any number of video and audio tracks (upper video tracks draw over lower ones). Import video, sound and pictures (drop them on the media list or the timeline), or add photos from Photos with their Develop edits.
- Move clips between tracks and along the timeline with snapping, trim either end, split at the playhead, duplicate, delete, delete and close the gap, detach a video clip's sound onto an audio track.
- Fades in and out (picture and sound), crossfades between neighbouring clips, titles (text, typeface, size, colour, position, optional box), volume per clip and per track, mute and hide, fit or fill, and (Advanced) size, position and opacity for picture-in-picture.
- Live preview in the window, and export to MP4 (H.264 video, AAC sound) at the project size or smaller, in three qualities. Save a frame as a picture, or send it to the Image workspace.
- Files the window cannot play itself (AVI, WMV, MKV with other codecs, HEVC, 10-bit video...) get a 720p preview copy made in the background; the export always uses the original. Projects are kept in `Pictures\Opia\Video\<project>`; media stays where it is (files dropped without a known location are copied into the project's `Media` folder).

FFmpeg does the work behind Video. It comes from the **imageio-ffmpeg** Python package: its Python code is BSD-2-Clause, but the `ffmpeg` program that ships inside it is a separate program under its own licence, and its builds are usually GPL builds (they include x264; the Linux one checked while writing this says `--enable-gpl`; run `ffmpeg -version` on the Windows one to see). That is fine for using Opia yourself; if you ever distribute `Opia.exe` with that ffmpeg inside, the GPL applies to that ffmpeg binary (offer its source, keep its licence notice). To use a different ffmpeg, put its full path in `config.json` as `"ffmpeg": "C:\\path\\to\\ffmpeg.exe"`. Help > About shows which one is in use.

Limits: no speed changes, keyframed motion, colour correction or effects on video clips, no text animation, and only MP4 output. The preview drops frames on slow machines or with many tracks at once; the export is always frame-accurate. Clips that overlap on the same track (other than a crossfade) both show, the later one on top.

**Music** is a small studio:

- *Beginner* is a jam board. Riff cards for drums, bass, chords and melody loop together; "Start me off" drafts a song in a style, and "New idea" rewrites one part to fit the rest. Notes are limited to the song's scale.
- *Advanced* puts the same song on a timeline with a mixer, and gives audio tracks range editing (split, cut, copy, paste, trim), effects (fades, amplify, normalize, compressor, filters, echo, reverb, reverse, pitch, tempo, speed, noise reduction), a spectrogram view, and silence/tone/noise generators.
- Import audio or MIDI, record from the microphone, use your own samples for any drum or as an instrument, and export WAV, MP3, FLAC, OGG, per-track stems or MIDI.

Ten instruments are recordings of real ones (piano, electric piano, two guitars, bass, strings, violin, cello, flute, trumpet), taken from the Fluid R3 GM SoundFont under CC BY 3.0; see `web/samples/CREDITS.md`. The other instruments and all drum kits are synthesised in the app. Songs are kept in `Pictures\Opia\Music\<song>`.

**PDF** is for reading and changing PDFs:

- *Edit* view: type text anywhere, highlight, draw, drop in ticks and crosses, place a signature you draw once, cover things up, add boxes, ovals, lines, arrows and pictures, and fill in real form fields. Find text across the document.
- *Pages* view: drag pages into a new order, rotate, duplicate, delete, insert blank pages, extract pages, and add more PDFs or pictures to combine everything into one file.
- More: page numbers, a watermark, a password, a smaller file size on Save As, splitting into several files, saving pages as PNG or JPEG, and saving all the text.

The files you open are never changed; saving builds a new PDF. What you add is drawn into the page, so it looks the same in every viewer, and it cannot be edited again after the saved file is reopened. Existing text in a PDF cannot be rewritten, scanned pages are not read (no OCR), and Cover Up hides what is under it without removing it from the file.

## Run it

Double-click `Opia.bat`, or:

```bash
python run.py
```

The app opens in its own window (Edge or Chrome in app mode). Closing the window stops the engine and, if one is due, backs up the catalog.

Options: `--port N`, `--no-window` (open the printed URL yourself), `--catalog path\to\file.opiacat`, `--home folder`.

Needs Python 3.10+ with `Pillow numpy opencv-python-headless rawpy exifread soundfile pywebview pillow-heif pypdf pypdfium2 cryptography imageio-ffmpeg` (`imageio-ffmpeg` is new for the Video workspace: `pip install imageio-ffmpeg`).

## Where things live

| What | Where |
| --- | --- |
| Catalogs (`.opiacat`, SQLite) | `Pictures\Opia\<Name>\<Name>.opiacat` |
| Previews / Smart Previews | `<Name> Previews.opiadata`, `<Name> Smart Previews.opiadata` beside the catalog |
| Backups | `Backups\<date>\<Name>.opiacat.zip` beside the catalog (or the folder set in Catalog Settings) |
| Presets, preferences, recent catalogs | `Pictures\Opia\config.json` |
| Video projects, preview copies, thumbnails | `Pictures\Opia\Video\<project>`, `Pictures\Opia\Video\.cache` |
| Image projects | wherever you save them (`.opiaimg`) |
| Extra ICC profiles | `Pictures\Opia\Profiles` |
| Plug-ins | `plugins\` here, plus any folders added in the Plug-in Manager |

Your photos are never modified. Edits are stored in the catalog (and optionally in `.xmp` sidecars).

## Writing a plug-in

A folder with `plugin.json` and a Python file:

```json
{ "id": "me.example", "name": "Example", "version": "1.0", "entry": "plugin.py",
  "commands": [{ "id": "hello", "title": "Say Hello" }] }
```

```python
def run(command, ctx):            # File > Plug-in Extras; ctx.photos is the selection
    return '%d photos selected' % len(ctx.photos)

def on_export(paths, settings, folder, ctx):   # after every export
    ...

def on_import(photos, ctx):                    # after every import
    ...
```

`ctx` offers `photos`, `catalog`, `home`, `image(photo_id, size)` (RGB array), `import_files(paths)`, `open(path)`, `reveal(path)`, `log(text)`.
See `plugins\contact_sheet` and `plugins\export_manifest`.

## Honest limits

- **`.opiacat` catalogs** are Opia's own SQLite schema and cannot be opened by other photo applications. Catalogs saved under the earlier `.lrcat` extension (with `.lrdata` previews) are renamed automatically the first time they are opened.
- **Editing is 8-bit sRGB.** RAW files are decoded through LibRaw to 8-bit before editing, so there is less highlight/shadow latitude than a true raw pipeline.
- **Smart Previews** are 2560 px JPEGs (not lossy DNG). They keep photos editable while the originals are offline.
- **Tethering** is a watched folder (point your camera maker's utility at it) plus direct capture from any camera Windows exposes as a webcam. There is no direct USB camera control.
- **CD/DVD**: burning uses Windows' IMAPI service and needs a recorder with blank media; without one it writes an `.iso` image.
- **Lens profiles**: a few generic profiles are built in; you can save your own or import Adobe `.lcp` files. There is no bundled per-lens database.
- **Camera calibration profiles** are saved looks plus primary adjustments, not DCP camera profiles.
- **Depth range masks** use a depth map estimated from focus, haze and position. Treat it as approximate.
- **Content-Aware Remove** borrows the best-matching nearby patch and blends it. It works well on textures and small objects, less so on large structured areas.
- **Upright** relies on detected straight lines; on scenes without architecture use Guided or Level.
- **DNG conversion** calls Adobe's free DNG Converter, which must be installed separately.
- **Map** tiles come from OpenStreetMap and need an internet connection (a coordinate grid is shown offline). This is the only network access the app makes, apart from FTP uploads you start.
- **Slideshow video** is recorded in real time and has no soundtrack.
