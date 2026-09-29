# Halaman administrasi

- `dashboard.html`: masuk dan ringkasan statistik.
- `admin-tamu.html`: daftar tamu, impor CSV, status kirim manual, dan penyusun draf WhatsApp pada halaman yang sama.
- `admin-rsvp.html`: daftar RSVP terbaru dan ekspor CSV.
- `admin-ucapan.html`: filter, moderasi, dan ekspor ucapan.
- `admin-pengguna.html`: khusus admin; daftar/buat akun, ubah peran dan status, reset password.

Setiap halaman memiliki formulir login jika belum ada sesi. Konten panel kerja tersembunyi hingga `GET /api/admin/session` berhasil. Respons sesi dan login membawa `data.csrf_token`, `data.username`, `data.role`; `authenticated` opsional pada login dan `false` pada sesi ditolak. Hanya token CSRF disimpan di `sessionStorage` dengan kunci lama `betastoria-admin-csrf`; data kontak tidak ditulis ke storage ataupun URL admin. Link personal `?to=` hanya dibuat saat penyusun undangan digunakan.

Operator dapat mengelola tamu, RSVP, dan ucapan, tetapi tautan pengguna disembunyikan dan halaman pengguna tidak melakukan permintaan daftar akun. Ini **bukan** batas keamanan: backend wajib menegakkan sesi, CSRF pada perubahan, dan 403 pada API akun bagi operator. `GET /api/admin/users` mengembalikan `{data:[{id,username,role,active,created_at}]}` tanpa hash. `POST /api/admin/users` menerima `{username,password,role}`; `PATCH /api/admin/users/:id` menerima salah satu `{role?,active?,password?}`. Password tidak ditampilkan kembali. Login dan logout menggunakan endpoint yang sama seperti sebelumnya; logout baru membersihkan sesi lokal setelah server menyetujui.

Jalankan `npm test`, `npm run lint:js`, `npm run lint:css`, `npm run lint:html`, dan `npm run build:public` secara lokal. Rilis backend dengan pengendalian akses lebih dulu. Jangan tulis data uji ke production; uji browser dengan API fixture lokal, lalu verifikasi ulang alur autentikasi sungguhan pada staging sebelum rilis frontend.
