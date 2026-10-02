const TIMEZONE = 'Europe/London';
function parts(date = new Date()) {
  const out = {};
  for (const p of new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date)) if (p.type !== 'literal') out[p.type] = p.value;
  return out;
}
function today() { const p = parts(); return `${p.year}-${p.month}-${p.day}`; }
function time() { const p = parts(); return `${p.hour}:${p.minute}`; }
function hour() { return Number(parts().hour); }
module.exports = { TIMEZONE, today, time, hour };
