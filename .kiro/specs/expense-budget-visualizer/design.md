# Design Document

## Expense & Budget Visualizer

---

## Overview

Expense & Budget Visualizer adalah aplikasi web standalone berbasis browser yang memungkinkan pengguna mencatat, mengelola, dan memvisualisasikan pengeluaran harian. Aplikasi ini dibangun sepenuhnya dengan HTML, plain CSS, dan Vanilla JavaScript — tanpa framework, tanpa build tool, tanpa backend.

Semua data disimpan di Browser Local Storage sehingga persisten antar sesi. Chart.js (via CDN) digunakan untuk merender pie chart distribusi pengeluaran per kategori.

### Tujuan Desain

- **Simplicity**: Satu file HTML, satu file CSS, satu file JS — mudah dibuka langsung di browser.
- **Responsiveness**: Layout yang berfungsi dari 320px hingga 1920px.
- **Reactivity**: Setiap perubahan data (tambah/hapus transaksi) langsung memperbarui semua komponen UI tanpa reload.
- **Resilience**: Error handling untuk Local Storage yang tidak tersedia atau corrupt.
- **Extensibility**: Kategori kustom, pengurutan, dan tema dapat ditambahkan tanpa mengubah arsitektur inti.

---

## Architecture

Aplikasi menggunakan arsitektur **MVC sederhana tanpa framework** yang sepenuhnya berjalan di browser:

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                        │
│  (struktur DOM: form, list, balance display, chart)      │
└──────────────────────────┬──────────────────────────────┘
                           │ loads
                           ▼
┌─────────────────────────────────────────────────────────┐
│                         js/app.js                        │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  StorageAPI  │   │  AppState    │   │  UIRenderer  │  │
│  │  (Model)     │◄──│  (Controller)│──►│  (View)      │  │
│  └─────────────┘   └──────────────┘   └──────────────┘  │
│         │                  │                  │          │
│  LocalStorage        Event Handlers      DOM + Chart.js  │
└─────────────────────────────────────────────────────────┘
                           │ styles
                           ▼
┌─────────────────────────────────────────────────────────┐
│                       css/style.css                      │
│  (layout, komponen, responsiveness, animasi)             │
└─────────────────────────────────────────────────────────┘
```

### Alur Data

```
User Input
    │
    ▼
Event Handler (submit/delete)
    │
    ▼
Validator ──► Error? ──► Tampilkan pesan error, stop
    │
    ▼ (valid)
StorageAPI.save() / StorageAPI.delete()
    │
    ▼
AppState.transactions (in-memory array)
    │
    ├──► UIRenderer.renderList()
    ├──► UIRenderer.renderBalance()
    └──► UIRenderer.renderChart()
