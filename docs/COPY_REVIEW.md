# Review naskah undangan Daniyal & Balqis

Revisi `index.html` adalah fallback statis. Pada situs yang berhasil memuat Directus, judul dan isi kisah di bawah ditimpa oleh tiga record `wedding_stories` berurutan. Saat diperiksa, record publik masih memuat naskah lama. **Jangan publikasikan perubahan CMS tanpa persetujuan kedua mempelai**, terutama tahun 2022/2026 dan detail kisah yang belum dikonfirmasi. Simpan revisi sebagai draft, pratinjau, lalu terbitkan menurut `docs/CMS_WORKFLOW.md`.

## Usulan teks CMS: `wedding_stories`

- Sort 1 — **Awal Perkenalan**
  Tahun 2022, sebuah perkenalan sederhana mempertemukan kami. Dari percakapan yang hangat, kami mulai saling mengenal, pelan-pelan dan tanpa tergesa.
- Sort 2 — **Saling Mengenal**
  Waktu memberi kami ruang untuk saling mendengar dan memahami. Di setiap langkah, kami belajar menjaga niat dan mensyukuri pertemuan yang Allah izinkan.
- Sort 3 — **Menuju Pernikahan**
  Dengan restu kedua keluarga pada tahun 2026, kami memantapkan niat untuk menikah. Bismillah, semoga Allah membimbing langkah kami membangun rumah tangga yang penuh kasih dan keberkahan.

## Checklist editorial sebelum tayang

- Pastikan nama lengkap, nama orang tua, tanggal dan jam acara, alamat, pilihan batik, serta tahun perkenalan/restu sesuai informasi dari keluarga.
- Cocokkan petikan QS. Ar-Rum: 21 dengan [terjemahan Kemenag](https://quran.kemenag.go.id/quran/per-ayat/surah/30?from=21&to=21). Petikan harus ditandai sebagai petikan, bukan keseluruhan ayat. Jangan menisbatkan narasi kisah kepada Al-Qur'an atau hadis.
- Periksa pula `weddings.seo_description`. Nilai publik saat pemeriksaan masih menyebut pasangan lain; frontend memakai fallback aman bila mendeteksi nama lama itu, tetapi sebaiknya perbaiki sumbernya lewat draft CMS.
- Jika label hadiah (`wedding_gifts.label`) atau field teks lain di CMS diubah, periksa tampilan setelah hidrasi; HTML statis bukan sumber akhir bagi field `data-cms`.
- Setelah publish, cek desktop/HP dengan CMS aktif dan saat CMS gagal; jangan menganggap tes statis cukup.
