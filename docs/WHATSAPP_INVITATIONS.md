# Undangan WhatsApp (dashboard)

Setelah masuk ke `/dashboard.html`, isi **nama tamu** dan **nomor WhatsApp Indonesia** (08…, 628…, atau +62…). Template pesan dapat diedit di tab tersebut; placeholder `{nama}` dan `{link}` wajib, `{mempelai}` dan `{tanggal}` opsional. Klik **Buat pratinjau** untuk memeriksa teks dan link personal `https://wedding.benifin.my.id/?to=...`; lalu klik **Buka draf di WhatsApp** dan tekan **Kirim** sendiri di WhatsApp.

Metadata nama mempelai dan tanggal dibaca dari record `weddings` berstatus `published` di Directus. Jika record tidak tersedia, pembuatan draf dinonaktifkan. Input nomor tidak disimpan di CMS/browser storage ataupun dikirim ke backend aplikasi; nomor dan teks baru diberikan ke WhatsApp ketika tautan draf dibuka. Jangan membuka draf untuk tamu yang tidak menyetujui komunikasi melalui WhatsApp.

Batasan: satu tamu per draf, tidak ada daftar kontak, pengiriman massal, API WhatsApp Business, atau pelacakan status terkirim. Personalisasi `?to=` adalah nama tampilan, bukan autentikasi/akses privat.
