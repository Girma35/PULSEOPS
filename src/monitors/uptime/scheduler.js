const db = require('../../services/repository/db');
const httpCheck = require('./httpCheck');
const alertManager = require('../../alerts/alertManager');

const intervals = new Map();

async function runCheck(monitor) {
	const result = await httpCheck({ monitorId: monitor.id, url: monitor.url, timeout: 10000 });
	
	db.saveCheckResult(result);
	if (!result.ok) {
		alertManager.notify(result);
	}
}

function scheduleMonitor(monitor) {
	if (!monitor || monitor.enabled === 0) return;
	const key = `monitor_${monitor.id}`;
	if (intervals.has(key)) {
		clearInterval(intervals.get(key));
	}
	const iv = setInterval(() => runCheck(monitor), (monitor.interval_sec || 60) * 1000);
	intervals.set(key, iv);
	setImmediate(() => runCheck(monitor));
}

module.exports = {
	start: async () => {
		const monitors = db.getAllMonitors();
		monitors.forEach(m => scheduleMonitor(m));
	},
	stop: () => {
		intervals.forEach(iv => clearInterval(iv));
		intervals.clear();
	},
	addMonitor: (monitor) => {
		scheduleMonitor(monitor);
	},
	removeMonitor: (monitorId) => {
		const key = `monitor_${monitorId}`;
		if (intervals.has(key)) {
			clearInterval(intervals.get(key));
			intervals.delete(key);
		}
	}
};
