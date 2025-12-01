const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const { BigQuery } = require('@google-cloud/bigquery');
const { Storage } = require('@google-cloud/storage');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json());

// Initialize GCP clients
const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
});

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Scraper function for ChatGPT Search
async function scrapeChatGPT(query) {
  try {
    // Use ChatGPT API to get search results
    // Note: This is a placeholder - actual implementation would use
    // ChatGPT's search functionality when available
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a search assistant. Provide comprehensive answers with citations.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 1000,
    });

    return {
      engine: 'ChatGPT',
      query,
      answer: response.choices[0].message.content,
      citations: extractCitations(response.choices[0].message.content),
      timestamp: new Date().toISOString(),
      metadata: {
        model: response.model,
        usage: response.usage,
      },
    };
  } catch (error) {
    console.error('ChatGPT scraping error:', error);
    return null;
  }
}

// Extract citations from text (simple regex-based extraction)
function extractCitations(text) {
  const citations = [];

  // Look for URLs in the text
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];

  // Look for domain mentions
  const domainRegex = /\b[a-z0-9-]+\.(com|ai|io|co|net|org)\b/gi;
  const domains = text.match(domainRegex) || [];

  // Look for company/product names (would be enhanced with entity recognition)
  const nameRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const names = text.match(nameRegex) || [];

  return {
    urls: [...new Set(urls)],
    domains: [...new Set(domains)],
    mentions: [...new Set(names)],
  };
}

// Store raw result in Cloud Storage
async function storeRawResult(result) {
  const bucket = storage.bucket(process.env.STORAGE_BUCKET);
  const filename = `${process.env.STORAGE_RAW_JSON_PATH}/${result.engine.toLowerCase()}/${Date.now()}_${result.query.replace(/\s+/g, '_')}.json`;
  const file = bucket.file(filename);

  await file.save(JSON.stringify(result, null, 2), {
    contentType: 'application/json',
    metadata: {
      engine: result.engine,
      query: result.query,
      timestamp: result.timestamp,
    },
  });

  return `gs://${process.env.STORAGE_BUCKET}/${filename}`;
}

// Write metadata to BigQuery
async function writeToBigQuery(result, storageUri) {
  const dataset = bigquery.dataset(process.env.BIGQUERY_DATASET);
  const table = dataset.table(process.env.BIGQUERY_TABLE_RAW_ANSWERS);

  const row = {
    query_id: `${result.engine}_${Date.now()}`,
    query_text: result.query,
    platform: result.engine,
    response_text: result.answer,
    response_json: result,
    model_version: result.metadata?.model || 'unknown',
    timestamp: result.timestamp,
    scrape_id: storageUri,
    metadata: {
      storage_uri: storageUri,
      ...result.metadata,
    },
  };

  try {
    await table.insert([row]);
    console.log('Inserted row into BigQuery:', row.query_id);
  } catch (error) {
    console.error('BigQuery insert error:', error);
    // Store in DLQ (dead letter queue)
    const dlqBucket = storage.bucket(process.env.STORAGE_BUCKET);
    const dlqFile = dlqBucket.file(`${process.env.STORAGE_DLQ_PATH}/${Date.now()}.json`);
    await dlqFile.save(JSON.stringify({ row, error: error.message }));
  }
}

// Main scraper handler
async function runScrapers() {
  console.log('Starting scraper run...');

  // 1. Get active topics from Firestore
  const topicsSnapshot = await firestore.collection('topics').get();
  const topics = topicsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(`Found ${topics.length} topics to process`);

  // 2. For each topic, run queries
  for (const topic of topics) {
    const queries = topic.querySeeds || [];
    console.log(`Processing topic: ${topic.topicName} with ${queries.length} queries`);

    for (const query of queries) {
      console.log(`Scraping query: "${query}"`);

      // Scrape ChatGPT (would add Gemini, Perplexity here)
      const result = await scrapeChatGPT(query);

      if (result) {
        // Store in Cloud Storage
        const storageUri = await storeRawResult(result);
        console.log(`Stored result: ${storageUri}`);

        // Write metadata to BigQuery
        await writeToBigQuery(result, storageUri);
      }

      // Rate limiting - wait 2 seconds between queries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('Scraper run completed');
}

// Pub/Sub message handler
app.post('/', async (req, res) => {
  try {
    // Pub/Sub sends messages in this format
    const message = req.body.message;
    const data = message?.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : {};

    console.log('Received message:', data);

    if (data.action === 'run_scrapers') {
      // Run scrapers asynchronously
      runScrapers().catch(error => {
        console.error('Scraper error:', error);
      });

      // Acknowledge immediately
      res.status(200).send('Scraper job started');
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
  console.log(`Scraper worker listening on port ${PORT}`);
});
