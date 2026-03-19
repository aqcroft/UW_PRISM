// UW PRISM — Google Apps Script (updated with ?all=1 support)
// Redeploy as a new version in Apps Script editor after updating

const SHEET_NAME = 'Daily Structure Data';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (e && e.parameter && e.parameter.all === '1') {
    return returnAllData(sheet);
  }
  return returnDateList(sheet);
}

function returnDateList(sheet) {
  try {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const dateCol = headers.indexOf('snapshot_date');
    if (dateCol < 0) return json({ ok: true, dates: [] });
    const dates = [];
    for (let i = 1; i < data.length; i++) {
      const d = formatDate(data[i][dateCol]);
      if (d && !dates.includes(d)) dates.push(d);
    }
    dates.sort().reverse();
    return json({ ok: true, dates });
  } catch(err) {
    return json({ ok: false, error: err.message });
  }
}

function returnAllData(sheet) {
  try {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const col = {};
    ['snapshot_date','partner_level','partner_name','title','closed',
     'personal_customers','partner_ids','group_customers','group_services'].forEach(h => {
      col[h] = headers.indexOf(h);
    });
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[col['partner_name']]) continue;
      rows.push({
        date: formatDate(row[col['snapshot_date']]),
        partner_level: row[col['partner_level']],
        partner_name: row[col['partner_name']],
        title: row[col['title']],
        closed: row[col['closed']],
        personal_customers: row[col['personal_customers']],
        partner_ids: row[col['partner_ids']],
        group_customers: row[col['group_customers']],
        group_services: row[col['group_services']]
      });
    }
    const dates = [...new Set(rows.map(r => r.date).filter(Boolean))].sort().reverse();
    return json({ ok: true, dates, data: rows });
  } catch(err) {
    return json({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { date, partners, overwrite } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const dateCol = headers.indexOf('snapshot_date');
    if (overwrite) {
      const toDelete = [];
      for (let i = data.length - 1; i >= 1; i--) {
        if (formatDate(data[i][dateCol]) === date) toDelete.push(i + 1);
      }
      toDelete.forEach(r => sheet.deleteRow(r));
    }
    const now = Utilities.formatDate(new Date(), 'Europe/London', 'yyyy-MM-dd HH:mm:ss');
    const rows = partners.map(p => [date, p.level, p.name, p.title, p.closed?'TRUE':'FALSE', p.pc, p.uwId, p.gc, p.services, now]);
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    return json({ ok: true, saved: rows.length, date });
  } catch(err) {
    return json({ ok: false, error: err.message });
  }
}

function formatDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return Utilities.formatDate(raw, 'Europe/London', 'yyyy-MM-dd');
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}