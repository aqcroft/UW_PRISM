# PRISM cloud automation

**Automation version:** 1.0.1

PRISM's daily team snapshot runs in GitHub Actions, so Adrian's laptop does not need to be switched on.

## Schedule

Checks run at approximately 08:07, 10:07, 12:07, 14:07 and 16:07 Europe/London time.

- If UW's `data from` date is today, PRISM loads every partner, validates the claimed row count, publishes to Apps Script, verifies the saved snapshot, and Apps Script sends the daily change email.
- If UW is still showing an older date, the earlier checks leave PRISM untouched and a later cloud run retries.
- If the source is still stale at the final check, Apps Script sends the natural-language warning email.
- If the saved UW login expires, PRISM sends the login-refresh alert rather than writing incomplete data.
- Once today's verified snapshot exists, later scheduled checks exit without opening UW.

## Required GitHub Actions secrets

Two repository secrets are required:

- `PRISM_APPS_SCRIPT_URL` - the deployed PRISM Apps Script web-app URL.
- `PRISM_UW_STORAGE_STATE_B64` - base64-encoded Playwright storage state from a valid UW Partner Portal session.

The UW login state must never be committed to the repository.

## One-off UW session export

Run `automation/export-uw-session.js` from the existing local PRISM automation folder that already contains the working `chrome-profile` and Playwright installation. It creates `PRISM_UW_STORAGE_STATE_B64.txt`.

Copy the complete contents of that text file into the GitHub repository secret `PRISM_UW_STORAGE_STATE_B64`, then delete the local export files when no longer needed.

If UW later signs the cloud session out, repeat the export and replace the GitHub secret.

## Version history

### 1.0.1 - session export hardening

- Compressed the private UW session export before storing it as a GitHub secret.
- Kept the exported secret small enough for GitHub Actions whilst preserving cookies, local storage and current-page session storage.

### 1.0.0 - cloud automation

- Added Playwright cloud collector using the proven 480px PRISM parsing flow.
- Added UK-local scheduled GitHub Action with retry checks through 16:07.
- Added verified Apps Script publish handshake and run-report artifact.
- Added stale-data and expired-login handling.
