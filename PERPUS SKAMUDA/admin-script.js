// admin-script.js - Admin Panel Functions
const LS_ADMIN_KEY = "smk_admin_v1";
let adminState = {
  members: [],
  settings: {
    loanDuration: 14,
    finePerDay: 5000,
    maxBooksPerMember: 3,
    schoolName: "SMKN 1 MURUNG PUDAK",
    schoolAddress: "Murung Pudak",
    schoolEmail: "perpustakaan@smkn1mp.sch.id",
  },
};

// Load admin data
function loadAdminData() {
  const raw = localStorage.getItem(LS_ADMIN_KEY);
  if (raw) {
    adminState = JSON.parse(raw);
  }
  loadSettings();
  renderDashboard();
  renderBooksTable();
  renderLoansTable();
  renderMembersTable();
}

// Save admin data
function saveAdminData() {
  localStorage.setItem(LS_ADMIN_KEY, JSON.stringify(adminState));
}

// Switch tabs
function switchTab(tabName, event) {
  if (event) event.preventDefault();

  // Remove active class from all tabs and nav items
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((nav) => nav.classList.remove("active"));

  // Add active class to selected tab and nav item
  const tabElement = document.getElementById(tabName);
  if (tabElement) {
    tabElement.classList.add("active");
  }

  event.target.closest(".nav-item").classList.add("active");

  // Update page title
  const titles = {
    dashboard: "Dashboard Admin",
    books: "Kelola Buku",
    loans: "Peminjaman",
    members: "Daftar Anggota",
    reports: "Laporan Perpustakaan",
    settings: "Pengaturan Sistem",
  };

  document.getElementById("page-title").textContent =
    titles[tabName] || "Admin";

  // Refresh data
  if (tabName === "books") renderBooksTable();
  if (tabName === "loans") renderLoansTable();
  if (tabName === "members") renderMembersTable();
  if (tabName === "reports") updateReports();
}

// Dashboard rendering
function renderDashboard() {
  const totalBooks = state.books.length;
  const totalStok = state.books.reduce((sum, b) => sum + b.copies, 0);
  const borrowedCount = state.loans.filter((l) => !l.returned).length;
  const membersCount = new Set(state.loans.map((l) => l.name)).size;
  const overdueCount = state.loans.filter(
    (l) => !l.returned && getDaysRemaining(l.dueDate) < 0,
  ).length;

  document.getElementById("stat-books").textContent = totalBooks;
  document.getElementById("stat-borrowed").textContent = borrowedCount;
  document.getElementById("stat-members").textContent = membersCount;
  document.getElementById("stat-overdue").textContent = overdueCount;

  // Activity log
  const activityTbody = document.getElementById("activity-tbody");
  if (state.loans.length === 0) {
    activityTbody.innerHTML =
      '<tr><td>Baru</td><td colspan="3" style="text-align: center; color: #9ca3af;">Tidak ada aktivitas</td></tr>';
  } else {
    const recentLoans = state.loans.slice(-5).reverse();
    activityTbody.innerHTML = recentLoans
      .map((loan) => {
        const book = state.books.find((b) => b.id === loan.bookId);
        const status = loan.returned ? "Dikembalikan" : "Dipinjam";
        return `
        <tr>
          <td>${new Date(loan.date).toLocaleDateString("id-ID")}</td>
          <td>${loan.returned ? "📚 Pengembalian" : "📖 Peminjaman"}</td>
          <td>${loan.name} - ${book?.title || "Unknown"}</td>
          <td><span class="status-badge ${loan.returned ? "status-returned" : "status-active"}">${status}</span></td>
        </tr>
      `;
      })
      .join("");
  }
}

