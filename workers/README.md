# CITIA Workers - Microservices Architecture

Complete Cloud Run microservices for automated AI search visibility tracking.

---

## 📁 Architecture Overview

```
CITIA Workers
├── scraper/          → Collects AI search results from ChatGPT, Gemini, Perplexity
├── normalization/    → Extracts entity citations from raw responses
├── aggregation/      → Calculates citation share scores and trends
├── alerts/           → Evaluates alert conditions and sends notifications
└── deploy-all.sh     → One-command deployment script
```

### Data Flow

```
Cloud Scheduler
    ↓
Pub/Sub Topics
    ↓
┌─────────────┐       ┌─────────────────┐       ┌────────────────┐       ┌────────────┐
│   Scraper   │  →    │ Normalization   │  →    │  Aggregation   │  →    │   Alerts   │
│   Worker    │       │     Worker      │       │     Worker     │       │   Worker   │
└─────────────┘       └─────────────────┘       └────────────────┘       └────────────┘
      ↓                       ↓                         ↓                       ↓
Cloud Storage           BigQuery              BigQuery              Firestore
(raw JSON)        (mentions table)      (citation scores)        (alert records)
```

---

## 🔧 Workers Detail

### 1. Scraper Worker

**Purpose:** Collects AI search results from multiple platforms

**Triggers:**
- Cloud Scheduler: Every 2 hours
- Pub/Sub topic: `scraper-results`
- Action: `run_scrapers`

**What it does:**
1. Reads active topics from Firestore
2. For each topic, runs query seeds through AI search engines
3. Stores raw JSON responses in Cloud Storage
4. Writes metadata to BigQuery (`ai_raw_answers` table)

**Platforms Supported:**
- ChatGPT (via OpenAI API)
- Gemini (to be added)
- Perplexity (to be added)

**Environment Variables:**
```bash
GCP_PROJECT_ID=citia-prod
OPENAI_API_KEY=sk-proj-...
STORAGE_BUCKET=citia-prod-data
BIGQUERY_DATASET=citia_ai
```

**Service Account:** `citia-ingestion@citia-prod.iam.gserviceaccount.com`

---

### 2. Normalization Worker

**Purpose:** Extracts structured entity citations from raw AI responses

**Triggers:**
- Cloud Scheduler: Daily at 2:00 AM
- Pub/Sub topic: `scraper-results`
- Action: `normalize_data`

**What it does:**
1. Queries raw answers from BigQuery (last 24 hours)
2. Loads entity definitions from Firestore
3. Extracts mentions using regex patterns for:
   - Entity names (e.g., "Asana")
   - Domain mentions (e.g., "asana.com")
   - Synonyms (e.g., "asana app")
4. Calculates mention position in response
5. Writes normalized data to BigQuery (`ai_mentions_normalized` table)

**Mention Extraction:**
- **Exact name matching:** Case-insensitive entity name
- **Domain matching:** URLs and domain references
- **Synonym matching:** Alternative names
- **Position calculation:** Where in response entity appears

**Service Account:** `citia-ingestion@citia-prod.iam.gserviceaccount.com`

---

### 3. Aggregation Worker

**Purpose:** Calculates citation share scores and competitive metrics

**Triggers:**
- Cloud Scheduler: Daily at 3:00 AM
- Pub/Sub topic: `scraper-results`
- Action: `aggregate_citations`

**What it does:**
1. Aggregates mentions by entity, platform, and date
2. Calculates citation share percentage:
   ```
   Citation Share = (Queries with Entity Mention / Total Queries) × 100
   ```
3. Computes additional metrics:
   - Average mention position
   - First-half appearances
   - Week-over-week trends
4. Categorizes scores (dominant/strong/moderate/weak/minimal)
5. Writes to BigQuery (`citation_share_scores` table)

**Metrics Calculated:**
- **Citation Share %**: Percentage of queries mentioning entity
- **Average Position**: Mean position in responses (0-100%)
- **Trend**: Week-over-week change
- **Category**: Performance classification

