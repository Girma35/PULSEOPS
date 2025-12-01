const axios = require('axios');
const db = require('../services/repository/db');

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || null;

async function notifySlack(message) {
	if (!SLACK_WEBHOOK) return;
	try {
		await axios.post(SLACK_WEBHOOK, { text: message });
	} catch (err) {
		console.error('Slack notify failed', err.message);
	}
}

module.exports = {
	notify: async (result) => {
		// Basic dedupe: check last result for this monitor
		const recent = db.getRecentResults(result.monitor_id, 1);
		if (recent && recent.length > 0 && recent[0].ok === 0) {
			// already failing, skip duplicate alert
			return;
		}
		const msg = `Monitor ${result.monitor_id} failed: ${result.url} - ${result.error || 'status:'+result.status_code}`;
		await notifySlack(msg);
	}
};
