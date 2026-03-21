# My Portfolio

A minimal, dark-themed portfolio site built with [Astro](https://astro.build).  
Hosted free on **Netlify** or **Vercel**.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev
# → opens at http://localhost:4321

# 3. Build for production
npm run build
```

---

## How to Update Each Section

### Add a New Project

Create a new `.md` file in `src/content/projects/`:

```bash
touch src/content/projects/03-my-new-project.md
```

Then fill in the frontmatter:

```md
---
title: "My New Project"
description: "What it does in 1-2 sentences."
tags: ["Python", "ML"]
link: "https://live-demo.com"
github: "https://github.com/you/repo"
order: 3
---

Optional longer description for a detail page.
```

**That's it.** The homepage automatically picks it up.

### Update Your Resume

Edit **one file**: `src/content/resume.ts`

- `personalInfo` — name, tagline, links
- `experience[]` — add/remove/reorder jobs
- `education[]` — add/remove degrees

### Change the Design

- Colors & fonts → `src/styles/global.css` (CSS variables at top)
- Layout → `src/pages/index.astro`
- Nav/footer → `src/layouts/Base.astro`

---

## Deploy for Free

### Option A: Netlify

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy. Done. You get a `yoursite.netlify.app` URL.

### Option B: Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → "New Project" → Import your repo
3. Vercel auto-detects Astro — just click Deploy
4. You get a `yoursite.vercel.app` URL.

### Custom Domain (Optional)

Both Netlify and Vercel let you connect a custom domain for free in their dashboard settings.

---

## File Structure

```
src/
├── content/
│   ├── projects/          ← Drop .md files here to add projects
│   │   ├── 01-project-one.md
│   │   └── 02-project-two.md
│   ├── resume.ts          ← Edit this for experience/education
│   └── config.ts          ← Schema definitions (rarely need to touch)
├── layouts/
│   └── Base.astro         ← Nav + footer wrapper
├── pages/
│   └── index.astro        ← Main page layout
└── styles/
    └── global.css         ← Colors, fonts, shared styles
```
