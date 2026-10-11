"""Opia launcher: starts the local engine and opens the app in its own window (falling back to Edge/Chrome app mode, then the default browser)."""
import argparse
import os
import shutil
import subprocess
import sys
import threading
import webbrowser

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def find_browser():
    """Edge or Chrome can show the UI as a chromeless app window."""
    roots = [os.environ.get(k, '') for k in ('ProgramFiles(x86)', 'ProgramFiles', 'LocalAppData')]
    for rel in (r'Microsoft\Edge\Application\msedge.exe', r'Google\Chrome\Application\chrome.exe'):
        for root in roots:
            p = os.path.join(root, rel)
            if root and os.path.exists(p):
                return p
    return shutil.which('msedge') or shutil.which('chrome') or shutil.which('chromium')


def native_window(url, home):
    """Show the UI in Opia's own window (Windows' built-in WebView2), blocking until it is closed. False if that is not available."""
    try:
        import webview
    except ImportError:
        return False
    try:
        import pyi_splash      # only present in the packaged single-file app
        pyi_splash.close()
    except Exception:
        pass
    webview.create_window('Opia', url, width=1500, height=950, min_size=(900, 600), background_color='#0f0f10')
    webview.start(private_mode=False, storage_path=os.path.join(home, '.app'))
    return True


def main():
    ap = argparse.ArgumentParser(description='Opia photo editor')
    ap.add_argument('--port', type=int, default=0, help='port to serve on (default: any free port)')
    ap.add_argument('--no-window', action='store_true', help='only run the engine; open the URL yourself')
    ap.add_argument('--catalog', help='open this .opiacat instead of the most recent one')
    ap.add_argument('--home', help='folder for catalogs and settings (default: Pictures/Opia)')
    args = ap.parse_args()
    if args.home:
        os.environ['OPIA_HOME'] = os.path.abspath(args.home)
    from server import app, core      # imported late so --home takes effect

    httpd = app.serve(args.port)
    if args.catalog:
        from server import catalog
        catalog.open_catalog(args.catalog)
    url = 'http://127.0.0.1:%d/' % httpd.server_port
    print('Opia is running at', url, flush=True)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    try:
        if args.no_window:
            threading.Event().wait()
        if native_window(url, core.HOME):
            return               # shown, and now closed
        browser = find_browser()
        if browser:
            profile = os.path.join(core.HOME, '.window')
            proc = subprocess.Popen([browser, '--app=' + url, '--user-data-dir=' + profile, '--no-first-run',
                                     '--no-default-browser-check', '--window-size=1500,950'])
            proc.wait()      # the engine lives exactly as long as the window
        else:
            webbrowser.open(url)
            print('Close this console window to quit Opia.')
            threading.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        app.shutdown()
        httpd.shutdown()


if __name__ == '__main__':
    main()
