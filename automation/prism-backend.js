function makeBackend(url, today, attemptTimes) {
  if (!url) throw new Error('Missing GitHub secret PRISM_APPS_SCRIPT_URL.');
  async function getJson() {
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) throw new Error(`PRISM backend GET returned HTTP ${r.status}.`);
    return r.json();
  }
  async function post(payload) {
    const r = await fetch(url, {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const raw = await r.text();
    if (!r.ok) throw new Error(`PRISM backend returned HTTP ${r.status}: ${raw.slice(0, 500)}`);
    try { return JSON.parse(raw); }
    catch (_) { throw new Error(`PRISM backend did not return JSON: ${raw.slice(0, 500)}`); }
  }
  return {
    async alreadyHas(date) {
      const j = await getJson();
      return !!(j && j.ok && Array.isArray(j.dates) && j.dates.includes(date));
    },
    async snapshot(parsed) {
      const j = await post({ date: parsed.date, partners: parsed.partners, claimedCount: parsed.claimed, overwrite: true });
      if (!j.ok) throw new Error(`PRISM backend rejected import: ${j.error || 'Unknown error'}`);
      if (j.verified !== true) throw new Error('PRISM backend did not confirm post-write verification.');
      if (Number(j.saved) !== Number(parsed.claimed)) {
        throw new Error(`Backend verification mismatch: saved ${j.saved}, expected ${parsed.claimed}.`);
      }
      return j;
    },
    async failure(reason, extra = {}) {
      const j = await post({
        action: 'failureNotice', date: today, reason, attempts: attemptTimes,
        latestUwDate: extra.latestUwDate || '', lastError: extra.lastError || ''
      });
      if (!j.ok) throw new Error(`Failure notice rejected: ${j.error || 'Unknown error'}`);
      return j.notification || {};
    }
  };
}
module.exports = { makeBackend };
