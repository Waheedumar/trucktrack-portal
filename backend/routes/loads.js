const express = require('express');
const { getSupabase } = require('../lib/supabase');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

function generateLoadNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TT-${date}-${rand}`;
}

const LOAD_SELECT = `
  *,
  broker:profiles!loads_broker_id_fkey(id, name:full_name, email, company:company_name)
`;

const LOAD_DETAIL_SELECT = `
  *,
  broker:profiles!loads_broker_id_fkey(id, name:full_name, email, company:company_name),
  load_updates(id, message, created_at, created_by, author:profiles!load_updates_created_by_fkey(id, name:full_name, role)),
  documents(id, name:file_name, url:file_url, uploaded_by, created_at, uploader:profiles!documents_uploaded_by_fkey(id, name:full_name))
`;

// GET /api/loads
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { role, id: userId } = req.user;

    let query = supabase
      .from('loads')
      .select(LOAD_SELECT)
      .order('created_at', { ascending: false });

    if (role === 'broker') {
      query = query.eq('broker_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[loads GET /] Supabase error:', error.message, error.hint);
      return res.status(500).json({ error: 'Failed to fetch loads', detail: error.message });
    }

    // Normalize: map driver_name → carrier for frontend compatibility
    const loads = (data || []).map(normalizeLoad);
    res.json({ loads });
  } catch (err) {
    console.error('[loads GET /] Unexpected error:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// POST /api/loads
router.post('/', requireRole('dispatcher'), async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      broker_id, origin, destination, pickup_date,
      delivery_date, commodity, weight, rate,
      carrier, truck_number, notes,
    } = req.body;

    if (!origin || !destination || !pickup_date) {
      return res.status(400).json({ error: 'origin, destination, and pickup_date are required' });
    }

    const insertPayload = {
      dispatcher_id: req.user.id,
      broker_id: broker_id || null,
      origin,
      destination,
      pickup_date,
      delivery_date: delivery_date || null,
      commodity: commodity || null,
      weight: weight || null,
      rate: rate || null,
      carrier: carrier || null,
      notes: notes || null,
    };
    console.log('[loads POST /] Inserting payload:', JSON.stringify(insertPayload));

    const { data, error } = await supabase
      .from('loads')
      .insert(insertPayload)
      .select(LOAD_SELECT)
      .single();

    if (error) {
      console.error('[loads POST /] Supabase insert failed:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Failed to create load', detail: error.message });
    }

    res.status(201).json({ load: normalizeLoad(data) });
  } catch (err) {
    console.error('[loads POST /] Unexpected error:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// PUT /api/loads/:id
router.put('/:id', requireRole('dispatcher'), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const {
      status, carrier, rate,
      pickup_date, delivery_date, origin, destination,
      commodity, weight, notes,
    } = req.body;

    const allowedStatuses = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (carrier !== undefined) updates.carrier = carrier;
    if (rate !== undefined) updates.rate = rate;
    if (pickup_date !== undefined) updates.pickup_date = pickup_date;
    if (delivery_date !== undefined) updates.delivery_date = delivery_date;
    if (origin !== undefined) updates.origin = origin;
    if (destination !== undefined) updates.destination = destination;
    if (commodity !== undefined) updates.commodity = commodity;
    if (weight !== undefined) updates.weight = weight;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('loads')
      .update(updates)
      .eq('id', id)
      .select(LOAD_SELECT)
      .single();

    if (error) {
      console.error('[loads PUT /:id] Supabase error:', error.message, error.hint);
      return res.status(500).json({ error: 'Failed to update load', detail: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({ load: normalizeLoad(data) });
  } catch (err) {
    console.error('[loads PUT /:id] Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// GET /api/loads/:id
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const { data: load, error } = await supabase
      .from('loads')
      .select(LOAD_DETAIL_SELECT)
      .eq('id', id)
      .single();

    if (error || !load) {
      console.error('[loads GET /:id] Supabase error:', error?.message);
      return res.status(404).json({ error: 'Load not found' });
    }

    if (role === 'broker' && load.broker_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ load: normalizeLoad(load) });
  } catch (err) {
    console.error('[loads GET /:id] Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// POST /api/loads/:id/updates
router.post('/:id/updates', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { message } = req.body;
    const { role, id: userId } = req.user;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const { data: load, error: loadError } = await supabase
      .from('loads').select('id, broker_id').eq('id', id).single();

    if (loadError || !load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    if (role === 'broker' && load.broker_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('load_updates')
      .insert({ load_id: id, message: message.trim(), updated_by: userId })
      .select('id, message, status, location, created_at, created_by:updated_by, author:profiles!load_updates_updated_by_fkey(id, name:full_name, role)')
      .single();

    if (error) {
      console.error('[loads POST /:id/updates] Supabase error:', error.message, error.hint);
      return res.status(500).json({ error: 'Failed to add update', detail: error.message });
    }

    res.status(201).json({ update: data });
  } catch (err) {
    console.error('[loads POST /:id/updates] Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// POST /api/loads/:id/documents
router.post('/:id/documents', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { name, url } = req.body;
    const { role, id: userId } = req.user;

    if (!name || !url) {
      return res.status(400).json({ error: 'Document name and URL are required' });
    }

    const { data: load, error: loadError } = await supabase
      .from('loads').select('id, broker_id').eq('id', id).single();

    if (loadError || !load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    if (role === 'broker' && load.broker_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({ load_id: id, file_name: name, file_url: url, uploaded_by: userId })
      .select('id, name:file_name, url:file_url, created_at, uploaded_by, uploader:profiles!documents_uploaded_by_fkey(id, name:full_name)')
      .single();

    if (error) {
      console.error('[loads POST /:id/documents] Supabase error:', error.message, error.hint);
      return res.status(500).json({ error: 'Failed to add document', detail: error.message });
    }

    res.status(201).json({ document: data });
  } catch (err) {
    console.error('[loads POST /:id/documents] Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// Normalise nested documents key for frontend compatibility
function normalizeLoad(load) {
  if (!load) return load;
  return {
    ...load,
    load_documents: load.documents,
  };
}

module.exports = router;
