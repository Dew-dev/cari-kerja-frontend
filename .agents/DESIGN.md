# DESIGN.md

# Cari-Kerja.co.id Design System

Version: 1.0

---

# Design Philosophy

Cari-Kerja.co.id merupakan platform pencarian kerja modern yang memiliki fokus utama:

- cepat
- sederhana
- profesional
- mudah digunakan semua umur
- mobile first
- aksesibilitas tinggi

Inspirasi desain:

- Work.ua

Prinsip utama:

> Less is Better.

Jangan membuat UI yang ramai.

Biarkan konten menjadi fokus utama.

---

# Core Principles

## 1. Mobile First

Seluruh halaman harus didesain mulai dari ukuran mobile.

Breakpoints:

```
sm 640
md 768
lg 1024
xl 1280
2xl 1536
```

Semua komponen wajib tetap nyaman digunakan pada layar 360px.

---

## 2. Consistency

Jangan membuat variasi button yang tidak diperlukan.

Gunakan:

- satu primary button
- satu secondary button
- satu danger button

Jangan mengubah radius, shadow, maupun spacing secara acak.

---

## 3. White Space

Gunakan whitespace yang cukup.

Jangan memenuhi layar dengan informasi.

Minimal spacing:

```
section

80px desktop

48px tablet

32px mobile
```

---

## 4. Readability

Semua text harus mudah dibaca.

Maksimal width artikel/konten:

```
768px
```

---

# Color Palette

## Primary

```
Blue 600

#2563EB
```

Hover

```
#1D4ED8
```

Light

```
#DBEAFE
```

---

## Success

```
#16A34A
```

---

## Warning

```
#F59E0B
```

---

## Danger

```
#DC2626
```

---

## Background

```
Primary Background

#FFFFFF
```

Secondary

```
#F8FAFC
```

Card

```
#FFFFFF
```

---

## Text

Primary

```
#0F172A
```

Secondary

```
#475569
```

Muted

```
#94A3B8
```

Disabled

```
#CBD5E1
```

---

## Border

```
#E2E8F0
```

---

# Typography

Font utama:

```
Inter
```

Fallback

```
system-ui
sans-serif
```

Jangan menggunakan lebih dari satu font family.

---

# Font Scale

Hero

```
48
bold
```

H1

```
36
bold
```

H2

```
30
semibold
```

H3

```
24
semibold
```

H4

```
20
medium
```

Body Large

```
18
regular
```

Body

```
16
regular
```

Small

```
14
regular
```

Caption

```
12
regular
```

Line Height

```
150%
```

---

# Border Radius

Gunakan satu sistem radius.

```
Small

8
```

```
Medium

12
```

```
Large

16
```

Card

```
16
```

Button

```
12
```

Input

```
12
```

---

# Shadows

Gunakan shadow seminimal mungkin.

Card

```
shadow-sm
```

Modal

```
shadow-xl
```

Jangan menggunakan shadow besar untuk card biasa.

---

# Buttons

## Primary

Background

Blue 600

Text

White

Height

```
44px
```

Radius

12px

Hover

Blue 700

---

## Secondary

Background

White

Border

Gray 300

Text

Gray 800

---

## Danger

Background

Red 600

Text putih

---

Semua button memiliki transition:

```
200ms ease
```

---

# Inputs

Height

```
44px
```

Radius

12

Border

Gray 300

Focus

Blue 500

Placeholder

Gray 400

Tidak menggunakan border tebal.

---

# Cards

Semua card:

Background putih

Radius 16

Border Gray 200

Shadow kecil

Padding

```
24
desktop

20
tablet

16
mobile
```

---

# Icon

Gunakan

```
lucide-react
```

Ukuran default

```
20px
```

Jangan mencampur icon library.

---

# Layout

Maximum container

```
1280px
```

Content

```
768px
```

Sidebar

```
320px
```

Gap

```
24px
```

---

# Grid

Desktop

```
12 columns
```

Tablet

```
8 columns
```

Mobile

```
4 columns
```

---

# Navigation

Desktop

