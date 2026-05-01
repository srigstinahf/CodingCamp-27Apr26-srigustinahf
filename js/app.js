/* ============================================================
   Expense & Budget Visualizer — app.js
   Vanilla JavaScript, no frameworks, no build tools
   ============================================================ */

'use strict';

/* ============================================================
   Utility: Format Rupiah
   ============================================================ */

/**
 * Format angka ke format mata uang Rupiah.
 * @param {number} amount
 * @returns {string} e.g. "Rp 35.000"
 */
function formatRupiah(amount) {
  try {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
  } catch (e) {
    // Fallback untuk browser yang tidak support Intl
    return 'Rp ' + String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}

/* ============================================================
   StorageAPI — enkapsulasi semua akses ke localStorage
   ============================================================ */

const StorageAPI = {
  KEY:            'expense_transactions',
  CATEGORIES_KEY: 'expense_custom_categories',
  SORT_KEY:       'expense_sort_preference',
  THEME_KEY:      'expense_theme',

  /**
   * Cek apakah localStorage tersedia di browser ini.
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Baca semua transaksi dari localStorage.
   * @returns {Transaction[]}
   */
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('StorageAPI.load: data corrupt, resetting.', e);
      try { localStorage.removeItem(this.KEY); } catch (_) {}
      return [];
    }
  },

  /**
   * Simpan seluruh array transaksi ke localStorage.
   * @param {Transaction[]} transactions
   * @returns {{ success: boolean, error?: string }}
   */
  save(transactions) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(transactions));
      return { success: true };
    } catch (e) {
      console.error('StorageAPI.save error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Baca daftar kategori kustom dari localStorage.
   * @returns {string[]}
   */
  loadCategories() {
    try {
      const raw = localStorage.getItem(this.CATEGORIES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('StorageAPI.loadCategories: data corrupt.', e);
      return [];
    }
  },

  /**
   * Simpan daftar kategori kustom ke localStorage.
   * @param {string[]} categories
   * @returns {{ success: boolean, error?: string }}
   */
  saveCategories(categories) {
    try {
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Baca preferensi sort dari localStorage.
   * @returns {string|null}
   */
  loadSortPreference() {
    try {
      return localStorage.getItem(this.SORT_KEY);
    } catch (e) {
      return null;
    }
  },

  /**
   * Simpan preferensi sort ke localStorage.
   * @param {string} sortValue
   */
  saveSortPreference(sortValue) {
    try {
      localStorage.setItem(this.SORT_KEY, sortValue);
    } catch (e) {
      console.warn('StorageAPI.saveSortPreference error:', e);
    }
  },

  /**
   * Baca preferensi tema dari localStorage.
   * @returns {'light'|'dark'|null}
   */
  loadTheme() {
    try {
      return localStorage.getItem(this.THEME_KEY);
    } catch (e) {
      return null;
    }
  },

  /**
   * Simpan preferensi tema ke localStorage.
   * @param {'light'|'dark'} theme
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (e) {
      console.warn('StorageAPI.saveTheme error:', e);
    }
  },
};

/* ============================================================
   Validator — validasi input form
   ============================================================ */

const Validator = {
  /**
   * Cek apakah value adalah angka positif.
   * @param {string} value
   * @returns {boolean}
   */
  isPositiveNumber(value) {
    const num = Number(value);
    return value.trim() !== '' && !isNaN(num) && num > 0;
  },

  /**
   * Validasi data form transaksi.
   * @param {{ name: string, amount: string, category: string }} formData
   * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
   */
  validateForm({ name, amount, category }) {
    const errors = {};

    if (!name || name.trim() === '') {
      errors.name = 'Nama item tidak boleh kosong';
    }

    if (!amount || amount.trim() === '') {
      errors.amount = 'Jumlah harus berupa angka';
    } else if (!this.isPositiveNumber(amount)) {
      errors.amount = 'Jumlah harus lebih dari 0';
    }

    if (!category || category === '') {
      errors.category = 'Pilih kategori pengeluaran';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/* ============================================================
   Category Colors — palet warna untuk badge & chart
   Urutan sesuai kategori default, lalu kustom bergilir
   ============================================================ */

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

const CATEGORY_COLORS = [
  '#FF6384', // Food
  '#36A2EB', // Transport
  '#FFCE56', // Fun
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
];

/**
 * Dapatkan warna untuk kategori berdasarkan indeks di daftar semua kategori.
 * @param {string} category
 * @param {string[]} allCategories
 * @returns {string} hex color
 */
function getCategoryColor(category, allCategories) {
  const idx = allCategories.indexOf(category);
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length] || '#aaaaaa';
}

/**
 * Tentukan apakah warna latar badge cukup terang sehingga teks harus gelap.
 * Digunakan untuk memastikan kontras teks yang baik pada semua warna badge.
 * @param {string} hex - warna hex e.g. "#FFCE56"
 * @returns {boolean}
 */
function isBrightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Luminance formula (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65;
}

/* ============================================================
   UIRenderer — semua manipulasi DOM & Chart.js
   ============================================================ */

const UIRenderer = {
  /** @type {Chart|null} */
  chartInstance: null,

  /**
   * Render ulang daftar transaksi di DOM.
   * @param {Transaction[]} transactions — sudah terurut
   * @param {string[]} allCategories
   */
  renderList(transactions, allCategories) {
    const container = document.getElementById('transaction-list');
    const emptyState = document.getElementById('list-empty');

    // Hapus semua item lama (kecuali empty state)
    const existingItems = container.querySelectorAll('.transaction-item');
    existingItems.forEach(el => el.remove());

    if (transactions.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    transactions.forEach(tx => {
      const item = document.createElement('li');
      item.className = 'transaction-item';
      item.dataset.id = tx.id;

      // Nama
      const nameEl = document.createElement('span');
      nameEl.className = 'transaction-item__name';
      nameEl.textContent = tx.name;

      // Badge kategori — warna diterapkan via inline style agar mendukung
      // jumlah kategori tak terbatas tanpa perlu menambah CSS class baru
      const badgeEl = document.createElement('span');
      badgeEl.className = 'category-badge';
      const badgeColor = getCategoryColor(tx.category, allCategories);
      badgeEl.style.backgroundColor = badgeColor;
      // Teks gelap untuk warna latar terang (kuning, dll), putih untuk latar gelap
      badgeEl.style.color = isBrightColor(badgeColor) ? 'rgba(0,0,0,0.75)' : '#ffffff';
      badgeEl.textContent = tx.category;

      // Jumlah
      const amountEl = document.createElement('span');
      amountEl.className = 'transaction-item__amount';
      amountEl.textContent = formatRupiah(tx.amount);

      // Tombol hapus
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn--danger';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.setAttribute('aria-label', 'Hapus transaksi ' + tx.name);
      deleteBtn.textContent = 'Hapus';

      item.appendChild(nameEl);
      item.appendChild(badgeEl);
      item.appendChild(amountEl);
      item.appendChild(deleteBtn);

      container.appendChild(item);
    });
  },

  /**
   * Perbarui tampilan total balance.
   * @param {number} total
   */
  renderBalance(total) {
    const el = document.getElementById('balance-display');
    el.textContent = formatRupiah(total);
  },

  /**
   * Perbarui atau buat ulang pie chart.
   * @param {{ [category: string]: number }} categoryTotals
   * @param {string[]} allCategories
   */
  renderChart(categoryTotals, allCategories) {
    if (typeof Chart === 'undefined') {
      document.getElementById('chart-container').innerHTML =
        '<p class="empty-state">Chart.js tidak tersedia. Periksa koneksi internet Anda.</p>';
      return;
    }

    const labels = Object.keys(categoryTotals).filter(k => categoryTotals[k] > 0);
    const data   = labels.map(k => categoryTotals[k]);
    const colors = labels.map(k => getCategoryColor(k, allCategories));

    const canvas   = document.getElementById('expense-chart');
    const emptyDiv = document.getElementById('chart-empty');

    if (labels.length === 0) {
      // Empty state
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      canvas.classList.add('hidden');
      emptyDiv.classList.remove('hidden');
      return;
    }

    canvas.classList.remove('hidden');
    emptyDiv.classList.add('hidden');

    if (this.chartInstance) {
      // Update data yang sudah ada
      this.chartInstance.data.labels = labels;
      this.chartInstance.data.datasets[0].data   = data;
      this.chartInstance.data.datasets[0].backgroundColor = colors;
      this.chartInstance.update();
    } else {
      // Buat instance baru
      const ctx = canvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#ffffff',
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 13 }, padding: 16 },
            },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct   = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                  return ` ${ctx.label}: ${formatRupiah(ctx.raw)} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }
  },

  /**
   * Render ulang opsi dropdown kategori di form.
   * @param {string[]} allCategories
   */
  renderCategoryDropdown(allCategories) {
    const select = document.getElementById('input-category');
    const currentValue = select.value;

    // Hapus semua opsi kecuali placeholder
    while (select.options.length > 1) {
      select.remove(1);
    }

    allCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    // Pertahankan pilihan sebelumnya jika masih valid
    if (allCategories.includes(currentValue)) {
      select.value = currentValue;
    }
  },

  /**
   * Tampilkan pesan error inline pada field form.
   * @param {{ name?: string, amount?: string, category?: string }} errors
   */
  showFormErrors(errors) {
    if (errors.name) {
      document.getElementById('input-name').classList.add('input-error');
      document.getElementById('error-name').textContent = errors.name;
    }
    if (errors.amount) {
      document.getElementById('input-amount').classList.add('input-error');
      document.getElementById('error-amount').textContent = errors.amount;
    }
    if (errors.category) {
      document.getElementById('input-category').classList.add('input-error');
      document.getElementById('error-category').textContent = errors.category;
    }
  },

  /**
   * Hapus semua pesan error dari form transaksi.
   */
  clearFormErrors() {
    ['input-name', 'input-amount', 'input-category'].forEach(id => {
      document.getElementById(id).classList.remove('input-error');
    });
    ['error-name', 'error-amount', 'error-category'].forEach(id => {
      document.getElementById(id).textContent = '';
    });
  },

  /**
   * Reset semua field form transaksi ke nilai default.
   */
  resetForm() {
    document.getElementById('transaction-form').reset();
  },

  /**
   * Tampilkan banner error global.
   * @param {string} message
   */
  showGlobalError(message) {
    const banner = document.getElementById('global-error');
    banner.textContent = message;
    banner.classList.remove('hidden');
  },

  /**
   * Terapkan tema ke elemen <html>.
   * @param {'light'|'dark'} theme
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  /**
   * Perbarui ikon/label tombol theme toggle.
   * @param {'light'|'dark'} theme
   */
  updateThemeToggle(theme) {
    const btn  = document.getElementById('theme-toggle');
    const icon = btn.querySelector('.theme-toggle__icon');
    if (theme === 'dark') {
      icon.textContent = '☀️';
      btn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      icon.textContent = '🌙';
      btn.setAttribute('aria-label', 'Switch to dark mode');
    }
  },
};

/* ============================================================
   AppState — state management & koordinasi operasi
   ============================================================ */

const AppState = {
  /** @type {Transaction[]} */
  transactions: [],

  /** @type {string[]} */
  customCategories: [],

  /** @type {string} */
  sortPreference: 'date-desc',

  /** @type {'light'|'dark'} */
  theme: 'light',

  /**
   * Inisialisasi aplikasi: load dari storage, terapkan tema, render semua.
   */
  init() {
    // Load data
    this.transactions     = StorageAPI.load();
    this.customCategories = StorageAPI.loadCategories();

    // Sort preference
    const savedSort = StorageAPI.loadSortPreference();
    if (savedSort) this.sortPreference = savedSort;

    // Tema: preferensi tersimpan → preferensi sistem → light
    const savedTheme  = StorageAPI.loadTheme();
    const systemDark  = window.matchMedia &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.theme = savedTheme || (systemDark ? 'dark' : 'light');

    UIRenderer.applyTheme(this.theme);
    UIRenderer.updateThemeToggle(this.theme);

    // Render semua komponen
    UIRenderer.renderCategoryDropdown(this.getAllCategories());
    this._syncSortControl();
    this._renderAll();
  },

  /**
   * Kembalikan semua kategori (default + kustom).
   * @returns {string[]}
   */
  getAllCategories() {
    return [...DEFAULT_CATEGORIES, ...this.customCategories];
  },

  /**
   * Tambah kategori kustom baru.
   * @param {string} name
   * @returns {{ success: boolean, error?: string }}
   */
  addCustomCategory(name) {
    const trimmed = name.trim();

    if (!trimmed) {
      return { success: false, error: 'Nama kategori tidak boleh kosong' };
    }
    if (trimmed.length > 30) {
      return { success: false, error: 'Nama kategori maksimal 30 karakter' };
    }

    const allLower = this.getAllCategories().map(c => c.toLowerCase());
    if (allLower.includes(trimmed.toLowerCase())) {
      return { success: false, error: 'Kategori sudah ada' };
    }

    this.customCategories.push(trimmed);
    StorageAPI.saveCategories(this.customCategories);
    UIRenderer.renderCategoryDropdown(this.getAllCategories());
    this._renderAll(); // update chart dengan kategori baru
    return { success: true };
  },

  /**
   * Tambah transaksi baru.
   * @param {{ name: string, amount: number, category: string }} data
   */
  addTransaction({ name, amount, category }) {
    const tx = {
      id:        this._generateId(),
      name:      name.trim(),
      amount:    Number(amount),
      category,
      createdAt: new Date().toISOString(),
    };
    this.transactions.push(tx);
    const result = StorageAPI.save(this.transactions);
    if (!result.success) {
      UIRenderer.showGlobalError(
        'Gagal menyimpan data: ' + (result.error || 'Storage penuh atau tidak tersedia.')
      );
    }
    this._renderAll();
  },

  /**
   * Hapus transaksi berdasarkan ID.
   * @param {string} id
   */
  deleteTransaction(id) {
    this.transactions = this.transactions.filter(tx => tx.id !== id);
    const result = StorageAPI.save(this.transactions);
    if (!result.success) {
      UIRenderer.showGlobalError(
        'Gagal menyimpan perubahan: ' + (result.error || 'Storage penuh atau tidak tersedia.')
      );
    }
    this._renderAll();
  },

  /**
   * Kembalikan transaksi yang sudah diurutkan sesuai sortPreference.
   * Tidak mengubah array asli.
   * @returns {Transaction[]}
   */
  getSortedTransactions() {
    const sorted = [...this.transactions];
    switch (this.sortPreference) {
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount);
      case 'category-asc':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case 'date-desc':
      default:
        // Terbaru di atas (insertion order sudah terbaru di akhir, balik)
        return sorted.reverse();
    }
  },

  /**
   * Ubah preferensi pengurutan dan re-render list.
   * @param {string} sortValue
   */
  setSortPreference(sortValue) {
    this.sortPreference = sortValue;
    StorageAPI.saveSortPreference(sortValue);
    this._renderAll();
  },

  /**
   * Toggle antara light dan dark mode.
   */
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    StorageAPI.saveTheme(this.theme);
    UIRenderer.applyTheme(this.theme);
    UIRenderer.updateThemeToggle(this.theme);
  },

  /**
   * Hitung total balance dari semua transaksi.
   * @returns {number}
   */
  getTotalBalance() {
    return this.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  },

  /**
   * Hitung total per kategori (dinamis, mendukung kategori kustom).
   * @returns {{ [category: string]: number }}
   */
  getCategoryTotals() {
    const totals = {};
    this.getAllCategories().forEach(cat => { totals[cat] = 0; });
    this.transactions.forEach(tx => {
      if (totals[tx.category] !== undefined) {
        totals[tx.category] += tx.amount;
      } else {
        totals[tx.category] = tx.amount; // kategori lama yang mungkin sudah dihapus
      }
    });
    return totals;
  },

  // ---- Private helpers ----

  /**
   * Render semua komponen UI sekaligus.
   * @private
   */
  _renderAll() {
    const allCategories = this.getAllCategories();
    UIRenderer.renderList(this.getSortedTransactions(), allCategories);
    UIRenderer.renderBalance(this.getTotalBalance());
    UIRenderer.renderChart(this.getCategoryTotals(), allCategories);
  },

  /**
   * Sinkronisasi nilai elemen sort-control dengan state.
   * @private
   */
  _syncSortControl() {
    const select = document.getElementById('sort-control');
    if (select) select.value = this.sortPreference;
  },

  /**
   * Generate ID unik untuk transaksi.
   * @returns {string}
   * @private
   */
  _generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },
};

/* ============================================================
   Event Handlers
   ============================================================ */

/**
 * Handle submit form transaksi.
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const name     = document.getElementById('input-name').value;
  const amount   = document.getElementById('input-amount').value;
  const category = document.getElementById('input-category').value;

  UIRenderer.clearFormErrors();

  const { valid, errors } = Validator.validateForm({ name, amount, category });

  if (!valid) {
    UIRenderer.showFormErrors(errors);
    return;
  }

  AppState.addTransaction({ name, amount, category });
  UIRenderer.resetForm();
}

/**
 * Handle klik tombol hapus (event delegation pada #transaction-list).
 * @param {Event} event
 */
function handleDeleteClick(event) {
  const btn = event.target.closest('[data-action="delete"]');
  if (!btn) return;

  const item = btn.closest('[data-id]');
  if (!item) return;

  AppState.deleteTransaction(item.dataset.id);
}

/**
 * Handle submit form tambah kategori kustom.
 */
function handleAddCategory() {
  const input    = document.getElementById('input-new-category');
  const errorEl  = document.getElementById('error-new-category');
  const name     = input.value;

  errorEl.textContent = '';
  input.classList.remove('input-error');

  const result = AppState.addCustomCategory(name);

  if (!result.success) {
    input.classList.add('input-error');
    errorEl.textContent = result.error;
    return;
  }

  input.value = '';
}

/**
 * Handle perubahan opsi sort.
 * @param {Event} event
 */
function handleSortChange(event) {
  AppState.setSortPreference(event.target.value);
}

/**
 * Handle klik theme toggle.
 */
function handleThemeToggle() {
  AppState.toggleTheme();
}

/* ============================================================
   Inisialisasi — DOMContentLoaded
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Cek ketersediaan localStorage
  if (!StorageAPI.isAvailable()) {
    UIRenderer.showGlobalError(
      'Local Storage tidak tersedia di browser ini. Data tidak akan tersimpan setelah halaman ditutup.'
    );
  }

  // Init state & render
  AppState.init();

  // Daftarkan event listeners
  document.getElementById('transaction-form')
    .addEventListener('submit', handleFormSubmit);

  document.getElementById('transaction-list')
    .addEventListener('click', handleDeleteClick);

  document.getElementById('btn-add-category')
    .addEventListener('click', handleAddCategory);

  document.getElementById('input-new-category')
    .addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
    });

  document.getElementById('sort-control')
    .addEventListener('change', handleSortChange);

  document.getElementById('theme-toggle')
    .addEventListener('click', handleThemeToggle);

  // Hapus error inline saat pengguna mulai mengetik
  ['input-name', 'input-amount', 'input-category'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      document.getElementById(id).classList.remove('input-error');
      const errorId = id.replace('input-', 'error-');
      const errorEl = document.getElementById(errorId);
      if (errorEl) errorEl.textContent = '';
    });
  });

  document.getElementById('input-new-category').addEventListener('input', () => {
    document.getElementById('input-new-category').classList.remove('input-error');
    document.getElementById('error-new-category').textContent = '';
  });
});
