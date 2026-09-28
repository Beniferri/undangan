# Beta Storia CMS Workflow

## Status editorial

Gunakan status item wedding berikut:

- `draft`: sedang diedit dan tidak tampil di website publik.
- `review`: siap diperiksa reviewer.
- `published`: satu-satunya status yang dibaca public API.
- `archived`: tidak tampil di website publik.

Public role hanya memiliki permission `read` dengan filter parent `status = published`. Jangan memberi public role akses ke `directus_versions`, draft, atau revision data.

## Validasi sebelum publish

Pada collection `weddings`, field inti berikut wajib diisi:

- slug;
- status;
- nama mempelai;
- tanggal pernikahan;
- timezone;
- SEO title;
- SEO description.

Event wajib memiliki relasi wedding, nama, dan tanggal. Story wajib memiliki relasi wedding, title, dan body. Gallery wajib memiliki relasi wedding dan alt text.

## Draft preview

Directus menggunakan Preview URL:

```text
https://wedding.benifin.my.id/?preview=true&version={{$version}}
```

Mode preview hanya aktif jika `preview=true` dan `version` tersedia. Akses biasa tetap menggunakan filter `status = published`. Draft harus dibuka dari sesi/token Directus yang terautentikasi; jangan menambahkan permission public untuk draft.

## Revision dan rollback

Versioning aktif pada seluruh collection konten. Sebelum rollback:

1. Buka item di Directus.
2. Periksa activity/revision dan bandingkan perubahan.
3. Pilih versi yang ingin dipulihkan.
4. Simpan sebagai draft.
5. Jalankan preview.
6. Ubah ke `review`, lalu `published` setelah pemeriksaan.

Jangan melakukan rollback langsung pada production tanpa preview dan verifikasi public API.

## Gallery

Upload gambar melalui Directus Files, hubungkan ke `directus_file_id`, isi alt text, caption, dan sort. Frontend memakai asset Directus dengan transform WebP dan fallback ke `image_url` lama.

Slot slider frontend 1–6 dipetakan dari record gallery berdasarkan `sort`. Jika collection gallery berisi record, slider kedua disembunyikan otomatis bila jumlah foto tidak lebih dari tiga. Jika CMS gagal atau kosong, fallback static tetap dipakai.

## Cover dan foto profil

Pada collection `weddings`:

- `cover_image_id`: background halaman; tidak memakai modal foto;
- `profile_image_id`: foto hero/profil; tetap memakai `undangan.guest.modal(this)`.

Keduanya diupload melalui Directus Files dan dapat diganti tanpa mengubah source frontend.

## Video

Pada collection `weddings`, pilih `video_source`:

- `file`: upload MP4 ke Directus Files dan isi `video_file_id`;
- `youtube`: isi `video_url` dengan URL YouTube biasa, `youtu.be`, atau `/embed/`.

Frontend mengubah URL YouTube menjadi embed `youtube-nocookie.com`, sedangkan file Directus diputar sebagai video HTML5. Jika field CMS kosong, file video lokal lama tetap menjadi fallback.

## Musik undangan

Pada item `weddings` berstatus `published`, ubah field `audio_url` untuk mengganti lagu tanpa rebuild frontend. Isi dengan path file musik yang tersedia pada origin website (misalnya `/assets/music/lagu.mp3`) **atau** URL HTTPS asset Directus (`https://directus.benifin.my.id/assets/<file-id>`). Upload file baru ke Directus Files terlebih dahulu dan pastikan public role dapat membaca file audio tersebut; uji URL dari browser tanpa sesi admin. URL eksternal lain, skema tidak aman, atau nilai kosong tidak digunakan; frontend memakai MP3 lokal bawaan sebagai fallback. Tombol musik baru muncul setelah undangan dibuka, dan bila autoplay ditolak pengunjung masih dapat memutar secara manual.

Untuk pratinjau, simpan sebagai draft dan buka preview Directus; hanya item `published` yang dibaca pengunjung umum. Jika musik tidak terputar, periksa akses public asset, content type audio, dan network request di browser sebelum publish.

## Frontend loading dan favicon

Loading screen hanya menahan tampilan sekitar 900 ms agar visitor tidak menunggu seluruh asset berat. Gambar, video, audio, dan library tetap dilanjutkan secara asynchronous dengan fallback existing.

Field `favicon_image_id` pada `weddings` dapat diisi dengan file PNG dari Directus Files. Jika kosong, frontend memakai favicon static bawaan.

## SEO dan structured data

Field SEO wedding:

- `seo_title`;
- `seo_description`;
- `seo_keywords`;
- `canonical_url`;
- `og_image_id`.

Frontend memetakan field tersebut ke document title, meta description, keywords, Open Graph, canonical URL, dan JSON-LD Event.