**Service Account:** `citia-ingestion@citia-prod.iam.gserviceaccount.com`

---

### 4. Alerts Worker

**Purpose:** Monitors metrics and sends notifications

**Triggers:**
- Cloud Scheduler: Every hour
- Pub/Sub topic: `alert-events`
- Action: `evaluate_alerts`

**What it does:**
1. Loads active alert rules from Firestore
2. For each rule, queries relevant metrics from BigQuery
3. Evaluates alert conditions
4. If triggered:
   - Creates alert record in Firestore
   - Sends email notification (via Nodemailer)
   - Sends Slack notification (if configured)

**Alert Types:**
- **Citation Decrease**: Share dropped by X%
- **Citation Increase**: Share increased by X%
- **Threshold Breach**: Share below/above threshold
- **Competitor Mention**: New competitor appeared
- **Answer Change**: Response content changed

**Notification Channels:**
- Email (Gmail SMTP)
- Slack (webhook integration)

**Service Account:** `citia-alerts@citia-prod.iam.gserviceaccount.com`

---

## 🚀 Deployment

### Prerequisites

1. **GCP Setup Complete:**
   - Project created (`citia-prod`)
   - Service accounts created
   - Pub/Sub topics configured
   - BigQuery dataset created
   - Cloud Storage bucket created

2. **Local Requirements:**
   - `gcloud` CLI installed and authenticated
   - Docker installed (for local testing)

### Deploy All Workers

**One-command deployment:**

```bash
cd /Users/brandonlhendricks/Desktop/Citia/workers
./deploy-all.sh
```

This script will:
1. Build Docker images for each worker
2. Deploy to Cloud Run
3. Create Pub/Sub push subscriptions
4. Configure service accounts and permissions

**Deployment takes ~10-15 minutes**

---

### Deploy Individual Worker

To deploy just one worker:

```bash
cd /Users/brandonlhendricks/Desktop/Citia/workers/scraper

# Build and deploy
gcloud run deploy citia-scraper \
  --source=. \
  --region=us-central1 \
  --platform=managed \
  --no-allow-unauthenticated \
  --service-account=citia-ingestion@citia-prod.iam.gserviceaccount.com \
  --set-env-vars="GCP_PROJECT_ID=citia-prod" \
  --project=citia-prod
```

---

## 🧪 Testing

### Test Locally

Run a worker locally with Docker:

```bash
cd scraper

# Build Docker image
docker build -t citia-scraper .

# Run locally
docker run -p 8080:8080 \
  -e GCP_PROJECT_ID=citia-prod \
  -e OPENAI_API_KEY=sk-proj-... \
  citia-scraper

# Test health check
curl http://localhost:8080/health

# Test with Pub/Sub message
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "'$(echo -n '{"action":"run_scrapers"}' | base64)'"
    }
  }'
```

### Test on Cloud Run

Trigger a worker manually:

```bash
# Get the worker URL
SERVICE_URL=$(gcloud run services describe citia-scraper \
  --region=us-central1 \
  --project=citia-prod \
  --format="value(status.url)")

# Send test message
curl -X POST "$SERVICE_URL" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "'$(echo -n '{"action":"run_scrapers"}' | base64)'"
    }
  }'
```

### Trigger via Cloud Scheduler

```bash
# Manually trigger a scheduler job
gcloud scheduler jobs run hourly-scraper-dispatch \
  --location=us-central1 \
  --project=citia-prod

# View logs
gcloud run logs read citia-scraper \
  --region=us-central1 \
  --project=citia-prod \
  --limit=50
```

---

## 📊 Monitoring

### View Logs

```bash
# Scraper logs
gcloud run logs read citia-scraper --region=us-central1 --project=citia-prod

# Normalization logs
gcloud run logs read citia-normalization --region=us-central1 --project=citia-prod

# Aggregation logs
gcloud run logs read citia-aggregation --region=us-central1 --project=citia-prod

# Alerts logs
gcloud run logs read citia-alerts --region=us-central1 --project=citia-prod
```

### Cloud Console

