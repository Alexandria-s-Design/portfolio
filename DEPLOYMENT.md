# alexandriasdesign.com — Deployment Notes

Everything you need to ship `~/alexandrias-design-redesign/mockup/` to `www.alexandriasdesign.com`. The redesign mockup is now the canonical site; the old single-page `alexandrias-design-site/index.html` retires when this is live.

---

## 1. File inventory

| File | Purpose | Status |
|---|---|---|
| `index.html` | Front page (hero, imagine, dark impact strip, audience boxes, demo, dark past-performance, capabilities, tiers, interaction levels, beyond-courses, dark closing) | ✅ Done |
| `government.html` | Federal lane — capabilities PDF prominent, multi-year subcontractor framing, NAICS table, set-aside detail | ✅ Done |
| `corporate.html` | Biotech / healthcare / enterprise — case cards, pricing tiers, AI for Biotech cohort, T-T-T / audit / thought-partner cards | ✅ Done |
| `education.html` | K-12 / higher ed — CTE Curriculum, Learning Games & SBIR Support, TRPEC (founded by Dr. William Gideon), Higher Ed cards; dark research strip; teacher PD CTA | ✅ Done |
| `academy.html` | Academy out-of-the-box catalog (existing, content intact) | ✅ Done |
| `about-room.html` | **The Doc Martin Studio Room** — 3D-style interactive scene; TV video console, research shelf, work-table theory hotspot, doorway-with-password-gate; founder bios with portraits | ✅ Done |
| `about.html` | Stub → auto-redirects to `about-room.html` (defensive — old links don't dead-end) | ✅ Done |
| `contact.html` | Real Formspree-backed form, dual contact cards (Charles primary, Marie secondary), capabilities PDF download | ✅ Done |
| `capabilities.pdf` | Downloadable PDF (217 KB) — current version from `alexandria-s-design.github.io/capability-statement/` | ✅ Done |
| `style.css` | Shared styles + new dark-section / boxy-audience modifiers | ✅ Done |
| `motion.js` | GSAP scroll reveals, headline word stagger | ✅ Existing |
| `inspiration/` | 30 Unsplash reference JPGs for the studio-room palette | ✅ Done |
| `videos-encoded/` | Web-optimized video assets: Microsoft, 2GIG, CAAASA, Wear-the-Crown, CCC MEDCoE secure walkthrough, Dr. Cortés gated avatar walkthrough, and TV idle GIF | ✅ Done |
| `research/` | Downloadable Dr. Cortés article drafts for the gated research and portfolio sections | ✅ Done |
| `ACADEMY-ROUTING-WORKFLOW.md` | UI/UX doc for routing consumer vs. business buyers from `academy.html` into Moodle | ✅ Done |

---

## 2. Three swap-before-launch values

These are placeholders in the code. They need to be set to real values before `www.alexandriasdesign.com` goes live.

### A. Formspree form ID — `contact.html`

```html
<form action="https://formspree.io/f/REPLACE_FORM_ID" method="POST">
```

1. Create a Formspree form at https://formspree.io/forms (free tier = 50 submissions/month, paid for more).
2. Set the destination email to `cmartin@alexandriasdesign.com` (primary) + bcc `mmartin@alexandriasdesign.com`.
3. Copy the form ID (looks like `xpwzgjby`).
4. Replace `REPLACE_FORM_ID` in `contact.html` line ~144.

> Alternative: use Resend or a VPS-hosted endpoint instead of Formspree. Same form fields, just point `action=` at your endpoint.

### B. Video hosting

Two options:

**Option 1 — Self-host on Hostinger VPS** (recommended; matches the "we control everything" decision Marie made earlier):

```bash
# From this folder:
scp -i ~/.ssh/id_ed25519 -r videos-encoded/ root@31.97.215.108:/var/www/files/videos/
# Then in Traefik/nginx, route files.alexandriasdesign.com → /var/www/files/
# Update DNS: A record `files.alexandriasdesign.com` → 31.97.215.108
```

Then change `about-room.html`:
```js
file: 'https://files.alexandriasdesign.com/videos/ch01-tiny-healer.mp4'
```
Update each channel's `file` field to the hosted URL, or keep the current `videos-encoded/` relative paths if the videos deploy with the site.

**Option 2 — Bundle with the site** if your host has enough storage (340 MB). Just deploy the `videos-encoded/` folder with the rest. No URL changes needed.

### C. Portfolio password — `about-room.html` line ~604

Current: `Welcome2020` (hash `31a455f1…b57f2`).

To rotate:
```bash
node -e "console.log(require('crypto').createHash('sha256').update('NewPassword').digest('hex'))"
```

Replace the hash in `ACCEPTED_HASHES`. To add a **magic-link token** for a high-priority lead, generate a hash the same way and **add** it (don't replace). The token goes in the URL: `https://www.alexandriasdesign.com/about-room.html?key=THEIR_TOKEN`.

---

## 3. Where to host the site itself

Options ranked by setup effort:

1. **Hostinger VPS (you already own it).** Add a vhost / Traefik route for `www.alexandriasdesign.com` → `/var/www/alexandriasdesign/`. Upload the whole `mockup/` folder. Renew the wildcard cert. Best long-term because videos + site share the same box.
2. **Cloudflare Pages / Netlify / Vercel** (static deploy, free tier). Drag-and-drop the `mockup/` folder. Videos likely need a separate VPS host or CDN (340 MB exceeds free-tier file limits on Cloudflare Pages and Netlify).
3. **GitHub Pages** (free, simple). Same caveat as #2 — videos go on VPS.

DNS is currently with GoDaddy (per Hostinger account memory). Point the root `alexandriasdesign.com` A record at whichever host wins.

---

## 4. Sitemap / IA after deployment

```
www.alexandriasdesign.com/                     → index.html
  ├─ /government.html
  ├─ /corporate.html
  ├─ /education.html
  ├─ /academy.html
  ├─ /about-room.html       (canonical "About")
  │    ├─ ?key=TOKEN        (magic-link auto-unlock for portfolio)
  ├─ /about.html            → 301 redirects to /about-room.html
  ├─ /contact.html
  ├─ /capabilities.pdf      (direct download)
  └─ /videos-encoded/*.mp4  (TV channel sources — move to files. subdomain when scaled)
```

---

## 5. Test plan before flipping DNS

Open each page in a browser (file://) and verify:

- [ ] `index.html` — hero animates; dark impact strip reads; audience boxes hover-lift; dark Past Performance grid renders; capabilities PDF button downloads the right file; tiers section; closing dark CTA links work.
- [ ] `government.html` — capabilities PDF downloads near top; gold cred badges render; perf cards hover; NAICS table reads cleanly; closing dark CTA works.
- [ ] `corporate.html` — case cards render dark with gold accents; 3 pricing tiers (middle featured/navy); AI Biotech cohort block; 3 "beyond" cards; closing dark CTA.
- [ ] `education.html` — 4 product cards (CTE Curriculum, Learning Games & SBIR Support, TRPEC → `rightpathed.com/services`, Higher Ed); dark research strip; closing.
- [ ] `academy.html` — existing catalog intact.
- [ ] `about-room.html` — 4 hotspots pulse; TV modal opens with the intentional channel order; idle GIF appears before a channel is selected; research lives on the bookshelf hotspot; theory lives on the work-table hotspot; doorway gate rejects bad password, accepts `Welcome2020`, and routes to `portfolio.html`; founder portraits load.
- [ ] `contact.html` — form fields focus correctly; submitting (before Formspree ID is set) will 404, that's expected until ID is wired.
- [ ] All footers show WOSB / SDB / 508 / SAM.gov creds.
- [ ] All nav links lead to the right page; "About" lands on `about-room.html`.
- [ ] `localStorage.removeItem('ad-portfolio-unlocked')` resets the gate for retesting.

Run Playwright once everything's live to catch the things eyes miss.

---

## 6. Two things you (Marie) own before launch

1. **Sign off on the Formspree destination email** (cmartin@ or info@).
2. **Decide the videos-encoded hosting path** (Option 1 VPS vs Option 2 bundled). If VPS, I'll need the green light to scp + set up the Traefik route; if bundled, no extra work.

---

## 7. Retiring the old single-page site

When `www.alexandriasdesign.com` points at this redesign:

- Archive `~/alexandrias-design-site/index.html` (don't delete — it's the only complete record of the old narrative copy, useful for reference).
- The live banner that currently points to `about-room.html` will Just Work as long as `about-room.html` is at the site root.

Nothing else from the old site is load-bearing.
