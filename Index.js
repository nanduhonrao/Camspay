const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CAMSPAY_BASE = 'https://www.camspay.com';

app.post('/proxy/*', async (req, res) => {
  const path = req.params[0];
  const targetUrl = `${CAMSPAY_BASE}/${path}`;
  
  try {
    const isFormData = req.headers['content-type']?.includes('urlencoded');
    
    let body;
    if (isFormData) {
      body = new URLSearchParams(req.body).toString();
    } else {
      body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });

    const text = await response.text();
    res.status(response.status).send(text);
      } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${
