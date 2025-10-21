# Client Reports Platform

Automated weekly performance reports hosted at **https://reports-blok.co**

## 🚀 Quick Start - Generate a New Weekly Report

### Step 1: Create Report with Claude Code

Use this prompt:

```
Create a weekly performance report for [CLIENT_NAME] comparing [WEEK1 DATES] vs [WEEK2 DATES].

[Paste or attach your analytics data]

Generate an interactive HTML report and save to:
/Users/brandonlhendricks/claudecode/blair-realty-report/[clientname-monthDD-DD]/index.html
```

### Step 2: Deploy

```bash
cd /Users/brandonlhendricks/claudecode/blair-realty-report
./quick-deploy.sh "clientname-oct20-26" "Client Name" "October 20-26, 2025"
```

### Step 3: Update Index (Optional)

Edit `index.html` to add the new report to the main landing page.

### Step 4: Share

Send client: `https://reports-blok.co/clientname-oct20-26/`

## 📁 Current Reports

- **Blair Realty Group**: `/blairrealtygroup-oct13-19/`

## 📚 Documentation

- **Full Template**: See `WEEKLY_REPORT_TEMPLATE.md` for detailed instructions
- **Customization**: Client-specific preferences and guidelines
- **Troubleshooting**: Common issues and solutions

## 🔧 Technical Setup

- **Hosting**: GitHub Pages
- **Domain**: reports-blok.co (Namecheap)
- **SSL**: Auto-provisioned by GitHub (Let's Encrypt)
- **Repository**: https://github.com/BLincoln711/blair-realty-report

## 📝 File Structure

```
blair-realty-report/
├── index.html                    # Main landing page
├── CNAME                         # Custom domain config
├── README.md                     # This file
├── WEEKLY_REPORT_TEMPLATE.md    # Report generation guide
├── quick-deploy.sh              # Deployment script
└── [clientname-dates]/
    └── index.html               # Individual client report
```

## 🎨 Report Features

- Executive summary with highlights
- Interactive Chart.js visualizations
- Mobile-responsive design
- Professional gradient styling
- Week-over-week comparisons
- Geographic distribution
- Traffic channel analysis
- Competitive intelligence

## 🔐 Privacy

Each client gets a unique URL path. Reports are public URLs but not indexed or linked publicly. Share only the specific URL with each client.

## ⚡ Maintenance

### Update Existing Report
```bash
# Edit the HTML file
nano clientname-oct13-19/index.html

# Deploy changes
git add -A
git commit -m "Update client report"
git push
```

### Check SSL Status
Visit: https://github.com/BLincoln711/blair-realty-report/settings/pages

### Verify DNS
```bash
nslookup reports-blok.co
```
