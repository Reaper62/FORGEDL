# Product.md — FORGERDL (Windows Native Experience)

## 0. Project Overview

This document defines the **complete product specification, feature coverage checklist, UI/UX system, and implementation blueprint** for a modern Electron-based Windows GUI built on top of `yt-dlp`.

The goal is to create a **powerful but extremely simple interface** that exposes _every capability of yt-dlp_ while maintaining a clean, intuitive, and modern design inspired by **Nothing OS**.

This is a living document for engineering agents. It must be treated as a **source of truth for feature completeness, UX consistency, and system architecture**.

---

# 1. Who is this for?

## Target Audience

- Everyday users who want to download videos/audio without terminal usage
- Power users who need full yt-dlp control (format selection, post-processing, scripting)
- Content creators (YouTube, TikTok, Instagram archival workflows)
- Researchers / archivists saving playlists or metadata
- Developers needing batch download automation through UI
- Low-tech users who still need advanced download capability

## User Types Breakdown

- 🟢 Beginner: paste link → download
- 🟡 Intermediate: choose format, quality, subtitles
- 🔴 Advanced: full CLI-equivalent control, batch jobs, scripting, cookies, headers, plugins

---

# 2. What does it do?

This application is a **GUI wrapper around yt-dlp + FFmpeg ecosystem** that:

- Downloads video/audio from hundreds of supported sites
- Converts formats (audio/video extraction, transcoding)
- Manages playlists, channels, and batch downloads
- Handles authentication (cookies, headers, login sessions)
- Applies post-processing (merge, trim, embed subtitles, metadata tagging)
- Uses FFmpeg for media processing pipelines
- Exposes all yt-dlp CLI features in a structured UI
- Supports advanced automation (presets, profiles, rules)
- Provides plugin/extensibility system

---

# 3. What problem does it solve?

## Core Problems

- yt-dlp is powerful but terminal-heavy and inaccessible to non-technical users
- FFmpeg setup is confusing and error-prone
- Advanced options are hard to discover or remember
- No visual workflow for batch downloading or format control
- Poor usability for playlist/channel management

## Solution

- Visual abstraction layer over full yt-dlp CLI
- Smart defaults for beginners
- Deep configuration panels for advanced users
- Preset system to remove repetitive configuration
- Live preview of output formats and download behavior

---

# Register

product

# Users

- **Everyday users**: Non-technical people who want to download video/audio without touching a terminal. Context: home, laptop, casual use.
- **Power users**: People who know yt-dlp's CLI and want full control (format selection, post-processing, scripting) in a visual interface. Context: focused workflow, keyboard-driven.
- **Content creators**: YouTube, TikTok, Instagram archival workflows. Batch operations, metadata preservation.
- **Researchers / archivists**: Saving playlists, channels, metadata for long-term storage.

# Product Purpose

A GUI wrapper around yt-dlp + FFmpeg that hides terminal complexity without removing any power. Success = a beginner can paste-and-download in 3 seconds, while an advanced user can reach every yt-dlp flag through the UI.

# Brand Personality

Minimal, calm, focused. Quietly capable without shouting. The interface should feel like a precision instrument — confident and restrained, never decorative. Nothing OS is the north star: dot-matrix sensibility, monochrome palette, strategic use of red/white accent pops to draw attention only where it matters.

# Anti-references

- Generic SaaS dashboards (Notion/Linear clones with rounded pastel cards, soft shadows, cookie-cutter layouts)
- Gamer/neon aesthetic (RGB glow, aggressive dark gradients)
- Cluttered download managers (JDownloader, IDM — buttons everywhere, no hierarchy)
- Electron apps that look like wrapped websites

# Design Principles

1. **Complexity on demand** — Beginners see only what they need. Advanced controls are always reachable but never in the way.
2. **Quiet confidence** — The interface communicates competence through restraint, not decoration. Every element earns its place.
3. **Terminal-grade density, GUI-grade clarity** — Pack information tight like a power tool, but make it scannable and navigable without a manual.
4. **Motion as signal** — Animation exists to communicate state changes (downloading, merging, error), never as ornament.
5. **One path, then options** — Every screen has one obvious primary action. Alternatives are discoverable but secondary.

