function decodeAuthBundle(b64) {
  if (!b64) throw new Error('Missing GitHub secret PRISM_UW_STORAGE_STATE_B64.');
  let value;
  try { value = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); }
  catch (e) { throw new Error(`Could not decode UW login state: ${e.message}`); }
  if (value && value.storageState) return value;
  if (value && Array.isArray(value.cookies) && Array.isArray(value.origins)) {
    return { storageState: value, sessionStorageByOrigin: {} };
  }
  throw new Error('UW login-state secret is not a valid Playwright storage state.');
}
async function applySessionStorage(context, bundle) {
  const map = bundle.sessionStorageByOrigin || {};
  if (!Object.keys(map).length) return;
  await context.addInitScript(({ map }) => {
    const values = map[location.origin];
    if (!values) return;
    for (const [key, value] of Object.entries(values)) {
      try { sessionStorage.setItem(key, value); } catch (_) {}
    }
  }, { map });
}
module.exports = { decodeAuthBundle, applySessionStorage };
