# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Birds iNaturalist PWA - A Progressive Web App for tracking bird observations from the iNaturalist API. Users can view recent observations and species counts by location, save location presets, and maintain personal notes about species.

## User Preferences

**Communication Style**: Keep explanations concise, brief, and straight to the point.

## Workflow Requirements

**After Code Changes**: Always complete these steps after any code modifications:
1. Run `pnpm run format` to format the code
2. Run `pnpm lint` to check for linting issues
3. Run `pnpm build` to verify the build succeeds

## Development Commands

```bash
# Development server
pnpm dev                 # Start dev server
pnpm dev-host           # Start dev server with network access

# Build and preview
pnpm build              # Type check (tsc) + build
pnpm preview            # Preview production build locally
pnpm preview-host       # Preview with network access

# Code quality
pnpm lint               # Run ESLint
pnpm format             # Format code with Prettier
```

**Package manager**: This project uses pnpm (v10.17.0+).

## Architecture

### Application Structure

Three-page SPA with manual page state management (no router):
- **Observations Page** (`src/latest-observations/`) - Recent bird observations from iNaturalist
- **Species Page** (`src/species/`) - Species count aggregates for selected location
- **Locations Page** (`src/locations-page/`) - Manage saved location presets

### State Management

**Global State:**
- `LocationsContext` - Locations list persisted to localStorage via `useStorageState` hook
- `SpeciesInfoContext` - Species information (notes, categories, exclusions) persisted to IndexedDB
- Current location ID persisted separately in localStorage

**Local State:**
- Pages manage their own data fetching and UI state

### Data Layer

**localStorage** (`src/storage.ts`):
- Location presets (`LocationInformation[]`)
- Current location selection
- Managed via `useStorageState` hook with automatic persistence

**IndexedDB** (`src/storage/db.ts`):
- Species information (personal notes, category tags, exclusions, preferred images, similar species)
- Accessed via `SpeciesInfoContext` ([src/SpeciesInfoContext.tsx](src/SpeciesInfoContext.tsx)) using the `useSpeciesInfoContext` hook

**API Integration** (`src/fetchData.ts`, `src/utils.ts`):
- iNaturalist API v2 endpoints for observations and species counts
- PWA service worker caches API responses and images (configured in [vite.config.ts](vite.config.ts))

### Key Technical Details

**Path Alias**: `@` resolves to `src/` (configured in [vite.config.ts](vite.config.ts))

**TypeScript**:
- Use `type` instead of `interface` for type definitions
- Non-null assertion operator (`!`) is disallowed by ESLint rule

**Comments**: Keep comments brief. Prefer descriptive variable/function names over long comments. No `@param` tags - TypeScript types already document parameters.

**i18n**: English/Spanish translations via i18next ([src/i18n.ts](src/i18n.ts), [src/locales/](src/locales/))

**PWA**: Offline support with Workbox caching strategies:
- `NetworkFirst` for API species counts (2-day cache)
- `CacheFirst` for iNaturalist images (2-day cache)

**UI Framework**: Material-UI with custom theme ([src/theme.ts](src/theme.ts))

**Maps**: Leaflet + React-Leaflet for location selection

**Build Tool**: Vite using rolldown-vite variant for faster builds

### Component Organization

Components are co-located with their pages:
- Page-level components in feature directories (`latest-observations/`, `species/`, `locations-page/`)
- Shared components in `src/components/`
- Custom hooks prefixed with `use` (e.g., `useFetchObservations`, `useSpeciesInfoContext`)

### Type Definitions

Core types in [src/types.ts](src/types.ts):
- `LocationInformation` - Location preset structure
- Page-specific types in respective directories (e.g., [src/latest-observations/types.ts](src/latest-observations/types.ts))
- Database types in [src/storage/db.ts](src/storage/db.ts)
