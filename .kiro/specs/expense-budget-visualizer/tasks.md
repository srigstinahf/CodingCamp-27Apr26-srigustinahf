# Implementation Plan: Expense & Budget Visualizer

## Overview

Implementasi aplikasi web client-side murni menggunakan HTML, plain CSS, dan Vanilla JavaScript. Tidak ada framework, tidak ada build tool, tidak ada backend. Semua komponen diimplementasi dalam tiga file: `index.html`, `css/style.css`, dan `js/app.js`.

## Tasks

- [x] 1. Buat struktur HTML dasar (`index.html`)
  - Buat file `index.html` di root folder `expense-budget-visualizer/`
  - Tambahkan elemen: `<header>`, global error banner (`#global-error`), layout dua kolom
  - Buat `<form id="transaction-form">` dengan field: input teks nama item (`#input-name`), input angka jumlah (`#input-amount`), dropdown kategori (`#input-category`) dengan opsi Food/Transport/Fun, tombol submit
  - Tambahkan elemen error inline di bawah setiap field form (`#error-name`, `#error-amount`, `#error-category`)
  - Buat section balance display (`#balance-display`) untuk menampilkan total pengeluaran
  - Buat container chart (`#chart-container`) dengan elemen `<canvas id="expense-chart">` dan div empty state (`#chart-empty`)
  - Buat container daftar transaksi (`#transaction-list`) dengan elemen empty state (`#list-empty`)
  - Sertakan Chart.js via CDN (`<script src="https://cdn.jsdelivr.net/npm/chart.js">`) dan `<link>` ke `css/style.css` dan `<script src="js/app.js" defer>`
  - _Requirements: 1.1, 2.4, 4.5, 8.1, 8.2, 8.4_

- [x] 2. Buat styling CSS dasar (`css/style.css`)
  - Buat file `css/style.css`
  - Definisikan CSS custom properties (variabel warna) di `:root` untuk warna-warna utama — ini akan digunakan ulang oleh fitur dark mode di Task 10
  - Implementasi CSS reset/base (box-sizing, margin, font)
  - Styling layout dua kolom untuk layar ≥ 600px (form di kiri, balance+chart di kanan) dan single column untuk < 600px menggunakan media query
  - Styling form: input fields, dropdown, tombol submit dengan hover/focus state
  - Styling error state: kelas `.input-error` (border merah pada field) dan `.error-message` (teks merah di bawah field)
  - Styling balance display: tampilan total pengeluaran yang menonjol
  - Styling chart container dan empty state chart
  - Styling transaction list: setiap item menampilkan nama, jumlah, kategori, dan tombol hapus; list scrollable jika overflow
  - Styling global error banner (`#global-error`) yang tersembunyi secara default
  - Pastikan layout usable pada lebar 320px hingga 1920px
  - **Catatan**: Styling untuk dark mode (`[data-theme="dark"]`), sort control, dan form custom category akan ditambahkan di Task 8–10
  - _Requirements: 1.3, 2.2, 7.3, 8.1, 8.3_

