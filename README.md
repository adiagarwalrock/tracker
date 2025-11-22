# OPT/STEM-OPT Unemployment Tracker

![Track US](https://deploy-badge.vercel.app/?url=https://trackus.vercel.app/&name=track-us)

This open-source project helps F‑1 students track unemployment days during post-completion OPT and STEM OPT. The app runs entirely in the browser (Vue 3 + Pinia + Tailwind + Vite) and keeps all data in localStorage so nothing leaves the user’s device.

Goals:

- Provide accurate unemployment calculations for 90-day OPT and 150-day STEM limits.
- Offer a clear timeline view with gap warnings and status summaries.
- Empower others to contribute and extend the tool (multi-language support, exports, notifications).

## Getting Started

```bash
git clone https://github.com/adiagarwalrock/tracker.git
cd tracker
npm install
npm run dev
```

Visit `http://localhost:5173` to start developing.

## Testing & Building

```bash
npm run test     # Vitest + happy-dom
npm run build    # vue-tsc + Vite production build
npm run preview  # Preview the build locally
```

## Deployment

### GitHub Pages

- Configured with a workflow in `.github/workflows/deploy.yml`. Push to `main` and the site builds automatically.

### Vercel

1. Install the Vercel CLI and run `vercel` (or `vercel --prod` for production).
2. The included `vercel.json` sets the build command (`npm run build`) and rewrites everything to `index.html` for SPA routing.
3. Web analytics is wired via `@vercel/analytics` (see `src/main.ts`). Toggle Analytics in the Vercel dashboard to start tracking.

## Contributing

1. Fork and create a branch (e.g., `feature/timeline-accessibility`).
2. Run `npm run dev`, make your changes, and add tests where needed.
3. Run `npm run test && npm run build`.
4. Submit a PR with a short summary and screenshots of UI changes.

Roadmap ideas include PDF export, multi-language support, offline/PWA mode, and additional notifications. Issues and feature requests are welcome.

Scope for future work also includes adding countdown trackers for other immigration or visa-related timelines so the app can serve a broader set of students.

## Notes & Resources

- Educational use only—students should always confirm status with their DSO or international student office.
- Official reference: [USCIS OPT Guidance](https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students).

## License

MIT © [Adi Agarwal](https://github.com/adiagarwalrock)
