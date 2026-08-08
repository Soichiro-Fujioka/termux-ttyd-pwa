# Termux ttyd PWA

A lightweight PWA wrapper for `ttyd` on Android Termux. It keeps the terminal as the main surface while adding swipe-open controls for settings and fullscreen.

## Requirements

- Android + Termux
- `ttyd`
- `python3`

## Start

```sh
./scripts/start.sh
```

The package command name is:

```sh
termux-ttyd-pwa
```

After package installation, users should be able to run:

```sh
termux-ttyd-pwa
```

Open `http://127.0.0.1:8080/` in Android Chrome or another PWA-capable browser.

For security, the app is intended to be used locally on `127.0.0.1`. Avoid changing `--host` to a network-reachable address unless you fully trust the network, because the embedded `ttyd` terminal is writable and can control your shell.

## Startup Options

```sh
./scripts/start.sh --font-size 18 --terminal-padding 12px
```

Installed package usage is the same:

```sh
termux-ttyd-pwa --font-size 18 --terminal-padding 12px
```

Useful options:

- `--host 127.0.0.1`
- `--app-port 8080`
- `--ttyd-port 7681`
- `--clipboard-bridge yes`
- `--no-clipboard-bridge`
- `--font-style termux`
- `--copy-termux-font yes`
- `--android-font-family monospace`
- `--font-size 14`
- `--font-weight normal`
- `--letter-spacing 0`
- `--line-height 1.2`
- `--terminal-padding 0`
- `-- COMMAND...`

The default font behavior is `--copy-termux-font yes`. It uses the font file configured for Termux at `~/.termux/font.ttf`, or the path specified by `TERMUX_FONT_FILE`. The font is read at startup and injected into the temporary `ttyd` page, so the package does not redistribute font files.

The clipboard bridge starts by default. If you only use native Termux clipboard commands directly and do not need the proot-oriented bridge, disable it with `--clipboard-bridge no` or `--no-clipboard-bridge`.

To use an Android browser/system font instead, disable the Termux font copy and specify the CSS font family explicitly:

```sh
termux-ttyd-pwa --copy-termux-font no --android-font-family monospace
```

If `--copy-termux-font yes` is set, it takes priority over `--android-font-family`. This is also the default behavior.

Font size, font weight, letter spacing, and line height default to values read from Termux settings when present. The startup command checks `~/.termux/termux.properties` or `TERMUX_PROPERTIES_FILE` for keys such as `font-size`, `font-weight`, `letter-spacing`, and `line-height`. Command line options like `--font-size`, `--font-weight`, `--letter-spacing`, and `--line-height` override those defaults.

Termux native rendering and browser rendering are not identical, so character width may still differ depending on the font. If the browser terminal looks too wide, start with a negative letter spacing such as `--letter-spacing -1` and adjust from there.

Because the app reads Termux-side files such as `~/.termux/font.ttf`, `~/.termux/termux.properties`, and `~/.termux/colors.properties`, running it directly on native Termux is recommended. Running from proot or another environment can work only if those files are visible through the same paths or are explicitly provided with `TERMUX_FONT_FILE`, `TERMUX_PROPERTIES_FILE`, and `TERMUX_COLORS_FILE`. If Termux font files are not visible from that environment, use `--copy-termux-font no --android-font-family monospace` or another Android font family available to the browser.

Example with a custom shell command:

```sh
./scripts/start.sh --font-size 18 -- bash -l
```

The startup font options are passed directly to `ttyd` with `--client-option`, so the terminal uses them before it is rendered. The terminal color palette uses Termux `colors.properties` when it is available at `~/.termux/colors.properties` or `/data/data/com.termux/files/home/.termux/colors.properties`; otherwise it falls back to a Termux-like black background, white foreground, and ANSI 16-color palette. Set `TERMUX_COLORS_FILE=/path/to/colors.properties` to use another file. `--terminal-padding` adds CSS padding below the embedded terminal frame, which can help keep tmux status bars visible in fullscreen mode on mobile browsers.

## Clipboard Bridge

The embedded terminal maps `Ctrl+v` to clipboard paste. It first uses browser clipboard access for the local `ttyd` frame, then falls back to the native Termux clipboard bridge at `/get` when browser access is blocked. On Android this may show a clipboard permission prompt, and it still depends on the browser and OS clipboard policy. If `Ctrl+v` cannot read the clipboard on your device, use the bridge-based paste options below where `/get` works.

Use the native Termux clipboard bridge mainly to copy text from Neovim and tmux running inside proot to the Android clipboard. This avoids browser clipboard permissions and tmux OSC52 passthrough for the copy direction.

