const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

// Minimal mock that returns a presigned manifest URL for authorized requests.
app.get('/media/video/:id/:variant/manifest', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // In production: validate token, look up object, generate presigned URLs,
  // optionally rewrite playlist with presigned segment URLs.

  // For demo purposes return a public sample HLS manifest.
  const sampleHls = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  res.json({ url: sampleHls });
});

app.listen(PORT, () => console.log(`Mock server listening on http://localhost:${PORT}`));
