# PRISM activity and promotion intelligence

## Activity signals

- Personal activity is reported when a Partner's personal-customer count increases or a new open direct Partner appears between the selected snapshots.
- Group-customer and service movements are shown separately. The Team-page extract cannot attribute those changes to one Partner's own work.
- Backend MAP is a monthly PRISM estimate based on observable personal-customer growth and Partner arrivals. A Partner arrival also marks the structural parent active; UW's authoritative MAP definition was not supplied.
- Activity is limited to the selected snapshot comparison in the Visualiser. Missing dates or gaps in the snapshot history can hide activity.

## Promotion estimates

- The Visualiser applies the existing PRISM thresholds and counts qualifying legs anywhere below each direct branch.
- The supplied UW promotion planners were not accessible, so these values are planning estimates and must not be used as official qualification decisions.
- QD★/SQD personal-recruitment eligibility cannot be verified from the Team-page structure extract. The interface calls this out next to those estimates.
- The Apps Script email only reports position changes actually observed in snapshots. It links each Partner to their locked structure view and does not claim that a title change verifies qualification.

## Watchlist privacy and retention

- Hot/cold labels and nicknames persist in browser local storage on the device that created them. They are not uploaded to the public snapshot API or embedded in public frontend data.
- Private promotion priorities and mentoring notes can be retained in the owner-only `PRISM Promotion Focus` tab in the private PRISM spreadsheet. The backend includes them only in owner reports, never team-recipient emails or the public snapshot API.
- Hot/cold labels in the public Visualiser are still device/browser scoped and are not encrypted. Keep sensitive mentoring notes in the private spreadsheet; do not add those notes to the Visualiser.

## Preview

Open `visualiser.html?demo=1` for the synthetic data mode. It does not call the Apps Script endpoint.