The bridge keeps clipboard operations on the Android/Termux side:

```text
Neovim / tmux
  -> curl http://127.0.0.1:8765/set
  -> termux-clipboard-bridge.py
  -> termux-clipboard-set
  -> Android clipboard
```

This is most useful when Neovim or tmux runs inside proot, where `termux-clipboard-set` is not normally available directly. In native Termux only, calling `termux-clipboard-set` directly is usually simpler.

The bridge also exposes `GET /get`, but Android clipboard reads may be restricted when Termux is not the foreground app. On affected devices, `termux-clipboard-get` can work when run manually in foreground Termux while the bridge still returns an empty response in the PWA/tmux/proot workflow. Treat `/get` as best-effort and device-dependent; do not rely on it for Android-to-tmux or Android-to-Neovim paste unless you have verified it on your device.

Install Termux:API on Android and the `termux-api` package in native Termux:

```sh
pkg install termux-api
```

Install `curl` in the environment where Neovim and tmux run if it is not already available. On native Termux:

```sh
pkg install curl
```

Inside Ubuntu or another proot distribution, use that distribution's package manager instead.

The bridge starts automatically with `termux-ttyd-pwa` from native Termux unless disabled:

```sh
termux-ttyd-pwa
```

Disable the bridge when native Termux clipboard commands are enough:

```sh
termux-ttyd-pwa --no-clipboard-bridge
```

For a source checkout, use:

```sh
./scripts/start.sh
```

The bridge listens on `127.0.0.1:8765` by default. It exposes three local endpoints:

- `POST /set`: writes request body to the Android clipboard
- `GET /get`: reads the Android clipboard when Android allows the bridge process to read it
- `GET /health`: checks whether the bridge is reachable without reading the clipboard

Then configure Neovim inside tmux or proot to call the bridge with `curl`. Copy uses `/set`; paste uses `/get` only if Android allows clipboard reads from the bridge process:

```lua
vim.g.clipboard = {
  name = "termux-clipboard-bridge",
  copy = {
    ["+"] = "curl -fsS --data-binary @- http://127.0.0.1:8765/set",
    ["*"] = "curl -fsS --data-binary @- http://127.0.0.1:8765/set",
  },
  paste = {
    ["+"] = "curl -fsS http://127.0.0.1:8765/get",
    ["*"] = "curl -fsS http://127.0.0.1:8765/get",
  }
}
```

If `/get` is empty on your device, keep the bridge for copy-to-Android use and use another paste path for Android-to-Neovim.

For tmux copy mode:

```tmux
bind-key -T copy-mode-vi y send-keys -X copy-pipe-and-cancel "curl -fsS --data-binary @- http://127.0.0.1:8765/set"
```

If your Neovim or tmux config is shared across Termux, proot, macOS, Linux, and WSL, keep existing clipboard providers and enable the bridge only in Termux/proot. For Neovim:

```lua
local is_termux = vim.env.TERMUX_VERSION ~= nil
  or vim.env.PREFIX == "/data/data/com.termux/files/usr"
  or vim.fn.isdirectory("/data/data/com.termux") == 1

if is_termux and vim.fn.executable("curl") == 1 then
  vim.g.clipboard = {
    name = "termux-clipboard-bridge",
    copy = {
      ["+"] = "curl -fsS --data-binary @- http://127.0.0.1:8765/set",
      ["*"] = "curl -fsS --data-binary @- http://127.0.0.1:8765/set",
    },
    paste = {
      ["+"] = "curl -fsS http://127.0.0.1:8765/get",
      ["*"] = "curl -fsS http://127.0.0.1:8765/get",
    }
  }
end
```

For tmux, put the bridge binding after other clipboard bindings so it takes priority inside Termux/proot when multiple clipboard commands exist. This works from native Termux and from proot as long as `127.0.0.1:8765` reaches the native Termux bridge:

```tmux
if-shell 'command -v curl >/dev/null 2>&1 && [ -d /data/data/com.termux ]' \
  'bind-key -T copy-mode-vi y send-keys -X copy-pipe-and-cancel "curl -fsS --data-binary @- http://127.0.0.1:8765/set"'
```

If `/get` works on your device, you can also paste the Android clipboard into tmux through the bridge by loading it into the tmux buffer first:

```tmux
if-shell 'command -v curl >/dev/null 2>&1 && [ -d /data/data/com.termux ]' \
  'bind p run-shell -b "curl -fsS http://127.0.0.1:8765/get | tmux load-buffer - && tmux paste-buffer"'
if-shell 'command -v curl >/dev/null 2>&1 && [ -d /data/data/com.termux ]' \
  'bind v run-shell -b "curl -fsS http://127.0.0.1:8765/get | tmux load-buffer - && tmux paste-buffer"'
```

