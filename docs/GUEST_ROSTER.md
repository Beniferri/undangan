# Daftar Tamu (dashboard admin)

Fitur ini bergantung pada API `betastoria-wedding-api` versi daftar tamu. **Rilis API lebih dulu, verifikasi endpoint di lingkungan nonproduksi, baru rilis frontend.** Migrasi schema `CREATE TABLE IF NOT EXISTS invitees` non-destruktif dan harus ditinjau sebelum rilis produksi. Tidak ada data uji ditulis ke production.

1. Login `/dashboard.html` dengan token admin; hanya admin yang dapat membaca nomor WhatsApp. Tambah tamu melalui formulir atau impor CSV berheader `nama,nomor` (`name,phone` juga diterima). Nomor Indonesia dinormalisasi ke `628…`; nomor duplikat dilewati saat impor (termasuk dalam file). Batas: 500 baris/1 MB per file. Baris tidak valid menghentikan seluruh impor sebelum dikirim. Konfirmasi jumlah baru dan duplikat sebelum impor.
2. Dari baris tamu pilih **Siapkan WA** untuk mengisi template undangan dan melihat pesan, tautan personal `?to=`, serta tombol pembuka draf `wa.me`. Kirim pesan dilakukan secara manual di WhatsApp. Tombol **Tandai sudah dikirim** hanya catatan admin; tidak membuktikan status pesan WhatsApp. Tanda dapat dibatalkan.
3. **Edit** mengubah nama/nomor. **Hapus** meminta konfirmasi lalu menghapus satu kontak secara permanen; ini tidak menghapus RSVP atau ucapan tamu.

Nomor disimpan pada database API khusus admin, bukan Directus/public page. Jangan impor kontak tanpa izin untuk berkomunikasi. Tidak ada pengiriman massal/otomatis, deteksi delivery, ataupun pencocokan RSVP otomatis. Bersihkan data kontak yang sudah tidak diperlukan lewat aksi hapus.
