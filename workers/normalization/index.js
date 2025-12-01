const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const { BigQuery } = require('@google-cloud/bigquery');

const app = express();
app.use(express.json());

// Initialize GCP clients
const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
});

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

// Extract entity mentions from text
function extractEntityMentions(text, entities) {
  const mentions = [];

  entities.forEach(entity => {
    const { entityId, entityName, domains, synonyms } = entity;

    // Check for exact name matches
    const nameRegex = new RegExp(`\\b${entityName}\\b`, 'gi');
    const nameMatches = (text.match(nameRegex) || []).length;

    // Check for domain mentions
    let domainMatches = 0;
    (domains || []).forEach(domain => {
      const domainRegex = new RegExp(domain.replace('.', '\\.'), 'gi');
      domainMatches += (text.match(domainRegex) || []).length;
    });

    // Check for synonym mentions
    let synonymMatches = 0;
    (synonyms || []).forEach(synonym => {
      const synonymRegex = new RegExp(`\\b${synonym}\\b`, 'gi');
      synonymMatches += (text.match(synonymRegex) || []).length;
    });

    const totalMentions = nameMatches + domainMatches + synonymMatches;

    if (totalMentions > 0) {
      mentions.push({
        entityId,
        entityName,
        mentionCount: totalMentions,
        mentionTypes: {
          name: nameMatches,
          domain: domainMatches,
          synonym: synonymMatches,
        },
      });
    }
  });

  return mentions;
}

// Calculate mention position/rank in response
function calculateMentionPosition(text, entityName) {
  const index = text.toLowerCase().indexOf(entityName.toLowerCase());
  if (index === -1) return null;

  // Calculate position as percentage of text length
  const position = (index / text.length) * 100;

  return {
    characterIndex: index,
    positionPercentage: position.toFixed(2),
    isInFirstHalf: position < 50,
  };
}

// Normalize raw answers
async function normalizeData() {
  console.log('Starting normalization process...');

  // 1. Get all entities from Firestore
  const entitiesSnapshot = await firestore.collection('entities').get();
  const entities = entitiesSnapshot.docs.map(doc => ({
    entityId: doc.id,
    ...doc.data(),
  }));

  console.log(`Loaded ${entities.length} entities for matching`);

  // 2. Query raw answers from BigQuery (last 24 hours)
  const query = `
    SELECT
      query_id,
      query_text,
      platform,
      response_text,
      timestamp
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_RAW_ANSWERS}\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
    ORDER BY timestamp DESC
  `;

  const [rawAnswers] = await bigquery.query({ query });
  console.log(`Found ${rawAnswers.length} raw answers to process`);

  // 3. Process each answer
  const normalizedMentions = [];

  for (const answer of rawAnswers) {
    const mentions = extractEntityMentions(answer.response_text, entities);

    mentions.forEach(mention => {
      const position = calculateMentionPosition(answer.response_text, mention.entityName);

      normalizedMentions.push({
        mention_id: `${answer.query_id}_${mention.entityId}`,
        query_id: answer.query_id,
        query_text: answer.query_text,
        platform: answer.platform,
        entity_id: mention.entityId,
        entity_name: mention.entityName,
        mention_count: mention.mentionCount,
        mention_position: position?.positionPercentage || null,
        is_in_first_half: position?.isInFirstHalf || false,
        mention_types: JSON.stringify(mention.mentionTypes),
        timestamp: answer.timestamp,
        processed_at: new Date().toISOString(),
      });
    });
  }

  console.log(`Extracted ${normalizedMentions.length} entity mentions`);

  // 4. Write normalized mentions to BigQuery
  if (normalizedMentions.length > 0) {
    const dataset = bigquery.dataset(process.env.BIGQUERY_DATASET);
    const table = dataset.table(process.env.BIGQUERY_TABLE_MENTIONS);

    await table.insert(normalizedMentions);
    console.log(`Inserted ${normalizedMentions.length} normalized mentions`);
  }

  console.log('Normalization completed');
  return normalizedMentions.length;
}

// Pub/Sub message handler
app.post('/', async (req, res) => {
  try {
    const message = req.body.message;
    const data = message?.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : {};

    console.log('Received message:', data);

    if (data.action === 'normalize_data') {
      // Run normalization asynchronously
      normalizeData().catch(error => {
        console.error('Normalization error:', error);
      });

      res.status(200).send('Normalization job started');
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
  console.log(`Normalization worker listening on port ${PORT}`);
});
