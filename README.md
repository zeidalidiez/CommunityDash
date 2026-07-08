# CommunityDash

Local-first, free forever daily goal dashboards with visual progress, history charts, and shareable templates. No account. No backend.

**Public web host:** [GitHub Pages](https://pages.github.com/) only (no Vercel / Cloudflare / Netlify plan).

## Features (v1 baseline)

- Create, edit, and track goals with configurable step size
- Values may exceed target (overflow shown in UI)
- Master tally of goals met today
- Daily reset with retained **history charts**
- Single-goal history reuse + **named multi-goal templates**
- Share templates via compressed share codes
- Full JSON backup export/import
- Dark / light / system theme
- Responsive: bottom tabs on phone, sidebar on wide layouts

## Run locally

```bash
npm install
npx expo start
```

- Press `w` for web, or use Android / iOS simulators / Expo Go.
- Lint: `npm run lint`
- Unit tests: `npm test`
- Typecheck: `npx tsc --noEmit`

## Web export (static)

```bash
npm run export:web
```

Output is written to `dist/`. This is the same artifact GitHub Pages deploys.

## GitHub Pages deploy

This repo ships a workflow at `.github/workflows/deploy-pages.yml` that:

1. Installs dependencies
2. Runs `npx expo export --platform web`
3. Uploads `dist/` to GitHub Pages

### One-time repo setup

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to `main` (or run the workflow manually under Actions)
3. Site URL is typically:
   - User/org site: `https://<user>.github.io/`
   - Project site: `https://<user>.github.io/CommunityDash/`

If the app is a **project site** (served under `/CommunityDash/`), set the Expo public base path before export:

```bash
# Windows PowerShell
$env:EXPO_BASE_PATH="/CommunityDash"
npm run export:web
```

Or configure `experiments.baseUrl` / router base in Expo for your fork. Document any path you use in your fork’s README.

User data always stays in the browser (`localStorage` via AsyncStorage). Pages only serves static assets.

## Data & privacy

- Everything is stored on-device / in-browser
- Settings → Export full backup (JSON) for your own safekeeping
- Settings → Erase All App Data wipes dashboards, history, templates, and snapshots
- Donation: [Ko-fi](https://ko-fi.com/zeiddiez) (optional; app stays free)

## Project layout

| Path | Role |
|------|------|
| `app/` | Expo Router screens |
| `store/dashboardStore.ts` | Zustand + persist |
| `utils/dashboardLogic.ts` | Pure domain logic (tested) |
| `utils/templateUtils.ts` | Share code encode/decode |
| `components/` | Cards + SVG visualizations |
| `DESIGNDOC` | Product & design source of truth |

## License / contributing

Open source — see the repository on GitHub. PRs welcome for bugs and scoped v1 polish; see `DESIGNDOC` §13 for explicit post-v1 backlog.
