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
- `--font-size 16`
- `--line-height 1.2`
- `--terminal-padding 0`
- `-- COMMAND...`

Available font styles are `monospace`, `sans`, `serif`, `jetbrains`, `fira`, `hack`, `source-code-pro`, and `noto`. Use `--font-family` when you want to pass a custom CSS font family directly to `ttyd`.

Example with a custom shell command:

```sh
./scripts/start.sh --font-size 18 -- bash -l
```

The startup font options are passed directly to `ttyd` with `--client-option`, so the terminal uses them before it is rendered. `--terminal-padding` adds CSS padding around the embedded terminal frame, which can help keep tmux status bars visible in fullscreen mode on mobile browsers.

## PWA Install

After opening the app in a supported browser, use the browser menu to install it to the Android home screen.

## Termux Package Publishing

To make this available through:

```sh
pkg install termux-ttyd-pwa
```

the package must be added to the official `termux/termux-packages` repository or to another Termux APT repository.

This repository includes a package recipe template at:

```text
packaging/termux-packages/termux-ttyd-pwa/build.sh
```

Official publishing flow:

1. Create a GitHub release tag, for example `v0.1.0`.
2. Calculate the release tarball SHA-256.
3. Replace `REPLACE_WITH_RELEASE_TARBALL_SHA256` in the package recipe.
4. Copy `packaging/termux-packages/termux-ttyd-pwa` into a fork of `termux/termux-packages` under `packages/termux-ttyd-pwa`.
5. Build and test the package with the Termux package build tools.
6. Open a pull request to `termux/termux-packages`.

The package installs:

- command: `$PREFIX/bin/termux-ttyd-pwa`
- PWA files: `$PREFIX/share/termux-ttyd-pwa/public`

Package dependencies are `python` and `ttyd`.

## Self-Hosted APT Repository

This repo also includes scripts for hosting your own Termux APT repository.

Build the `.deb` package:

```sh
packaging/apt/build-deb.sh
```

Build the APT repository metadata:

```sh
packaging/apt/build-repo.sh
```

The generated repository is written to:

```text
dist/apt-repo
```

Repository layout:

```text
dist/apt-repo/
  dists/stable/Release
  dists/stable/main/binary-aarch64/Packages.gz
  dists/stable/main/binary-arm/Packages.gz
  dists/stable/main/binary-i686/Packages.gz
  dists/stable/main/binary-x86_64/Packages.gz
  pool/main/t/termux-ttyd-pwa/*.deb
```

### GitHub Pages Hosting

The workflow at `.github/workflows/apt-repo.yml` builds and deploys the APT repository to GitHub Pages.

To use it:

1. Enable GitHub Pages in the repository settings.
2. Set the Pages source to GitHub Actions.
3. Push to `main` or push a tag like `v0.1.0`.
4. The repository will be published at `https://soichiro-fujioka.github.io/termux-ttyd-pwa`.

### User Install Command

On Termux, users can add your repository with:

```sh
curl -fsSL https://soichiro-fujioka.github.io/termux-ttyd-pwa/termux-ttyd-pwa.list -o "$PREFIX/etc/apt/sources.list.d/termux-ttyd-pwa.list"
```

If you use GitHub Pages from this repository, the source line is:

```text
deb [trusted=yes] https://soichiro-fujioka.github.io/termux-ttyd-pwa stable main
```

Then install:

```sh
pkg update
pkg install termux-ttyd-pwa
termux-ttyd-pwa
```

This repository is unsigned by default, so the source line uses `[trusted=yes]`. For broader public distribution, signing the repository is recommended.

## Notes

- The embedded terminal defaults to `http://127.0.0.1:7681/`.
- Runtime font changes are shown as a selected startup style in the PWA settings because the embedded `ttyd` page runs on another port. Use startup font options to change the actual terminal font.
- The IME button is intentionally simple. It keeps focus behavior predictable and avoids interfering with Japanese composition events.