If the PWA terminal runs inside proot, start `termux-ttyd-pwa` from native Termux with tmux as the command:

```sh
termux-ttyd-pwa -- tmux new -A -s pwa
```

Keep the bridge bound to `127.0.0.1`. Do not expose it with `0.0.0.0`, because any reachable client could read or overwrite the Android clipboard.

Main copy flow from proot Neovim to Android:

```text
Neovim yank, such as "+y
  -> Neovim clipboard provider runs curl --data-binary @- /set
  -> bridge receives the yanked text as the POST body
  -> bridge passes it to termux-clipboard-set
  -> Android clipboard is updated
```

Best-effort paste flow from Android to Neovim:

```text
Neovim paste, such as "+p
  -> Neovim clipboard provider runs curl /get
  -> bridge runs termux-clipboard-get, if Android allows it
  -> Android clipboard text is returned to Neovim
  -> Neovim inserts the text
```

Copy flow from tmux copy mode to Android:

```text
tmux copy-mode selection and y
  -> copy-pipe-and-cancel sends the selected text to curl --data-binary @- /set
  -> bridge passes it to termux-clipboard-set
  -> Android clipboard is updated
```

The tmux copy-mode example above only handles copying from tmux to Android. If `/get` works on your device, the `prefix + p` and `prefix + v` bindings above handle Android-to-tmux paste. For pasting Android clipboard text into Neovim, use Neovim paste such as `"+p` only after verifying `/get`. For shell-level access, test Android clipboard reads with:

```sh
curl -fsS http://127.0.0.1:8765/get
```

Avoid a simple tmux binding such as `send-keys "$(curl ...)"` for paste. It can mishandle newlines, quotes, and control characters.

If `curl http://127.0.0.1:8765/get` hangs, times out, or returns an empty response, check Termux:API first:

```sh
pkg install termux-api
termux-clipboard-get
```

The Android app "Termux:API" must also be installed and allowed to run. If `termux-clipboard-get` hangs, the bridge cannot return clipboard text either. If manual `termux-clipboard-get` works only while Termux is foreground but `/get` is empty from tmux, proot, or the PWA workflow, this is likely an Android clipboard read restriction rather than a bridge failure. The bridge times out clipboard commands after 3 seconds by default; change this with `TERMUX_CLIPBOARD_BRIDGE_COMMAND_TIMEOUT=5` if needed.

## PWA Install

After opening the app in a supported browser, use the browser menu to install it to the Android home screen.

## APT Repository Install

### User Install Command

On Termux, users can add your repository with:

```sh
curl -fsSL https://soichiro-fujioka.github.io/termux-ttyd-pwa/termux-ttyd-pwa-archive-keyring.gpg -o "$PREFIX/etc/apt/trusted.gpg.d/termux-ttyd-pwa-archive-keyring.gpg"
curl -fsSL https://soichiro-fujioka.github.io/termux-ttyd-pwa/termux-ttyd-pwa.list -o "$PREFIX/etc/apt/sources.list.d/termux-ttyd-pwa.list"
```

The APT repository is signed with this key fingerprint:

```text
C94B 7C3C 81CE C096 959D  677D 2FCA 3DB5 F98C 433F
```

Then install:

```sh
pkg update
pkg install termux-ttyd-pwa
termux-ttyd-pwa
```

### Publishing the APT Repository

The `Publish APT repository` GitHub Actions workflow builds the `.deb`, signs the APT repository metadata, and deploys `dist/apt-repo` to GitHub Pages.

Configure GitHub Pages to use GitHub Actions as the source, then add this repository secret:

- `APT_GPG_PRIVATE_KEY`: armored private key for the APT signing key

If the signing key has a passphrase, also add:

- `APT_GPG_PASSPHRASE`: passphrase for the APT signing key

Export the private key with:

```sh
gpg --armor --export-secret-keys C94B7C3C81CEC096959D677D2FCA3DB5F98C433F
```

Do not commit the exported private key.

## Notes

- The embedded terminal defaults to `http://127.0.0.1:7681/`.
- Local startup on `127.0.0.1` is recommended. Exposing the app or `ttyd` to a LAN or the internet can allow other devices to operate your shell if they can reach the port.
- Runtime font changes are shown as a selected startup style in the PWA settings because the embedded `ttyd` page runs on another port. Use startup font options to change the actual terminal font.
- The IME button is intentionally simple. It keeps focus behavior predictable and avoids interfering with Japanese composition events.
