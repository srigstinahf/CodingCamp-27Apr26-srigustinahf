# Requirements Document

## Introduction

Expense & Budget Visualizer adalah aplikasi web standalone yang memungkinkan pengguna mencatat pengeluaran harian, mengelompokkannya berdasarkan kategori, dan memvisualisasikan distribusi pengeluaran melalui pie chart interaktif. Aplikasi ini berjalan sepenuhnya di browser tanpa backend — semua data disimpan di Local Storage. Dibangun dengan HTML, CSS, dan Vanilla JavaScript, aplikasi ini dapat digunakan sebagai halaman web biasa maupun browser extension.

## Glossary

- **App**: Aplikasi web Expense & Budget Visualizer
- **Transaction**: Satu entri pengeluaran yang terdiri dari nama item, jumlah uang, dan kategori
- **Transaction_List**: Daftar seluruh transaksi yang telah ditambahkan oleh pengguna
- **Input_Form**: Formulir input untuk menambahkan transaksi baru
- **Balance_Display**: Komponen UI yang menampilkan total saldo/pengeluaran keseluruhan
- **Chart**: Pie chart yang memvisualisasikan distribusi pengeluaran per kategori
- **Storage**: Browser Local Storage API yang digunakan untuk menyimpan data transaksi
- **Category**: Pengelompokan transaksi; nilai default adalah Food, Transport, dan Fun; pengguna dapat menambahkan kategori kustom
- **Custom_Category**: Kategori yang dibuat oleh pengguna di luar kategori default
- **Sort_Control**: Kontrol UI untuk mengurutkan daftar transaksi
- **Theme_Toggle**: Tombol untuk beralih antara mode terang (light) dan gelap (dark)
- **Validator**: Komponen yang memvalidasi input sebelum transaksi disimpan

---

## Requirements

### Requirement 1: Input Form

**User Story:** Sebagai pengguna, saya ingin mengisi formulir dengan nama item, jumlah, dan kategori, agar saya dapat mencatat pengeluaran saya dengan cepat.

#### Acceptance Criteria

1. THE Input_Form SHALL menyediakan field teks untuk nama item, field angka untuk jumlah (amount), dan dropdown untuk kategori dengan pilihan default: Food, Transport, Fun, serta kategori kustom yang telah ditambahkan pengguna.
2. WHEN pengguna mengklik tombol submit, THE Validator SHALL memeriksa bahwa semua field (nama item, jumlah, kategori) telah diisi.
3. IF salah satu field kosong saat submit, THEN THE Input_Form SHALL menampilkan pesan error yang menjelaskan field mana yang belum diisi.
4. IF field jumlah diisi dengan nilai bukan angka positif, THEN THE Validator SHALL menolak input dan menampilkan pesan error yang sesuai.
5. WHEN transaksi berhasil ditambahkan, THE Input_Form SHALL mengosongkan semua field dan mereset dropdown ke nilai default.

---

### Requirement 2: Transaction List

**User Story:** Sebagai pengguna, saya ingin melihat daftar semua transaksi yang telah saya catat, agar saya dapat memantau riwayat pengeluaran saya.

#### Acceptance Criteria

1. THE Transaction_List SHALL menampilkan semua transaksi yang tersimpan, masing-masing menampilkan nama item, jumlah, dan kategori.
2. WHILE terdapat lebih dari sejumlah transaksi yang melebihi tinggi tampilan, THE Transaction_List SHALL dapat di-scroll secara vertikal.
3. WHEN pengguna mengklik tombol hapus pada sebuah transaksi, THE Transaction_List SHALL menghapus transaksi tersebut dari daftar dan dari Storage.
4. WHEN Transaction_List kosong, THE App SHALL menampilkan pesan kosong yang informatif kepada pengguna.

---

### Requirement 3: Total Balance

**User Story:** Sebagai pengguna, saya ingin melihat total pengeluaran saya secara keseluruhan, agar saya dapat mengetahui berapa banyak yang telah saya keluarkan.

#### Acceptance Criteria

