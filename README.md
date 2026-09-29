# 💌 Beta Storia Wedding Invitation

![Thumbnail](/assets/images/banner.webp)

[![GitHub repo](https://img.shields.io/badge/GitHub-Beniferri%2Fundangan-181717?logo=github)](https://github.com/Beniferri/undangan)

## 🚀 Demo
Untuk kamu yang ingin melihat demo terlebih dahulu:

[https://wedding.benifin.my.id/](https://wedding.benifin.my.id/)

## 📦 Dokumentasi & Panduan

* Jalankan `npm install`, lalu `npm run dev`, dan buka `http://localhost:8080`.
* Halaman utama publik berada di `index.html`, sedangkan portal administrasi berada di `dashboard.html` beserta halaman sub-admin (`admin-tamu.html`, `admin-rsvp.html`, `admin-pengguna.html`).
* Interaksi RSVP, data tamu, dan tampilan ucapan terhubung ke API backend terpisah.
* Jalankan tes lokal dengan `npm test`, linter dengan `npm run lint:js`, `npm run lint:css`, `npm run lint:html`, dan build publik via `npm run build:public`.
* Panduan deployment dapat dilihat di [Deployment Runbook](docs/DEPLOYMENT.md).

## 🛠️ Modul Portal Administrasi

- **Ringkasan (`dashboard.html`):** Ikhtisar metrik kehadiran tamu dan status respons RSVP.
- **Buku Tamu & WA (`admin-tamu.html`):** Manajemen penerima undangan, impor CSV, pembentukan link personal `?to=...`, dan penyusunan draf pesan WhatsApp.
- **Data RSVP (`admin-rsvp.html`):** Rekap konfirmasi kehadiran, ekspor data CSV, dan tombol toggle sembunyikan/tampilkan ucapan di web publik.
- **Kelola Pengguna (`admin-pengguna.html`):** Khusus peran Admin untuk membuat akun operator baru, mengatur status, dan reset password.

## ⚙️ Tech stack

- Bootstrap 5.3.8
- AOS 2.3.4
- Fontawesome 7.1.0
- Canvas Confetti 1.9.3
- Google Fonts
- Vanilla JS

## 🎨 Credit
All visual assets in this project are sourced from Pixabay.

## 🤝 Contributing

I'm very open to those of you who want to contribute to the undangan!

## 🐞 Security Vulnerabilities

If you find a security vulnerability, please report it privately to the repository maintainer.

## 📜 License

Undangan is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
