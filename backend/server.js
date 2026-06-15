require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const loadsRoutes = require('./routes/loads');
const brokersRoutes = require('./routes/brokers');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/loads', authMiddleware, loadsRoutes);
app.use('/api/brokers', authMiddleware, brokersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
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
