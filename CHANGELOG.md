# Changelog

All notable changes to this project are documented in this file. The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

- - -

## Table of Contents

- [1.1.1 - 2021-01-29](#111---2021-01-29)
    - [Changed](#changed)
    - [Removed](#removed)
    - [Fixed](#fixed)
    - [Security](#security)
- [1.1.0 - 2020-10-31](#110---2020-10-31)
    - [Added](#added)
    - [Changed](#changed-1)
    - [Fixed](#fixed-1)
- [1.0.0 - 2020-09-30](#100---2020-09-30)
    - [Added](#added-1)

## [1.1.1](https://github.com/Phixyn/no-bs-looper/releases/tag/1.1.1) - 2021-01-29

Fixes a critical issue wherein the value for "End time" could be stuck at 1 and the slider could not be moved.

Contains some minor improvements to the UI.

### Changed

- Increased website title's font size on mobile and decreased it on desktop
- Changed background colors of the top bar and footer to be slightly lighter
- Added a CSS transition for text color to hyperlinks

### Removed

- Removed the background image and replaced it with a solid color background

### Fixed

- Fixed [#112](https://github.com/Phixyn/no-bs-looper/issues/112): End time no longer gets stuck at 1 second when first loading the website

### Security

- Website is now more CSP-friendly - [#101](https://github.com/Phixyn/no-bs-looper/issues/101)

## [1.1.0](https://github.com/Phixyn/no-bs-looper/releases/tag/1.1.0) - 2020-10-31

👻 Halloween update! 🎃

Adds some much needed essential features and improvements.

### Added

- **Added the ability to use YouTube links to load a new video!** 🎉
- Added "Turn Off the Lights" feature, inspired by this [Firefox extension](https://addons.mozilla.org/en-GB/firefox/addon/turn-off-the-lights/)
- Added a "Share/save loop" button that opens a modal containing the share link
- Added HTML form input validation and error handling
- Added a shadow around the video player

### Changed

- Clicking/tapping the "Video link or ID" input field now auto-selects its contents
- Background and text color of selected text has been changed to accent color - [#72](https://github.com/Phixyn/no-bs-looper/issues/72) (thanks [@tomwalsh-home](https://github.com/tomwalsh-home))
- Server messages now include a `type` property
- Server now sends more detailed error messages to clients
- Client's `onmessage` handler now checks server message contents
- Client now handles JSON parsing errors
- Client now logs errors received by the server

### Fixed

- Fixed [#74](https://github.com/Phixyn/no-bs-looper/issues/74): Meta tags for Twitter now use the `name` attribute instead of `property`

## [1.0.0](https://github.com/Phixyn/no-bs-looper/releases/tag/1.0.0) - 2020-09-30

First release with all core features implemented.

### Added

- Ability to set a new video ID - [#2](https://github.com/Phixyn/no-bs-looper/issues/2)
- Ability to set new start and end times - [#1](https://github.com/Phixyn/no-bs-looper/issues/1)
- Python proxy server for YouTube server requests - [#14](https://github.com/Phixyn/no-bs-looper/issues/14)
- Slider that can be used to adjust start and end times - [#7](https://github.com/Phixyn/no-bs-looper/issues/7)
- "Current Time" buttons for quickly setting start and end times - [#17](https://github.com/Phixyn/no-bs-looper/issues/17)
- Full dark theme - [#16](https://github.com/Phixyn/no-bs-looper/issues/16)
- Dynamic page URL based on video ID and start/end times - [#3](https://github.com/Phixyn/no-bs-looper/issues/3)
