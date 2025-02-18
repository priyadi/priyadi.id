---
title: Christopher Farrel & Kecilin
authors: priyadi
---

Dari berita diketahui bahwa Christopher Farrel, pendiri *startup*
[Kecilin](https://kecilin.id), menghilang di laut lepas pantai Bantul,
Yogyakarta. Berikut catatan saya setelah melakukan sedikit investigasi.

<!-- truncate -->

## Masalah Teknologi yang Diklaim Kecilin

Kecilin adalah *startup* yang mengklaim memiliki teknologi kompresi data. Saat
saya cek, situsnya tidak bisa diakses, tetapi ada subdomain
[demo.kecilin.id](https://demo.kecilin.id) yang isinya seperti ini:

![Kecilin](./kecilin-demo.jpeg)

Saya coba mengunggah satu file JPEG, dan situsnya memberikan file hasilnya yang
lebih kecil sampai sekitar seperempatnya. Namun tidak ada yang istimewa mengenai
hal ini. Hal yang sama bisa dengan mudah dilakukan misalnya dengan perintah
seperti:

```bash
magick input.jpg -quality 20 output.jpg
```

Bagian mana yang melibatkan *"advanced compression engine"* yang mereka klaim?
Dari demo, tidak ada yang bisa saya lihat. Seandainya ada *compression engine*
yang *proprietary*, seharusnya saya perlu melakukan instalasi aplikasi *viewer*
khusus di komputer saya, tetapi tidak perlu. Demo tersebut memperkecil gambar
hanya dengan cara mengurangi kualitas JPEG, tidak ada yang istimewa.

## Pendanaan

Walaupun tidak ada kejelasan mengenai teknologinya, Kecilin bisa sampai
mendapatkan pendanaan dari [Mandiri Capital
Indonesia](https://web.archive.org/web/20230924093808/https://mandiri-capital.co.id/kecilin-raih-pendanaan-rp60-miliar-dipimpin-mandiri-capital-indonesia-kembangkan-solusi-kompresi-data/)
dan [BNI Ventures](https://www.bniventures.co.id/id/portofolio/kecilinid)
sebesar Rp 60 milyar.

## Awal Mula

Berikut [kutipan berita dari ANTARA](https://www.antaranews.com/berita/1595918/kisah-christopher-farrel-usia-18-tahun-jadi-ceo-dan-kerja-di-google?page=all):

> Karena susah dalam menerangkan apa sih ini dan apa sih impact-nya, dan
> akhirnya muncul juga ide untuk open source, aku taruh di GitHub, akhirnya ada
> undangan dari Google," ujar dia.
> 
> Farrel akhirnya bertolak ke markas Google di Mountain View, California,
> Amerika Serikat, pada 14 Februari 2017. Dalam sebuah summit, Farrel diminta
> untuk mempresentasikan algoritma core temuannya.

Akun GitHubnya adalah [ChFarrelMK](https://github.com/ChFarrelMK), dibuat pada
bulan Agustus 2015. Sebelum tanggal 14 Februari 2017 tidak ada aktivitas yang
signifikan di sana. Walaupun bisa saja dihapus.

Repository yang berhubungan dengan kompresi data baru mulai ada di akhir 2017:

- [ChFarrelMK/python-zstd](https://github.com/ChFarrelMK/python-zstd)
- [SqueezeNet-Deep-Compression](https://github.com/ChFarrelMK/SqueezeNet-Deep-Compression)
- [ChFarrelMK/fractal-image-compression](https://github.com/ChFarrelMK/fractal-image-compression)
- [ChFarrelMK/NN_compression](https://github.com/ChFarrelMK/NN_compression)

Tetapi semuanya adalah fork dari proyek lain, tidak ada yang buatan dia sendiri,
dan tidak ada *pull request* dari dia.

Hanya ada dua repo non-fork:

- [ChFarrelMK/chfarrelmk](https://github.com/ChFarrelMK/chfarrelmk), ini hanya
  GitHub Pages yang tidak ada isinya.
- [ChFarrelMK/optimizevideo](https://github.com/ChFarrelMK/optimizevideo), ini
  juga fork, yang di-fork bukan melalui fitur fork GitHub.

Di repository lain yang terkait Kecilin juga tidak ada commit yang berasal dari
dia.

- [Kecilin](https://github.com/Kecilin)
- [Kecilin-Team](https://github.com/Kecilin-Team)

## Kesimpulan Saya

Kesimpulan saya, kejadian ini mirip dengan [kasus pembangkit listrik
kedondong](https://news.detik.com/berita/d-3955322/dulu-bikin-heboh-listrik-pohon-kedondong-kini-tinggal-cerita) dulu itu.

* Christopher Farrel dulu adalah anak muda berbakat, punya percaya diri sangat
  tinggi, tapi sama sekali tidak memiliki pengalaman

* Dia punya karya sangat bagus untuk tingkat *science project*, tetapi keliru
  dia nilai jauh di atas itu. Dia pikir karyanya kelas dunia.

* Orang-orang dewasa di sekitarnya tidak memahami apa yang dia kerjakan, hanya
  tahu itu bagus. Jadi bukannya mengarahkan sesuai dengan proporsinya ke arah
  yang positif, tapi malah memupuk *[illusory
  superiority](https://en.wikipedia.org/wiki/Illusory_superiority)*-nya.

* Lalu ada media massa yang bahas, dan dikutip media massa lainnya, lalu dikutip
  media massa lainnya, dan seterusnya sampai menjadi *hype*. Sayangnya tak ada
  satu pun yang melakukan verifikasi, misalnya mencari project GitHub mana yang
  menjadikan dia dilirik Google. Harusnya tidak sulit. Akun GitHub-nya pun tak
  memiliki banyak *cendol* untuk orang dengan reputasi seperti yang diberitakan.

* (Mungkin) kemudian ada petinggi negara ini yang juga tak memahami apa yang dia
  kerjakan, tapi terpengaruh dengan *hype*-nya. Kemudian dia beri referensi ke
  Mandiri & BNI untuk mendapatkan pendanaan sampai 60 milyar.

* (Mungkin) dari koneksi yang sama mereka juga mendapatkan klien dari lembaga
  pemerintah, militer, BUMN, dan PSSI.

* (Mungkin) suatu saat ada dari mereka yang menyadari bahwa tak mungkin dia
  bisa *deliver*, atau tidak sesuai ekspektasi. Lalu kemudian memberi ultimatum.

* (Mungkin) lalu dia dikeluarkan oleh *board*-nya sendiri.

* Lalu dia [pinjam
  uang](https://www.detik.com/jogja/berita/d-7776026/farrel-yang-hilang-dilaporkan-penipuan-rp-150-juta-korbannya-orang-sleman)
  untuk menyelesaikan proyeknya, tapi karena ekspektasinya terlalu tinggi dan
  tidak realistis, dia tetap tidak mampu.

* Kemudian dia menghilang. Entah karena bunuh diri, atau kabur.
  
Jadi itulah cerita bagaimana negara ini bisa kehilangan anak muda berbakat yang
sebenarnya memiliki potensi besar untuk berkontribusi positif.

## Lain-lain

Dari pencarian, judul makalah yang dia sampaikan ke Google adalah *"Data
Compression using EG and Neural Network Algorithm for Lossless Data"*, tetapi
yang ada di Internet hanyalah media massa yang saling kutip.

Kasus ini sering terjadi. Masalahnya jika kita yang ahli dan berpengalaman
mengatakan pendapat kita dengan jujur pada tahun 2017 dulu, maka kita akan
dianggap "tidak nasionalis", "tidak mendukung karya anak bangsa", dan
sebagainya.

Sudah pernah nonton film seri [Silicon
Valley](https://en.wikipedia.org/wiki/Silicon_Valley_(TV_series))? Ada kemiripan
dengan kasus ini. Serial tersebut bercerita tentang anak muda yang membuat
aplikasi Pied Piper yang memiliki algoritma kompresi data yang revolusioner.