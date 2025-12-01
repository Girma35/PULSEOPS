// Express entry point for PulseOps MVP
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// serve static public files (dashboard)
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'index.html')));

app.get('/status', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// API routes
app.use('/api/monitors', require('./api/routes/monitors'));

// start DB and scheduler
const db = require('./services/repository/db');
const scheduler = require('./monitors/uptime/scheduler');

async function start() {
  await db.init();
  scheduler.start();
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
