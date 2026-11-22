/* Satu tugas saja: menampilkan elemen .muncul saat tergulir masuk layar.

   Situs tetap utuh kalau berkas ini gagal dimuat — kelas .tanpa-js pada
   <html> membuat semua .muncul terlihat, dan skrip sebaris di <head>
   membuangnya begitu JavaScript hidup. */

(function () {
  'use strict';

  var calon = document.querySelectorAll('.muncul');
  if (!calon.length) return;

  var diam = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (diam || !('IntersectionObserver' in window)) {
    for (var i = 0; i < calon.length; i++) calon[i].classList.add('tampak');
    return;
  }

  var pengamat = new IntersectionObserver(function (entri) {
    entri.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('tampak');
      pengamat.unobserve(e.target);      // sekali tampil, biarkan tampil
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

  calon.forEach(function (el) { pengamat.observe(el); });
})();
