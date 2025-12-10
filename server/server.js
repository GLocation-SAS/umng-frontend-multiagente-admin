import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --------------------------------------------
// FRONTEND
// --------------------------------------------
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

const homePath = path.join(__dirname, '../src/home');
app.use(express.static(homePath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(homePath, 'index.html'));
});

// --------------------------------------------
// CONFIG AGENTE
// --------------------------------------------
const PROJECT_ID = 'umng-estudiantes-agentes-dev';
const LOCATION = 'global';
const AGENT_ID = '9d6cdfd4-cc92-4bef-a00a-f660e9f72ff1';

// --------------------------------------------
// GOOGLE AUTH (Cloud Run / App Engine)
// --------------------------------------------
async function getAccessToken() {
  const keyFilePath = path.join(
    __dirname,
    '../credentials/service-account.json'
  );

  const auth = new GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

// --------------------------------------------
// ENDPOINT /api/chat
// --------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const text = req.body.text;
    const sessionId = 'session-' + Date.now();

    const url =
      `https://dialogflow.googleapis.com/v3/projects/${PROJECT_ID}` +
      `/locations/${LOCATION}/agents/${AGENT_ID}` +
      `/sessions/${sessionId}:detectIntent`;

    const body = {
      queryInput: {
        text: { text },
        languageCode: 'es',
      },
    };

    const token = await getAccessToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.json({
      reply: data.queryResult?.responseMessages ?? [],
      raw: data,
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error procesando la solicitud' });
  }
});

// --------------------------------------------
// SERVIDOR (Cloud Run usa PORT=8080)
// --------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Servidor iniciado en PUERTO ' + PORT);
});