1. THE Balance_Display SHALL menampilkan jumlah total dari seluruh nilai amount pada semua transaksi yang tersimpan.
2. WHEN sebuah transaksi baru ditambahkan, THE Balance_Display SHALL memperbarui nilai total secara otomatis tanpa memuat ulang halaman.
3. WHEN sebuah transaksi dihapus, THE Balance_Display SHALL memperbarui nilai total secara otomatis tanpa memuat ulang halaman.
4. THE Balance_Display SHALL memformat nilai total menggunakan format mata uang yang konsisten (contoh: Rp 150.000).

---

### Requirement 4: Visual Chart

**User Story:** Sebagai pengguna, saya ingin melihat pie chart distribusi pengeluaran per kategori, agar saya dapat memahami pola pengeluaran saya secara visual.

#### Acceptance Criteria

1. THE Chart SHALL menampilkan pie chart yang memvisualisasikan proporsi total pengeluaran untuk setiap kategori (Food, Transport, Fun).
2. WHEN sebuah transaksi baru ditambahkan, THE Chart SHALL memperbarui tampilan secara otomatis tanpa memuat ulang halaman.
3. WHEN sebuah transaksi dihapus, THE Chart SHALL memperbarui tampilan secara otomatis tanpa memuat ulang halaman.
4. THE Chart SHALL menampilkan label atau legenda yang mengidentifikasi setiap kategori beserta persentase atau nilainya.
5. WHEN Transaction_List kosong, THE Chart SHALL menampilkan state kosong yang sesuai (misalnya placeholder atau pesan "Belum ada data").

---

### Requirement 5: Data Persistence

**User Story:** Sebagai pengguna, saya ingin data pengeluaran saya tetap tersimpan saat saya menutup atau me-refresh browser, agar saya tidak kehilangan riwayat transaksi.

#### Acceptance Criteria

1. WHEN pengguna menambahkan sebuah transaksi, THE Storage SHALL menyimpan data transaksi tersebut ke Local Storage secara langsung.
2. WHEN pengguna menghapus sebuah transaksi, THE Storage SHALL menghapus data transaksi tersebut dari Local Storage secara langsung.
3. WHEN App dimuat (load/refresh), THE App SHALL membaca seluruh data transaksi dari Local Storage dan menampilkannya di Transaction_List, Balance_Display, dan Chart.
4. IF Local Storage tidak tersedia atau terjadi error saat membaca/menulis, THEN THE App SHALL menampilkan pesan error yang informatif kepada pengguna.

---

### Requirement 6: Browser Compatibility

**User Story:** Sebagai pengguna, saya ingin aplikasi berjalan dengan baik di browser yang saya gunakan sehari-hari, agar saya tidak perlu menginstal software tambahan.

#### Acceptance Criteria

1. THE App SHALL berfungsi dengan benar pada versi terbaru Chrome, Firefox, Edge, dan Safari.
2. THE App SHALL dapat dijalankan sebagai halaman web standalone (membuka file HTML langsung di browser) tanpa memerlukan server.
3. THE App SHALL dapat digunakan sebagai browser extension tanpa modifikasi pada kode inti.

---

### Requirement 7: Performance & Responsiveness

**User Story:** Sebagai pengguna, saya ingin aplikasi terasa cepat dan responsif, agar pengalaman mencatat pengeluaran tidak terasa lambat atau menjengkelkan.

#### Acceptance Criteria

1. THE App SHALL merender seluruh UI awal dalam waktu kurang dari 2 detik pada koneksi jaringan standar.
2. WHEN pengguna menambahkan atau menghapus transaksi, THE App SHALL memperbarui Transaction_List, Balance_Display, dan Chart dalam waktu kurang dari 300ms.
3. THE App SHALL menampilkan layout yang dapat digunakan pada lebar layar antara 320px hingga 1920px.

---

### Requirement 8: Code Structure

**User Story:** Sebagai developer, saya ingin struktur kode yang bersih dan terorganisir, agar aplikasi mudah dipelihara dan dikembangkan.

