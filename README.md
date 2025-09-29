# ELD Frontend — How to Use

This guide walks you through how to register an account, log in, create a trip, add a daily log sheet, and edit duty periods on the log grid.


## 1) Register an account

1. Open the app in your browser.
2. Navigate to the registration page.
3. Fill out the form. Required fields typically include:

   - Email, Username, Password, Confirm Password
   - First name, Last name
   - Driver details: driver number, initials, home operating center, license number, license state
4. Submit the form. You should see a success message and be able to log in.

Notes:

- The app shows inline field errors under inputs for easy fixes.
- If something goes wrong that isn’t tied to a specific field, you’ll see a toast message.

## 2) Log in

1. Go to the login page.
2. Enter your username and password.
3. On success, you’ll be redirected to the dashboard.

## 3) Create a trip

1. From the dashboard, open the “Create Trip” flow (modal or page, depending on layout).
2. Fill out the trip details:

   - Current location, Pickup location, Dropoff location
   - Current cycle used hours (0–70)
   - Vehicle (truck) selection
   - Optional coordinates (current/pickup/dropoff)
3. Submit to create the trip. You should see a success toast.

Important:

- A driver can only create one trip per day. If you try to create another on the same day, you’ll see an error toast: “Another trip has already been setup for today”.
- Field-level validation errors will show beneath the inputs; you may also see a toast prompting to fix errors below.

## 4) Open a trip and view Daily Log Sheets

1. Navigate to the Trips list and select a trip to view its detail page.
2. On the trip page, scroll to “Daily Log Sheets”.
3. You’ll see a table of existing log sheets for that trip.

## 5) Add a Log Sheet (modal)

1. Click “Add Log Sheet”. A modal will open.
2. Choose the date for the log sheet and submit.
3. On success:

   - The table refreshes with your new log sheet.
   - You’ll be navigated to the edit page for that log sheet so you can add duty periods.

## 6) Manage a Log Sheet (edit page)

The Manage Log Sheet page has three key parts:

- Your Daily Log (Grid):

  - Interactive FMCSA-style 24-hour grid.
  - Drag the ends of a segment to adjust its time; snapping happens in 15-minute increments.
  - If a duty period crosses midnight, it will be split into two entries automatically.
  - If coordinates are present on periods, a small map shows the day route and stops.

- Duty Periods (List):

  - Shows all periods with human-readable statuses: Off Duty, Sleeper Berth, Driving, On Duty.
  - Delete a period with the “Delete” button.
  - Use “Quick Add” to create a new duty period:
    - Pick start/end time, duty status, location, and optional coordinates.
    - Grid start/end minutes are auto-calculated and snapped.

- Summary (Form):

  - The summary totals (Off Duty, Sleeper Berth, Driving, On Duty, Duty Total, Miles Driven) can be edited.
  - Click “Recalculate from Periods” to compute totals from the current duty periods.
  - HOS violations are detected automatically (e.g., >11h driving or >14h duty) and flagged.
  - Click “Save Summary” to persist changes.

## Tips & Notes

- Errors:
  - Field-level validation errors show beneath specific inputs.
  - General errors show as toasts (e.g., duplicate trip for the day).
- Vehicles:
  - Only active tractors appear for selection.
- Timezones:
  - Trip creation limits are date-based and timezone-aware server-side.
- Coordinates:
  - Adding start/end coordinates to driving/on-duty periods enables route lines and stop markers on the map.

## Troubleshooting

- If you can’t create a trip: Ensure you haven’t already created one today for the same driver. The UI should show: “Another trip has already been setup for today”.
- Validation errors: Check the inline messages under fields; fix and resubmit.
- API URL issues: Verify `NEXT_PUBLIC_BASE_API_URL` matches your backend base URL and that CORS is configured on the backend.

---

If you want similar modal UX for editing log sheets or other entities, you can reuse the dialog component pattern used by the Trip and Log Sheet flows.