**Cloud Run Services:**
https://console.cloud.google.com/run?project=citia-prod

**Cloud Scheduler Jobs:**
https://console.cloud.google.com/cloudscheduler?project=citia-prod

**Pub/Sub Topics:**
https://console.cloud.google.com/cloudpubsub/topic/list?project=citia-prod

**BigQuery Tables:**
https://console.cloud.google.com/bigquery?project=citia-prod

---

## 💰 Cost Estimate

### Cloud Run Pricing (per worker)

- **CPU:** 1 vCPU
- **Memory:** 512MB
- **Requests:** ~50/day average
- **Cost:** $0-5/month per worker

### Total Infrastructure Cost

| Service | Cost/Month |
|---------|-----------|
| Cloud Run (4 workers) | $10-20 |
| Pub/Sub messages | Free (under 10GB) |
| Cloud Scheduler | $0.50 |
| BigQuery storage | $1-5 |
| Cloud Storage | $1-5 |
| **Total** | **$12-31/month** |

---

## 🔐 Security

### Service Accounts

Each worker runs with least-privilege service accounts:

- **citia-ingestion**: BigQuery write, Firestore read, Storage write
- **citia-alerts**: BigQuery read, Firestore write, Pub/Sub publish

### Secrets Management

API keys stored in Secret Manager:

```bash
# Store OpenAI API key
echo -n "sk-proj-..." | gcloud secrets create openai-api-key \
  --data-file=- \
  --project=citia-prod

# Grant access to service account
gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:citia-ingestion@citia-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=citia-prod
```

### Authentication

All Cloud Run services are private (no-allow-unauthenticated). Only Pub/Sub with valid service account can trigger them.

---

## 🛠️ Troubleshooting

### Worker Not Receiving Messages

**Check Pub/Sub subscription:**
```bash
gcloud pubsub subscriptions describe scraper-results-scraper-sub \
  --project=citia-prod
```

**Check service account permissions:**
```bash
gcloud projects get-iam-policy citia-prod \
  --flatten="bindings[].members" \
  --filter="bindings.members:citia-ingestion@citia-prod.iam.gserviceaccount.com"
```

### Worker Timing Out

**Increase timeout:**
```bash
gcloud run services update citia-scraper \
  --timeout=600 \
  --region=us-central1 \
  --project=citia-prod
```

### BigQuery Quota Exceeded

**Check quota:**
```bash
gcloud monitoring time-series-list \
  --filter='metric.type="bigquery.googleapis.com/quota/query/usage"' \
  --project=citia-prod
```

---

## 📝 Development

### Local Development

1. **Install dependencies:**
   ```bash
   cd scraper
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export GCP_PROJECT_ID=citia-prod
   export OPENAI_API_KEY=sk-proj-...
   ```

3. **Run locally:**
   ```bash
   npm start
   ```

### Add New AI Platform

To add a new scraping platform (e.g., Claude, Bing AI):

1. **Edit `scraper/index.js`:**
   ```javascript
   async function scrapeClaude(query) {
     // Implement Claude API integration
   }
   ```

2. **Update `runScrapers()` function:**
   ```javascript
   // Add Claude to scraping loop
   const claudeResult = await scrapeClaude(query);
   ```

3. **Redeploy:**
   ```bash
   ./deploy-all.sh
   ```

---

## 🎯 Next Steps

### Immediate

1. **Deploy workers:**
   ```bash
   cd /Users/brandonlhendricks/Desktop/Citia/workers
   ./deploy-all.sh
   ```

2. **Test end-to-end:**
   - Trigger scraper manually
   - Verify data in BigQuery
   - Check alert notifications

### Future Enhancements

- [ ] Add Gemini API integration
- [ ] Add Perplexity API integration
- [ ] Implement Slack webhook for alerts
- [ ] Add retry logic with exponential backoff
- [ ] Implement circuit breakers
- [ ] Add Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Add unit tests
- [ ] Add integration tests

---

**Your complete data pipeline is ready to deploy! 🚀**

Run `./deploy-all.sh` to get started.
