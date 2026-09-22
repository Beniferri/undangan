# Findings — premium UI audit

- Existing project already loads Cormorant Garamond and DM Sans; retain both and remove ad-hoc typography drift through scoped tokens.
- `.svg-wrapper`, Wedding Frame, and child-order labels are absent; navbar already shows four 25% items and scrolls horizontally.
- Typography hierarchy is diluted by many inline `font-size` declarations; replace them with semantic classes/tokens and scoped heading/body rules.
- Opening overlay is fixed but body remains scrollable beneath it; add an explicit lock class removed only by Open Invitation.
- Guest query parsing already uses `URLSearchParams` and `textContent`, which is correct and safe.
- Audio starts from the synchronous `undangan.open` event, but `audio.play()` failure leaves the control disabled and emits an intrusive error; recover gracefully and keep manual play available.
- Exactly two event cards exist and CMS uses `events.slice(0, 2)`, but fallback names should be `Akad Nikah` / `Resepsi Pernikahan`; the second event needs its own maps CTA and per-event hydration.
- Existing AOS attributes are sparse. Add a dependency-free IntersectionObserver reveal system with reduced-motion fallback.
- Public Directus published endpoints returned HTTP 403 from Python, curl, and real browser during this audit. Preserve safe static fallback and report CMS content verification as blocked rather than guessing.
