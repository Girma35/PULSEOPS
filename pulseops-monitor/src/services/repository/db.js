const path = require('path');
const Database = require('better-sqlite3');

let db;
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'pulseops.db');

function ensureTables() {
	db.prepare(`CREATE TABLE IF NOT EXISTS monitors (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		url TEXT,
		interval_sec INTEGER DEFAULT 60,
		enabled INTEGER DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`).run();

	db.prepare(`CREATE TABLE IF NOT EXISTS check_results (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		monitor_id INTEGER,
		ok INTEGER,
		status_code INTEGER,
		duration_ms INTEGER,
		error TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`).run();
}

module.exports = {
	init: async () => {
		const dir = require('fs').dirname || path.dirname;
		// ensure parent dir exists
		const fs = require('fs');
		const parent = path.dirname(DB_PATH);
		if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
		db = new Database(DB_PATH);
		ensureTables();
	},
	getAllMonitors: () => {
		const stmt = db.prepare('SELECT * FROM monitors');
		return stmt.all();
	},
	createMonitor: ({ name, url, interval_sec = 60 }) => {
		const stmt = db.prepare('INSERT INTO monitors (name, url, interval_sec) VALUES (?, ?, ?)');
		const info = stmt.run(name, url, interval_sec);
		return { id: info.lastInsertRowid, name, url, interval_sec };
	},
	saveCheckResult: ({ monitor_id, ok, status_code, duration_ms, error }) => {
		const stmt = db.prepare('INSERT INTO check_results (monitor_id, ok, status_code, duration_ms, error) VALUES (?, ?, ?, ?, ?)');
		return stmt.run(monitor_id, ok ? 1 : 0, status_code || null, duration_ms || null, error || null);
	},
	getRecentResults: (monitor_id, limit = 50) => {
		const stmt = db.prepare('SELECT * FROM check_results WHERE monitor_id = ? ORDER BY created_at DESC LIMIT ?');
		return stmt.all(monitor_id, limit);
	}
};
