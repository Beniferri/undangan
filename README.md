# 💌 Beta Storia Wedding Invitation

![Thumbnail](/assets/images/banner.webp)

[![GitHub repo](https://img.shields.io/badge/GitHub-Beniferri%2Fundangan-181717?logo=github)](https://github.com/Beniferri/undangan)

## 🚀 Demo
Untuk kamu yang ingin melihat demo terlebih dahulu:

[https://wedding.benifin.my.id/](https://wedding.benifin.my.id/)

## 📦 Documentation

* Jalankan perintah `npm install`, lalu `npm run dev`, dan buka `http://localhost:8080`.
* Ubah isi file `index.html` sesuai keinginanmu.
* Konten publik berada di `index.html`, sedangkan interaksi RSVP dan guestbook menggunakan API production.
* Untuk menjalankan lokal, gunakan API yang aman dan jangan masukkan credential production ke source code.
* Untuk deployment, ikuti [deployment runbook](docs/DEPLOYMENT.md).
* Perubahan production harus divalidasi melalui GitHub dan Coolify.

> Undangan ini hanya menggunakan HTML, CSS, dan JavaScript biasa. NPM digunakan agar file JavaScript bisa langsung dieksekusi (bukan bertipe module lagi).

> Jika tetap ingin tanpa NPM, ubah `src="./dist/guest.js"` menjadi `src="./js/guest.js" type="module"` pada tag `<head>` di index dan dashboard.html, dengan risiko glitch tema di awal loading.

> Jika kamu punya pertanyaan, gunakan fitur `discussions` agar bisa dibaca juga oleh teman-teman lainnya.

> Branch production project ini menggunakan `4.x`. Selalu jalankan smoke test setelah deployment.

## 🔥 Deployment API

- Video\
    otw

- Presentation
    [https://docs.google.com/presentation](https://docs.google.com/presentation/d/1EY2YmWdZUI7ASoo0f2wvU7ec_Yt0uZanYa8YLbfNysk/edit)

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
