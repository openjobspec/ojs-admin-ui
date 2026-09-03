# OJS Admin UI — Clean-Code / SRP + Quality Audit

Branch: `refactor/clean-code-srp` · Scope: `ojs-admin-ui` only (independent repo).
Constraints honoured: public component/package APIs, backend routes/wire, embed API
(`mountOJSAdmin`), config/env keys, package identity and the data-dense operational
visual language are all preserved. No dependency upgrades, no visual redesign, no
format sweep. Guardrail against over-extraction applied (no thin forwarding units).

Guidelines applied: Vercel Web Interface Guidelines (a11y, focus, forms, motion,
content, performance, navigation, theming, i18n) and Vercel React performance guidance
(stable hooks/deps, derive-in-render, no fetch waterfalls, functional updates).

## Highest-leverage fixes (top 5)

1. **F1 — Restore a green baseline.** Unused `verifying` state fails `tsc`
   (`noUnusedLocals`), so `npm run lint` — and therefore CI — is red before any other
   work. Surfacing it to `ReceiptCard` fixes the gate *and* restores the intended
   "verifying in progress" UX.
2. **F9 — Real-time metrics stale closure.** `connectSSE` calls `startPolling` without
   depending on it; after SSE reconnect attempts exhaust, the fallback runs a stale
   closure. Extracting the pure metric math to a tested `lib/metrics.ts` and breaking
   the hook cycle with a ref fixes correctness and makes the math unit-testable.
3. **F4/F6 — Safe asynchronous destructive actions.** Dead-letter deletion is confirmed,
   cannot be dismissed in flight, reports failures inline, retains its target for retry,
   and only closes/audits/refreshes after a successful response.
4. **F3/F5/F6/F8 — Native keyboard & focus semantics.** Job rows remain native table
   rows with a real details button; dialogs own topmost Escape handling and focus
   restoration; the shell also exposes a skip link and labelled navigation.
5. **F2 — Test-suite worker-timeout hardening.** Global `jsdom` env + real
   `setInterval`/`EventSource` hooks make added component/hook tests hang worker
   teardown. Per-file environment scoping + fake timers + guaranteed unmount let the new
   tests run fast and clean without weakening assertions.

## Findings

