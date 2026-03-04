import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { createEndpoint, getEndpoint, cleanupExpiredEndpoints } from './db';

const app = new Hono();

app.use('*', cors());

// Run cleanup periodically on the server (every 24 hours)
setInterval(() => {
  cleanupExpiredEndpoints();
}, 1000 * 60 * 60 * 24); 

/**
 * Generates a deterministic 10-character lowercase hash based on input data.
 */
async function generateDeterministicHash(data: string): Promise<string> {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(data);
  const hashHex = hasher.digest("hex");
  return hashHex.substring(0, 10).toLowerCase();
}

app.post('/api/create', async (c) => {
  try {
    const body = await c.req.json();
    let { method, response_code, response_body, response_type } = body;
    
    if (!method || !response_code || response_body === undefined || !response_type) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // 1. Decode and Normalize Body
    let decoded: string;
    try {
      decoded = atob(response_body);
    } catch (e) {
      return c.json({ error: 'Invalid base64 encoding for response_body' }, 400);
    }

    let normalizedBody = decoded;
    if (response_type === 'JSON') {
      try {
        // Minify JSON
        normalizedBody = JSON.stringify(JSON.parse(decoded));
      } catch (e) {
        return c.json({ error: 'Invalid JSON content' }, 400);
      }
    } else {
      // Trim whitespace for other types
      normalizedBody = decoded.trim();
    }

    // Re-encode normalized body to base64 for storage
    const finalResponseBody = btoa(normalizedBody);

    const upperMethod = method.toUpperCase();
    const statusCode = Number(response_code);
    
    // 2. Create a unique string for hashing using the normalized body
    const uniqueString = `${upperMethod}|${response_type}|${statusCode}|${finalResponseBody}`;
    const hash = await generateDeterministicHash(uniqueString);
    
    // 3. Check if it already exists
    const existing = getEndpoint(hash);
    if (existing) {
      const url = new URL(c.req.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      return c.json({
        message: 'Endpoint already exists',
        hash,
        url: `${baseUrl}/api/${hash}`,
        existing: true
      });
    }
    
    createEndpoint({
      hash,
      method: upperMethod,
      response_code: statusCode,
      response_body: finalResponseBody,
      response_type
    });
    
    const url = new URL(c.req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    return c.json({
      message: 'Endpoint created successfully',
      hash,
      url: `${baseUrl}/api/${hash}`
    });
  } catch (error: any) {
    console.error('Failed to create endpoint:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

app.all('/api/:hash', async (c) => {
  const hash = c.req.param('hash').toLowerCase();
  const reqMethod = c.req.method.toUpperCase();
  
  const endpoint = getEndpoint(hash);
  
  if (!endpoint) {
    return c.json({ error: 'Endpoint not found or expired' }, 404);
  }
  
  if (endpoint.method !== 'ANY' && endpoint.method !== reqMethod) {
    return c.json({ error: 'Method not allowed for this endpoint' }, 405);
  }
  
  let headers = new Headers();
  switch (endpoint.response_type) {
    case 'JSON':
      headers.set('Content-Type', 'application/json');
      break;
    case 'XML':
      headers.set('Content-Type', 'application/xml');
      break;
    case 'Plain Text':
    default:
      headers.set('Content-Type', 'text/plain');
      break;
  }
  
  let decodedBody: Uint8Array;
  try {
    const binaryString = atob(endpoint.response_body);
    decodedBody = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      decodedBody[i] = binaryString.charCodeAt(i);
    }
  } catch (e) {
    return new Response(endpoint.response_body, {
      status: endpoint.response_code,
      headers
    });
  }
  
  return new Response(decodedBody, {
    status: endpoint.response_code,
    headers
  });
});

app.use('/*', serveStatic({ root: './frontend/dist' }));
app.get('/', serveStatic({ path: './frontend/dist/index.html' }));

export default app;
