const express = require('express');
const jwt = require('jsonwebtoken');
const { getSupabase } = require('../lib/supabase');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const token = jwt.sign(
      {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        company: profile.company_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        company: profile.company_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email, password, name, role, company } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    const allowedRoles = ['dispatcher', 'broker'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Role must be either dispatcher or broker' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: error.message });
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      full_name: name,
      role,
      company_name: company || null,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    const token = jwt.sign(
      { id: data.user.id, email, name, role, company: company || null },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: data.user.id, email, name, role, company: company || null },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