| ID | Sev | Area | Location | Finding | Fix | Test | Status |
|----|-----|------|----------|---------|-----|------|--------|
| F1 | P0 | baseline/build | `components/audit/AuditExplorer.tsx:14` | `verifying` state set but never read → `tsc noUnusedLocals` error → `npm run lint`/CI red | Pass `verifying` to `ReceiptCard` (additive optional prop) to show progress + disable button | `ReceiptCard.test.tsx` | ✅ |
| F2 | P0 | baseline/test | `vitest.config.ts`, `hooks/*` | Global `jsdom` + real timers/`EventSource` risk worker teardown timeouts once component/hook tests exist | Per-file `@vitest-environment`, `testTimeout`, fake timers + `unmount()` in new tests | all new suites | ✅ |
| F3 | P1 | a11y/semantics | `components/jobs/JobTable.tsx` | Making `<tr>` a button breaks native table semantics and creates a partial ARIA grid | Keep native rows/cells; add a labelled, focus-visible **View details** button with a 40px target | `JobTable.test.tsx` + browser AX tree/Enter flow | ✅ |
| F4 | P1 | safety | `components/dead-letter/DeadLetterList.tsx` | Delete closed and audited even when the request failed | Retain target and propagate failure to the modal; close/audit/refresh only after success; guard unmount | `DeadLetterList.test.tsx` + failed-delete browser retry | ✅ |
| F5 | P1 | a11y/focus | dialog/drawer components | Document-level Escape skips focused form controls and can close multiple nested dialogs | Move Escape into `useFocusTrap`; topmost dialog owns it; restore trigger focus; migrate all active dialogs | `useFocusTrap.test.tsx`, `JobDetail.test.tsx` + browser input Escape | ✅ |
| F6 | P1 | async UX | `components/common/ConfirmModal.tsx` | Async confirmation can be dismissed and rejected promises escape without recoverable UI | Own pending/error state; disable fieldset/actions; block Escape/backdrop/Cancel; accessible busy copy and retryable `role=alert` | `ConfirmModal.test.tsx` + pending browser flow | ✅ |
| F7 | P1 | motion/theming | `index.css` | No `prefers-reduced-motion`; no `color-scheme` for native controls/scrollbars | Reduced-motion media query disables animations; `color-scheme: light`/`dark` | `reduced-motion.test` (css asserted via build) | ✅ |
| F8 | P1 | a11y/nav | `components/shell/Layout.tsx`, `Sidebar.tsx` | No skip-to-content link; `<main>` had no id; nav landmark unlabeled | Add skip link + `<main id>`; `aria-label` on nav; decorative icons `aria-hidden` | `Layout.test.tsx` | ✅ |
| F9 | P1 | correctness | `hooks/useRealtimeMetrics.ts:287` | `connectSSE` omits `startPolling` from deps → stale-closure fallback after reconnect exhaustion | Extract pure math to `lib/metrics.ts`; hold `startPolling` in a ref | `metrics.test.ts` | ✅ |
| F10 | P2 | a11y/forms | `components/jobs/JobFilters.tsx` | Selects and type input lack accessible labels | `aria-label` on each control; `htmlFor` on visible labels elsewhere | `JobFilters.test.tsx` | ✅ |
| F11 | P2 | dead-code | `pages/AuditLogPage.tsx:23` | `addAuditEntry` exported but never called — bulk ops don't record audit entries | Wire bulk retry/cancel + DLQ ops to `addAuditEntry` (restores intended feature) | `DeadLetterList.test.tsx` | ✅ |
| F12 | P1 | concurrency | `hooks/usePolling.ts` | Interval and manual refresh use independent requests, allowing overlap, stale commits, and post-unmount updates | One generation/AbortController path for mount, interval, refresh, and fetcher changes; latest generation exclusively owns data/error/loading | deterministic deferred-promise `usePolling.test.tsx` | ✅ |
| F13 | P1 | packaging/types | `package.json`, `dist/` | Package advertises `dist/index.d.ts` but the library build did not emit declarations | Add declaration build entry/config and include it in `npm run build` | packed runtime + TypeScript consumer smoke | ✅ |

## Ordered implementation sequence

1. F2 — vitest env/timeout hardening + test helpers (unblocks safe component tests).
2. F1 — baseline unused-var fix (restore green `tsc`/lint).
3. F9 — extract `lib/metrics.ts` (pure, tested) + ref fix in `useRealtimeMetrics`.
4. F12 — shared polling request generation, abort, and stale-result fencing.
5. F3, F10 — native JobTable semantics/details action + JobFilters labels.
6. F5, F6 — scoped topmost Escape/focus restore + resilient async ConfirmModal.
7. F4, F11 — success-only dead-letter close/audit/refresh + audit-log wiring.
8. F8, F7 — Layout skip link/landmarks + reduced-motion/color-scheme CSS.
9. Gates: typecheck, lint, test+coverage, lib + app builds, package smoke, browser QA.

## Out of scope (explicitly not changed)

- **Backend/API contract**: `OJSAdminClient` routes, query params, and wire shapes are
  unchanged — the UI must stay compatible with any OJS-conformant backend.
- **Embed API**: `mountOJSAdmin(el, { baseUrl, basename })` signature and the single-file
  library artifact shape are unchanged.
- **Visual language / Tailwind tokens**: no restyle, no spacing/color redesign, no
  Prettier/format sweep.
- **Dependencies**: no upgrades/pins; `npm audit` transitive advisories are not in scope
  for this refactor pass.
- **Public component props**: existing prop contracts preserved; only additive optional
  props introduced (`ReceiptCard.verifying`, `ConfirmModal.confirmingLabel`).

## Deferred (recommended, higher risk / larger effort)

- **Route-based code splitting & lazy heavy deps** (`recharts`, `@xyflow/react`):
  meaningful initial-bundle win for the standalone app, but `React.lazy` changes the
  library build into multiple async chunks, which risks the single-file **embed
  contract**. Needs a build-mode-aware strategy — deferred.
