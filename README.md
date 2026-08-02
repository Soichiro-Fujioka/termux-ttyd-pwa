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

## Startup Options

```sh
./scripts/start.sh --font-style jetbrains --font-size 18 --terminal-padding 12px
```

Installed package usage is the same:

```sh
termux-ttyd-pwa --font-style jetbrains --font-size 18 --terminal-padding 12px
```

Useful options:

- `--host 127.0.0.1`
- `--app-port 8080`
- `--ttyd-port 7681`
- `--font-style monospace`
- `--font-family monospace`
- `--font-size 14`
- `--line-height 1.2`
- `--terminal-padding 0`
- `-- COMMAND...`

Available font styles are `monospace`, `sans`, `serif`, `jetbrains`, `fira`, `hack`, `source-code-pro`, and `noto`. Use `--font-family` when you want to pass a custom CSS font family directly to `ttyd`.

Example with a custom shell command:

```sh
./scripts/start.sh --font-size 18 -- bash -l
```

The startup font options are passed directly to `ttyd` with `--client-option`, so the terminal uses them before it is rendered. The terminal color palette uses Termux `colors.properties` when it is available at `~/.termux/colors.properties` or `/data/data/com.termux/files/home/.termux/colors.properties`; otherwise it falls back to a Termux-like black background, white foreground, and ANSI 16-color palette. Set `TERMUX_COLORS_FILE=/path/to/colors.properties` to use another file. `--terminal-padding` adds CSS padding around the embedded terminal frame, which can help keep tmux status bars visible in fullscreen mode on mobile browsers.

## PWA Install

After opening the app in a supported browser, use the browser menu to install it to the Android home screen.

## APT Repository Install

### User Install Command

On Termux, users can add your repository with:

```sh
curl -fsSL https://soichiro-fujioka.github.io/termux-ttyd-pwa/termux-ttyd-pwa.list -o "$PREFIX/etc/apt/sources.list.d/termux-ttyd-pwa.list"
```

Then install:

```sh
pkg update
pkg install termux-ttyd-pwa
termux-ttyd-pwa
```

## Notes

- The embedded terminal defaults to `http://127.0.0.1:7681/`.
- Runtime font changes are shown as a selected startup style in the PWA settings because the embedded `ttyd` page runs on another port. Use startup font options to change the actual terminal font.
- The IME button is intentionally simple. It keeps focus behavior predictable and avoids interfering with Japanese composition events.
