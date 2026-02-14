# Contributing to OJS Admin UI

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/openjobspec/ojs-admin-ui
cd ojs-admin-ui
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` and proxies `/ojs/*` to `http://localhost:8080`. Start any OJS-conformant backend on port 8080 to develop against real data.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build library package (dist/) |
| `npm run build:app` | Build standalone app (dist-app/) |
| `npm run lint` | Run TypeScript type checking |
| `npm run typecheck` | Alias for lint |
| `npm test` | Run Vitest test suite |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
  api/          # API client, types, manifest utilities
  components/   # React components organized by feature
    common/     # Shared components (Pagination, StatusBadge, etc.)
    dashboard/  # Dashboard-specific components
    dead-letter/
    jobs/
    queues/
    shell/      # Layout, Header, Sidebar
    workers/
  hooks/        # Custom React hooks
  lib/          # Utility functions (formatting, colors)
  pages/        # Page-level components (one per route)
  main.tsx      # Standalone app entry
  mount.tsx     # Library entry (mountOJSAdmin)
```

## Making Changes

1. **Fork** the repository and create a feature branch from `main`
2. **Write code** following existing patterns and conventions
3. **Add tests** for new functionality — especially for utilities and API client logic
4. **Run checks** before submitting: `npm run lint && npm test && npm run build`
5. **Submit a PR** with a clear description of what changed and why

## Code Style

- **TypeScript** — strict mode enabled; avoid `any`
- **React** — functional components with hooks
- **Tailwind CSS** — use utility classes; extend the theme for OJS-specific colors in `tailwind.config.ts`
- **Naming** — PascalCase for components, camelCase for functions/variables, kebab-case for file directories
- **Comments** — only where logic is non-obvious

## Reporting Issues

- Use GitHub Issues with the provided templates
- Include browser, OS, and OJS backend implementation if relevant
- For bugs, include steps to reproduce

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