- **Full i18n framework**: `formatNumber`/`timeAgo` are English-only. Introducing
  `Intl.RelativeTimeFormat`/`Intl.NumberFormat` would change rendered strings and break
  snapshot expectations; warrants its own change with locale plumbing. Date display
  already uses `toLocaleString()`.
- **Table virtualization**: all tables are pagination-bounded (25–50 rows), so
  `content-visibility`/windowing is not yet load-bearing; revisit if page sizes grow.
- **`useRealtimeMetrics` full decomposition**: connection orchestration remains one hook
  by design (over-extraction guardrail); only the pure math was extracted.
- **CTN attestation verification** (`AttestAuditPage`): Labs placeholder awaiting
  `ojs-ctn` P2 backend; left as-is.

## Blockers

- None. Runtime browser QA used a disposable local mock backend because no live OJS
  backend was provisioned.

## Validation

Canonical gates (Node 22 locally; CI matrix Node 20 & 22):

| Gate | Command | Result |
|------|---------|--------|
| Typecheck + ESLint | `npm run lint` | ✅ 0 errors, 0 warnings (baseline: 1 error + 3 warnings) |
| Targeted independent-review regressions | `npm test -- --run src/hooks/usePolling.test.tsx src/hooks/useFocusTrap.test.tsx src/components/common/ConfirmModal.test.tsx src/components/dead-letter/DeadLetterList.test.tsx src/components/jobs/JobTable.test.tsx src/components/jobs/JobDetail.test.tsx` | ✅ 28 passed / 6 files |
| Unit tests + coverage | `npm test -- --coverage` | ✅ 137 passed / 17 files; 70.48% statements, 61.35% branches, 65.27% functions, 72.22% lines |
| Library build | `npm run build` | ✅ `dist/index.{js,css,d.ts}` plus referenced declarations |
| Standalone app build | `npm run build:app` | ✅ `dist-app/` |
| Package smoke | `npm pack --dry-run --json` | ✅ tarball includes `dist/index.d.ts` |
| Packed runtime/types smoke | Pack to disposable local `node_modules`, compile strict TS consumer, import built ESM | ✅ public types resolve; runtime exports `mountOJSAdmin`, `OJSAdminClient` |
| Available Node matrix | Node 18.20.8, 20.20.2, 22.23.1, 22.23.2, 24.4.1: `npm run lint:types && npm test && npm run build` | ✅ 137 tests + typecheck + library build on every version |

Tests added: 61 (ReceiptCard, metrics, usePolling, useRealtimeMetrics, useFocusTrap,
ConfirmModal, JobTable, JobFilters, JobDetail, DeadLetterList, auditLog, Layout, Header).

Browser QA (agent-browser core + dogfood workflows; Vite app + disposable mock OJS backend):

- **Polling** — Dashboard **Completed** changed `6 → 7` after one 5-second poll. ✅
- **Focused-input Escape** — opened maintenance confirmation, focused/filled **Reason**,
  pressed Escape; dialog closed and focus returned to **Enable Maintenance**. ✅
- **Pending nondismissal** — started delayed maintenance confirmation, pressed Escape,
  clicked backdrop; dialog remained `aria-busy=true`, input/select matched `:disabled`,
  Cancel and **Enabling…** had `disabled=true`; it closed only after success. ✅
- **Failed delete retry** — first DELETE returned 503; dialog stayed open with
  `role=alert` “QA delete failed”, audit count remained 0; retry succeeded, closed the
  dialog, and created exactly one `dead_letter.delete` audit entry. ✅
- **Table semantics/keyboard** — AX tree exposed `table → row → cell` and seven
  `columnheader`s, with one labelled button “View details for email.send job …”;
  keyboard Enter opened the details dialog, Escape closed it, and focus returned to the
  same details button. ✅
- **Console** — 0 application errors. The bootstrap method used to bypass Vite's `/ojs`
  API proxy emitted only expected React Router basename warnings before the test route
  was installed.

## Additional observations (not changed)

- **Mobile sidebar**: the fixed `w-56` sidebar does not collapse below ~640px, so content
  is cramped on phones. Adding a responsive drawer is a redesign of the data-dense shell —
  deferred to respect the "no gratuitous redesign" constraint.