- [x] 3. Implementasi `StorageAPI` dan `formatRupiah` di `js/app.js`
  - Buat file `js/app.js`
  - Implementasi fungsi `formatRupiah(amount)` menggunakan `Intl.NumberFormat('id-ID')` dengan fallback regex untuk browser lama
  - Implementasi objek `StorageAPI` dengan:
    - `KEY: 'expense_transactions'`
    - `isAvailable()`: cek ketersediaan localStorage dengan try/catch write-read-delete
    - `load()`: baca dan parse JSON dari localStorage; kembalikan `[]` jika key tidak ada atau data corrupt (bungkus dalam try/catch)
    - `save(transactions)`: simpan array sebagai JSON string; kembalikan `{ success: boolean, error?: string }`
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4. Implementasi `Validator` di `js/app.js`
  - Tambahkan objek `Validator` ke `js/app.js`
  - Implementasi `isPositiveNumber(value)`: kembalikan `true` hanya jika value adalah string yang dapat dikonversi ke angka dan nilainya > 0
  - Implementasi `validateForm({ name, amount, category })`: periksa setiap field dan kembalikan `{ valid: boolean, errors: { name?, amount?, category? } }`
    - Nama kosong atau hanya whitespace → `"Nama item tidak boleh kosong"`
    - Amount kosong → `"Jumlah harus berupa angka"`
    - Amount bukan angka positif → `"Jumlah harus lebih dari 0"`
    - Kategori kosong → `"Pilih kategori pengeluaran"`
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 5. Implementasi `UIRenderer` di `js/app.js`
  - Tambahkan objek `UIRenderer` ke `js/app.js` dengan `chartInstance: null`
  - Implementasi `renderList(transactions)`: generate HTML item transaksi menggunakan `textContent` (bukan `innerHTML`) untuk nama item agar aman dari XSS; setiap item memiliki atribut `data-id` dan tombol hapus dengan `data-action="delete"`; tampilkan `#list-empty` jika array kosong
  - Implementasi `renderBalance(total)`: update teks di `#balance-display` menggunakan `formatRupiah(total)`
  - Implementasi `renderChart(categoryTotals)`: 
    - Jika semua nilai 0: destroy instance chart jika ada, set `chartInstance = null`, sembunyikan canvas, tampilkan `#chart-empty`
    - Jika instance sudah ada: update `data.datasets[0].data` dan panggil `chart.update()`
    - Jika belum ada: buat instance baru `new Chart(ctx, config)` dengan konfigurasi pie chart (labels: Food/Transport/Fun, warna: #FF6384/#36A2EB/#FFCE56, tooltip format Rupiah)
    - Cek `typeof Chart === 'undefined'` sebelum render; jika Chart.js tidak tersedia, sembunyikan container chart
  - Implementasi `showFormErrors(errors)`: tambahkan kelas `.input-error` ke field yang error dan tampilkan teks error di elemen `#error-*` yang sesuai
  - Implementasi `clearFormErrors()`: hapus kelas `.input-error` dari semua field dan kosongkan semua elemen `#error-*`
  - Implementasi `resetForm()`: reset semua field form ke nilai default menggunakan `form.reset()`
  - Implementasi `showGlobalError(message)`: tampilkan banner `#global-error` dengan pesan yang diberikan
  - _Requirements: 1.3, 1.5, 2.1, 2.2, 2.4, 3.1, 3.4, 4.1, 4.4, 4.5_

- [x] 6. Implementasi `AppState` di `js/app.js`
  - Tambahkan objek `AppState` ke `js/app.js` dengan `transactions: []`
  - Implementasi `getTotalBalance()`: jumlahkan semua `amount` dari `this.transactions`; kembalikan 0 jika array kosong
  - Implementasi `getCategoryTotals()`: iterasi `this.transactions` dan akumulasi total per kategori; kembalikan `{ Food: 0, Transport: 0, Fun: 0 }` sebagai nilai default
  - Implementasi `addTransaction({ name, amount, category })`: buat objek Transaction baru dengan `id` dari `crypto.randomUUID()` (atau fallback), `createdAt` dari `new Date().toISOString()`, simpan via `StorageAPI.save()`, push ke `this.transactions`, panggil `renderAll()`
  - Implementasi `deleteTransaction(id)`: filter `this.transactions` untuk menghapus item dengan id tersebut, simpan via `StorageAPI.save()`, panggil `renderAll()`
  - Implementasi `init()`: load transaksi dari `StorageAPI.load()`, assign ke `this.transactions`, panggil `renderAll()`
  - Tambahkan fungsi helper `renderAll()` yang memanggil `UIRenderer.renderList()`, `UIRenderer.renderBalance()`, dan `UIRenderer.renderChart()` secara berurutan
  - _Requirements: 2.1, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 7. Implementasi Event Handlers dan inisialisasi di `js/app.js`
  - Implementasi `handleFormSubmit(event)`: panggil `event.preventDefault()`, ambil nilai dari semua field form, panggil `UIRenderer.clearFormErrors()`, validasi dengan `Validator.validateForm()`, jika tidak valid panggil `UIRenderer.showFormErrors(errors)` dan return, jika valid panggil `AppState.addTransaction()` lalu `UIRenderer.resetForm()`
  - Implementasi `handleDeleteClick(event)` dengan event delegation: cek `e.target.matches('[data-action="delete"]')`, ambil `id` dari `e.target.closest('[data-id]').dataset.id`, panggil `AppState.deleteTransaction(id)`
  - Tambahkan listener `input` pada setiap field form untuk menghapus error inline saat pengguna mulai mengetik (panggil `clearFormErrors` atau hapus error field spesifik)
  - Bungkus semua inisialisasi dalam `document.addEventListener('DOMContentLoaded', () => { ... })`:
    - Cek `StorageAPI.isAvailable()`, jika false panggil `UIRenderer.showGlobalError(...)`
    - Panggil `AppState.init()`
    - Daftarkan `handleFormSubmit` pada form submit event
    - Daftarkan `handleDeleteClick` pada `#transaction-list` click event
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.3, 3.2, 3.3, 4.2, 4.3, 5.4_

- [x] 8. Implementasi Custom Categories
  - Tambahkan form tambah kategori di `index.html`: input teks (`#input-new-category`), tombol submit (`#btn-add-category`), dan elemen error inline (`#error-new-category`)
  - Tambahkan styling form custom category di `css/style.css`: layout input + tombol sejajar, error message, dan styling tombol
  - Tambahkan di `StorageAPI`: `CATEGORIES_KEY`, `loadCategories()`, `saveCategories(categories)`
  - Tambahkan di `AppState`: `customCategories: []`, `getAllCategories()` (gabungkan default + kustom), `addCustomCategory(name)` dengan validasi duplikat dan panjang nama
  - Tambahkan di `UIRenderer`: `renderCategoryDropdown(categories)` yang memperbarui opsi dropdown `#input-category` di form
  - Implementasi `handleAddCategory(event)`: validasi nama tidak kosong dan tidak duplikat (case-insensitive), panggil `AppState.addCustomCategory()`, perbarui dropdown via `UIRenderer.renderCategoryDropdown()`
  - Pastikan `AppState.init()` memanggil `StorageAPI.loadCategories()` dan `UIRenderer.renderCategoryDropdown()` saat startup
  - Pastikan `getCategoryTotals()` menggunakan map dinamis (bukan hardcode Food/Transport/Fun) sehingga kategori kustom otomatis masuk ke chart
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 9. Implementasi Sort Transactions
  - Tambahkan Sort_Control di `index.html`: elemen `<select id="sort-control">` dengan opsi: `amount-desc` (Jumlah: Terbesar), `amount-asc` (Jumlah: Terkecil), `category-asc` (Kategori: A–Z)
  - Tambahkan styling sort control di `css/style.css`: posisi di atas transaction list, alignment dengan header list
  - Tambahkan di `StorageAPI`: `SORT_KEY`, `loadSortPreference()`, `saveSortPreference(value)`
  - Tambahkan di `AppState`: `sortPreference: 'amount-desc'` (default), `getSortedTransactions()` yang mengembalikan salinan array terurut tanpa mengubah `transactions` asli, `setSortPreference(value)` yang menyimpan ke storage dan memanggil `renderAll()`
  - Implementasi `handleSortChange(event)`: ambil nilai dari `#sort-control`, panggil `AppState.setSortPreference(value)`
  - Update `UIRenderer.renderList()` agar menerima array yang sudah terurut (dipanggil dengan `AppState.getSortedTransactions()` dari `renderAll()`)
  - Pastikan `AppState.init()` memuat preferensi sort dari storage dan menerapkannya ke `#sort-control` (set `value` pada elemen select)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10. Implementasi Dark/Light Mode Toggle
  - Tambahkan Theme_Toggle di `index.html` pada header: tombol `<button id="theme-toggle">` dengan ikon/label yang mencerminkan mode aktif (☀️ untuk light, 🌙 untuk dark)
  - Tambahkan CSS dark mode di `css/style.css`: selector `[data-theme="dark"]` yang meng-override variabel warna di `:root` — semua komponen (form, list, chart container, header, tombol) otomatis mengikuti karena sudah menggunakan variabel CSS dari Task 2; tambahkan juga styling tombol theme toggle
  - Tambahkan di `StorageAPI`: `THEME_KEY`, `loadTheme()`, `saveTheme(theme)`
  - Tambahkan di `AppState`: `theme: 'light'`, `toggleTheme()` yang beralih antara `'light'` dan `'dark'`, menyimpan ke storage, dan memanggil `UIRenderer.applyTheme()` dan `UIRenderer.updateThemeToggle()`
  - Tambahkan di `UIRenderer`: `applyTheme(theme)` yang set `document.documentElement.setAttribute('data-theme', theme)`, `updateThemeToggle(theme)` yang memperbarui ikon/label tombol
  - Implementasi `handleThemeToggle()`: panggil `AppState.toggleTheme()`
  - Pastikan `AppState.init()` mendeteksi preferensi sistem via `window.matchMedia('(prefers-color-scheme: dark)')` sebagai fallback jika tidak ada preferensi tersimpan, lalu terapkan tema sebelum render
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 11. Checkpoint — Verifikasi integrasi keseluruhan
  - Buka `index.html` langsung di browser (tanpa server)
  - Verifikasi fitur inti: tambah transaksi, hapus, balance update, chart update, data persist setelah refresh
  - Verifikasi custom categories: tambah kategori baru, muncul di dropdown dan chart, tersimpan setelah refresh
  - Verifikasi sort: ubah opsi sort, daftar berubah urutan, preferensi tersimpan setelah refresh
  - Verifikasi dark/light mode: klik toggle, seluruh UI berubah tema, preferensi tersimpan setelah refresh
  - Verifikasi responsive: resize ke 320px, semua fitur tetap usable
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan.

## Notes

- Semua kode ditulis dalam tiga file saja: `index.html`, `css/style.css`, `js/app.js`
- Tidak ada build tool, bundler, atau server yang diperlukan — buka langsung di browser
- Gunakan `textContent` (bukan `innerHTML`) untuk konten yang berasal dari input pengguna agar aman dari XSS
- Chart.js dimuat via CDN; selalu cek `typeof Chart === 'undefined'` sebelum menggunakannya
- Event delegation digunakan untuk tombol hapus agar tidak ada memory leak saat list di-render ulang
- Setiap perubahan data selalu memanggil `renderAll()` untuk menjaga sinkronisasi semua komponen UI
- Tema diimplementasi via CSS custom properties dan atribut `data-theme` pada `<html>` — tidak perlu JavaScript untuk setiap elemen
- Sort dilakukan in-memory pada salinan array, urutan asli `transactions` tidak diubah
- `getCategoryTotals()` menggunakan map dinamis sehingga kategori kustom otomatis masuk ke chart tanpa perubahan kode
