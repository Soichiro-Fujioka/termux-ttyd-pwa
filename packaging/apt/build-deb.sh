#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PACKAGE="termux-ttyd-pwa"
VERSION="${VERSION:-0.1.0}"
ARCHITECTURE="all"
TERMUX_PREFIX="${TERMUX_PREFIX:-/data/data/com.termux/files/usr}"
BUILD_DIR="$ROOT_DIR/build/deb/$PACKAGE"
OUTPUT_DIR="$ROOT_DIR/dist/deb"

if ! command -v dpkg-deb >/dev/null 2>&1; then
  printf 'dpkg-deb is required. Install it with: pkg install dpkg\n' >&2
  exit 1
fi

rm -rf "$BUILD_DIR"
mkdir -p \
  "$BUILD_DIR/DEBIAN" \
  "$BUILD_DIR$TERMUX_PREFIX/bin" \
  "$BUILD_DIR$TERMUX_PREFIX/share/$PACKAGE" \
  "$OUTPUT_DIR"

install -m 755 "$ROOT_DIR/bin/termux-ttyd-pwa" "$BUILD_DIR$TERMUX_PREFIX/bin/termux-ttyd-pwa"
cp -R "$ROOT_DIR/public" "$BUILD_DIR$TERMUX_PREFIX/share/$PACKAGE/public"
INSTALLED_SIZE="$(du -sk "$BUILD_DIR$TERMUX_PREFIX" | cut -f1)"

cat > "$BUILD_DIR/DEBIAN/control" <<EOF
Package: $PACKAGE
Version: $VERSION
Architecture: $ARCHITECTURE
Maintainer: Soichiro Fujioka <noreply@example.com>
Installed-Size: $INSTALLED_SIZE
Depends: python, ttyd
Homepage: https://github.com/Soichiro-Fujioka/termux-ttyd-pwa
Description: Mobile-friendly PWA wrapper for ttyd on Termux
 A lightweight PWA wrapper for ttyd that improves Android terminal usability
 with touch-friendly controls, fullscreen support, and startup font options.
EOF

dpkg-deb --build --root-owner-group "$BUILD_DIR" "$OUTPUT_DIR/${PACKAGE}_${VERSION}_${ARCHITECTURE}.deb"
printf 'Built %s\n' "$OUTPUT_DIR/${PACKAGE}_${VERSION}_${ARCHITECTURE}.deb"
