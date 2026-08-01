## termux ttyd pwa application

This application wraps `ttyd` in a PWA for Termux.

The main purpose of this application is to make terminal usage on Android easier,
especially for switching IME/input modes such as English and Japanese, which is
not well supported by the original Termux experience.

## Target environment

- Android
- Termux
- proot Ubuntu environment
- `ttyd` as the terminal backend
- Browser/PWA frontend

Assume the app may run on mobile devices with limited screen size, touch input,
mobile browser restrictions, and Android IME behavior.

**features**

- Easy IME/input-mode switching
- Change font style/family and size
- Full screen support
- PWA install support
- Mobile-friendly terminal UI

## Startup options

- The application has startup command options for terminal font style/family and
  font size.
- Preserve these options when changing startup scripts, command parsing, or
  terminal initialization.
- Font options provided at startup should be reflected in the terminal UI when
  the app opens.
- Runtime font controls, if present, should remain consistent with values passed
  from the startup command.

## Development guidelines

- Keep the app lightweight and simple.
- Prefer minimal, focused changes over large rewrites.
- Preserve compatibility with Termux, Android browsers, and `ttyd`.
- Avoid desktop-only UI assumptions.
- Avoid heavy dependencies unless they are clearly necessary.
- Be careful when changing keyboard handling, focus handling, input events, or
  terminal rendering.

## UX requirements

- Controls must be usable with touch input.
- The terminal area should remain the main focus of the UI.
- Settings and controls should not block normal terminal usage.
- Font family and font size changes should apply immediately when possible.
- Startup font style/family and size options should be respected before the
  terminal is first rendered when possible.
- Fullscreen behavior should handle mobile browser limitations gracefully.
- Layout changes should work on narrow mobile viewports as well as desktop
  browsers.

## IME and keyboard handling

- Japanese and other IME composition input must not be broken.
- Be careful with `compositionstart`, `compositionupdate`, `compositionend`,
  `beforeinput`, `input`, `keydown`, and `keyup` behavior.
- Do not assume one physical key press always maps to one character.
- Do not interrupt active composition unless the behavior is intentional.
- Keep focus behavior predictable so the software keyboard opens reliably on
  Android.

## PWA requirements

- The app should be installable from supported mobile browsers.
- Keep the web app manifest valid.
- Use icons and theme colors suitable for Android home screen usage.
- Add or modify a service worker only when it provides clear value.
- Avoid caching behavior that could make terminal sessions stale or confusing.

## ttyd integration

- Treat `ttyd` as the terminal backend.
- Avoid modifying `ttyd` behavior unless necessary.
- Frontend changes must not break terminal input, output, resizing, or focus.
- Terminal resizing should remain reliable when the viewport changes, settings
  panels open/close, or fullscreen mode changes.

## Verification checklist

When changing the app, verify the relevant items below:

- Terminal input still works.
- Terminal output still renders correctly.
- Japanese IME composition still works.
- English/Japanese input switching remains usable.
- Font family settings work.
- Font size settings work.
- Startup command font style/family and size options work.
- Fullscreen mode works or fails gracefully.
- Layout works on mobile-sized screens.
- PWA install-related files remain valid if changed.

## Notes for agents

- This project is focused on practical mobile terminal usability.
- Prioritize IME behavior, touch usability, and simple configuration.
- Do not assume a normal desktop Linux environment.
- The development environment may be Termux + proot Ubuntu.
