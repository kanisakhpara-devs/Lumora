# Opia

A local photo organizer and editor: Library, Develop, Map, Book, Slideshow, Print and Web modules.
A Python engine handles the disk, catalogs, colour management and export; the interface renders every edit on the GPU (WebGL 2).

## Two workspaces

**Photos** is the organizer and editor described below. **Music** (the switch beside the logo) is a small studio:

- *Beginner* is a jam board. Riff cards for drums, bass, chords and melody loop together; "Start me off" drafts a song in a style, and "New idea" rewrites one part to fit the rest. Notes are limited to the song's scale.
- *Advanced* puts the same song on a timeline with a mixer, and gives audio tracks range editing (split, cut, copy, paste, trim), effects (fades, amplify, normalize, compressor, filters, echo, reverb, reverse, pitch, tempo, speed, noise reduction), a spectrogram view, and silence/tone/noise generators.
- Import audio or MIDI, record from the microphone, use your own samples for any drum or as an instrument, and export WAV, MP3, FLAC, OGG, per-track stems or MIDI.

All instruments and drum kits are synthesised in the app; no sample library is bundled. Songs are kept in `Pictures\Opia\Music\<song>`.

## Run it

Double-click `Opia.bat`, or:

```bash
python run.py
```

The app opens in its own window (Edge or Chrome in app mode). Closing the window stops the engine and, if one is due, backs up the catalog.

Options: `--port N`, `--no-window` (open the printed URL yourself), `--catalog path\to\file.opiacat`, `--home folder`.

Needs Python 3.10+ with `Pillow numpy opencv-python-headless rawpy exifread soundfile pywebview` (already installed on this machine).

## Where things live

| What | Where |
| --- | --- |
| Catalogs (`.opiacat`, SQLite) | `Pictures\Opia\<Name>\<Name>.opiacat` |
| Previews / Smart Previews | `<Name> Previews.opiadata`, `<Name> Smart Previews.opiadata` beside the catalog |
| Backups | `Backups\<date>\<Name>.opiacat.zip` beside the catalog (or the folder set in Catalog Settings) |
| Presets, preferences, recent catalogs | `Pictures\Opia\config.json` |
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

- **`.opiacat` catalogs** are Opia's own SQLite schema and cannot be opened by other photo applications. Catalogs from when the app was called Lumora (`.lumcat` or `.lrcat`, with `.lumdata` or `.lrdata` previews) are renamed automatically the first time they are opened, and the `Pictures\Lumora` folder becomes `Pictures\Opia`.
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
