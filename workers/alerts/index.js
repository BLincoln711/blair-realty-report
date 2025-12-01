const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const { BigQuery } = require('@google-cloud/bigquery');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// Initialize GCP clients
const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
});

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

// Email configuration (using Gmail SMTP for demo)
// Only create transporter if credentials are provided
let emailTransporter = null;
if (process.env.ALERT_EMAIL_USER && process.env.ALERT_EMAIL_PASSWORD) {
  try {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ALERT_EMAIL_USER,
        pass: process.env.ALERT_EMAIL_PASSWORD,
      },
    });
    console.log('Email transporter configured');
  } catch (error) {
    console.error('Failed to create email transporter:', error);
  }
} else {
  console.log('Email credentials not provided - alerts will be logged only');
}

// Alert types
const ALERT_TYPES = {
  ANSWER_CHANGE: 'answer_change',
  COMPETITOR_MENTION: 'competitor_mention',
  CITATION_INCREASE: 'citation_increase',
  CITATION_DECREASE: 'citation_decrease',
  THRESHOLD_BREACH: 'threshold_breach',
};

// Evaluate alert rules
async function evaluateAlerts() {
  console.log('Starting alert evaluation...');

  // 1. Get active alert rules from Firestore
  const alertsSnapshot = await firestore
    .collection('alerts')
    .where('active', '==', true)
    .get();

  if (alertsSnapshot.empty) {
    console.log('No active alert rules found');
    return 0;
  }

  const alertRules = alertsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(`Evaluating ${alertRules.length} alert rules`);

  let triggeredAlerts = 0;

  // 2. For each alert rule, check conditions
  for (const rule of alertRules) {
    try {
      const shouldTrigger = await evaluateAlertRule(rule);

      if (shouldTrigger) {
        await triggerAlert(rule, shouldTrigger.data);
        triggeredAlerts++;
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
    }
  }

  console.log(`Triggered ${triggeredAlerts} alerts`);
  return triggeredAlerts;
}

// Evaluate individual alert rule
async function evaluateAlertRule(rule) {
  const { type, condition } = rule;

  switch (type) {
    case ALERT_TYPES.CITATION_DECREASE:
      return await checkCitationDecrease(condition);

    case ALERT_TYPES.CITATION_INCREASE:
      return await checkCitationIncrease(condition);

    case ALERT_TYPES.THRESHOLD_BREACH:
      return await checkThresholdBreach(condition);

    case ALERT_TYPES.COMPETITOR_MENTION:
      return await checkCompetitorMention(condition);

    case ALERT_TYPES.ANSWER_CHANGE:
      return await checkAnswerChange(condition);

    default:
      console.warn(`Unknown alert type: ${type}`);
      return false;
  }
}

// Check for citation decrease
async function checkCitationDecrease(condition) {
  const { entity_id, threshold_percentage = 10 } = condition;

  const query = `
    WITH recent_scores AS (
      SELECT
        entity_id,
        entity_name,
        AVG(share_score) as current_score
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_CITATION_SCORES}\`
      WHERE entity_id = @entity_id
        AND time_period >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
      GROUP BY entity_id, entity_name
    ),
    previous_scores AS (
      SELECT
        entity_id,
        AVG(share_score) as previous_score
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_CITATION_SCORES}\`
      WHERE entity_id = @entity_id
        AND time_period >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
        AND time_period < DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
      GROUP BY entity_id
    )
    SELECT
      rs.entity_id,
      rs.entity_name,
      rs.current_score,
      ps.previous_score,
      ROUND(((rs.current_score - ps.previous_score) / ps.previous_score) * 100, 2) as percent_change
    FROM recent_scores rs
    JOIN previous_scores ps ON rs.entity_id = ps.entity_id
    WHERE ((rs.current_score - ps.previous_score) / ps.previous_score) * 100 < -@threshold
  `;

  const [results] = await bigquery.query({
    query,
    params: { entity_id, threshold: threshold_percentage },
  });

  if (results.length > 0) {
    return {
      triggered: true,
      data: results[0],
    };
  }

  return false;
}

// Check for citation increase
async function checkCitationIncrease(condition) {
  const { entity_id, threshold_percentage = 20 } = condition;

  const query = `
    WITH recent_scores AS (
      SELECT
        entity_id,
        entity_name,
        AVG(share_score) as current_score
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_CITATION_SCORES}\`
      WHERE entity_id = @entity_id
        AND time_period >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
      GROUP BY entity_id, entity_name
    ),
    previous_scores AS (
      SELECT
        entity_id,
        AVG(share_score) as previous_score
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_CITATION_SCORES}\`
      WHERE entity_id = @entity_id
        AND time_period >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
        AND time_period < DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
      GROUP BY entity_id
    )
    SELECT
      rs.entity_id,
      rs.entity_name,
      rs.current_score,
      ps.previous_score,
      ROUND(((rs.current_score - ps.previous_score) / ps.previous_score) * 100, 2) as percent_change
    FROM recent_scores rs
    JOIN previous_scores ps ON rs.entity_id = ps.entity_id
    WHERE ((rs.current_score - ps.previous_score) / ps.previous_score) * 100 > @threshold
  `;

  const [results] = await bigquery.query({
    query,
    params: { entity_id, threshold: threshold_percentage },
  });

  if (results.length > 0) {
    return {
      triggered: true,
      data: results[0],
    };
  }

  return false;
}

// Check threshold breach
async function checkThresholdBreach(condition) {
  const { entity_id, threshold_value, operator = 'less_than' } = condition;

  const operatorMap = {
    less_than: '<',
    greater_than: '>',
    equals: '=',
  };

  const query = `
    SELECT
      entity_id,
      entity_name,
      AVG(share_score) as current_score
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_CITATION_SCORES}\`
    WHERE entity_id = @entity_id
      AND time_period >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
    GROUP BY entity_id, entity_name
    HAVING AVG(share_score) ${operatorMap[operator] || '<'} @threshold
  `;

  const [results] = await bigquery.query({
    query,
    params: { entity_id, threshold: threshold_value },
  });

  if (results.length > 0) {
    return {
      triggered: true,
      data: results[0],
    };
  }

  return false;
}

// Check for competitor mentions
async function checkCompetitorMention(condition) {
  // Simplified - would need more complex logic in production
  return false;
}

// Check for answer changes
async function checkAnswerChange(condition) {
  // Simplified - would need to compare historical answers
  return false;
}

// Trigger alert (send notification)
async function triggerAlert(rule, data) {
  console.log(`Triggering alert: ${rule.name}`);

  // Create alert message
  const message = formatAlertMessage(rule, data);

  // Store alert in Firestore
  await firestore.collection('alerts').add({
    type: rule.type,
    severity: rule.severity || 'medium',
    message,
    data: JSON.stringify(data),
    rule_id: rule.id,
    createdAt: new Date().toISOString(),
  });

  // Send email notification
  if (rule.channels?.includes('email')) {
    await sendEmailAlert(rule, message);
  }

  // Send Slack notification (if configured)
  if (rule.channels?.includes('slack')) {
    await sendSlackAlert(rule, message);
  }

  console.log(`Alert triggered and sent via ${rule.channels?.join(', ') || 'none'}`);
}

// Format alert message
function formatAlertMessage(rule, data) {
  const { type } = rule;

  switch (type) {
    case ALERT_TYPES.CITATION_DECREASE:
      return `Citation share for ${data.entity_name} decreased by ${Math.abs(data.percent_change)}% (from ${data.previous_score}% to ${data.current_score}%)`;

    case ALERT_TYPES.CITATION_INCREASE:
      return `Citation share for ${data.entity_name} increased by ${data.percent_change}% (from ${data.previous_score}% to ${data.current_score}%)`;

    case ALERT_TYPES.THRESHOLD_BREACH:
      return `Citation share for ${data.entity_name} is ${data.current_score}% (threshold: ${rule.condition.threshold_value}%)`;

    default:
      return `Alert triggered for rule: ${rule.name}`;
  }
}

// Send email alert
async function sendEmailAlert(rule, message) {
  if (!emailTransporter) {
    console.log('Email alert (not configured):', message);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.ALERT_EMAIL_USER,
      to: rule.email_recipients || process.env.ALERT_EMAIL_DEFAULT_RECIPIENT,
      subject: `CITIA Alert: ${rule.name}`,
      html: `
        <h2>CITIA Alert Notification</h2>
        <p><strong>Rule:</strong> ${rule.name}</p>
        <p><strong>Severity:</strong> ${rule.severity || 'medium'}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><small>Triggered at: ${new Date().toISOString()}</small></p>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('Email alert sent successfully');
  } catch (error) {
    console.error('Email alert error:', error);
  }
}

// Send Slack alert (placeholder)
async function sendSlackAlert(rule, message) {
  // Would integrate with Slack webhook here
  console.log('Slack alert (not configured):', message);
}

// Pub/Sub message handler
app.post('/', async (req, res) => {
  try {
    const message = req.body.message;
    const data = message?.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : {};

    console.log('Received message:', data);

    if (data.action === 'evaluate_alerts') {
      // Run alert evaluation asynchronously
      evaluateAlerts().catch(error => {
        console.error('Alert evaluation error:', error);
      });

      res.status(200).send('Alert evaluation started');
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
  console.log(`Alerts worker listening on port ${PORT}`);
});
