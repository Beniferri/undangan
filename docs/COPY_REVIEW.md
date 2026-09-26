# Review naskah undangan Daniyal & Balqis

Revisi `index.html` adalah fallback statis. Pada situs yang berhasil memuat Directus, judul dan isi kisah di bawah ditimpa oleh tiga record `wedding_stories` berurutan. Setelah persetujuan editorial, versi `islamic-copy-review-20260926` untuk `weddings/1` dan `wedding_stories/1–3` dipromosikan. API publik dan halaman live yang terhidrasi kini menampilkan kisah baru. PR frontend masih draft; bagian statis lain di PR belum tayang hingga rilis frontend disetujui.

## Naskah terbit di CMS: `wedding_stories`

- Sort 1 — **Awal Perkenalan**
  Tahun 2022, sebuah perkenalan sederhana mempertemukan kami. Dari percakapan yang hangat, kami mulai saling mengenal, pelan-pelan dan tanpa tergesa.
- Sort 2 — **Saling Mengenal**
  Waktu memberi kami ruang untuk saling mendengar dan memahami. Di setiap langkah, kami belajar menjaga niat dan mensyukuri pertemuan yang Allah izinkan.
- Sort 3 — **Menuju Pernikahan**
  Dengan restu kedua keluarga pada tahun 2026, kami memantapkan niat untuk menikah. Bismillah, semoga Allah membimbing langkah kami membangun rumah tangga yang penuh kasih dan keberkahan.

## Checklist editorial sebelum tayang

- Pastikan nama lengkap, nama orang tua, tanggal dan jam acara, alamat, pilihan batik, serta tahun perkenalan/restu sesuai informasi dari keluarga.
- Cocokkan petikan QS. Ar-Rum: 21 dengan [terjemahan Kemenag](https://quran.kemenag.go.id/quran/per-ayat/surah/30?from=21&to=21). Petikan harus ditandai sebagai petikan, bukan keseluruhan ayat. Jangan menisbatkan narasi kisah kepada Al-Qur'an atau hadis.
- `weddings.seo_title` dan `seo_description` telah diperbaiki di CMS. Pastikan metadata live tetap menyebut Daniyal & Balqis.
- Jika label hadiah (`wedding_gifts.label`) atau field teks lain di CMS diubah, periksa tampilan setelah hidrasi; HTML statis bukan sumber akhir bagi field `data-cms`.
- API publik dan tampilan desktop/HP dengan CMS aktif sudah diperiksa. Uji fallback saat CMS gagal tetap dilakukan melalui build lokal; rilis frontend dari PR perlu verifikasi ulang setelah merge dan deployment.