```

### Prinsip Reaktivitas

Setiap kali data berubah, fungsi `renderAll()` dipanggil. Fungsi ini memanggil ketiga renderer secara berurutan sehingga semua komponen UI selalu sinkron dengan state terkini.

---

## Components and Interfaces

### 1. StorageAPI

Modul yang mengenkapsulasi semua interaksi dengan `localStorage`. Tidak ada komponen lain yang mengakses `localStorage` secara langsung.

```javascript
const StorageAPI = {
  KEY: 'expense_transactions',
  CATEGORIES_KEY: 'expense_custom_categories',
  SORT_KEY: 'expense_sort_preference',
  THEME_KEY: 'expense_theme',

  // Membaca semua transaksi dari localStorage
  // Returns: Transaction[] | [] (array kosong jika tidak ada data atau error)
  load(): Transaction[],

  // Menyimpan seluruh array transaksi ke localStorage
  // Params: transactions: Transaction[]
  // Returns: { success: boolean, error?: string }
  save(transactions): Result,

  // Membaca daftar kategori kustom dari localStorage
  // Returns: string[] | [] (array kosong jika tidak ada data)
  loadCategories(): string[],

  // Menyimpan daftar kategori kustom ke localStorage
  // Params: categories: string[]
  // Returns: { success: boolean, error?: string }
  saveCategories(categories): Result,

  // Membaca preferensi sort dari localStorage
  // Returns: string | null
  loadSortPreference(): string | null,

  // Menyimpan preferensi sort ke localStorage
  // Params: sortValue: string
  saveSortPreference(sortValue): void,

  // Membaca preferensi tema dari localStorage
  // Returns: 'light' | 'dark' | null
  loadTheme(): string | null,

  // Menyimpan preferensi tema ke localStorage
  // Params: theme: 'light' | 'dark'
  saveTheme(theme): void,

  // Mengecek apakah localStorage tersedia di browser ini
  // Returns: boolean
  isAvailable(): boolean,
}
```

### 2. Validator

Modul pure-function yang memvalidasi input form sebelum transaksi dibuat.

```javascript
const Validator = {
  // Memvalidasi data form input
  // Params: { name: string, amount: string, category: string }
  // Returns: { valid: boolean, errors: { name?: string, amount?: string, category?: string } }
  validateForm(formData): ValidationResult,

  // Memvalidasi bahwa amount adalah angka positif
  // Params: value: string
  // Returns: boolean
  isPositiveNumber(value): boolean,
}
```

### 3. AppState

Objek tunggal (singleton) yang menyimpan state aplikasi di memori dan mengkoordinasikan operasi.

```javascript
const AppState = {
  transactions: Transaction[],    // array transaksi in-memory
  customCategories: string[],     // array nama kategori kustom
  sortPreference: string,         // 'date-desc' | 'amount-desc' | 'amount-asc' | 'category-asc'
  theme: string,                  // 'light' | 'dark'

  // Inisialisasi: load dari storage, terapkan tema, render semua komponen
  init(): void,

  // Menambah transaksi baru
  // Params: { name: string, amount: number, category: string }
  addTransaction(data): void,

  // Menghapus transaksi berdasarkan ID
  // Params: id: string
  deleteTransaction(id): void,

  // Menambah kategori kustom baru
  // Params: categoryName: string
  // Returns: { success: boolean, error?: string }
  addCustomCategory(categoryName): Result,

  // Mengembalikan semua kategori (default + kustom)
  // Returns: string[]
  getAllCategories(): string[],

  // Mengembalikan transaksi yang sudah diurutkan sesuai sortPreference
  // Returns: Transaction[]
  getSortedTransactions(): Transaction[],

  // Mengubah preferensi pengurutan
  // Params: sortValue: string
  setSortPreference(sortValue): void,

  // Beralih antara light dan dark mode
  toggleTheme(): void,

  // Menghitung total balance dari semua transaksi
  // Returns: number
  getTotalBalance(): number,

  // Menghitung total per kategori untuk chart (termasuk kategori kustom)
  // Returns: { [category: string]: number }
  getCategoryTotals(): CategoryTotals,
}
```

### 4. UIRenderer

Modul yang bertanggung jawab atas semua manipulasi DOM dan rendering Chart.js.

```javascript
const UIRenderer = {
  chartInstance: null,  // referensi ke instance Chart.js aktif

  // Merender ulang seluruh daftar transaksi di DOM (sudah terurut)
  // Params: transactions: Transaction[]
  renderList(transactions): void,

  // Memperbarui tampilan total balance
  // Params: total: number
  renderBalance(total): void,

  // Memperbarui atau membuat ulang pie chart (mendukung kategori dinamis)
  // Params: categoryTotals: CategoryTotals
  renderChart(categoryTotals): void,

  // Merender ulang dropdown kategori di form (default + kustom)
  // Params: categories: string[]
  renderCategoryDropdown(categories): void,

  // Menampilkan pesan error pada field form tertentu
  // Params: errors: { name?: string, amount?: string, category?: string }
  showFormErrors(errors): void,

  // Menghapus semua pesan error dari form
  clearFormErrors(): void,

  // Mereset semua field form ke nilai default
  resetForm(): void,

  // Menampilkan notifikasi error global (misal: localStorage tidak tersedia)
  showGlobalError(message): void,

  // Menerapkan tema ke elemen <html> via atribut data-theme
  // Params: theme: 'light' | 'dark'
  applyTheme(theme): void,

  // Memperbarui ikon/label pada Theme_Toggle sesuai tema aktif
  // Params: theme: 'light' | 'dark'
  updateThemeToggle(theme): void,
}
```

### 5. Event Handlers

Fungsi-fungsi yang terhubung ke event DOM, didaftarkan saat `DOMContentLoaded`.

```javascript
// Handler untuk submit form transaksi
function handleFormSubmit(event): void

