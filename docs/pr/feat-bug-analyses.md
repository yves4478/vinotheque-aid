# feat/bug-analyses

## Summary

Fixes two regressions in wine capture:

- saving a wine from `/add` could appear to do nothing even though the form was filled out
- taking a photo from the browser was unreliable on mobile capture flows

## What Changed

- Replaced the external save action in `/add` with a native form submit using `type="submit"` plus `form="..."`.
- Removed the `requestSubmit()` dependency from the sidebar/mobile save bar.
- Updated the label scanner camera and upload actions to use direct file inputs on the visible tiles instead of hidden-input click forwarding.
- Applied the same direct camera/gallery input pattern to the manual wishlist photo flow.
- Added a regression test covering both `/add` save modes:
  - `Ans Lager`
  - `Nur Registrieren`

## Review Notes

- `src/pages/AddWine.tsx`
  - the save bar now submits the form through native browser form wiring
  - this makes the cellar and wishlist flows independent of `requestSubmit()` support
- `src/components/WineLabelScanner.tsx`
  - camera and file selection are now attached directly to interactive input surfaces
  - scanner errors are reset before a new recognition run starts
- `src/pages/Wishlist.tsx`
  - manual photo capture now exposes separate camera and gallery entry points
  - photo removal button is explicitly `type="button"` to avoid accidental form submission
- `src/pages/AddWine.test.tsx`
  - verifies that both save actions actually call the correct store mutation and navigation target

## Validation

- `git diff --check`
- `npm test -- src/pages/AddWine.test.tsx`
- `npm run build`

## Known Gaps

- The camera flow was hardened for browser compatibility, but it was not physically verified on a real mobile device in this terminal session.
- The production build still reports a large bundle warning for the existing app chunk.
