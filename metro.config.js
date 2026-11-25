const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8000;

const config = getDefaultConfig(__dirname);
const originalEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, metroServer) => {
    const baseMiddleware = originalEnhanceMiddleware
      ? originalEnhanceMiddleware(metroMiddleware, metroServer)
      : metroMiddleware;

    return (req, res, next) => {
      if (req.url && (req.url === '/api' || req.url.startsWith('/api/'))) {
        const forwardedHeader = req.headers['x-forwarded-for'];
        const rawIp = Array.isArray(forwardedHeader)
          ? forwardedHeader[0]
          : forwardedHeader || req.socket?.remoteAddress || 'movil';
        const clientIp = String(rawIp).split(',')[0].trim().replace(/^::ffff:/, '');

        const proxyHeaders = { ...req.headers };
        delete proxyHeaders.host;
        proxyHeaders['x-forwarded-for'] = clientIp;

        const proxyReq = http.request(
          {
            hostname: BACKEND_HOST,
            port: BACKEND_PORT,
            path: req.url,
            method: req.method,
            headers: proxyHeaders,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
          },
        );

        proxyReq.on('error', () => {
          if (!res.headersSent) {
            res.writeHead(503, {
              'Content-Type': 'application/json',
              'x-backend-offline': '1',
            });
          }
          res.end(JSON.stringify({ detail: 'Backend local FastAPI apagado (127.0.0.1:8000)' }));
        });

        req.pipe(proxyReq, { end: true });
        return;
      }

      return baseMiddleware(req, res, next);
    };
  },
};

module.exports = config;
