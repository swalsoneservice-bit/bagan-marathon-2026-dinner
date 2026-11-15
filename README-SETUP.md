# Bagan Marathon 2026 — Official Dinner Ticket Website

## Files
- `index.html`, `style.css`, `code.js`: GitHub Pages website.
- `Code.gs`: Google Apps Script backend (paste into Apps Script).
- `assets/`: add the event images and payment QR images listed below.

## Required asset filenames
- `assets/bagan-heritage-hero.jpg` — wide Bagan / Heritage Hotel hero image
- `assets/runderful-myanmar-logo.png`
- `assets/swal-sone-service-logo.png`
- `assets/QR-1.png` — KBZPay
- `assets/QR-2.png` — CBPay
- `assets/QR-3.png` — AYA Pay
- `assets/QR-4.png` — WavePay

Keep these exact filenames or update the corresponding paths in `index.html`.

## Google setup (one-time)
1. Create a Google Sheet and copy its spreadsheet ID from its URL.
2. Create a Drive folder for payment proofs and copy its folder ID.
3. Open Extensions → Apps Script from the Sheet (or script.google.com), paste `Code.gs`.
4. In Project Settings → Script Properties add:
   - `SPREADSHEET_ID` = your spreadsheet ID
   - `UPLOAD_FOLDER_ID` = your Drive upload folder ID
   - `ADMIN_PASSWORD_HASH` = SHA-256 hex digest of your admin password
   - `PUBLIC_BASE_URL` = your GitHub Pages URL, ending with `/`
5. Run `setupOnce()` once and authorize Sheets, Drive and Mail permissions.
6. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
7. Copy the Web App URL and replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` in `app.js`.
8. Commit/publish the website on GitHub Pages.

## Admin password hash
Use a SHA-256 tool locally or a trusted password manager utility to calculate a 64-character SHA-256 hex digest. Do not put the plain admin password in GitHub or `app.js`.

## Important operational notes
- Payment is manual verification. A QR scan or uploaded screenshot is not proof of settled funds.
- Admin approves only after checking the actual payment in the provider account.
- Group registration is one lead contact and one group ticket; the guest count is shown.
- Capacity is enforced on the backend under a script lock. Set the final capacity in Admin Dashboard.
- Approving sends an email using the Apps Script owner's Mail quota.
- The public guest list displays names only.
- Ticket verification QR reveals the approved lead name, email, phone and guest count to anyone who scans that ticket. Treat the ticket QR as private.
- This is a starter deployment package. Test with a small capacity and test payment before public launch.
