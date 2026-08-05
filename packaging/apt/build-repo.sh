#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEB_DIR="$ROOT_DIR/dist/deb"
REPO_DIR="$ROOT_DIR/dist/apt-repo"
PACKAGE="termux-ttyd-pwa"
COMPONENT="main"
SUITE="stable"
ARCHES=(aarch64 arm i686 x86_64)
SIGNING_KEY="${APT_SIGNING_KEY:-C94B7C3C81CEC096959D677D2FCA3DB5F98C433F}"

if [ ! -d "$DEB_DIR" ]; then
  printf 'No deb directory found at %s. Run packaging/apt/build-deb.sh first.\n' "$DEB_DIR" >&2
  exit 1
fi

rm -rf "$REPO_DIR"
mkdir -p "$REPO_DIR/pool/main/t/$PACKAGE" "$REPO_DIR/dists/$SUITE/$COMPONENT"
cp "$ROOT_DIR/packaging/apt/termux-ttyd-pwa.list" "$REPO_DIR/termux-ttyd-pwa.list"
cp "$ROOT_DIR/packaging/apt/termux-ttyd-pwa-archive-keyring.gpg" "$REPO_DIR/termux-ttyd-pwa-archive-keyring.gpg"

shopt -s nullglob
DEBS=("$DEB_DIR"/*.deb)
if [ "${#DEBS[@]}" -eq 0 ]; then
  printf 'No .deb files found at %s. Run packaging/apt/build-deb.sh first.\n' "$DEB_DIR" >&2
  exit 1
fi

for deb in "${DEBS[@]}"; do
  cp "$deb" "$REPO_DIR/pool/main/t/$PACKAGE/"
done

write_packages() {
  local arch="$1"
  local packages_dir="$REPO_DIR/dists/$SUITE/$COMPONENT/binary-$arch"
  local packages_file="$packages_dir/Packages"
  mkdir -p "$packages_dir"
  : > "$packages_file"

  for deb in "$REPO_DIR"/pool/main/t/$PACKAGE/*.deb; do
    local filename="${deb#$REPO_DIR/}"
    local size
    local md5
    local sha1
    local sha256
    size="$(wc -c < "$deb")"
    md5="$(md5sum "$deb")"
    md5="${md5%% *}"
    sha1="$(sha1sum "$deb")"
    sha1="${sha1%% *}"
    sha256="$(sha256sum "$deb")"
    sha256="${sha256%% *}"

    dpkg-deb -f "$deb" >> "$packages_file"
    {
      printf 'Filename: %s\n' "$filename"
      printf 'Size: %s\n' "$size"
      printf 'MD5sum: %s\n' "$md5"
      printf 'SHA1: %s\n' "$sha1"
      printf 'SHA256: %s\n\n' "$sha256"
    } >> "$packages_file"
  done

  gzip -9c "$packages_file" > "$packages_file.gz"
}

for arch in "${ARCHES[@]}"; do
  write_packages "$arch"
done

RELEASE_FILE="$REPO_DIR/dists/$SUITE/Release"
cat > "$RELEASE_FILE" <<EOF
Origin: termux-ttyd-pwa
Label: termux-ttyd-pwa
Suite: $SUITE
Codename: $SUITE
Architectures: ${ARCHES[*]}
Components: $COMPONENT
Description: APT repository for termux-ttyd-pwa
EOF

append_hashes() {
  local algorithm="$1"
  local command_name="$2"
  printf '%s:\n' "$algorithm" >> "$RELEASE_FILE"
  for arch in "${ARCHES[@]}"; do
    for name in Packages Packages.gz; do
      local path="$COMPONENT/binary-$arch/$name"
      local full_path="$REPO_DIR/dists/$SUITE/$path"
      local size
      local hash
      size="$(wc -c < "$full_path")"
      hash="$($command_name "$full_path")"
      hash="${hash%% *}"
      printf ' %s %16s %s\n' "$hash" "$size" "$path" >> "$RELEASE_FILE"
    done
  done
}

append_hashes "MD5Sum" md5sum
append_hashes "SHA1" sha1sum
append_hashes "SHA256" sha256sum

GPG_SIGN_ARGS=(--batch --yes --local-user "$SIGNING_KEY")
if [ -n "${APT_GPG_PASSPHRASE:-}" ]; then
  GPG_SIGN_ARGS+=(--pinentry-mode loopback --passphrase "$APT_GPG_PASSPHRASE")
fi

gpg "${GPG_SIGN_ARGS[@]}" --clearsign --output "$REPO_DIR/dists/$SUITE/InRelease" "$RELEASE_FILE"
gpg "${GPG_SIGN_ARGS[@]}" --detach-sign --armor --output "$RELEASE_FILE.gpg" "$RELEASE_FILE"

printf 'Built APT repository at %s\n' "$REPO_DIR"
