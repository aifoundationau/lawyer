import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

const MAX_BODY_BYTES = 1_000_000;

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Runs the Vercel functions in /api during `vite dev`, so the front end and the
// server routes work together locally. In production Vercel serves /api itself.
function vercelApiDevServer(): Plugin {
  return {
    name: 'lawyerselect-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        if (!url.pathname.startsWith('/api/')) return next();

        // Files and folders starting with "_" are private helpers, as on Vercel.
        const route = url.pathname.slice('/api/'.length).replace(/\/+$/, '');
        const segments = route.split('/');
        if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(route) || segments.some((s) => s.startsWith('_'))) {
          return sendJson(res, 404, { error: 'Not found' });
        }
        const file = path.resolve(__dirname, 'api', `${route}.ts`);
        if (!fs.existsSync(file)) return sendJson(res, 404, { error: 'Not found' });

        try {
          const rawBody = await readBody(req);
          const isJson = (req.headers['content-type'] || '').includes('application/json');
          let body: unknown = undefined;
          if (isJson && rawBody.length > 0) {
            try {
              body = JSON.parse(rawBody.toString('utf8'));
            } catch {
              return sendJson(res, 400, { error: 'Invalid JSON body' });
            }
          }

          const apiReq = Object.assign(req, {
            query: Object.fromEntries(url.searchParams.entries()),
            body,
            rawBody,
          });
          const apiRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return apiRes;
            },
            json(data: unknown) {
              if (!res.headersSent) res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return apiRes;
            },
            send(data: string) {
              res.end(data);
              return apiRes;
            },
          });

          const mod = await server.ssrLoadModule(file);
          await mod.default(apiReq, apiRes);
        } catch (err) {
          server.config.logger.error(`[api] ${url.pathname} failed: ${(err as Error).stack || err}`);
          if (!res.headersSent) sendJson(res, 500, { error: 'Server error' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make server-only settings from the .env files available to the /api routes in dev.
  // Settings passed on the command line win over the files.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    // NEXT_PUBLIC_ is kept so the variable names already used on Vercel keep working.
    // Only variables with these prefixes are ever sent to the browser.
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    plugins: [react(), vercelApiDevServer()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
    },
  };
});
