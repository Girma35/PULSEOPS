async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

async function loadMonitors() {
  const list = document.getElementById('monitor-list');
  list.innerHTML = 'Loading…';
  try {
    const monitors = await fetchJSON('/api/monitors');
    list.innerHTML = '';
    if (!monitors.length) {
      list.innerText = 'No monitors configured.';
      return;
    }
    monitors.forEach(m => {
      const row = el('div', 'monitor-row');
      const title = el('div', 'monitor-title');
      title.innerText = `${m.id} — ${m.name}`;
      const meta = el('div', 'monitor-meta');
      meta.innerText = `${m.url} • every ${m.interval_sec || 60}s`;

      // status summary
      const statusWrap = el('div', 'monitor-status');
      const last = m.last_result;
      const statusDot = el('span', 'status-dot');
      statusDot.classList.add(last && last.ok ? 'status-up' : 'status-down');
      const statusText = el('span', 'status-text');
      if (!last) statusText.innerText = 'No checks yet';
      else statusText.innerText = (last.ok ? 'Up' : 'Down') + (last.status_code ? ` • ${last.status_code}` : '') + (last.duration_ms ? ` • ${last.duration_ms}ms` : '');
      statusWrap.appendChild(statusDot);
      statusWrap.appendChild(statusText);
      const btn = el('button', 'btn');
      btn.innerText = 'View recent results';
      btn.onclick = () => loadResults(m.id);
      const left = el('div', 'monitor-left');
      left.appendChild(title);
      left.appendChild(meta);
      row.appendChild(left);
      row.appendChild(statusWrap);
      row.appendChild(btn);
      list.appendChild(row);
    });
  } catch (err) {
    list.innerText = 'Failed to load monitors: ' + err.message;
  }
}

async function loadResults(monitorId) {
  const container = document.getElementById('results-list');
  container.innerHTML = 'Loading…';
  try {
    const results = await fetchJSON(`/api/monitors/${monitorId}/results`);
    container.innerHTML = '';
    if (!results.length) {
      container.innerText = 'No results yet.';
      return;
    }
    const table = el('table', 'results-table');
    const thead = el('thead');
    thead.innerHTML = '<tr><th>Time</th><th>OK</th><th>Status</th><th>Duration</th><th>Error</th></tr>';
    table.appendChild(thead);
    const tbody = el('tbody');
    results.forEach(r => {
      const tr = el('tr');
      const tTime = el('td'); tTime.innerText = r.created_at || r.timestamp || '';
      const tOk = el('td'); tOk.innerText = r.ok ? '✅' : '❌';
      const tStatus = el('td'); tStatus.innerText = r.status_code || '-';
      const tDur = el('td'); tDur.innerText = r.duration_ms != null ? r.duration_ms + 'ms' : '-';
      const tErr = el('td'); tErr.innerText = r.error || '-';
      tr.appendChild(tTime); tr.appendChild(tOk); tr.appendChild(tStatus); tr.appendChild(tDur); tr.appendChild(tErr);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  } catch (err) {
    container.innerText = 'Failed to load results: ' + err.message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMonitors();
  // auto-refresh monitors list every 15s
  setInterval(() => {
    loadMonitors();
  }, 15000);
  const form = document.getElementById('monitor-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('m-name').value.trim();
      const url = document.getElementById('m-url').value.trim();
      const interval_sec = Number(document.getElementById('m-interval').value) || 60;
      const resultEl = document.getElementById('create-result');
      resultEl.innerText = '';
      try {
        const res = await fetch('/api/monitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, interval_sec })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        resultEl.style.color = 'green';
        resultEl.innerText = 'Monitor created.';
        form.reset();
        loadMonitors();
      } catch (err) {
        resultEl.style.color = '#900';
        resultEl.innerText = 'Create failed: ' + err.message;
      }
    });
  }
  const qcForm = document.getElementById('quick-check-form');
  if (qcForm) {
    qcForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('qc-url').value.trim();
      const timeout = Number(document.getElementById('qc-timeout').value) || 10000;
      const out = document.getElementById('qc-result');
      out.innerText = '';
      out.style.color = '#090';
      try {
        const res = await fetch('/api/monitors/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, timeout })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const r = await res.json();
        out.style.color = '#090';
        out.innerText = `Result: ${r.ok ? 'Up' : 'Down'} ${r.status_code ? '• ' + r.status_code : ''} ${r.duration_ms ? '• ' + r.duration_ms + 'ms' : ''}`;
      } catch (err) {
        out.style.color = '#900';
        out.innerText = 'Check failed: ' + err.message;
      }
    });
  }
});