// Handler untuk klik tombol hapus (event delegation pada container list)
function handleDeleteClick(event): void

// Handler untuk submit form tambah kategori kustom
function handleAddCategory(event): void

// Handler untuk perubahan opsi sort
function handleSortChange(event): void

// Handler untuk klik Theme_Toggle
function handleThemeToggle(): void
```

---

## Data Models

### Transaction

Representasi satu entri pengeluaran.

```javascript
/**
 * @typedef {Object} Transaction
 * @property {string} id        - UUID unik, dibuat dengan crypto.randomUUID() atau fallback
 * @property {string} name      - Nama item pengeluaran (non-empty string)
 * @property {number} amount    - Jumlah pengeluaran dalam Rupiah (angka positif)
 * @property {string} category  - Salah satu dari: 'Food' | 'Transport' | 'Fun'
 * @property {string} createdAt - ISO 8601 timestamp saat transaksi dibuat
 */
```

Contoh:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Makan siang",
  "amount": 35000,
  "category": "Food",
  "createdAt": "2024-01-15T12:30:00.000Z"
}
```

### ValidationResult

```javascript
/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {Object} errors
 * @property {string} [errors.name]     - Pesan error untuk field nama
 * @property {string} [errors.amount]   - Pesan error untuk field amount
 * @property {string} [errors.category] - Pesan error untuk field kategori
 */
```

### CategoryTotals

```javascript
/**
 * @typedef {Object} CategoryTotals
 * @description Map dinamis dari nama kategori ke total amount.
 *              Mendukung kategori default (Food, Transport, Fun) dan kategori kustom.
 * @example { Food: 50000, Transport: 15000, Fun: 30000, Kesehatan: 20000 }
 */
```

### Result

```javascript
/**
 * @typedef {Object} Result
 * @property {boolean} success
 * @property {string}  [error] - Pesan error jika success === false
 */
```

### Local Storage Schema

Data disimpan sebagai JSON string dengan beberapa key terpisah:

**Key `'expense_transactions'`** — array transaksi:
```json
[
  {
    "id": "a1b2c3d4-...",
    "name": "Makan siang",
    "amount": 35000,
    "category": "Food",
    "createdAt": "2024-01-15T12:30:00.000Z"
  }
]
```

**Key `'expense_custom_categories'`** — array nama kategori kustom:
```json
["Kesehatan", "Pendidikan", "Hiburan"]
```

**Key `'expense_sort_preference'`** — string preferensi sort:
```json
"amount-desc"
```

**Key `'expense_theme'`** — string preferensi tema:
```json
"dark"
```

---

## Error Handling

### Strategi Error Handling

Aplikasi ini tidak memiliki backend, sehingga semua error bersifat lokal (DOM, Local Storage, Chart.js).

#### 1. Validasi Form

- Error ditampilkan **inline** di bawah masing-masing field yang bermasalah.
- Kelas CSS `.error-message` digunakan untuk styling pesan error.
- Kelas CSS `.input-error` ditambahkan ke field yang invalid untuk border merah.
- Error dihapus saat pengguna mulai mengetik di field tersebut (`input` event).

```
Field kosong     → "Nama item tidak boleh kosong"
Amount bukan angka → "Jumlah harus berupa angka"
Amount ≤ 0       → "Jumlah harus lebih dari 0"
Kategori kosong  → "Pilih kategori pengeluaran"
```

#### 2. Local Storage Tidak Tersedia

- Dicek saat `AppState.init()` dengan `StorageAPI.isAvailable()`.
- Jika tidak tersedia: tampilkan banner error global di atas halaman.
- Aplikasi tetap berfungsi secara in-memory (data hilang saat refresh).