Top Navigation

Mobile

Bottom Navigation atau Hamburger

Navigation harus sticky.

---

# Job Cards

Job Card merupakan komponen terpenting.

Harus menampilkan:

- Logo perusahaan
- Nama perusahaan
- Nama pekerjaan
- Lokasi
- Tipe kerja
- Rentang gaji (jika tersedia)
- Label "Remote" atau "Hybrid"
- Tanggal posting
- Tombol Simpan

Card harus dapat diklik seluruhnya.

Hover hanya sedikit mengangkat card.

---

# Company Profile

Gunakan layout:

Hero

↓

Informasi perusahaan

↓

Lowongan aktif

↓

Tentang perusahaan

↓

Benefit

↓

Lokasi

↓

Job lainnya

---

# Search

Search selalu berada di atas.

Desktop:

search + filter

Mobile:

search

↓

filter button

Filter menggunakan Bottom Sheet pada mobile.

---

# Forms

Semua form:

Label di atas

Helper text di bawah

Error merah

Spacing konsisten

Tidak menggunakan placeholder sebagai label.

---

# Tables

Desktop:

Gunakan table.

Mobile:

Otomatis berubah menjadi card.

---

# Empty State

Selalu memiliki:

- icon
- title
- description
- CTA

---

# Loading

Gunakan Skeleton.

Jangan spinner penuh halaman kecuali proses pertama.

---

# Animations

Gunakan:

Framer Motion

Durasi

```
0.2 - 0.3s
```

Tidak menggunakan animasi berlebihan.

---

# Accessibility

Minimal:

- aria-label
- keyboard navigation
- focus state
- contrast AA
- alt image

Semua button harus dapat diakses keyboard.

---

# Images

Logo perusahaan:

```
contain
```

Banner

```
cover
```

Avatar

```
circle
```

Gunakan lazy loading.

---

# Responsive Rules

Desktop ≠ Mobile yang diperkecil.

Harus benar-benar responsive.

Prioritas:

Mobile

↓

Tablet

↓

Desktop

---

# Dark Mode

Belum menjadi prioritas.

Namun seluruh warna harus menggunakan design token agar mudah ditambahkan nanti.

---

# Component Rules

Semua komponen harus reusable.

Tidak boleh membuat:

ButtonLogin

ButtonDashboard

ButtonProfile

Gunakan satu:

Button

dengan variant.

Hal yang sama berlaku untuk:

Input

Modal

Badge

Card

Avatar

Tooltip

Dropdown

Pagination

Tabs

---

# Status Badge

Success

Hijau

Warning

Kuning

Danger

Merah

Info

Biru

Neutral

Abu

---

# UX Rules

Selalu tampilkan feedback.

Loading

Success

Error

Empty

Jangan biarkan user menunggu tanpa indikator.

---

# Performance

Semua gambar:

lazy loading

Semua icon:

SVG

Gunakan dynamic import bila memungkinkan.

Target Lighthouse:

Performance > 90

Accessibility > 95

Best Practices > 95

SEO > 95

---

# Design Token Naming

Gunakan token seperti:

```
primary

secondary

success

warning

danger

surface

surface-secondary

text-primary

text-secondary

border

radius-md

radius-lg

shadow-sm

shadow-md

spacing-4

spacing-6

spacing-8
```

Jangan menggunakan warna hardcode langsung di komponen.

---

# AI Development Rules

Setiap komponen yang dibuat AI wajib mengikuti aturan berikut:

- Mobile First
- Menggunakan Tailwind CSS
- Menggunakan design token
- Tidak hardcode warna
- Tidak hardcode spacing
- Reusable
- Accessible
- Menggunakan typography sesuai DESIGN.md
- Konsisten dengan seluruh halaman lain
- Tidak membuat variasi komponen baru tanpa alasan kuat
- Mengutamakan kesederhanaan dibanding dekorasi visual

Apabila terdapat konflik antara kebutuhan fitur dan estetika, prioritaskan pengalaman pengguna (UX), keterbacaan, dan konsistensi desain.