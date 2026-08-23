# Professional Portfolio — Aakarsh Kashyap (formal variant)

> Drop this file to give an agent instant full context on this project.
> Workspace: `/home/soulsnix/AI/portfolio/professional/`

---

## What & Why

The **dry-corporate formal portfolio** for Aakarsh Kashyap. Sibling to the
"fun" retro-HTML portfolio at `../portfolio/` (`masterrecord.chaldea.moe`),
this is its **recruiter-safe** counterpart on a dedicated domain. The two
sites cross-link: this site references `https://masterrecord.chaldea.moe/`
as the personal site; the personal site does NOT link back here (HR must
not wander into the chaos).

Deploy target: **`portfolio.aakarsh.in`** (separate domain from the personal
site; declared in `CNAME` for GitHub Pages).

**Voice**: deadpan first-person, maximal-corporate-dry, with dry wit in
prose structure (e.g. "I undertake the work for the pleasure of the work").
See `~/.config/opencode/skills/corporate-speak/SKILL.md` for the full
vocabulary red-list and pattern A–E transformation rules.

**Architecture**: the **moofin pattern** — one DOM, CSS-only attribute-gated
presentation swap via `<html data-theme="…">`. Two presentations:
  - `<html data-theme="latex">` (default) — raw LaTeX-academic paper, plain
    `<div class="latex-card">` borders, thin 1px `<hr>` under section
    headers
  - `<html data-theme="sketch">` — pencil-sketch via **wired-elements**
    (`<wired-card>`, `<wired-divider>`) wrapped around the same content

Orthogonal to that: `<html data-mode="light|dark">` flips the paper colour
independently. See `~/.config/opencode/skills/moofin-pattern/SKILL.md` for
the complete pattern contract.

