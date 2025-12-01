#!/bin/bash

# CITIA Workers - Deploy All Services to Cloud Run
# This script builds and deploys all 4 microservices

set -e  # Exit on error

PROJECT_ID="citia-prod"
REGION="us-central1"

echo "🚀 Deploying CITIA Workers to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to deploy a worker
deploy_worker() {
  local worker_name=$1
  local worker_dir=$2
  local pubsub_topic=$3
  local service_account=$4

  echo -e "${BLUE}📦 Deploying ${worker_name}...${NC}"

  cd "$worker_dir"

  # Build and deploy to Cloud Run
  gcloud run deploy "citia-${worker_name}" \
    --source=. \
    --region="$REGION" \
    --platform=managed \
    --no-allow-unauthenticated \
    --service-account="$service_account" \
    --set-secrets="OPENAI_API_KEY=chatgpt-api-key:latest" \
    --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,GCP_REGION=$REGION,BIGQUERY_DATASET=citia_ai,BIGQUERY_TABLE_RAW_ANSWERS=ai_raw_answers,BIGQUERY_TABLE_MENTIONS=ai_mentions_normalized,BIGQUERY_TABLE_CITATION_SCORES=citation_share_scores,STORAGE_BUCKET=citia-prod-data,STORAGE_RAW_JSON_PATH=raw-json,STORAGE_DLQ_PATH=dlq" \
    --project="$PROJECT_ID" \
    --quiet

  # Get the service URL
  SERVICE_URL=$(gcloud run services describe "citia-${worker_name}" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)")

  echo -e "${GREEN}✓ Deployed: $SERVICE_URL${NC}"

  # Create Pub/Sub subscription to trigger this service
  SUBSCRIPTION_NAME="${pubsub_topic}-${worker_name}-sub"

  # Check if subscription exists
  if gcloud pubsub subscriptions describe "$SUBSCRIPTION_NAME" \
    --project="$PROJECT_ID" &>/dev/null; then
    echo "  Subscription $SUBSCRIPTION_NAME already exists"
  else
    echo "  Creating Pub/Sub subscription: $SUBSCRIPTION_NAME"

    gcloud pubsub subscriptions create "$SUBSCRIPTION_NAME" \
      --topic="$pubsub_topic" \
      --push-endpoint="$SERVICE_URL" \
      --push-auth-service-account="$service_account" \
      --project="$PROJECT_ID" \
      --quiet
  fi

  cd ..
  echo ""
}

# Deploy all workers
echo -e "${BLUE}Starting deployments...${NC}"
echo ""

# 1. Scraper Worker
deploy_worker \
  "scraper" \
  "scraper" \
  "scraper-results" \
  "citia-ingestion@citia-prod.iam.gserviceaccount.com"

# 2. Normalization Worker
deploy_worker \
  "normalization" \
  "normalization" \
  "scraper-results" \
  "citia-ingestion@citia-prod.iam.gserviceaccount.com"

# 3. Aggregation Worker
deploy_worker \
  "aggregation" \
  "aggregation" \
  "scraper-results" \
  "citia-ingestion@citia-prod.iam.gserviceaccount.com"

# 4. Alerts Worker
deploy_worker \
  "alerts" \
  "alerts" \
  "alert-events" \
  "citia-alerts@citia-prod.iam.gserviceaccount.com"

echo -e "${GREEN}✅ All workers deployed successfully!${NC}"
echo ""
echo "You can view your services at:"
echo "https://console.cloud.google.com/run?project=$PROJECT_ID"
echo ""
echo "To test a worker manually, trigger its Cloud Scheduler job:"
echo "  gcloud scheduler jobs run daily-query-generation --location=$REGION --project=$PROJECT_ID"
