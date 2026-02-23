# Aplikasi Manajemen Donasi Safari Ramadhan

Aplikasi berbasis web untuk mengelola jadwal safari, pencatatan donasi, dan monitoring komitmen donatur selama periode Ramadhan.

## 🚀 Fitur Utama
- **Dashboard Admin**: Visualisasi total donasi, komitmen aktif, dan grafik pemasukan.
- **Manajemen Jadwal**: Kelola lokasi masjid, tanggal, dan penceramah.
- **Pencatatan Donasi**: Input donasi (Cash/Transfer) dengan audit trail per masjid.
- **Monitoring Komitmen**: Lacak progres pelunasan donatur yang berkomitmen (cicilan).
- **Laporan Otomatis**: Laporan per masjid dan tren harian/mingguan.

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4.0
- **Database & Auth**: Supabase
- **Icons**: Lucide React
- **Charts**: Recharts
- **Deployment**: Vercel

## ⚙️ Persiapan Database (Supabase)

1. **Jalankan SQL Migration**:
   - Buka [Supabase Dashboard](https://app.supabase.com/)
   - Pilih proyek Anda -> SQL Editor
   - Copy Isi dari file `supabase/migration.sql` dan jalankan (Run).

2. **Setup Storage (Untuk Bukti Transfer)**:
   - Buka menu **Storage** di Supabase.
   - Buat bucket baru dengan nama: `bukti-transfer`.
   - Atur bucket tersebut menjadi **Public**.

3. **Environment Variables**:
   - File `.env.local` sudah dikonfigurasi dengan credentials Anda.

## 🏃 Cara Menjalankan Lokal

1. Install dependensi:
   ```bash
   npm install
   ```

2. Jalankan server development:
   ```bash
   npm run dev
   ```

3. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📁 Struktur Proyek
- `src/app`: Halaman-halaman aplikasi (Dashboard, Jadwal, Donasi, dll).
- `src/components`: Komponen UI reusable (Sidebar, Modal, StatCard).
- `src/lib`: Konfigurasi Supabase dan helper utilities.
- `src/types`: Definisi tipe data TypeScript untuk database.
- `supabase`: Script SQL untuk inisialisasi tabel.