// Books table rendering
function renderBooksTable() {
  const tbody = document.getElementById("books-tbody");
  const query =
    document.getElementById("books-search")?.value?.toLowerCase() || "";

  const filtered = state.books.filter(
    (b) =>
      !query ||
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query),
  );

  tbody.innerHTML = filtered
    .map((book, index) => {
      const available = availableCopies(book.id);
      const borrowed = book.copies - available;

      return `
      <tr>
        <td>${index + 1}</td>
        <td><img src="${book.image || "https://via.placeholder.com/40x50"}" class="table-cover" alt=""></td>
        <td><strong>${book.title}</strong></td>
        <td>${book.author}</td>
        <td>${book.isbn || "-"}</td>
        <td>${book.copies}</td>
        <td><span style="color: #10b981;">${available}</span></td>
        <td><span style="color: #f59e0b;">${borrowed}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" onclick="editBook('${book.id}')">✏️ Edit</button>
            <button class="btn-delete" onclick="deleteBook('${book.id}')">🗑️ Hapus</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// Loans table rendering
function renderLoansTable() {
  const tbody = document.getElementById("loans-tbody");
  const filter = document.getElementById("loan-filter")?.value || "all";

  let filtered = state.loans;

  if (filter === "active") {
    filtered = filtered.filter((l) => !l.returned);
  } else if (filter === "returned") {
    filtered = filtered.filter((l) => l.returned);
  } else if (filter === "overdue") {
    filtered = filtered.filter(
      (l) => !l.returned && getDaysRemaining(l.dueDate) < 0,
    );
  }

  tbody.innerHTML = filtered
    .map((loan, index) => {
      const book = state.books.find((b) => b.id === loan.bookId);
      const daysRemaining = getDaysRemaining(loan.dueDate);
      let statusClass = "status-active";
      let statusText = "Aktif";

      if (loan.returned) {
        statusClass = "status-returned";
        statusText = "Dikembalikan";
      } else if (daysRemaining < 0) {
        statusClass = "status-overdue";
        statusText = `Overdue (${Math.abs(daysRemaining)} hari)`;
      }

      return `
      <tr>
        <td>${index + 1}</td>
        <td>${loan.name}</td>
        <td>${book?.title || "Unknown"}</td>
        <td>${new Date(loan.date).toLocaleDateString("id-ID")}</td>
        <td>${new Date(loan.dueDate).toLocaleDateString("id-ID")}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <div class="action-buttons">
            ${!loan.returned ? `<button class="btn-return" onclick="returnBook('${state.loans.indexOf(loan)}')">✓ Kembalikan</button>` : ""}
            <button class="btn-delete" onclick="deleteLoan(${state.loans.indexOf(loan)})">🗑️ Hapus</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// Members table rendering
function renderMembersTable() {
  const tbody = document.getElementById("members-tbody");
  const query =
    document.getElementById("members-search")?.value?.toLowerCase() || "";

  // Get unique members
  const uniqueMembers = [];
  const memberNames = new Set();

  state.loans.forEach((loan) => {
    if (!memberNames.has(loan.name)) {
      memberNames.add(loan.name);
      const memberLoans = state.loans.filter((l) => l.name === loan.name);
      const activeLoans = memberLoans.filter((l) => !l.returned).length;

      if (!query || loan.name.toLowerCase().includes(query)) {
        uniqueMembers.push({
          name: loan.name,
          totalLoans: memberLoans.length,
          activeLoans: activeLoans,
          lastLoan: new Date(memberLoans[memberLoans.length - 1].date),
        });
      }
    }
  });

  if (uniqueMembers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center; color: #9ca3af;">Tidak ada anggota</td></tr>';
  } else {
    tbody.innerHTML = uniqueMembers
      .map(
        (member, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${member.name}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>${member.activeLoans}</td>
        <td><span class="status-badge status-active">Aktif</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" onclick="editMember('${member.name}')">✏️ Detail</button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");
  }
}

// Update reports
function updateReports() {
  const activeLoans = state.loans.filter((l) => !l.returned).length;
  const returnedLoans = state.loans.filter((l) => l.returned).length;
  const overdueLoans = state.loans.filter(
    (l) => !l.returned && getDaysRemaining(l.dueDate) < 0,
  ).length;
  const uniqueMembers = new Set(state.loans.map((l) => l.name)).size;
  const availableBooks = state.books.reduce(
    (sum, b) => sum + availableCopies(b.id),
    0,
  );
  const borrowedBooks = state.books.reduce(
    (sum, b) => sum + (b.copies - availableCopies(b.id)),
    0,
  );

  document.getElementById("report-total-loans").textContent =
    state.loans.length;
  document.getElementById("report-active-loans").textContent = activeLoans;
  document.getElementById("report-returned-loans").textContent = returnedLoans;
  document.getElementById("report-overdue-loans").textContent = overdueLoans;

  document.getElementById("report-total-titles").textContent =
    state.books.length;
  document.getElementById("report-total-stock").textContent =
    state.books.reduce((sum, b) => sum + b.copies, 0);
  document.getElementById("report-available").textContent = availableBooks;
  document.getElementById("report-borrowed").textContent = borrowedBooks;

  document.getElementById("report-total-members").textContent = uniqueMembers;
  document.getElementById("report-active-members").textContent = uniqueMembers;
  document.getElementById("report-members-debt").textContent = "0";
}

// Filter loans
function filterLoans() {
  renderLoansTable();
}

// Modal functions
function openAdminModal() {
  document.getElementById("admin-modal").classList.add("active");
}

function closeAdminModal() {
  document.getElementById("admin-modal").classList.remove("active");
}

// Book management
function openAddBookForm() {
  const html = `
    <form onsubmit="saveBook(event)">
      <div class="form-group">
        <label class="label">Judul Buku</label>
        <input id="form-book-title" class="input" placeholder="Masukkan judul" required>
      </div>
      <div class="form-group">
        <label class="label">Penulis</label>
        <input id="form-book-author" class="input" placeholder="Nama penulis" required>
      </div>
      <div class="form-group">
        <label class="label">ISBN</label>
        <input id="form-book-isbn" class="input" placeholder="978-...">
      </div>
      <div class="form-group">
        <label class="label">Tahun Terbit</label>
        <input id="form-book-year" type="number" class="input" min="2000">
      </div>
      <div class="form-group">
        <label class="label">Jumlah Salinan</label>
        <input id="form-book-copies" type="number" class="input" value="1" min="1" required>
      </div>
      <div class="form-group">
        <label class="label">URL Gambar</label>
        <input id="form-book-image" type="url" class="input" placeholder="https://...">
      </div>
      <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Simpan Buku</button>
    </form>
  `;

  document.getElementById("modal-title").textContent = "Tambah Buku Baru";
  document.getElementById("modal-body").innerHTML = html;
  openAdminModal();
}

function saveBook(e) {
  e.preventDefault();

  const newBook = {
    id: "b" + (state.books.length + 1),
    title: document.getElementById("form-book-title").value,
    author: document.getElementById("form-book-author").value,
    isbn: document.getElementById("form-book-isbn").value || "-",
    year:
      document.getElementById("form-book-year").value ||
      new Date().getFullYear(),
    copies: parseInt(document.getElementById("form-book-copies").value),
    image:
      document.getElementById("form-book-image").value ||
      "https://via.placeholder.com/280x220?text=No+Image",
    description: "",
  };

  state.books.push(newBook);
  save();
  closeAdminModal();
  renderBooksTable();
  showToast("Buku berhasil ditambahkan!", "success");
}

function editBook(bookId) {
  const book = state.books.find((b) => b.id === bookId);
  if (!book) return;

  const html = `
    <form onsubmit="updateBook('${bookId}', event)">
      <div class="form-group">
        <label class="label">Judul Buku</label>
        <input id="form-book-title" class="input" value="${book.title}" required>
      </div>
      <div class="form-group">
        <label class="label">Penulis</label>
        <input id="form-book-author" class="input" value="${book.author}" required>
      </div>
      <div class="form-group">
        <label class="label">Jumlah Salinan</label>
        <input id="form-book-copies" type="number" class="input" value="${book.copies}" min="1" required>
      </div>
      <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Perbarui Buku</button>
    </form>
  `;

  document.getElementById("modal-title").textContent = "Edit Buku";
  document.getElementById("modal-body").innerHTML = html;
  openAdminModal();
}

function updateBook(bookId, e) {
  e.preventDefault();

  const book = state.books.find((b) => b.id === bookId);
  if (!book) return;

  book.title = document.getElementById("form-book-title").value;
  book.author = document.getElementById("form-book-author").value;
  book.copies = parseInt(document.getElementById("form-book-copies").value);

  save();
  closeAdminModal();
  renderBooksTable();
  showToast("Buku berhasil diperbarui!", "success");
}

function deleteBook(bookId) {
  if (!confirm("Hapus buku ini? Peminjaman terkait akan tetap tercatat."))
    return;

  state.books = state.books.filter((b) => b.id !== bookId);
  save();
  renderBooksTable();
  showToast("Buku berhasil dihapus!", "success");
}

// Loan management
function returnBook(loanIndex) {
  if (!confirm("Konfirmasi pengembalian buku?")) return;

  state.loans[loanIndex].returned = true;
  state.loans[loanIndex].returnDate = new Date().toISOString().split("T")[0];

  save();
  renderLoansTable();
  renderDashboard();
  showToast("Buku berhasil dikembalikan!", "success");
}

function deleteLoan(index) {
  if (!confirm("Hapus catatan peminjaman ini?")) return;

  state.loans.splice(index, 1);
  save();
  renderLoansTable();
  renderDashboard();
  showToast("Peminjaman berhasil dihapus!", "success");
}

function openNewLoanForm() {
  const booksOptions = state.books
    .map((b) => `<option value="${b.id}">${b.title}</option>`)
    .join("");

  const html = `
    <form onsubmit="createNewLoan(event)">
      <div class="form-group">
        <label class="label">Nama Peminjam</label>
        <input id="form-loan-name" class="input" placeholder="Nama lengkap" required>
      </div>
      <div class="form-group">
        <label class="label">Pilih Buku</label>
        <select id="form-loan-book" class="input" required>
          <option value="">-- Pilih Buku --</option>
          ${booksOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="label">Tanggal Peminjaman</label>
        <input id="form-loan-date" type="date" class="input" required>
      </div>
      <div class="form-group">
        <label class="label">Durasi (hari)</label>
        <select id="form-loan-duration" class="input">
          <option value="7">7 hari</option>
          <option value="14" selected>14 hari</option>
          <option value="21">21 hari</option>
          <option value="30">30 hari</option>
        </select>
      </div>
      <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Buat Peminjaman</button>
    </form>
  `;

  document.getElementById("form-loan-date").valueAsDate = new Date();

  document.getElementById("modal-title").textContent = "Buat Peminjaman Baru";
  document.getElementById("modal-body").innerHTML = html;
  document.getElementById("form-loan-date").valueAsDate = new Date();
  openAdminModal();
}

function createNewLoan(e) {
  e.preventDefault();

  const name = document.getElementById("form-loan-name").value;
  const bookId = document.getElementById("form-loan-book").value;
  const date = document.getElementById("form-loan-date").value;
  const duration = parseInt(
    document.getElementById("form-loan-duration").value,
  );

  const dueDate = new Date(date);
  dueDate.setDate(dueDate.getDate() + duration);

  state.loans.push({
    id: "l" + state.loans.length,
    bookId,
    name,
    date,
    dueDate: dueDate.toISOString().split("T")[0],
    returned: false,
  });

  save();
  closeAdminModal();
  renderLoansTable();
  renderDashboard();
  showToast("Peminjaman berhasil dibuat!", "success");
}

// Settings
function loadSettings() {
  document.getElementById("setting-duration").value =
    adminState.settings.loanDuration;
  document.getElementById("setting-fine").value =
    adminState.settings.finePerDay;
  document.getElementById("setting-max-books").value =
    adminState.settings.maxBooksPerMember;
  document.getElementById("setting-school").value =
    adminState.settings.schoolName;
  document.getElementById("setting-address").value =
    adminState.settings.schoolAddress;
  document.getElementById("setting-email").value =
    adminState.settings.schoolEmail;
}

function saveSettings() {
  adminState.settings.loanDuration = parseInt(
    document.getElementById("setting-duration").value,
  );
  adminState.settings.finePerDay = parseInt(
    document.getElementById("setting-fine").value,
  );
  adminState.settings.maxBooksPerMember = parseInt(
    document.getElementById("setting-max-books").value,
  );
  adminState.settings.schoolName =
    document.getElementById("setting-school").value;
  adminState.settings.schoolAddress =
    document.getElementById("setting-address").value;
  adminState.settings.schoolEmail =
    document.getElementById("setting-email").value;

  saveAdminData();
  showToast("Pengaturan berhasil disimpan!", "success");
}

function changePassword() {
  const pwd = document.getElementById("setting-password").value;
  const pwdConfirm = document.getElementById("setting-password-confirm").value;

  if (!pwd || pwd.length < 6) {
    showToast("Password minimal 6 karakter!", "error");
    return;
  }

  if (pwd !== pwdConfirm) {
    showToast("Password tidak cocok!", "error");
    return;
  }

  adminState.settings.password = pwd;
  saveAdminData();
  document.getElementById("setting-password").value = "";
  document.getElementById("setting-password-confirm").value = "";
  showToast("Password berhasil diubah!", "success");
}

function backupData() {
  const backup = {
    books: state.books,
    loans: state.loans,
    settings: adminState.settings,
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `perpustakaan-backup-${new Date().getTime()}.json`;
  a.click();

  showToast("Data berhasil dibackup!", "success");
}

function restoreData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        state.books = backup.books;
        state.loans = backup.loans;
        adminState.settings = backup.settings;
        save();
        saveAdminData();
        loadAdminData();
        showToast("Data berhasil direstore!", "success");
      } catch (err) {
        showToast("File backup tidak valid!", "error");
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

function clearData() {
  if (
    !confirm(
      "Hapus SEMUA data perpustakaan? Tindakan ini tidak bisa dibatalkan!",
    )
  )
    return;

  state.books = [];
  state.loans = [];
  adminState.members = [];
  save();
  saveAdminData();
  loadAdminData();
  showToast("Semua data telah dihapus!", "success");
}

function downloadReport(format) {
  const reports = {
    totalBooks: state.books.length,
    totalLoans: state.loans.length,
    activeLoans: state.loans.filter((l) => !l.returned).length,
    returnedLoans: state.loans.filter((l) => l.returned).length,
    overdueLoans: state.loans.filter(
      (l) => !l.returned && getDaysRemaining(l.dueDate) < 0,
    ).length,
    totalMembers: new Set(state.loans.map((l) => l.name)).size,
  };

  if (format === "excel") {
    showToast("Excel download dalam pengembangan", "info");
  } else if (format === "pdf") {
    showToast("PDF download dalam pengembangan", "info");
  }
}

function editMember(memberName) {
  const memberLoans = state.loans.filter((l) => l.name === memberName);

  const html = `
    <div>
      <p><strong>Nama:</strong> ${memberName}</p>
      <p><strong>Total Peminjaman:</strong> ${memberLoans.length}</p>
      <p><strong>Sedang Dipinjam:</strong> ${memberLoans.filter((l) => !l.returned).length}</p>
      <p><strong>Terakhir Pinjam:</strong> ${new Date(memberLoans[memberLoans.length - 1].date).toLocaleDateString("id-ID")}</p>
      <hr>
      <h4>Riwayat Peminjaman:</h4>
      <table style="width: 100%; font-size: 0.9rem;">
        <tr style="border-bottom: 1px solid rgba(99, 102, 241, 0.2);">
          <th>Buku</th>
          <th>Tanggal</th>
          <th>Status</th>
        </tr>
        ${memberLoans
          .map((loan) => {
            const book = state.books.find((b) => b.id === loan.bookId);
            return `
            <tr style="border-bottom: 1px solid rgba(99, 102, 241, 0.1);">
              <td>${book?.title || "Unknown"}</td>
              <td>${new Date(loan.date).toLocaleDateString("id-ID")}</td>
              <td>${loan.returned ? "Dikembalikan" : "Dipinjam"}</td>
            </tr>
          `;
          })
          .join("")}
      </table>
    </div>
  `;

  document.getElementById("modal-title").textContent =
    `Detail Anggota: ${memberName}`;
  document.getElementById("modal-body").innerHTML = html;
  openAdminModal();
}

function openAddMemberForm() {
  const html = `
    <form onsubmit="addMember(event)">
      <div class="form-group">
        <label class="label">Nama Anggota</label>
        <input id="form-member-name" class="input" placeholder="Nama lengkap" required>
      </div>
      <div class="form-group">
        <label class="label">NIS/ID</label>
        <input id="form-member-id" class="input" placeholder="Nomor induk siswa">
      </div>
      <div class="form-group">
        <label class="label">Kelas</label>
        <input id="form-member-class" class="input" placeholder="Kelas">
      </div>
      <div class="form-group">
        <label class="label">Email</label>
        <input id="form-member-email" type="email" class="input" placeholder="email@sekolah.id">
      </div>
      <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Tambah Anggota</button>
    </form>
  `;

  document.getElementById("modal-title").textContent = "Tambah Anggota Baru";
  document.getElementById("modal-body").innerHTML = html;
  openAdminModal();
}

function addMember(e) {
  e.preventDefault();

  const member = {
    name: document.getElementById("form-member-name").value,
    nisId: document.getElementById("form-member-id").value,
    class: document.getElementById("form-member-class").value,
    email: document.getElementById("form-member-email").value,
  };

  adminState.members.push(member);
  saveAdminData();
  closeAdminModal();
  renderMembersTable();
  showToast("Anggota berhasil ditambahkan!", "success");
}

// Initialize admin panel
document.addEventListener("DOMContentLoaded", () => {
  loadAdminData();

  // Search functionality
  document
    .getElementById("books-search")
    ?.addEventListener("keyup", renderBooksTable);
  document
    .getElementById("members-search")
    ?.addEventListener("keyup", renderMembersTable);
});

// Close modal on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAdminModal();
});