**Site structure**: multi-page — 4 pages (no `experience` page; folded into
`index` per user's choice).

---

## File Structure

```
professional/
├── index.html             # about (trimmed) + skills + public GPG key + correspondence (logos + contact)
├── projects.html          # 6 project cards (latex/sketch pairs each)
├── blog.html              # blog index — filter-buttons (latex/wired), post list from posts.json
├── resume.html            # "Résumé & Experience" — résumé PDF + GigaVector experience entry
├── latex-sketch.css       # moofin-gated styles; visibility matrix; print; mobile
├── js/
│   └── theme-toggle.js    # applies data-theme/data-mode from URL→localStorage→default;
│                          # flips #theme-chip text; toggles inert+aria-hidden on [data-pair] siblings
├── vendor/
│   └── wired-elements.js  # esbuild-bundled ESM; Lit + RoughJS + 24 wired components, ~100KB minified
├── resume/
│   └── resume.pdf         # canonical résumé PDF (copied from ../portfolio/resume/resume.pdf)
├── favicon.svg            # B&W hex sigil mark (custom Chaldea monogram, 7-stroke stencil)
├── CNAME                  # portfolio.aakarsh.in
├── SKILL.md               # this file
├── posts/
│   └── .gitkeep           # blog post .md files live here (presently empty)
│                          # committed .md → .github/workflows/blog.yml runs build-posts.js
└── .github/
    ├── scripts/
    │   └── build-posts.js # formal-site fork of fun-site build; wraps MD in formal template
    └── workflows/
        └── blog.yml       # GitHub Actions: push to posts/**/*.md → npm install marked@15 → node build-posts.js → commit
```

---

## Tech Stack

| Aspect | Technology |
|---|---|
| Site type | Static HTML, multi-page, no framework |
| Build step | **None** for the site itself; one CI build step for the blog (`marked@15`) |
| HTML | HTML5; `<section>`, `<article>`, `<header>`, `<main>`; no `<marquee>`, no `<table>` layout |
| CSS | `latex-sketch.css` (one file); attribute-gated moofin; hairless `!important` per body rule, only on the visibility matrix |
| JS | Vanilla, oldweb style (`var`, function expressions, no arrow functions, no `import`/`export`) |
| Sketch overlay | `vendor/wired-elements.js` (esbuild-bundled ESM; loaded via `<script type="module">`) |
| Typography | Crimson Text (Google Fonts); Courier New for chips/clock |
| Code highlighting | highlight.js 11.9.0 (cdnjs; github-dark theme) — only blog post pages |
| Favicon | SVG hex-sigil mark (B&W) |
| Deploy | GitHub Pages with custom domain via `CNAME` |

**No** CDNs are consumed at runtime for the site shell — `wired-elements.js`
is vendored locally. The only CDN use is `highlight.js` on blog post pages
(which are CI-built, not hand-maintained).

---

## The Moofin Pattern in this Site

The architecture imposes strict contracts on the CSS, JS, and HTML:

### 1. One canonical DOM, two presentations
Every "card-like" element appears in the DOM **twice**, with identical
content — once as a plain `<div class="latex-card">` (raw-latex view) and
once as a `<wired-card class="sketch-card">` (pencil-sketch view). The
outer wrapper carries `data-pair` so `theme-toggle.js` can find pairs and
propagate `inert` / `aria-hidden` to keep the a11y tree in sync.

```html
<section class="project" id="sauceos" data-pair>
  <div class="latex-card card">          <!-- visible in [data-theme="latex"] -->
    <h3>sauceOS</h3>
    <p>…</p>
  </div>
  <wired-card class="sketch-card card" elevation="2">   <!-- visible in [data-theme="sketch"] -->
    <h3>sauceOS</h3>
    <p>…</p>
  </wired-card>
</section>
```

### 2. CSS visibility matrix
```css
[data-theme="latex"]  .sketch-card { display: none; }
[data-theme="sketch"] .latex-card  { display: none; }
[data-theme="sketch"] wired-card.sketch-card { display: block; }
/* etc for `.latex-only` / `.sketch-only` marker class */
[data-theme="latex"]  .sketch-only { display: none !important; }
[data-theme="sketch"] .latex-only  { display: none !important; }
```

### 3. JS toggle (orthogonal axes)
`js/theme-toggle.js`:
- `data-theme` (`latex` | `sketch`) — flipped via `#theme-chip`
  (`\end{document}` ↔ `\documentclass{article}`); persisted in
  `localStorage['theme']`; overridable via `?theme=latex|sketch` URL param
- `data-mode` (`light` | `dark`) — flipped via `#pagecolor-chip`
  (`\pagecolor{dark}` ↔ `\pagecolor{light}`); persisted in
  `localStorage['mode']`; overridable via `?mode=light|dark` URL param

On every theme toggle, `propagatePairs(theme)` walks every `[data-pair]`
element and toggles `inert` + `aria-hidden` on its `.latex-card` and
`.sketch-card` children so the inactive variant is removed from the a11y
tree (no double-reading by screen readers).

### 4. Section dividers — `<hr>` vs `<wired-divider>`
Under every `<h2>`:
```html
<hr class="latex-only">
<wired-divider class="sketch-only" elevation="2"></wired-divider>
```
The latency theme's CSS gives `<h2>` a thin bottom border (`border-bottom:
1px solid #333`); the sketch theme removes that border so the
`<wired-divider>` is the single visual rule. Pairs cleanly.

---

## Multi-Page Layout

Four pages share the chrome (`latex-sketch.css`, `js/theme-toggle.js`,
`vendor/wired-elements.js`, chips, taskbar, live clock):

| Page | Contains | Anchored to |
|---|---|---|
| `index.html` | masthead, About (trimmed), Skills, Public Key (GPG), Correspondence (logos + contact + cross-link to personal site) | `#about`, `#skills`, `#public-key`, `#correspondence` |
| `projects.html` | masthead, 6 project cards (sauceOS, soft-cuda, sush, Custodian, SlopGen, Chirpy) | `#projects` and each `#<slug>` |
| `blog.html` | masthead, filter-pair (series + tag), post list (fetches `posts.json`, empty initially) | `#blog` |
| `resume.html` | masthead "Résumé & Experience", résumé PDF link, Experience entry (GigaVector) | `#resume-document`, `#experience` |

Every page's taskbar nav: `about · projects · blog · résumé` (lowercase résumé
with `é`). Center tagline: `typeset with Vim and restraint`. Right: live
clock (`#latex-clock`).

The nav popup (left chip `\begin{document}`) lists the 4 pages as
`\ref{about}`, `\ref{projects}`, `\ref{blog}`, `\ref{résumé}`.

---

## Placeholder List (TODOs for the user to fill)

Search for these literals in `index.html`:

