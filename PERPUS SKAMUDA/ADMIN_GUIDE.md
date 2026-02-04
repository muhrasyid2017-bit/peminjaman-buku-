# 🔐 Panduan Admin - Sistem Perpustakaan SMK

## Fitur Admin

Sistem perpustakaan ini dilengkapi dengan sistem autentikasi admin yang memungkinkan hanya administrator perpustakaan yang dapat mengedit atau menghapus data buku.

### Kredensial Admin Default

- **Username:** `admin`
- **Password:** `smk12345`

> ⚠️ **PENTING:** Ubah password default setelah login pertama kali!

---

## Cara Login Admin

1. Klik tombol **🔐 Admin Login** di bagian atas kanan halaman
2. Masukkan username: `admin`
3. Masukkan password: `smk12345`
4. Klik tombol "Login"
5. Jika berhasil, tombol akan berubah menjadi "👤 Admin (Logged In)" dengan warna hijau

---

## Fitur yang Hanya Bisa Diakses Admin

Setelah login, admin dapat:

### ✅ Menambah Buku Baru

- Klik tombol **+ Buku** di header
- Isi form dengan data buku (judul, penulis, jumlah salinan, dll)
- Klik "Simpan Buku"

### ✅ Mengedit Buku yang Ada

- Pada setiap kartu buku, klik tombol **Edit**
- Ubah data yang diperlukan
- Klik "Perbarui Buku"

### ✅ Menghapus Buku

- Pada setiap kartu buku, klik tombol **Hapus** (merah)
- Konfirmasi penghapusan
- Buku dan semua data peminjaman terkait akan dihapus

---

## Fitur yang Bisa Diakses Semua Pengguna

1. **Mencari Buku** - Gunakan input pencarian di header
2. **Melihat Daftar Buku** - Lihat semua buku yang tersedia dan stok
3. **Meminjam Buku** - Klik "Pinjam" pada buku yang ingin dipinjam
4. **Melihat Riwayat Peminjaman** - Lihat daftar peminjaman dan status pengembalian

---

## Sistem Keamanan

### 🔒 Perlindungan Akses

- Tombol **Edit** dan **Hapus** hanya tampil ketika admin sudah login
- Jika user biasa mencoba mengakses fungsi edit/hapus, akan diminta untuk login terlebih dahulu
- Setiap login menyimpan session di browser untuk kemudahan penggunaan

### 💾 Penyimpanan Data

- Semua data disimpan di **Local Storage** browser
- Data persisten selama cache browser tidak dihapus
- Setiap perubahan langsung tersimpan otomatis

### 🚪 Logout

- Klik tombol "Logout" di modal admin login
- Session akan dihapus dan akses admin akan ditutup

---

## Tips Penggunaan

1. **Jangan Lupa Logout** - Logout setelah selesai mengedit agar aman
2. **Backup Data** - Secara berkala backup data dengan mengekspor localStorage
3. **Update Password** - Ubah password default untuk keamanan lebih baik
4. **Clear Browser Cache** - Hati-hati saat clear cache, data buku akan hilang jika tidak di-backup

---

## Troubleshooting

### ❌ Lupa Password

- Password default: `smk12345`
- Jika sudah diubah, hapus localStorage di browser atau hubungi administrator

### ❌ Tombol Edit/Hapus Tidak Muncul

- Pastikan sudah login sebagai admin
- Refresh halaman dan coba login ulang

### ❌ Data Tidak Tersimpan

- Pastikan Local Storage browser tidak dalam mode private/incognito
- Cek quota storage browser

---

## Versi

- **Versi:** 1.0.0
- **Update Terakhir:** 2026
- **Dikembangkan untuk:** SMKN 1 MURUNG PUDAK

---

**Untuk bantuan lebih lanjut, hubungi administrator perpustakaan.**
