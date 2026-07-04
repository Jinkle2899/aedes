# Aedes

Website builder prototype: animated marketing site + multi-page app + nested drag-and-drop editor with a predictive insertion system ("Aedes Flow"), backed by Supabase (optional) or localStorage.

## Cloud setup (optional — app runs fully in local mode without it)

1. Create a project at supabase.com (free tier is fine).
2. In the project: **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, Run.
3. **Project Settings → API**: copy the Project URL and the `anon` public key.
4. `cp .env.example .env`, fill both values, restart `npm run dev`.
5. The `/app` dashboard now shows sign-in; accounts + synced sites are live.

Auth note: Supabase enables email confirmation by default. For quick testing you can disable it under **Authentication → Providers → Email → Confirm email**.

---

# Marketing site notes

Modern animated landing page. React + GSAP ScrollTrigger + Lenis. No 3D — pure CSS/JS motion design, name-agnostic branding.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173

## What's inside

- **Hero** — kinetic headline with rotating word, floating glass product cards with mouse parallax (GSAP quickTo) + CSS bob, ambient grid + drifting glow background.
- **Smooth scroll** — Lenis momentum scrolling synced to ScrollTrigger.
- **Scroll choreography** — multi-speed hero exit parallax, feature marquee, scrubbed step reveals with a self-drawing connector line, staggered pricing cards, gallery reveals, footer wordmark.
- **Sections** — hero, feature marquee, how-it-works (animated CSS/SVG icons), pricing comparison (featured card), template gallery (hover interactions), footer CTA.

## Performance & accessibility

- Zero WebGL, tiny JS bundle (React + GSAP + Lenis only).
- Floating cards hidden below 1100px; layout fully responsive.
- `prefers-reduced-motion` → smooth scroll and animations disabled.

## Files

- `src/App.jsx` — page sections + all GSAP/Lenis wiring
- `src/styles.css` — full design system (monochrome, Inter + Instrument Serif)
