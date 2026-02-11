# CodeBuddy Documentation Site Roadmap

## Goal
Establish a world-class, developer-centric documentation hub for CodeBuddy, featuring an "OpenAI-style" minimalist aesthetic, hosted on GitHub Pages.

## Tech Stack
- **Framework:** [Nextra](https://nextra.site/) (Next.js + MDX).
  - *Why:* Clean, "Vercel-style" design out-of-the-box, React-based (consistent with CodeBuddy), excellent performance, and built-in full-text search.
- **Styling:** Tailwind CSS.
- **Hosting:** GitHub Pages.
- **Package Manager:** npm.

## Phase 1: Infrastructure & Scaffolding (Immediate)
1.  **Initialize Project:** Create a `website/` directory in the repo root.
2.  **Install Dependencies:** `next`, `react`, `react-dom`, `nextra`.
3.  **Configuration:** Set up `next.config.js` and `theme.config.jsx`.
4.  **Structure:**
    - `website/pages/index.mdx` (Landing Page)
    - `website/pages/docs/` (Documentation Root)
    - `website/pages/blog/` (Blog Root)

## Phase 2: Content Migration
1.  **Architecture Docs:** Move existing `docs/*.md` files (e.g., `KNOWLEDGE_GRAPH_IMPLEMENTATION.md`) into `website/pages/docs/architecture/`.
2.  **Getting Started:** Create `website/pages/docs/getting-started.mdx` derived from `README.md`.
3.  **Blog Setup:** Initialize the blog section for "OpenAI-style" announcements.

## Phase 3: CI/CD & Deployment
1.  **GitHub Actions:** Create `.github/workflows/deploy-site.yml`.
2.  **Build Script:** Configure static export (`output: 'export'` in Next.js).
3.  **Domain:** Configure `codebuddy.github.io` (or custom domain).

## Phase 4: Branding & Polish
1.  **Typography:** Configure Inter/SF Pro fonts.
2.  **Theming:** Customize colors to match CodeBuddy's dark/light theme preferences.
3.  **Interactive Elements:** Add "Copy Code" buttons and syntax highlighting (built-in to Nextra).

## Next Steps
- [ ] Initialize `website/` directory with Nextra template.
- [ ] Migrate first batch of markdown files.
