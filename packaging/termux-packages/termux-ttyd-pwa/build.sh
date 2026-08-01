TERMUX_PKG_HOMEPAGE=https://github.com/Soichiro-Fujioka/termux-ttyd-pwa
TERMUX_PKG_DESCRIPTION="Mobile-friendly PWA wrapper for ttyd on Termux"
TERMUX_PKG_LICENSE="MIT"
TERMUX_PKG_MAINTAINER="@Soichiro-Fujioka"
TERMUX_PKG_VERSION=0.1.0
TERMUX_PKG_SRCURL=https://github.com/Soichiro-Fujioka/termux-ttyd-pwa/archive/refs/tags/v${TERMUX_PKG_VERSION}.tar.gz
TERMUX_PKG_SHA256=REPLACE_WITH_RELEASE_TARBALL_SHA256
TERMUX_PKG_DEPENDS="python, ttyd"
TERMUX_PKG_PLATFORM_INDEPENDENT=true

termux_step_make_install() {
  install -Dm755 bin/termux-ttyd-pwa "$TERMUX_PREFIX/bin/termux-ttyd-pwa"

  mkdir -p "$TERMUX_PREFIX/share/termux-ttyd-pwa"
  cp -Rf public "$TERMUX_PREFIX/share/termux-ttyd-pwa/"
}
