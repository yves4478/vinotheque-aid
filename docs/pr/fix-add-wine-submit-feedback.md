# fix/add-wine-submit-feedback

## Summary

Fixes the wine capture flow so `Ins Lager aufnehmen` and `Registrieren` reliably submit, persist the entry, and show visible user feedback.

## What Changed

- Replaced the indirect `requestSubmit()` trigger with real external submit buttons bound to the form.
- Added a submitting state so the action buttons show progress and cannot be double-clicked while saving.
- Wrapped the save flow in explicit error handling so storage failures surface as destructive toasts instead of failing silently.
- Hardened local entry creation with a fallback ID generator when `crypto.randomUUID()` is unavailable.
- Persisted new cellar and wishlist entries immediately in the store so save errors are caught at the source.
- Added regression tests for:
  - successful cellar submission
  - successful register-only submission
  - visible error feedback when saving fails

## Review Notes

- `src/pages/AddWine.tsx`
  - now uses form-linked submit buttons for both desktop and mobile save bars
  - shows success and failure toasts directly in the submit flow
  - disables save/cancel actions while a submission is in progress
- `src/hooks/useWineStore.tsx`
  - validates persistence during `addWine` and `addWishlistItem`
  - returns created entries and uses a safe fallback for ID generation
- `src/pages/AddWine.test.tsx`
  - covers the external save buttons and failure feedback path

## Validation

- `npm test`
- `npm run build`

## Known Gaps

- The project still stores these entries in browser local storage, not in a backend database.
- Repository-wide ESLint errors already exist in unrelated files and were not part of this fix.
