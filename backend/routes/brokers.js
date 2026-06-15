const express = require('express');
const { getSupabase } = require('../lib/supabase');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/brokers - get all brokers (dispatcher only)
router.get('/', requireRole('dispatcher'), async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name:full_name, email, company:company_name, created_at')
      .eq('role', 'broker')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('[brokers] Supabase query failed:');
      console.error('  message:', error.message);
      console.error('  code:', error.code);
      console.error('  details:', error.details);
      console.error('  hint:', error.hint);
      console.error('  full:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Failed to fetch brokers', detail: error.message });
    }

    console.log(`[brokers] Returned ${data?.length ?? 0} brokers`);
    res.json({ brokers: data || [] });
  } catch (err) {
    console.error('[brokers] Unexpected error:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
