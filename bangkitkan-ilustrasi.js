#!/usr/bin/env node
'use strict';

/**
 * Membangkitkan ilustrasi latar untuk panel hero.
 *
 * Kenapa dibangkitkan, bukan ditulis tangan: punggung bukitnya adalah
 * jumlahan beberapa gelombang sinus. Kalau titik-titiknya diketik manual
 * hasilnya akan goyah dan kelihatan digambar komputer yang buruk. Dihitung,
 * kurvanya mulus dan konsisten — sama seperti scripts/bangkitkan-ikon.js
 * yang membuat favicon.
 *
 *   node mockup/bangkitkan-ilustrasi.js
 *
 * Keluaran: mockup/aset/langit.svg
 */

const fs = require('fs');
const path = require('path');

const L = 1600;   // lebar
const T = 760;    // tinggi

/* Acak yang bisa diulang. Dengan benih tetap, menjalankan skrip ini dua kali
   menghasilkan berkas yang identik — penting supaya git tidak berisik. */
function benih(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const acak = benih(20261125);

/* ------------------------------------------------------------------ *
 * Punggung bukit                                                      *
 * ------------------------------------------------------------------ */

/**
 * Satu lapis punggung bukit sebagai path tertutup.
 *
 * @param {number} dasar  ketinggian rata-rata dari atas
 * @param {Array}  ombak  daftar [amplitudo, panjang gelombang, geseran]
 */
function punggung(dasar, ombak) {
  const titik = [];
  for (let x = 0; x <= L; x += 4) {
    let y = dasar;
    for (const [amp, lam, geser] of ombak) {
      y += Math.sin((x / lam) + geser) * amp;
    }
    titik.push(`${x},${y.toFixed(1)}`);
  }
  // Ditutup ke bawah supaya jadi siluet padat, bukan garis.
  return `M0,${T} L${titik.join(' L')} L${L},${T} Z`;
}

/* Dari paling jauh (atas, pucat) ke paling dekat (bawah, nyaris hitam).
   Jarak antar lapis sengaja menyempit di depan supaya terasa ada kedalaman. */
const lapis = [
  { dasar: 395, warna: '#17474a', ombak: [[26, 210, 0.4], [11, 83, 1.9], [5, 37, 0.2]] },
  { dasar: 452, warna: '#113a3e', ombak: [[31, 178, 2.2], [13, 67, 0.6], [6, 31, 2.7]] },
  { dasar: 515, warna: '#0c2d33', ombak: [[27, 149, 4.1], [12, 59, 3.3], [5, 27, 1.1]] },
  { dasar: 582, warna: '#081f27', ombak: [[23, 127, 1.3], [10, 49, 5.0], [4, 23, 3.8]] },
  { dasar: 652, warna: '#04131a', ombak: [[19, 108, 3.7], [8, 41, 2.1], [3, 19, 0.9]] },
];

/* ------------------------------------------------------------------ *
 * Bintang                                                             *
 * ------------------------------------------------------------------ */

/* Dijatuhkan hanya di bagian langit, dan dijarangkan makin ke bawah supaya
   tidak ada bintang yang menempel di punggung bukit paling belakang. */
const bintang = [];
for (let i = 0; i < 190; i++) {
  const x = acak() * L;
  const y = acak() * 380;
  const dekatCakrawala = y / 380;          // 0 di atas, 1 di bawah
  if (acak() < dekatCakrawala * 0.75) continue;

  const r = 0.5 + acak() * 1.15;
  const alfa = (0.2 + acak() * 0.65) * (1 - dekatCakrawala * 0.5);
  // Sebagian kecil berkedip, dengan tempo dan jeda yang berbeda-beda.
  const kedip = acak() < 0.22
    ? `<animate attributeName="opacity" values="${alfa.toFixed(2)};${(alfa * 0.25).toFixed(2)};${alfa.toFixed(2)}" dur="${(3 + acak() * 5).toFixed(1)}s" begin="${(acak() * 6).toFixed(1)}s" repeatCount="indefinite"/>`
    : '';
  bintang.push(
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#d6f2e6" opacity="${alfa.toFixed(2)}">${kedip}</circle>`
  );
}

/* ------------------------------------------------------------------ *
 * Awan                                                                *
 * ------------------------------------------------------------------ *
 * Hanyut dari kiri ke kanan lalu habis. Tiap awan gumpalan beberapa
 * elips yang saling menimpa — itu sebabnya ia terlihat seperti awan dan
 * bukan seperti kapsul. Lebar, tinggi, dan jarak tiap elips diacak, jadi
 * tidak ada dua awan yang berbentuk sama.
 *
 * Yang bergerak cuma transform-nya, bukan posisi tiap elips. Satu
 * animateTransform per awan, bukan puluhan.                            */

const AWAN = 7;
const awan = [];
for (let i = 0; i < AWAN; i++) {
  // Ditebar merata menurun, bukan acak penuh, supaya tidak menggerombol.
  const y = 72 + (i / AWAN) * 236 + (acak() - 0.5) * 42;
  const skala = 0.5 + acak() * 0.95;
  const alfa = 0.05 + acak() * 0.06;
  const durasi = Math.round(78 + acak() * 86);
  const jeda = -Math.round(acak() * durasi);   // mulai di tengah siklus

  const gumpal = [];
  const n = 4 + Math.floor(acak() * 3);
  let x = 0;
  for (let j = 0; j < n; j++) {
    // Elips tengah paling besar, yang di tepi mengecil — siluet awan.
    const tepi = Math.abs(j - (n - 1) / 2) / ((n - 1) / 2);
    const rx = (40 + acak() * 52) * (1 - tepi * 0.45);
    const ry = rx * (0.3 + acak() * 0.15);
    const naik = (acak() - 0.5) * 14;
    gumpal.push(`<ellipse cx="${x.toFixed(0)}" cy="${naik.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}"/>`);
    x += rx * (0.66 + acak() * 0.4);
  }

  awan.push(`
  <g opacity="0">
    <g transform="scale(${skala.toFixed(2)})" fill="#7fa6b0">${gumpal.join('')}</g>
    <animateTransform attributeName="transform" type="translate"
      values="-380,${y.toFixed(0)}; ${L + 380},${(y - 22).toFixed(0)}"
      dur="${durasi}s" begin="${jeda}s" repeatCount="indefinite"/>
    <animate attributeName="opacity"
      values="0;${alfa.toFixed(3)};${alfa.toFixed(3)};0" keyTimes="0;0.2;0.7;1"
      dur="${durasi}s" begin="${jeda}s" repeatCount="indefinite"/>
  </g>`);
}

/* ------------------------------------------------------------------ *
 * Rumah berlampu                                                      *
 * ------------------------------------------------------------------ *
 * Satu titik hangat di lereng terdepan. Inilah isi ceritanya: semua
 * pekerjaan itu terjadi di sini, di satu mesin, di tengah gelap.        */

/* Digambar di koordinat lokal dengan (0,0) di tengah alasnya, lalu
   ditempatkan sekali lewat transform. Mau diperbesar? Ubah SKALA saja —
   tidak ada satu pun titik yang perlu dihitung ulang. */
const SKALA = 1.9;
const bx = 1108;   // jangkar mendatar
const by = 674;    // ketinggian tanah di titik itu, mengikuti punggung terdepan

/* Asap dari cerobong. Tiga kepul berjeda, supaya tidak keluar serentak. */
const asap = [0, 2.8, 5.6].map((jeda) => `
    <circle cx="19" cy="-64" r="3" fill="#9fc9bd" opacity="0">
      <animate attributeName="cy"      values="-64;-172" dur="8.4s" begin="${jeda}s" repeatCount="indefinite"/>
      <animate attributeName="cx"      values="19;-8"    dur="8.4s" begin="${jeda}s" repeatCount="indefinite"/>
      <animate attributeName="r"       values="2.5;18"   dur="8.4s" begin="${jeda}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;.14;0"  dur="8.4s" begin="${jeda}s" repeatCount="indefinite"/>
    </circle>`).join('');

const rumah = `
  <g transform="translate(${bx} ${by}) scale(${SKALA})">
    <!-- pendar lampu, bernapas pelan -->
    <ellipse cx="0" cy="-22" rx="108" ry="76" fill="url(#pendar)" opacity="0.5">
      <animate attributeName="opacity" values="0.34;0.6;0.34" dur="7s" repeatCount="indefinite"/>
    </ellipse>
${asap}
    <!-- cerobong digambar lebih dulu supaya pangkalnya tertutup atap -->
    <rect x="14" y="-62" width="11" height="26" fill="#02080c"/>
    <!-- badan, lalu atap dengan tritisan sedikit menjorok -->
    <path d="M-36,-26 H36 V0 H-36 Z" fill="#02080c"/>
    <path d="M-43,-26 L0,-56 L43,-26 Z" fill="#02080c"/>
    <!-- dua jendela menyala, berkedip tidak sefase -->
    <rect x="-27" y="-20" width="14" height="11" rx="1.5" fill="#ffcf8f">
      <animate attributeName="fill" values="#ffcf8f;#ffdcaa;#ffcf8f" dur="7s" repeatCount="indefinite"/>
    </rect>
    <rect x="13" y="-20" width="14" height="11" rx="1.5" fill="#ffcf8f">
      <animate attributeName="fill" values="#ffcf8f;#ffdcaa;#ffcf8f" dur="7s" begin="-2.4s" repeatCount="indefinite"/>
    </rect>
    <!-- pintu, cahayanya lebih redup -->
    <rect x="-7" y="-19" width="14" height="19" rx="1.5" fill="#c6873d"/>
  </g>`;

/* ------------------------------------------------------------------ *
 * Rakit SVG                                                           *
 * ------------------------------------------------------------------ */

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${T}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Lanskap malam dengan satu rumah berlampu">
<defs>
  <linearGradient id="langit" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#05121a"/>
    <stop offset="46%"  stop-color="#0a2430"/>
    <stop offset="78%"  stop-color="#124241"/>
    <stop offset="100%" stop-color="#1d5f50"/>
  </linearGradient>
  <radialGradient id="fajar" cx="0.72" cy="0.58" r="0.52">
    <stop offset="0%"   stop-color="#6fd9ae" stop-opacity="0.20"/>
    <stop offset="100%" stop-color="#6fd9ae" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="pendar" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0%"   stop-color="#ffc47a" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="#ffc47a" stop-opacity="0"/>
  </radialGradient>
</defs>

<rect width="${L}" height="${T}" fill="url(#langit)"/>
<rect width="${L}" height="${T}" fill="url(#fajar)"/>

<g>${bintang.join('')}</g>

<!-- Awan di belakang punggung bukit, jadi ia lewat di langit saja. -->
<g>${awan.join('')}</g>

${lapis.map((l) => `<path d="${punggung(l.dasar, l.ombak)}" fill="${l.warna}"/>`).join('\n')}

${rumah}
</svg>
`;

const keluar = path.join(__dirname, 'aset');
fs.mkdirSync(keluar, { recursive: true });
fs.writeFileSync(path.join(keluar, 'langit.svg'), svg);

console.log(`langit.svg  ${(Buffer.byteLength(svg) / 1024).toFixed(1)} kB  ·  ` +
  `${bintang.length} bintang  ·  ${awan.length} awan  ·  ${lapis.length} lapis bukit`);
