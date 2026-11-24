// Membangkitkan favicon.ico + apple-touch-icon.png dari geometri yang sama
// dengan favicon.svg. Dijalankan sekali lalu dihapus; disimpan di riwayat git
// kalau suatu saat bentuknya perlu diubah.
//
// Tidak ada sharp/jimp di proyek ini dan tidak perlu ada — ikonnya cuma
// gabungan lingkaran dan persegi, jadi dirasterkan sendiri pakai jarak
// bertanda (SDF) dengan supersampling 4x4 untuk tepi yang halus.

const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

// ── Geometri, dalam koordinat 0..100 yang sama dengan favicon.svg ──────────

const persegi = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const bulat = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const atau = (...f) => (x, y) => f.some((g) => g(x, y));

const mangkukAtas = atau(persegi(24, 20, 52, 50), bulat(52, 35, 15));
const mangkukBawah = atau(persegi(24, 50, 54, 80), bulat(54, 65, 15));
const ronggaAtas = atau(persegi(38, 30, 49, 40), bulat(49, 35, 5));
const ronggaBawah = atau(persegi(38, 60, 51, 70), bulat(51, 65, 5));

const huruf = (x, y) =>
  (mangkukAtas(x, y) || mangkukBawah(x, y)) && !(ronggaAtas(x, y) || ronggaBawah(x, y));

// Latar: persegi sudut membulat r=24.
const latar = (x, y) => {
  const dx = Math.max(Math.abs(x - 50) - (50 - 24), 0);
  const dy = Math.max(Math.abs(y - 50) - (50 - 24), 0);
  return Math.hypot(dx, dy) <= 24;
};

const AWAL = [0x00, 0xf2, 0xfe];
const AKHIR = [0x00, 0xff, 0xa3];
const TINTA = [0x0d, 0x0e, 0x13];

// Gradien SVG x1,y1=0,0 → x2,y2=1,1 memproyeksikan ke (x+y)/200.
const gradien = (x, y) => {
  const t = Math.min(Math.max((x + y) / 200, 0), 1);
  return AWAL.map((a, i) => Math.round(a + (AKHIR[i] - a) * t));
};

// ── Rasterisasi ───────────────────────────────────────────────────────────

const CUPLIK = 4; // 4x4 = 16 sampel per piksel

function raster(ukuran) {
  const buf = Buffer.alloc(ukuran * ukuran * 4);
  for (let py = 0; py < ukuran; py++) {
    for (let px = 0; px < ukuran; px++) {
      let alfa = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < CUPLIK; sy++) {
        for (let sx = 0; sx < CUPLIK; sx++) {
          const x = ((px + (sx + 0.5) / CUPLIK) / ukuran) * 100;
          const y = ((py + (sy + 0.5) / CUPLIK) / ukuran) * 100;
          if (!latar(x, y)) continue;
          alfa++;
          const w = huruf(x, y) ? TINTA : gradien(x, y);
          r += w[0];
          g += w[1];
          b += w[2];
        }
      }
      const n = CUPLIK * CUPLIK;
      const i = (py * ukuran + px) * 4;
      if (alfa === 0) continue;
      // Warna dirata-ratakan hanya atas sampel yang kena, lalu alfa dipasang
      // terpisah. Kalau dibagi n, tepinya jadi gelap (halo).
      buf[i] = Math.round(r / alfa);
      buf[i + 1] = Math.round(g / alfa);
      buf[i + 2] = Math.round(b / alfa);
      buf[i + 3] = Math.round((alfa / n) * 255);
    }
  }
  return buf;
}

// ── Enkoder PNG ───────────────────────────────────────────────────────────

const TABEL_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABEL_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function potongan(tipe, data) {
  const isi = Buffer.concat([Buffer.from(tipe, "ascii"), data]);
  const panjang = Buffer.alloc(4);
  panjang.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(isi));
  return Buffer.concat([panjang, isi, crc]);
}

function png(rgba, ukuran) {
  // Tiap baris didahului satu bita tipe filter (0 = None).
  const baris = Buffer.alloc((ukuran * 4 + 1) * ukuran);
  for (let y = 0; y < ukuran; y++) {
    baris[y * (ukuran * 4 + 1)] = 0;
    rgba.copy(baris, y * (ukuran * 4 + 1) + 1, y * ukuran * 4, (y + 1) * ukuran * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ukuran, 0);
  ihdr.writeUInt32BE(ukuran, 4);
  ihdr[8] = 8; // kedalaman bit
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    potongan("IHDR", ihdr),
    potongan("IDAT", zlib.deflateSync(baris, { level: 9 })),
    potongan("IEND", Buffer.alloc(0)),
  ]);
}

// ── Pembungkus ICO ────────────────────────────────────────────────────────
// ICO boleh memuat PNG apa adanya sejak Vista. Semua target kita jauh lebih
// baru, jadi tidak perlu BMP.

function ico(gambar) {
  const kepala = Buffer.alloc(6);
  kepala.writeUInt16LE(0, 0); // cadangan
  kepala.writeUInt16LE(1, 2); // tipe 1 = ikon
  kepala.writeUInt16LE(gambar.length, 4);

  let geser = 6 + gambar.length * 16;
  const daftar = [];
  for (const { ukuran, data } of gambar) {
    const e = Buffer.alloc(16);
    e[0] = ukuran >= 256 ? 0 : ukuran; // 0 berarti 256
    e[1] = ukuran >= 256 ? 0 : ukuran;
    e[2] = 0; // jumlah warna palet
    e[3] = 0; // cadangan
    e.writeUInt16LE(1, 4); // bidang warna
    e.writeUInt16LE(32, 6); // bit per piksel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(geser, 12);
    geser += data.length;
    daftar.push(e);
  }
  return Buffer.concat([kepala, ...daftar, ...gambar.map((g) => g.data)]);
}

// ── Keluaran ──────────────────────────────────────────────────────────────

const ke = (nama) => path.join(__dirname, nama);

const ukuranIco = [16, 32, 48];
fs.writeFileSync(
  ke("favicon.ico"),
  ico(ukuranIco.map((u) => ({ ukuran: u, data: png(raster(u), u) })))
);

fs.writeFileSync(ke("apple-touch-icon.png"), png(raster(180), 180));

// Pratinjau besar supaya bentuknya bisa diperiksa mata, bukan ditebak.
fs.writeFileSync(ke("pratinjau-ikon.png"), png(raster(256), 256));

for (const n of ["favicon.ico", "apple-touch-icon.png", "pratinjau-ikon.png"]) {
  console.log(n, fs.statSync(ke(n)).size, "bita");
}
