<!--
Sync Impact Report
==================
Version change: (none) → 1.0.0
Modified principles: N/A (initial creation)
Added sections: All (Core Principles, Technology Stack Constraints, Development Workflow, Governance)
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check updated with principle gates
  - .specify/templates/spec-template.md ✅ Aligned with requirements structure
  - .specify/templates/tasks-template.md ✅ Task phases align with testing discipline
  - .specify/templates/commands/*.md ⚠ N/A (commands live in .cursor/commands/)
Follow-up TODOs: None
-->

# FindMyStuff Constitution

## Core Principles

### I. Code Quality

- All code MUST pass ESLint (`npm run lint`) before merge. Direct Supabase client
  imports are permitted only in `lib/`, `app/api/`, `contexts/`, `components/auth/`;
  elsewhere use the API client (`apiClient`).
- Components MUST use functional patterns with TypeScript; prefer interfaces over
  types. Avoid classes and enums; use maps for lookup structures.
- Naming MUST be descriptive with auxiliary verbs (e.g. `isLoading`, `hasError`).
- Files MUST follow structure: exported component first, subcomponents, helpers,
  static content, types. Minimize `use client`, `useEffect`, and `setState`;
  favor React Server Components.

**Rationale**: Consistent, maintainable codebase reduces bugs and onboarding time.

### II. Testing Standards

- Unit tests MUST cover critical business logic; use Jest + Testing Library.
  E2E tests MUST cover main user flows; use Playwright.
- New features MUST include tests where user-facing behavior or critical paths
  are affected. Run `npm run check` (lint + coverage + e2e) before merge.
- Contract-style tests are recommended for API boundaries and shared schemas.
- Coverage thresholds MUST be enforced via `npm run test:coverage:check`.

**Rationale**: Prevents regressions and enables confident refactoring.

### III. User Experience Consistency

- UI MUST follow Shadcn UI, Radix UI, and Tailwind conventions. Mobile-first
  responsive design is mandatory.
- Shared patterns (lists, forms, navigation, entity detail views) MUST remain
  consistent across entity types (rooms, places, containers, items).
- Loading and error states MUST be explicitly handled; avoid blank or undefined
  states. Use Suspense with fallbacks for client components.
- Accessibility: interactive elements MUST be keyboard navigable; semantic HTML
  and ARIA where appropriate.

**Rationale**: Predictable UX reduces cognitive load and support burden.

### IV. Performance Requirements

- Core Web Vitals MUST be optimized: LCP, CLS, FID. Images SHOULD use WebP,
  include size data, and support lazy loading.
- Server-side rendering and Next.js SSR MUST be preferred over client-side
  data fetching where possible. Dynamic loading for non-critical components.
- Database queries SHOULD avoid N+1 patterns; use Supabase RLS and efficient
  indexing. Nuqs used for URL search parameter state to avoid hydration issues.

**Rationale**: Fast, responsive app improves retention and usability on varied devices.

## Technology Stack Constraints

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Shadcn UI.
- **Backend**: Supabase (PostgreSQL, Auth, RLS). Google OAuth 2.0 for authentication.
- **Data flow**: API client for pages and most components; direct Supabase only in
  allowed paths (see Principle I).
- **Testing**: Jest, Playwright, MSW for mocking. Coverage enforced in CI.

## Development Workflow

- Feature work MUST follow the spec-driven flow: specification → plan → tasks →
  implementation. Constitution principles apply to all phases.
- All PRs and reviews MUST verify constitution compliance. Complexity MUST be
  justified and documented when deviating from principles.
- Use `.cursor/rules` and AGENTS.md for runtime development guidance.

## Governance

- This constitution supersedes ad-hoc practices. All contributors and AI agents
  MUST align with these principles.
- Amendments require: documented rationale, team approval, and migration plan
  for existing violations. Version bumps follow semantic versioning:
  - **MAJOR**: Backward-incompatible principle removals or redefinitions.
  - **MINOR**: New principle or material expansion.
  - **PATCH**: Clarifications, typo fixes, non-semantic refinements.
- Compliance reviews SHOULD be part of regular code reviews and sprint planning.

**Version**: 1.0.0 | **Ratified**: 2025-02-21 | **Last Amended**: 2025-02-21
