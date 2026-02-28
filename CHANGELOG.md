# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0](https://github.com/openjobspec/ojs-admin-ui/compare/v0.1.0...v0.2.0) (2026-02-28)


### Features

* add initial project structure ([a2d7f41](https://github.com/openjobspec/ojs-admin-ui/commit/a2d7f410fe91517481fc0ed5c4ae4d564c571b4b))
* add initial project structure ([47f1e8e](https://github.com/openjobspec/ojs-admin-ui/commit/47f1e8e68da10b85bb7d39a1f75b0b0608ca24c1))
* add job detail modal with state transitions ([b3e010a](https://github.com/openjobspec/ojs-admin-ui/commit/b3e010ae41169beb3eeabd1f68fc628f465ac231))
* add real-time job status indicators ([ae9d786](https://github.com/openjobspec/ojs-admin-ui/commit/ae9d7867946baa1be077991806d8218120f2d05f))


### Bug Fixes

* correct pagination offset in job list view ([e91a5cd](https://github.com/openjobspec/ojs-admin-ui/commit/e91a5cd549fa33266c7657f3f7c817c9cd496baf))
* resolve workflow builder drag-drop state in WorkflowBuilder ([cb129a9](https://github.com/openjobspec/ojs-admin-ui/commit/cb129a9088812d33e326f43eff27afdd87b8daba))

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