| Placeholder | Location | What to replace |
|---|---|---|
| `https://t.me/your-handle` | Telegram `<a href>` in `index.html` | Real Telegram profile URL |
| `t.me/your-handle` | Telegram `<span class="logo-caption">` in `index.html` | Real slug |
| `https://discord.gg/your-server` | Discord `<a href>` in `index.html` | Real Discord server invite |
| `discord.gg/your-server` | Discord `<span class="logo-caption">` in `index.html` | Real slug |
| `XXXX XXXX XXXX XXXX XXXX  XXXX XXXX XXXX XXXX XXXX` | `<pre class="gpg-key placeholder">` in `index.html` | Real 40-hex GPG fingerprint |
| `[ paste your fingerprint here ]` | `<small class="placeholder-note">` after the GPG `<pre>` in `index.html` | Remove once fingerprint is filled |
| `class="logo placeholder"` (×2: Telegram + Discord) | On the two social-logo `<span>`s in `index.html` | Remove the `placeholder` class once the URL is filled |

After filling, also ensure the `placeholder` class is gone so the dashed
CSS outline disappears.

---

## Run / Preview

No build step for site shell. To preview locally:

```bash
cd /home/soulsnix/AI/portfolio/professional/
python3 -m http.server 8000
# → http://localhost:8000/
```

No `package.json`. The only npm dependency is `marked@15` for the blog
build (installed transiently in CI).

### To author a new blog post

1. Write `posts/<slug>.md` with frontmatter (see `posts/.gitkeep` for schema)
2. Push to `main`
3. `.github/workflows/blog.yml` runs `node .github/scripts/build-posts.js`
4. CI commits `posts/<slug>.html`, `posts.json`, `feed.xml` back to `main`
5. GitHub Pages serves the new entry at `portfolio.aakarsh.in/posts/<slug>.html`

Voice contract for blog posts: corporate-dry. See `posts/.gitkeep` and the
`corporate-speak` skill.

### To regenerate `vendor/wired-elements.js` (rarely needed)

```bash
mkdir -p /tmp/wired-bundle && cd /tmp/wired-bundle
npm init -y && npm install --no-fund --no-audit wired-elements@3.0.0-rc.6 esbuild
echo 'import "wired-elements";' > entry.js
./node_modules/.bin/esbuild entry.js --bundle --format=esm --minify \
  --outfile=<repo>/vendor/wired-elements.js
node --check <repo>/vendor/wired-elements.js
```

