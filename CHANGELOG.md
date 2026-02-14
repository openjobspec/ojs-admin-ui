# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-02-14

### Added

- Dashboard with aggregate stats, queue overview, and throughput charts
- Queue management — list, pause/resume with live counts
- Job browser — search, filter by queue/state/type, inspect full detail with error history
- Worker monitoring — view connected workers, quiet running, remove stale
- Dead letter queue — browse, retry, delete, bulk retry, stats by error type
- Settings page — backend info, conformance level, capabilities, extensions, raw manifest
- Dark mode with system-aware default and localStorage persistence
- Auto-refresh polling (configurable interval, default 5s)
- Manifest-driven feature discovery — hides unsupported features automatically
- Embeddable library entry (`mountOJSAdmin`) for backend integration
- Standalone development mode with Vite proxy
- Connection status indicator in header
- URL-driven job filters for shareable links
- Keyboard shortcuts — Escape to close panels
- Error boundary for graceful crash recovery
