# Situs Belmont Tools

Situs statis untuk [Belmont Tools](https://github.com/sinichi-edogawa/belmont) —
halaman depan plus enam halaman panduan. HTML dan CSS biasa, tanpa build step,
tanpa dependensi.

## Melihatnya

Klik dua kali `index.html`. Itu saja — tidak ada server yang perlu dijalankan.

Kalau ingin memakai server lokal (berguna supaya path absolut berperilaku sama
seperti saat sudah di-host):

```
npx serve .
```

## Isinya

```
index.html              halaman depan: fitur, daftar penyedia, unduhan
panduan/
├── pasang.html         pemasangan, SmartScreen, lokasi data
├── provider.html       login Claude, kunci API, endpoint custom
├── pengaturan.html     semua opsi, termasuk yang hanya ada di settings.json
├── subagent.html       subagen paralel dan indikatornya
├── telegram.html       penyiapan bot, perintah, batasan
└── bangun.html         jalankan dari sumber, bangun installer
aset/
└── gaya.css            seluruh gaya situs
```

## Menyunting

**Teks** — buka berkas `.html`-nya, cari kalimatnya, ubah, simpan.

**Warna** — semuanya terkumpul sebagai variabel di bagian atas `aset/gaya.css`,
di blok `:root` untuk tema gelap dan `@media (prefers-color-scheme: light)`
untuk tema terang. Situs mengikuti tema sistem pengunjung secara otomatis.

**Menu navigasi** — diulang di setiap berkas (konsekuensi dari tidak memakai
build step). Mengubahnya berarti menyunting ketujuh berkas. Kalau halamannya
nanti bertambah banyak, pertimbangkan pindah ke Astro atau generator statis lain.

## Tautan unduhan

Mengarah ke tag rilis `windows-latest` di repo publik, yang nama asetnya tidak
mengandung nomor versi:

```
https://github.com/sinichi-edogawa/belmont/releases/download/windows-latest/Belmont-Tools-Setup.exe
https://github.com/sinichi-edogawa/belmont/releases/download/windows-latest/Belmont-Tools-Portable.exe
```

Karena itu tautannya tidak perlu diperbarui setiap kali ada versi baru — cukup
timpa aset di rilis tersebut. Yang perlu disunting manual saat versi naik hanya
nomor versi pada lencana di `index.html`.

## Hosting

Folder ini bisa langsung diunggah ke GitHub Pages, Netlify, Vercel, atau hosting
statis apa pun. Tidak ada konfigurasi build yang perlu diisi; direktori keluarannya
adalah folder ini sendiri.
