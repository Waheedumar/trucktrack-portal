require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const loadsRoutes = require('./routes/loads');
const brokersRoutes = require('./routes/brokers');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/loads', authMiddleware, loadsRoutes);
app.use('/api/brokers', authMiddleware, brokersRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/parse-ratecon', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are a rate confirmation parser for a trucking company. Extract structured load data and return ONLY valid JSON with no explanation, no markdown, no backticks:
{"broker":{"name":"","contact_name":null,"email":null,"phone":null,"mc_number":null},"load":{"reference_number":null,"load_type":null,"commodity":null,"weight":null},"pickup":{"company":null,"address":null,"city":"","state":"","zip":null,"date":null,"time":null,"notes":null},"delivery":{"company":null,"address":null,"city":"","state":"","zip":null,"date":null,"time":null,"notes":null},"rate":{"total":0,"per_mile":0,"estimated_miles":0,"currency":"USD","fuel_surcharge":0,"payment_terms":null},"confidence":"high/medium/low","missing_fields":[],"raw_notes":null}
If a field is not found use null. Dates must be YYYY-MM-DD. Rates must be numbers only.`,
      messages: [{ role: 'user', content: `Extract load data from this rate confirmation:\n\n${text}` }]
    });
    const raw = response.content[0].text;
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json(parsed);
  } catch (err) {
    console.error('Rate con parser error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`TruckTrack Portal API running on port ${PORT}`);
  try {
    const { getSupabase } = require('./lib/supabase');
    const supabase = getSupabase();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('[Supabase] Connection check failed:', error.message, error.hint || '');
    } else {
      console.log('[Supabase] Connected successfully');
    }
  } catch (err) {
    console.error('[Supabase] Startup check threw:', err.message);
  }
});