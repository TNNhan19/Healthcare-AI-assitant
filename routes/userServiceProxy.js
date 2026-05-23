const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const USER_SERVICE_BASE = process.env.USER_SERVICE_URL || 'http://localhost:5003';

function buildHeaders(req) {
  const headers = {};
  // forward JSON when body exists
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
  return headers;
}

async function forward(req, res, path, methodOverride) {
  try {
    const method = methodOverride || req.method;
    const url = `${USER_SERVICE_BASE}${path}${Object.keys(req.query || {}).length ? `?${new URLSearchParams(req.query).toString()}` : ''}`;
    const headers = buildHeaders(req);
    const body = ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : req.body && (headers['Content-Type']?.includes('application/json') ? JSON.stringify(req.body) : req.body);
    const resp = await fetch(url, { method, headers, body });
    const ct = resp.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await resp.json() : await resp.text();
    res.status(resp.status).send(data);
  } catch (err) {
    console.error('user-service proxy error:', err);
    res.status(500).json({ success: false, message: 'User service proxy error', error: err.message });
  }
}

// Map auth
router.post('/auth/register', (req, res) => forward(req, res, '/api/v1/auth/register'));
router.post('/auth/login', (req, res) => forward(req, res, '/api/v1/auth/login'));

// Map users (admin)
router.get('/users', (req, res) => forward(req, res, '/api/v1/users', 'GET'));
router.patch('/users/:id', (req, res) => forward(req, res, `/api/v1/users/${req.params.id}`, 'PATCH'));

module.exports = router;