# Accessibility & Inclusion

- WCAG AA compliance (4.5:1 contrast minimum for body text, 3:1 for large text and UI components)
- Full keyboard navigation across all interactive elements
- Screen reader labels on all controls
- `prefers-reduced-motion` respected — all animations degrade to instant or crossfade
- High contrast mode support
- Scalable UI (100%–200%)

---

# 4. Core System Architecture

## 4.1 Application Stack

- Electron (main process + renderer)
- Node.js backend layer for yt-dlp execution
- FFmpeg bundled via yt-dlp FFmpeg Builds
- Optional Python fallback (if needed for extensions)
- Local config storage (JSON + IndexedDB)

## 4.2 Core Modules

- Downloader Engine
- Format Resolver Engine
- Playlist Manager
- Post-processing Pipeline
- Plugin Manager
- Settings Engine
- Job Queue System
- File System Manager

## 4.3 yt-dlp Integration Layer

- CLI wrapper abstraction
- JSON output parsing (`--dump-json`)
- Progress hook parsing
- Error normalization layer
- Capability discovery system (`yt-dlp --help-json` or CLI introspection)

---

# 5. FULL yt-dlp Feature Coverage Checklist

> This section must be implemented as a **dynamic UI mapping of ALL yt-dlp options**, not hardcoded assumptions.

## 5.1 Core Download Features

- [ ] Single video download
- [ ] Playlist download
- [ ] Channel/user download
- [ ] Multi-URL batch input
- [ ] Resume interrupted downloads
- [ ] Fragmented streaming download support
- [ ] Concurrent fragment downloading
- [ ] Rate limiting
- [ ] Retry policies
- [ ] Network timeout control

## 5.2 Format & Quality Control

- [ ] Format selection (best/worst/custom)
- [ ] Resolution selection (4K/1080p/720p/etc.)
- [ ] FPS filtering
- [ ] Codec selection (H.264, VP9, AV1)
- [ ] Audio-only extraction
- [ ] Bitrate selection
- [ ] File size constraints

## 5.3 Post Processing (FFmpeg Layer)

- [ ] Merge audio + video
- [ ] Extract audio (MP3/AAC/Opus/etc.)
- [ ] Re-encode formats
- [ ] Trim start/end
- [ ] Embed thumbnails
- [ ] Embed metadata (title, uploader, date)
- [ ] Subtitle embedding
- [ ] Chapter extraction

## 5.4 Subtitles & Captions

- [ ] Auto subtitle download
- [ ] Manual language selection
- [ ] Subtitle format conversion (srt/vtt/ass)
- [ ] Hardcoded subtitles option
- [ ] Auto-generated subtitles support

## 5.5 Metadata & Extraction

- [ ] JSON metadata extraction
- [ ] Thumbnail extraction
- [ ] Chapter parsing
- [ ] Tags/description export
- [ ] File naming templates

## 5.6 Authentication & Access

- [ ] Cookie file support
- [ ] Browser cookie import
- [ ] Header customization
- [ ] Login session reuse
- [ ] Age-restricted content handling

## 5.7 Network Control

- [ ] Proxy support (HTTP/SOCKS)
- [ ] IPv4/IPv6 selection
- [ ] Geo-bypass options
- [ ] Custom DNS (optional layer)
- [ ] VPN compatibility handling notes

## 5.8 Rate Limiting & Performance

- [ ] Speed caps
- [ ] Parallel downloads
- [ ] Fragment concurrency tuning
- [ ] Disk caching strategy

## 5.9 Advanced Extraction Features

- [ ] Site-specific extractors
- [ ] Generic extractor fallback
- [ ] URL redirect handling
- [ ] Playlist flattening
- [ ] Metadata-only mode

---

# 6. Plugin System (yt-dlp + App Extensions)

## 6.1 yt-dlp Plugin Support

- Extractor plugins
- Postprocessor plugins
- Downloader plugins
- External scripting hooks

## 6.2 GUI Plugin Layer

- Custom UI panels per plugin
- Plugin lifecycle management
- Enable/disable system
- Sandboxed execution
- Permission system

## 6.3 Plugin Use Cases

