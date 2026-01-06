# Blok.CO Client Reports - Claude Instructions

## Overview
This directory contains client report generation for Blok.co real estate analytics platform.

**Live Reports URL:** https://reports-blok.co/
**Repository:** BLincoln711/blair-realty-report (GitHub Pages)

---

## Color Scheme (MANDATORY)

Always use these exact colors for all Blok.co reports:

| Element | Value |
|---------|-------|
| Header Gradient | `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)` |
| Accent Color | `#00d4ff` (Cyan) |
| Table Headers | `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)` |
| Section Title Bar | `linear-gradient(180deg, #00d4ff 0%, #0f3460 100%)` |
| Insight Box | Light blue gradient with `#0ea5e9` left border |
| Heading Text | `#1a1a2e` |
| Body Text | `#333` |

---

## Report Structure

### Header Requirements
- Blok logo on RIGHT side: `/blok-logo.svg`
- Use flexbox: `display: flex; justify-content: space-between; align-items: center;`
- Include "Powered by Blok.co" badge
- Client logo on LEFT side (if available)

### Tone & Messaging
- **Keep messaging POSITIVE** - avoid negative language about performance
- Focus on opportunities and growth areas
- Use "areas for improvement" instead of "poor performance"
- Highlight wins prominently

### Standard Sections
1. Executive Summary
2. Key Performance Metrics
3. Traffic/Engagement Analysis
4. Competitive Insights
5. Recommendations
6. Next Steps

---

## Client History & Directory

### Blair Realty Group
- **Status:** Active
- **Service:** Total Search & AI Visibility Analytics
- **Started:** October 2025
- **Website:** blairrg.com
- **Market:** Texas real estate (League City, Galveston County area)
- **Contact:** Blair (owner)
- **Directory:** `blair-realty-report/blairrealtygroup-[date-range]/`
- **Reports Generated:**
  - `blairrealtygroup-nov3-9` (Nov 3-9, 2025)
  - `blairrealtygroup-nov10-16` (Nov 10-16, 2025)
  - `blairrealtygroup-nov17-23` (Nov 17-23, 2025)
- **Case Study:** `blair-realty-report/case-study/` - AI Search Visibility case study (3-week program results)
- **Data Sources:** GA4, Search Console, AI search visibility tracking
- **Notes:** First Blok.CO client; pilot program for Total Search methodology

### The Francie Malina Team
- **Status:** Onboarding
- **Service:** Real Estate Analytics & Content
- **Started:** December 2025
- **Website:** franciemalina.com / Compass agent profile
- **Market:** Westchester County, NY luxury real estate
- **Directory:** `FrancieMalinaTeam/`
- **Reports Generated:** None yet (content development phase)
- **Content:** `FrancieMalinaTeam/content/` - Article drafts and content strategy
- **Notes:** High-end luxury market; focus on Scarsdale, Bronxville, Larchmont

---

## Client Onboarding Checklist

When adding a new client:
- [ ] Create client directory in `~/Blok.CO/`
- [ ] Set up report subfolder structure
- [ ] Document client in this CLAUDE.md file
- [ ] Confirm data source access (GA4, Search Console, etc.)
- [ ] Add client logo to assets
- [ ] Set up weekly report schedule
- [ ] Configure GitHub Pages deployment (if separate repo)

---

## Directory Structure

```
Blok.CO/
├── blair-realty-report/          # Main reports repo (GitHub Pages)
│   ├── blairrealtygroup-nov17-23/
│   ├── blairrealtygroup-nov10-16/
│   └── blairrealtygroup-nov3-9/
├── FrancieMalinaTeam/            # Francie Malina reports
│   └── content/
├── blok-agent-dashboard/         # Dashboard application
├── content-articles/             # Content generation
└── Blok.co-BlairRealtyGroup/     # Legacy/archive
```

---

## Report Generation Workflow

### 1. Create New Report
```bash
mkdir -p ~/Blok.CO/blair-realty-report/blairrealtygroup-[date-range]
```

### 2. Generate HTML Report
- Use standard template with Blok color scheme
- Include all required sections
- Add Blok logo and branding

### 3. Deploy to GitHub Pages
```bash
cd ~/Blok.CO/blair-realty-report
git add .
git commit -m "Add [Client] weekly report [date-range]"
git push origin main
```

### 4. Verify Live
- Check https://reports-blok.co/[client-folder]/

---

## HTML Template Snippet

```html
<header style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
               padding: 30px; display: flex; justify-content: space-between; align-items: center;">
    <div>
        <h1 style="color: white; margin: 0;">[Client Name]</h1>
        <p style="color: #00d4ff; margin: 5px 0 0 0;">Weekly Performance Report</p>
    </div>
    <div style="text-align: right;">
        <img src="/blok-logo.svg" alt="Blok.co" style="height: 50px;">
        <p style="color: #00d4ff; font-size: 12px; margin: 5px 0 0 0;">Powered by Blok.co</p>
    </div>
</header>
```

---

## PDF Export (if needed)

Use Chrome headless for HTML to PDF:
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu \
  --print-to-pdf="report.pdf" \
  --no-pdf-header-footer \
  "file:///path/to/report.html"
```

---

## Notes
- Reports are typically weekly (Sunday-Saturday or Monday-Sunday)
- Always verify data accuracy before publishing
- Keep historical reports for trend analysis
