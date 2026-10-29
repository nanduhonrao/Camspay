const express = require('express');
const https = require('https');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CAMSPAY_HOST = 'www.camspay.com';

app.post('/proxy/*', (req, res) => {
  const path = req.params[0];
  const isFormData = (req.headers['content-type'] || '').includes('urlencoded');

  let body;
  if (isFormData) {
    body = new URLSearchParams(req.body).toString();
  } else {
    body = JSON.stringify(req.body);
  }

  const options = {
    hostname: CAMSPAY_HOST,
    path: '/' + path,
    method: 'POST',
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Accept': 'application/json',
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  proxyReq.write(body);
  proxyReq.end();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Returns this server's outbound IP (as seen by an external service)
app.get('/ip', (req, res) => {
  const options = {
    hostname: 'api.ipify.org',
    path: '/?format=json',
    method: 'GET',
  };
  const ipReq = https.request(options, (ipRes) => {
    let data = '';
    ipRes.on('data', (chunk) => { data += chunk; });
    ipRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch(e) {
        res.json({ ip: data.trim() });
      }
    });
  });
  ipReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
  ipReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));
