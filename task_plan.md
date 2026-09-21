# Premium wedding UI audit and refactor

## Goal
Merapikan keseluruhan UI menjadi elegan, bersih, konsisten, dan tetap aman terhadap Directus/RSVP.

## Phases
- [in_progress] Audit tipografi, layout, content, CMS fallback, opening/audio/navigation.
- [pending] Buat branch refactor dan implementasi perubahan terfokus.
- [pending] Lint, build, static/security scan.
- [pending] Browser audit desktop/mobile/short viewport dan interaksi aman.
- [pending] Independent review, commit, dan laporan; production hanya dengan persetujuan eksplisit.

## Constraints
- Pertahankan Cormorant Garamond untuk display dan DM Sans untuk body/UI.
- Pertahankan Directus published hydration, static fallback, RSVP, Gift, dan guestbook.
- Tepat dua acara: Akad Nikah dan Resepsi Pernikahan.
- Cover mengunci scroll sampai CTA dan audio dimulai dari user gesture.
- Tanpa framework/dependency baru.
- Tidak mengubah data production atau backend.
- Planning files tidak dikomit.