- SponsorBlock integration toggles
- Auto naming conventions
- Cloud upload after download
- AI metadata tagging
- Custom format filters

---

# 7. UI/UX DESIGN SYSTEM (Nothing OS Inspired)

## 7.1 Design Philosophy

- Minimal but expressive
- Transparent layering
- Soft blur surfaces
- High contrast typography
- Motion-driven feedback
- No visual clutter

## 7.2 Layout Style

- Modular cards
- Floating control panels
- Sidebar navigation (collapsible)
- Command palette (Ctrl + K style)
- Drag-and-drop URL zone as primary action

## 7.3 Visual Language

- Monochrome base palette
- Accent-driven highlights
- Subtle neon glow for active states
- Rounded geometry (8–16px radius)
- Glassmorphism (light use, not excessive)

## 7.4 Typography

- Inter / system UI font
- Large numeric emphasis for progress
- Compact labels for advanced panels

## 7.5 Motion Design

- Smooth easing (0.2–0.4s transitions)
- Download progress wave animation
- Loading skeletons instead of spinners
- Hover elevation effects

## 7.6 Core Screens

- Home (URL input + quick actions)
- Download Queue
- Format Picker Panel
- Advanced Settings Drawer
- Playlist Manager
- History Library
- Plugin Manager
- Settings Hub

---

# 8. UX FLOW REQUIREMENTS

## Beginner Flow

1. Paste link
2. Auto-detect best format
3. Click download
4. Done

## Intermediate Flow

1. Paste link
2. Choose quality
3. Choose audio/video/subtitles
4. Download with preview

## Advanced Flow

1. Open advanced panel
2. Modify yt-dlp parameters
3. Save as preset
4. Run batch jobs

---

# 9. PRESET SYSTEM

- Save download configurations
- Shareable config files
- Profiles per use-case:
  - "High Quality Archive"
  - "Mobile Optimized"
  - "Audio Extract Only"
  - "Playlist Bulk Download"

---

# 10. JOB SYSTEM

- Queue-based execution
- Pause/resume/cancel jobs
- Priority queue support
- Background execution mode
- Crash recovery

---

# 11. ERROR HANDLING

- Normalize yt-dlp errors into UI-friendly messages
- Provide fix suggestions
- Retry button per error
- Log viewer panel

---

# 12. PERFORMANCE REQUIREMENTS

- Handle 100+ queued downloads
- No UI freezing during ffmpeg operations
- Lazy load metadata previews
- Virtualized lists for history/queue

---

# 13. SECURITY REQUIREMENTS

- No remote code execution from plugins without sandbox
- Cookie file encryption option
- Safe command escaping for yt-dlp CLI calls
- Disable unsafe shell injection patterns

---

# 14. ACCESSIBILITY

- Keyboard navigation support
- High contrast mode
- Screen reader labels
- Scalable UI (100%–200%)

---

# 15. FFmpeg Integration Requirements

- Auto-detect bundled FFmpeg
- Fallback path detection
- Version compatibility validation
- Codec availability checker UI

---

# 16. CONFIGURATION SYSTEM

- JSON-based config storage
- Hot-reload settings
- Profile switching
- Import/export settings

---

# 17. DEVELOPMENT CHECKLIST

## Core Implementation

- [ ] yt-dlp wrapper engine
- [ ] FFmpeg integration layer
- [ ] Job queue system
- [ ] UI shell (Electron renderer)
- [ ] Settings engine
- [ ] Plugin loader

## UI Implementation

- [ ] Nothing OS design system
- [ ] Drag-and-drop input zone
- [ ] Command palette
- [ ] Queue visualization
- [ ] Advanced settings drawer

## Advanced Features

- [ ] Preset system
- [ ] Metadata viewer
- [ ] Playlist manager
- [ ] Error dashboard
- [ ] Plugin system UI

---

# 18. QUALITY BAR

- Must behave like a polished commercial application
- No terminal exposure required for end users
- Advanced features must never overwhelm beginners
- Every yt-dlp option must be reachable through UI or advanced JSON mode

---

# 19. FINAL PRINCIPLE

This is not just a downloader.

It is a **universal media extraction and processing workstation** wrapped in a clean, modern interface that hides complexity without removing power.

---