#### Acceptance Criteria

1. THE App SHALL menggunakan tepat satu file CSS di dalam direktori `css/`.
2. THE App SHALL menggunakan tepat satu file JavaScript di dalam direktori `js/`.
3. THE App SHALL menggunakan custom CSS untuk styling.
4. THE App SHALL tidak memerlukan build tool, bundler, atau proses kompilasi untuk dijalankan.

---

### Requirement 9: Custom Categories

**User Story:** Sebagai pengguna, saya ingin menambahkan kategori pengeluaran sendiri, agar saya dapat mencatat pengeluaran yang tidak masuk ke kategori default.

#### Acceptance Criteria

1. THE App SHALL menyediakan form atau input untuk menambahkan Custom_Category baru dengan nama yang ditentukan pengguna.
2. WHEN pengguna menambahkan Custom_Category, THE App SHALL menampilkan kategori tersebut di dropdown kategori pada Input_Form.
3. WHEN pengguna menambahkan Custom_Category, THE Storage SHALL menyimpan daftar kategori kustom ke Local Storage secara langsung.
4. WHEN App dimuat (load/refresh), THE App SHALL membaca daftar Custom_Category dari Local Storage dan menampilkannya di dropdown kategori.
5. IF nama Custom_Category kosong atau hanya whitespace, THEN THE App SHALL menampilkan pesan error dan tidak menyimpan kategori tersebut.
6. IF nama Custom_Category sudah ada (duplikat, case-insensitive), THEN THE App SHALL menampilkan pesan error dan tidak menyimpan kategori tersebut.
7. THE Chart SHALL menampilkan Custom_Category beserta datanya pada pie chart dengan warna yang berbeda dari kategori default.

---

### Requirement 10: Sort Transactions

**User Story:** Sebagai pengguna, saya ingin mengurutkan daftar transaksi berdasarkan jumlah atau kategori, agar saya dapat dengan mudah menemukan dan menganalisis pengeluaran saya.

#### Acceptance Criteria

1. THE App SHALL menyediakan Sort_Control yang memungkinkan pengguna memilih urutan tampilan transaksi.
2. THE Sort_Control SHALL menyediakan opsi pengurutan: berdasarkan tanggal ditambahkan (terbaru di atas, default), berdasarkan jumlah (amount) dari terbesar ke terkecil, berdasarkan jumlah dari terkecil ke terbesar, dan berdasarkan kategori (A–Z).
3. WHEN pengguna memilih opsi pengurutan, THE Transaction_List SHALL memperbarui urutan tampilan secara otomatis tanpa memuat ulang halaman.
4. THE Sort_Control SHALL menyimpan preferensi urutan yang dipilih pengguna ke Local Storage sehingga tetap aktif saat halaman di-refresh.
5. WHEN transaksi baru ditambahkan atau dihapus, THE Transaction_List SHALL tetap menampilkan transaksi sesuai urutan yang sedang aktif.

---

### Requirement 11: Dark/Light Mode Toggle

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara tampilan terang dan gelap, agar saya dapat menggunakan aplikasi dengan nyaman di berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. THE App SHALL menyediakan Theme_Toggle berupa tombol yang dapat diklik untuk beralih antara light mode dan dark mode.
2. WHEN pengguna mengklik Theme_Toggle, THE App SHALL mengubah tampilan seluruh antarmuka ke mode yang dipilih secara instan tanpa memuat ulang halaman.
3. THE Storage SHALL menyimpan preferensi tema yang dipilih pengguna ke Local Storage.
4. WHEN App dimuat (load/refresh), THE App SHALL membaca preferensi tema dari Local Storage dan menerapkannya secara otomatis.
5. IF tidak ada preferensi tema tersimpan, THE App SHALL menggunakan preferensi sistem operasi pengguna (`prefers-color-scheme`) sebagai nilai default.
6. THE Theme_Toggle SHALL menampilkan ikon atau label yang mencerminkan mode yang sedang aktif (misalnya ikon matahari untuk light mode, ikon bulan untuk dark mode).
