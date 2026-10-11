"""Songs for the Music workspace. Each lives in <home>/Music/<name>/ as song.json plus the audio recorded or edited in it."""
import json
import os

from . import core
from .core import api, img, upload, ApiError, Binary

AUDIO = {'.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg', '.flac': 'audio/flac',
         '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.webm': 'audio/webm'}


def _root():
    return os.path.join(core.HOME, 'Music')


def _clean(name):
    name = ''.join(ch for ch in (name or '') if ch not in '\\/:*?"<>|').strip().strip('.')
    if not name:
        raise ApiError('Give the song a name')
    return name


def _dir(name):
    return os.path.join(_root(), _clean(name))


@api
def music_list():
    out = []
    if os.path.isdir(_root()):
        for e in os.scandir(_root()):
            f = os.path.join(e.path, 'song.json')
            if e.is_dir() and os.path.isfile(f):
                out.append({'name': e.name, 'mtime': os.path.getmtime(f)})
    return sorted(out, key=lambda s: -s['mtime'])


@api
def music_load(name):
    f = os.path.join(_dir(name), 'song.json')
    if not os.path.isfile(f):
        return None
    with open(f, encoding='utf-8') as fh:
        return json.load(fh)


@api
def music_save(name, song):
    d = _dir(name)
    os.makedirs(d, exist_ok=True)
    tmp = os.path.join(d, 'song.json.tmp')
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(song, fh)
    os.replace(tmp, os.path.join(d, 'song.json'))
    return {'folder': d}


@api
def music_rename(old, new):
    a, b = _dir(old), _dir(new)
    if os.path.exists(b):
        raise ApiError('A song with that name already exists')
    if os.path.isdir(a):
        os.rename(a, b)
    return {'name': _clean(new), 'folder': b}


@upload
def music_audio_put(q, body):
    """Keep a recording or an edited piece of audio inside the song's folder."""
    d = _dir(q['song'])
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, os.path.basename(q['file']))
    if os.path.splitext(path)[1].lower() != '.wav':
        raise ApiError('Song audio is stored as .wav')
    with open(path, 'wb') as fh:
        fh.write(body)
    return {'path': path}


@upload
def music_export(q, body):
    path = os.path.abspath(q['path'])
    if os.path.splitext(path)[1].lower() != '.wav' or not os.path.isdir(os.path.dirname(path)):
        raise ApiError('Choose an existing folder to export the .wav into')
    with open(path, 'wb') as fh:
        fh.write(body)
    return {'path': path}


@img
def audio(rest, q):
    """Serve a local audio file for the Music workspace to decode."""
    path = q['path']
    ctype = AUDIO.get(os.path.splitext(path)[1].lower())
    if not ctype or not os.path.isfile(path):
        raise ApiError('Not an audio file Opia can open')
    with open(path, 'rb') as fh:
        return Binary(fh.read(), ctype)
