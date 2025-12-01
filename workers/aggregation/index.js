const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');

const app = express();
app.use(express.json());

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

// Calculate citation share scores
async function aggregateCitations() {
  console.log('Starting citation aggregation...');

  // Query to calculate citation share by entity and platform
  const query = `
    WITH mention_counts AS (
      SELECT
        platform,
        entity_id,
        entity_name,
        DATE(timestamp) as date,
        COUNT(DISTINCT query_id) as total_queries_mentioned,
        SUM(mention_count) as total_mentions,
        AVG(CAST(mention_position AS FLOAT64)) as avg_position,
        SUM(CASE WHEN is_in_first_half THEN 1 ELSE 0 END) as first_half_mentions
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_MENTIONS}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAYS)
      GROUP BY platform, entity_id, entity_name, date
    ),
    total_queries AS (
      SELECT
        platform,
        DATE(timestamp) as date,
        COUNT(DISTINCT query_id) as total_platform_queries
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_RAW_ANSWERS}\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAYS)
      GROUP BY platform, date
    )
    SELECT
      mc.platform,
      mc.entity_id,
      mc.entity_name,
      mc.date,
      mc.total_queries_mentioned,
      mc.total_mentions,
      mc.avg_position,
      mc.first_half_mentions,
      tq.total_platform_queries,
      ROUND((mc.total_queries_mentioned / tq.total_platform_queries) * 100, 2) as citation_share_percentage,
      CURRENT_TIMESTAMP() as calculated_at
    FROM mention_counts mc
    JOIN total_queries tq
      ON mc.platform = tq.platform
      AND mc.date = tq.date
    ORDER BY mc.date DESC, citation_share_percentage DESC
  `;

  const [results] = await bigquery.query({ query });
  console.log(`Calculated ${results.length} citation share scores`);

  // Write to citation_share_scores table
  if (results.length > 0) {
    const dataset = bigquery.dataset(process.env.BIGQUERY_DATASET);
    const table = dataset.table(process.env.BIGQUERY_TABLE_CITATION_SCORES);

    const rows = results.map(row => ({
      platform: row.platform,
      entity_id: row.entity_id,
      entity_name: row.entity_name,
      time_period: row.date.value,
      total_mentions: row.total_mentions,
      unique_queries: row.total_queries_mentioned,
      avg_position: parseFloat(row.avg_position?.toFixed(2) || 0),
      share_score: parseFloat(row.citation_share_percentage || 0),
      category: categorizeScore(row.citation_share_percentage),
      calculated_at: row.calculated_at.value,
    }));

    await table.insert(rows);
    console.log(`Inserted ${rows.length} citation scores`);
  }

  // Calculate trends (week-over-week change)
  await calculateTrends();

  console.log('Citation aggregation completed');
  return results.length;
}

// Categorize citation share score
function categorizeScore(score) {
  if (score >= 75) return 'dominant';
  if (score >= 50) return 'strong';
  if (score >= 25) return 'moderate';
  if (score >= 10) return 'weak';
  return 'minimal';
}

// Calculate week-over-week trends
async function calculateTrends() {
  console.log('Calculating trends...');

  const trendQuery = `
    WITH current_week AS (
      SELECT
        platform,
        entity_id,
        AVG(share_score) as current_score
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_CITATION_SCORES}\`
      WHERE time_period >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      GROUP BY platform, entity_id
    ),
    previous_week AS (
      SELECT
        platform,
        entity_id,
        AVG(share_score) as previous_score
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_CITATION_SCORES}\`
      WHERE time_period >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
        AND time_period < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      GROUP BY platform, entity_id
    )
    SELECT
      cw.platform,
      cw.entity_id,
      cw.current_score,
      pw.previous_score,
      ROUND(cw.current_score - pw.previous_score, 2) as score_change,
      ROUND(((cw.current_score - pw.previous_score) / pw.previous_score) * 100, 2) as percent_change
    FROM current_week cw
    LEFT JOIN previous_week pw
      ON cw.platform = pw.platform
      AND cw.entity_id = pw.entity_id
    WHERE pw.previous_score IS NOT NULL
  `;

  const [trends] = await bigquery.query({ query: trendQuery });
  console.log(`Calculated ${trends.length} trend metrics`);

  return trends;
}

// Pub/Sub message handler
app.post('/', async (req, res) => {
  try {
    const message = req.body.message;
    const data = message?.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : {};

    console.log('Received message:', data);

    if (data.action === 'aggregate_citations') {
      // Run aggregation asynchronously
      aggregateCitations().catch(error => {
        console.error('Aggregation error:', error);
      });

      res.status(200).send('Aggregation job started');
    } else {
      res.status(400).send('Invalid action');
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).send('Internal error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Aggregation worker listening on port ${PORT}`);
});
