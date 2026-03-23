# Blend — Dating App

Coffee dating platform. No endless swiping, no weeks of chatting. Just coffee at a café we pick.

## Tech Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Firebase (Auth, Firestore, Storage), Vercel
- Framer Motion for animations

## Project Structure
- `/app` — Next.js routes (route groups: `(auth)` and `(app)`)
- `/components` — UI components (`/ui`, `/profiles`, `/match`, `/date`, `/landing`)
- `/lib` — Firebase init, auth helpers, Firestore queries, business logic
- `/hooks` — React hooks (`useAuth`, `useDailyProfiles`, `useMatches`, `useDates`)
- `/types` — TypeScript interfaces (User, Match, DateRecord, Café, etc.)

## Code Conventions
- `"use client"` only when necessary, prefer server components
- Firebase calls live in `/lib/` — never directly in components
- Loading skeletons, not spinners
- All images via `next/image`
- Mobile-first responsive design
- Tailwind v4: design tokens defined in `globals.css` via `@theme inline`, no tailwind.config file
- Fonts: DM Serif Display (headings), DM Sans (body), JetBrains Mono (accents)

## Design System
- Colors: cream (#f0ebe3) backgrounds, ink (#1a1817) text, coral (#ef5043) CTAs, red (#e63928) accent, blue (#8badc4) info
- Whitespace-heavy, warm not cold, editorial minimalism
- Cards: rounded-2xl, shadow-sm, cream/white bg
- Buttons: rounded-full or rounded-xl, generous padding

## Git
- Conventional commits: `feat:`, `fix:`, `style:`, `refactor:`
- Branch per feature: `feat/landing-page`, `feat/daily-profiles`, etc.

@AGENTS.md