The bundle registers all wired-* custom elements on import (verified with
jsdom: 24 of 26 components — `wired-calendar` and `wired-progress-ring`
have additional DOM deps but aren't used on this site).

---

## Design Rules (never break these)

- **Monochrome only.** Two fonts (Crimson Text + Courier New), one column
  (max 680px), no gradients, no shadows on content (only on popovers),
  no rounded corners except 2px on chips.
- **Two presentation variants via moofin pattern only.** Never introduce a
  third — see the moofin skill for why >3 is unwieldy.
- **Dark mode is orthogonal to theme.** `data-mode` must never be coupled
  to `data-theme` in JS or CSS. The `\pagecolor{dark}` chip flips light/
  dark only; the `\end{document}` chip flips latex/sketch only.
- **No social media CTAs in prose.** Closing line stays dry: "Available
  for internship and contract work in systems programming, GPU compute,
  and compiler infrastructure. souls.syntax@gmail.com"
- **First-person dry-corporate voice.** No slang, no exclamation, hedging-
  free, numbers 0–9 spelled out, `résumé` with two accents as a noun,
  en dash with spaces in date ranges. Dry wit allowed within prose
  structure: "I undertake the work for the pleasure of the work." OK.
  Memetic "i use arch btw" voice: NOT OK. See `corporate-speak` skill.
- **`var`, function expressions, no arrow functions.** Matches oldweb
  JS convention; also matches `theme-toggle.js`.
- **Rough-notation / hand-rolled sketch overlays are gone.** All sketch
  rendering is via `<wired-card>` and `<wired-divider>` — wired-elements
  web components that draw via RoughJS internally.
- **`<h2>` for section titles, `<h3>` for project titles, `<b>` for inline
  citation labels inside `<li>`.** Same convention as the fun-site latex
  layer.
- **Every "card-like" element is paired** — `<div class="latex-card">` +
  `<wired-card class="sketch-card">` siblings, wrapped by
  `[data-pair]`. `inert` propagates on toggle so the a11y tree
  doesn't double-read content.
- **`<html data-theme="latex" data-mode="light">` is hardcoded in source.**
  This is the anti-FOUC boot — the attribute is present on first paint.
  `theme-toggle.js` may flip it before/after paint; nothing flashes.

---

## Deploy

GitHub Pages with the `CNAME` containing `portfolio.aakarsh.in`.

1. Push the `professional/` directory's contents to its own GitHub repo
   (e.g. `souls-syntax/professional-portfolio`), or push to a subdir of
   the existing `souls-syntax/portfolio` repo with proper subdir-source
   config on GitHub Pages.
2. Set GitHub Pages source to the appropriate branch/dir.
3. DNS for `portfolio.aakarsh.in`:
   - A record → `185.199.108` `.109` `.110` `.111.153` (GitHub Pages IPs), OR
   - CNAME `portfolio.aakarsh.in` → `souls-syntax.github.io`
4. Wait for HTTPS cert auto-provisioning (GitHub Pages handles this).
5. Verify the moofin toggle: visit `?theme=sketch` — should load pencil
   sketches immediately. Visit `?theme=latex` — raw paper. Visit
   `?mode=dark` — dark paper, ink flips.

---

## Cross-reference: the sister fun-site

| Aspect | Formal (`professional/`, here) | Fun (`../portfolio/`) |
|---|---|---|
| Layout | `<main>` + `<section>` single column, 4 pages | `<table>` 3-column, 8 pages |
| Voice | Dry-corporate first-person | Anime-bro first-person |
| Sketch overlay | wired-elements (`<wired-card>`, `<wired-divider>`) | none (CSS only) |
| Theme toggle | latex ↔ sketch (moofin, same DOM) + dark/light | latex ↔ personal (two DOMs) + dark/light |
| Content | 6 projects, GigaVector experience, GPG block, logos, blog (empty) | 6 + projects, blog (2 posts), guestbook, weird/* subpages, Touhou shrine |
| Animations | wired-elements sketch drawings only | Marquee, blinkies, BGM player, visit counter |
| Blog posts | Empty; new corporate-voiced posts authored over time | 2 slangy posts (realLangs_0, tsun_0); not migrated |
| Socials | X · Telegram · GitHub · Discord · masterrecord · email (logos + line) | X · GitHub · LinkedIn (text links only) |
| Type | Crimson Text + Courier New | Crimson Text + system serif (personal layer) |
| Vendored JS | wired-elements.js (~100KB, esbuild-bundled ESM) | none |

The formal site references the fun site as a single `<a>` link in `#about`:
"The personal site is at masterrecord.chaldea.moe." Otherwise no cross-
navigation. HR cannot reach the fun site without typing the URL.

---

## Sanity Checks (run before publishing)

- [ ] `node --check js/theme-toggle.js` passes
- [ ] `node --check .github/scripts/build-posts.js` passes
- [ ] `vendor/wired-elements.js` exists; `node --check` passes
- [ ] All placeholders listed above are either filled or visually flagged
  with the `placeholder` class (dashed outline)
- [ ] No exclamation marks anywhere in prose
- [ ] No "btw", "lol", "yk", "imo", "tbh", "kinda", "nerd", "addict" in
  copy (`rg -i` to confirm)
- [ ] All project names in canonical brand spelling (sauceOS, soft-cuda,
  Custodian, SlopGen, Chirpy)
- [ ] All degree names spelled with periods: "B.Tech", "B.S.", "IIT Madras"
- [ ] "résumé" with two accents as a noun (except inside `resume/resume.pdf`
  path which is a filesystem name)
- [ ] Numbers 0–9 spelled out in prose; percentages as "35-percent"
- [ ] Date ranges use en dash with spaces: "Apr 2026 – present"
- [ ] Print stylesheet hides chrome, keeps annotation SVGs, breaks cards cleanly
- [ ] Mobile (≤600px): chips repositioned; taskbar tagline hidden; logos wrap clean
- [ ] `prefers-reduced-motion: reduce` honoured (no transition)
- [ ] Favicon.svg renders as a B&W hex sigil
- [ ] CNAME contains one line: `portfolio.aakarsh.in`
- [ ] The moofin toggle works: typing `?theme=sketch` in URL bar lands on
  the pencil-sketch view; `?theme=latex` lands on raw paper; localStorage
  persists the choice; the `#theme-chip` text flips between
  `\end{document}` and `\documentclass{article}`
- [ ] Dark/light toggle is orthogonal: `?mode=dark` works in BOTH themes;
  the `\pagecolor` chip text flips but does NOT touch `data-theme`
- [ ] The `inert` attribute propagates: in latex theme, every
  `<wired-card class="sketch-card">` has `inert` + `aria-hidden`; in
  sketch theme, every `<div class="latex-card">` has them. Verify with
  `document.querySelectorAll('[data-pair] [aria-hidden="true"]')` in console.