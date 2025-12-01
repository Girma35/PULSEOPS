const db = require('../../services/repository/db');
const scheduler = require('../../monitors/uptime/scheduler');
const httpCheck = require('../../monitors/uptime/httpCheck');

exports.list = (req, res) => {
	const monitors = db.getAllMonitors();
	// attach last result for each monitor
	const enriched = monitors.map(m => {
		const recent = db.getRecentResults(m.id, 1);
		const last = recent && recent.length ? recent[0] : null;
		if (last) {
			last.ok = !!last.ok;
		}
		return Object.assign({}, m, { last_result: last });
	});
	res.json(enriched);
};

exports.create = (req, res) => {
	const { name, url, interval_sec } = req.body;
	if (!name || !url) return res.status(400).json({ error: 'name and url required' });
	const info = db.createMonitor({ name, url, interval_sec });
	// Assemble monitor object (db.createMonitor returns id + fields)
	const monitor = Object.assign({ enabled: 1 }, info);
	// Schedule checks immediately for the new monitor
	try {
		scheduler.addMonitor(monitor);
	} catch (err) {
		console.error('Failed to schedule new monitor', err);
	}
	res.status(201).json(monitor);
};

exports.results = (req, res) => {
	const id = Number(req.params.id);
	const limit = Number(req.query.limit) || 50;
	const results = db.getRecentResults(id, limit);
	res.json(results);
};

// Lightweight endpoint to run a single immediate HTTP check without persisting
exports.checkNow = async (req, res) => {
	const { url, timeout } = req.body || {};
	if (!url) return res.status(400).json({ error: 'url required' });
	try {
		const result = await httpCheck({ monitorId: null, url, timeout: timeout || 10000 });
		return res.json(result);
	} catch (err) {
		console.error('checkNow error', err);
		return res.status(500).json({ error: err.message || 'check failed' });
	}
};
