# OJS Admin UI

Universal admin dashboard for any [Open Job Spec](https://openjobspec.org) conformant backend.

**Works with any OJS backend** — Redis, Postgres, Kafka, SQS, or any custom implementation that exposes the OJS Admin API.

## Features

- 📊 **Dashboard** — Aggregate stats, queue overview, throughput charts
- 📋 **Queues** — List, pause/resume, purge with counts and throughput
- ⚡ **Jobs** — Search, filter, inspect full job detail with error history
- ⚙️ **Workers** — Monitor connected workers, quiet, deregister stale
- ☠️ **Dead Letter** — Browse DLQ, bulk retry, delete, stats by error type
- 🔍 **Settings** — Backend info, conformance level, capabilities, extensions
- 🌙 **Dark mode** — System-aware with manual toggle
- 📡 **Auto-refresh** — Configurable polling interval (default 5s)
- 🧩 **Manifest-driven** — Auto-discovers backend capabilities, hides unsupported features

## Quick Start

### Option 1: Embed in your backend (recommended)

Backends serve the admin UI as static files. The UI makes API calls to the same origin.

```bash
npm install @openjobspec/admin-ui
```

```javascript
import { mountOJSAdmin } from '@openjobspec/admin-ui';

// Mount into a DOM element
const unmount = mountOJSAdmin(document.getElementById('admin'), {
  baseUrl: '',           // same-origin (default)
  basename: '/ojs/admin' // URL prefix for routing
});
```

### Option 2: Standalone development

```bash
git clone https://github.com/openjobspec/ojs-admin-ui
cd ojs-admin-ui
npm install
npm run dev
```

The dev server proxies `/ojs/*` to `http://localhost:8080` — start any OJS backend there.

## Architecture

```
┌─────────────────────────────┐
│ OJS Backend                 │
│                             │
│  GET  /ojs/manifest         │  ← capabilities discovery
│  GET  /ojs/v1/admin/*       │  ← admin API
│  GET  /ojs/admin/           │  ← serves this UI
│                             │
└─────────────────────────────┘
```

The admin UI is a pure SPA (React + Vite + Tailwind). No server component. Backends embed the `dist/` files and serve them at any path.

## API Contract

The UI consumes the [OJS Admin API Specification](../spec/spec/ojs-admin-api.md):

| Endpoint | Used By |
|----------|---------|
| `GET /ojs/manifest` | Settings, feature flags |
| `GET /ojs/v1/admin/stats` | Dashboard |
| `GET /ojs/v1/admin/queues` | Dashboard, Queues |
| `GET /ojs/v1/admin/jobs` | Jobs |
| `GET /ojs/v1/admin/workers` | Workers |
| `GET /ojs/v1/admin/dead-letter` | Dead Letter |
| `POST .../pause`, `resume`, `retry`, `cancel` | Actions |

## Tech Stack

- **React 19** + TypeScript
- **Vite 6** for build tooling
- **Tailwind CSS 3** for styling
- **Recharts** for throughput charts
- **React Router 7** for navigation

Bundle size: ~370KB gzipped.

## License

Apache 2.0
