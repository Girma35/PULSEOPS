const axios = require('axios');

module.exports = async function httpCheck({ monitorId, url, timeout = 10000 }) {

	const start = Date.now();

	try {
		const resp = await axios.get(url, { timeout, validateStatus: null });

		const duration = Date.now() - start;
		
		return {
			monitor_id: monitorId,
			url,
			ok: resp.status >= 200 && resp.status < 400,
			status_code: resp.status,
			duration_ms: duration,
			error: null,
			timestamp: new Date().toISOString()
		};
	} catch (err) {
		const duration = Date.now() - start;
		return {
			monitor_id: monitorId,
			url,
			ok: false,
			status_code: null,
			duration_ms: duration,
			error: err.message,
			timestamp: new Date().toISOString()
		};
	}
};