#### 3. Data Corrupt di Local Storage

- Saat `StorageAPI.load()`, parsing JSON dibungkus dalam `try/catch`.
- Jika parsing gagal: kembalikan array kosong, tampilkan pesan peringatan.
- Data corrupt dihapus dari storage agar tidak mengganggu sesi berikutnya.

#### 4. Chart.js Gagal Load (CDN tidak tersedia)

- Dicek dengan `typeof Chart === 'undefined'` setelah DOM ready.
- Jika Chart.js tidak tersedia: sembunyikan container chart, tampilkan pesan fallback.

#### 5. ID Generation Fallback

- `crypto.randomUUID()` digunakan sebagai primary method.
- Fallback ke `Date.now().toString(36) + Math.random().toString(36)` jika tidak tersedia (browser lama).

#### 6. Validasi Custom Category

- Nama kosong atau hanya whitespace → tampilkan error inline.
- Nama duplikat (case-insensitive) → tampilkan error "Kategori sudah ada".
- Nama terlalu panjang (> 30 karakter) → tampilkan error "Nama kategori terlalu panjang".

---

## Testing Strategy

> **Catatan**: Bagian ini bersifat **referensi saja** dan tidak perlu diimplementasikan. Sesuai batasan teknis, tidak ada test setup yang diperlukan (`No test setup required`).

Jika di kemudian hari ingin menambahkan testing, berikut skenario yang relevan sebagai panduan verifikasi manual di browser:

| Skenario | Expected Result |
|---|---|
| Buka halaman pertama kali | Tampil empty state di list dan chart |
| Tambah transaksi valid | List, balance, chart semua update |
| Tambah transaksi dengan field kosong | Error inline muncul, tidak ada data tersimpan |
| Hapus transaksi | List, balance, chart semua update |
| Refresh halaman | Data tetap ada (dari localStorage) |
| Hapus semua transaksi | Empty state kembali muncul |
| Resize window ke 320px | Layout tetap usable |
| Buka di Chrome, Firefox, Edge, Safari | Semua berfungsi normal |

---

## Layout & UI Structure

### Wireframe Layout

```
┌──────────────────────────────────────────────────────┐
│   Expense & Budget Visualizer          [☀️/🌙 Toggle] │  ← header
├──────────────────────────────────────────────────────┤
│  [Global Error Banner — hanya muncul jika ada error]  │
├───────────────────────┬──────────────────────────────┤
│                       │                              │
│   INPUT FORM          │   TOTAL BALANCE              │
│   ┌───────────────┐   │   ┌──────────────────────┐   │
│   │ Nama Item     │   │   │  Total Pengeluaran   │   │
│   └───────────────┘   │   │  Rp 0                │   │
│   ┌───────────────┐   │   └──────────────────────┘   │
│   │ Jumlah (Rp)   │   │                              │
│   └───────────────┘   │   PIE CHART                  │
│   ┌───────────────┐   │   ┌──────────────────────┐   │
│   │ Kategori ▼    │   │   │                      │   │
│   └───────────────┘   │   │    [Chart.js Pie]    │   │
│   [Tambah]            │   │                      │   │
│                       │   └──────────────────────┘   │
│   TAMBAH KATEGORI     │                              │
│   ┌───────────────┐   │                              │
│   │ Nama Kategori │   │                              │
│   └───────────────┘   │                              │
│   [+ Tambah Kategori] │                              │
├───────────────────────┴──────────────────────────────┤
│   TRANSACTION LIST          Urutkan: [Dropdown Sort] │
│  ┌──────────────────────────────────────────────┐    │
│  │ Makan siang   Rp 35.000   Food    [Hapus]   │    │
│  │ Ojek online   Rp 15.000 Transport [Hapus]   │    │
│  │ ...                                          │    │
│  └──────────────────────────────────────────────┘    │
│  (scrollable jika overflow)                          │
└──────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| < 600px | Single column: form → balance → chart → list |
| ≥ 600px | Two column: form (kiri) + balance+chart (kanan), list di bawah |

### Chart.js Configuration

Chart mendukung kategori dinamis — labels dan data dibangun dari `getCategoryTotals()` sehingga kategori kustom otomatis muncul di chart.

```javascript
// Palet warna: 3 warna default + warna tambahan untuk kategori kustom
const CATEGORY_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

