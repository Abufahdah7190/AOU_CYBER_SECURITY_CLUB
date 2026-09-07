'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const learningRoutes = require('./routes/learning.routes');
const userRoutes = require('./routes/user.routes');
const { generalLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFoundHandler } = require('./middleware/errors');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SERVER_ROOT = path.resolve(__dirname, '..');

// Resolve the frontend from the actual files that are deployed.
// Render can run this service from either the repository root or with
// `server` as the Root Directory, so do not assume a single layout.
const FRONTEND_CANDIDATES = [
  PROJECT_ROOT,
  path.join(PROJECT_ROOT, 'public'),
  path.join(SERVER_ROOT, 'public'),
  SERVER_ROOT,
];

const FRONTEND_REQUIRED_FILES = [
  'index.html',
  'profile.html',
  'css/style.css',
  'js/profile.js',
];

const FRONTEND_ROOT = FRONTEND_CANDIDATES.find((candidate) =>
  FRONTEND_REQUIRED_FILES.every((file) => fs.existsSync(path.join(candidate, file)))
);

if (!FRONTEND_ROOT) {
  throw new Error(
    `Frontend files not found. Checked: ${FRONTEND_CANDIDATES.join(', ')}`
  );
}

const app = express();

// Render/Railway/most PaaS sit behind a reverse proxy — needed for
// req.ip and secure cookies to work correctly.
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://*.supabase.co', 'https://*.supabase.in'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const maintenancePage = path.join(FRONTEND_ROOT, 'maintenance.html');
app.locals.maintenancePage = maintenancePage;
const pageAcceptsHtml = (req) => req.method === 'GET' && !req.path.startsWith('/api') && (req.headers.accept || '').includes('text/html');
app.use((req, res, next) => {
  if (env.MAINTENANCE_MODE && pageAcceptsHtml(req) && req.path !== '/maintenance.html') {
    return res.sendFile(maintenancePage);
  }
  return next();
});

if (!env.isProd) {
  app.use(morgan('dev'));
}

app.use('/api', generalLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, env: env.NODE_ENV }));

// Dedicated LMS classroom route. The client reads :courseId from the path.
const sendLmsPage = (req, res) => res.sendFile(path.join(FRONTEND_ROOT, 'course.html'));
app.get('/learn/:courseId', sendLmsPage);

// Student dashboard route. Keep it separate from the public home page.
const sendStudentProfile = (req, res) => res.sendFile(path.join(FRONTEND_ROOT, 'profile.html'));
app.get('/student/profile', sendStudentProfile);

// Serve every real frontend file before the document fallback.
// `fallthrough: true` lets unknown document routes continue to the SPA
// fallback, while real files such as /profile.html, /css/style.css,
// /js/profile.js and /assets/* are served directly.
app.use(express.static(FRONTEND_ROOT, {
  index: 'index.html',
  fallthrough: true,
  etag: true,
  maxAge: env.isProd ? '1h' : 0,
}));

// Explicitly serve .html documents from the resolved frontend directory.
// This makes direct navigation/refresh of pages such as /profile.html
// independent from the catch-all route below.
app.get('/*.html', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();

  const relativePath = req.path.replace(/^\/+/, '');
  const requestedFile = path.resolve(FRONTEND_ROOT, relativePath);

  // Prevent path traversal and only serve files that actually exist.
  if (
    !requestedFile.startsWith(FRONTEND_ROOT + path.sep) &&
    requestedFile !== FRONTEND_ROOT
  ) {
    return res.status(400).type('text/plain').send('Invalid path');
  }

  if (!fs.existsSync(requestedFile) || !fs.statSync(requestedFile).isFile()) {
    return next();
  }

  return res.sendFile(requestedFile);
});

// Never rewrite asset-like URLs to the SPA shell. Return a real 404 so a
// deployment error is visible immediately instead of being cached as HTML.
app.use((req, res, next) => {
  const looksLikeAsset = /\.[a-z0-9]{1,12}$/i.test(req.path);
  if (req.method === 'GET' && looksLikeAsset && !req.path.startsWith('/api/')) {
    return res.status(404).type('text/plain').send('Static asset not found');
  }
  return next();
});

app.use('/api', notFoundHandler);

// Frontend catch-all is reserved for extensionless browser document
// navigations. Never use it to answer missing asset requests.
app.get('*', (req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();

  // Requests containing a file extension must already have been handled by
  // express.static / the explicit HTML handler; otherwise return a real 404.
  if (/\.[a-z0-9]{1,12}$/i.test(req.path)) {
    return res.status(404).type('text/plain').send('Static asset not found');
  }

  const acceptsHtml = (req.headers.accept || '').includes('text/html');
  if (!acceptsHtml) return res.status(404).type('text/plain').send('Not found');

  return res.sendFile(path.join(FRONTEND_ROOT, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