// Konfigurasi pie chart (labels dan data bersifat dinamis)
{
  type: 'pie',
  data: {
    labels: Object.keys(categoryTotals),           // dinamis
    datasets: [{
      data: Object.values(categoryTotals),          // dinamis
      backgroundColor: labels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
      borderWidth: 2,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 13 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: Rp ${formatNumber(ctx.raw)}`
        }
      }
    }
  }
}
```

**Empty State Chart**: Jika semua kategori bernilai 0, chart diganti dengan elemen `<div>` yang menampilkan teks "Belum ada data pengeluaran".

### Currency Formatting

Format Rupiah menggunakan `Intl.NumberFormat` dengan fallback manual:

```javascript
function formatRupiah(amount) {
  try {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
  } catch (e) {
    // Fallback untuk browser yang tidak support Intl
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
```

---

## Implementation Notes

### Dark/Light Mode

Tema diimplementasi menggunakan atribut `data-theme` pada elemen `<html>` dan CSS custom properties:

```css
/* Light mode (default) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --accent-color: #4f46e5;
}

/* Dark mode */
[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border-color: #2d2d4e;
  --accent-color: #818cf8;
}
```

Toggle tema menggunakan JavaScript:
```javascript
function toggleTheme() {
  const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
  AppState.theme = newTheme;
  StorageAPI.saveTheme(newTheme);
  UIRenderer.applyTheme(newTheme);
  UIRenderer.updateThemeToggle(newTheme);
}
```

Deteksi preferensi sistem saat pertama kali load:
```javascript
const savedTheme = StorageAPI.loadTheme();
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
AppState.theme = savedTheme || systemTheme;
```

### Sort Transactions

Pengurutan dilakukan in-memory pada `AppState.getSortedTransactions()` tanpa mengubah urutan array `transactions` asli:

```javascript
getSortedTransactions() {
  const sorted = [...this.transactions];
  switch (this.sortPreference) {
    case 'amount-desc':  return sorted.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':   return sorted.sort((a, b) => a.amount - b.amount);
    case 'category-asc': return sorted.sort((a, b) => a.category.localeCompare(b.category));
    case 'date-desc':
    default:             return sorted.reverse(); // terbaru di atas (default)
  }
}
```

### Urutan Inisialisasi (`DOMContentLoaded`)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  if (!StorageAPI.isAvailable()) {
    UIRenderer.showGlobalError('Local Storage tidak tersedia. Data tidak akan tersimpan.');
  }
  AppState.init();           // load dari storage, terapkan tema, render semua
  registerEventHandlers();   // pasang event listeners (form, delete, sort, theme, add-category)
});
```

### Event Delegation untuk Delete

Tombol hapus menggunakan event delegation pada container list, bukan event listener per item. Ini menghindari memory leak saat item di-render ulang:

```javascript
document.getElementById('transaction-list').addEventListener('click', (e) => {
  if (e.target.matches('[data-action="delete"]')) {
    const id = e.target.closest('[data-id]').dataset.id;
    AppState.deleteTransaction(id);
  }
});
```

### Chart Instance Management

Chart.js instance disimpan di `UIRenderer.chartInstance`. Setiap kali data berubah:
1. Jika instance sudah ada → update `data.datasets[0].data` dan panggil `chart.update()`.
2. Jika belum ada → buat instance baru dengan `new Chart(ctx, config)`.
3. Jika semua data 0 → panggil `chart.destroy()`, set `chartInstance = null`, tampilkan empty state.

### Keamanan Input

- Nama item di-escape sebelum dimasukkan ke DOM menggunakan `textContent` (bukan `innerHTML`) untuk mencegah XSS.
- Amount dikonversi ke `Number` dan divalidasi sebelum disimpan.
