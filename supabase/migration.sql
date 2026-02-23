-- Supabase SQL Migration Script
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: jadwal_safari
-- Format: Jadwal Safari Ramadhan Palu 2026 / 1447H
-- =====================================================
CREATE TABLE IF NOT EXISTS jadwal_safari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal DATE NOT NULL,
  ramadhan_ke INTEGER NOT NULL,
  waktu_sholat VARCHAR(10) NOT NULL CHECK (waktu_sholat IN ('subuh', 'dzuhur', 'isya')),
  nama_masjid VARCHAR(255) NOT NULL,
  alamat TEXT,
  no_pengurus VARCHAR(20),
  status VARCHAR(30) DEFAULT 'belum_dilaksanakan' CHECK (status IN ('belum_dilaksanakan', 'sudah_dilaksanakan')),
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: donatur
-- =====================================================
CREATE TABLE IF NOT EXISTS donatur (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(255) NOT NULL,
  no_hp VARCHAR(20) NOT NULL,
  alamat TEXT NOT NULL,
  jenis_donatur VARCHAR(20) DEFAULT 'sekali' CHECK (jenis_donatur IN ('sekali', 'komitmen')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: donasi
-- =====================================================
CREATE TABLE IF NOT EXISTS donasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal DATE NOT NULL,
  donatur_id UUID NOT NULL REFERENCES donatur(id) ON DELETE CASCADE,
  nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
  metode_pembayaran VARCHAR(20) NOT NULL CHECK (metode_pembayaran IN ('cash', 'transfer')),
  jadwal_safari_id UUID NOT NULL REFERENCES jadwal_safari(id) ON DELETE CASCADE,
  bukti_transfer TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: komitmen
-- =====================================================
CREATE TABLE IF NOT EXISTS komitmen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donatur_id UUID NOT NULL REFERENCES donatur(id) ON DELETE CASCADE,
  total_komitmen DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_terbayar DECIMAL(15,2) NOT NULL DEFAULT 0,
  target_pelunasan DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'lunas', 'menunggak')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_safari(tanggal);
CREATE INDEX IF NOT EXISTS idx_jadwal_status ON jadwal_safari(status);
CREATE INDEX IF NOT EXISTS idx_jadwal_ramadhan_ke ON jadwal_safari(ramadhan_ke);
CREATE INDEX IF NOT EXISTS idx_donasi_tanggal ON donasi(tanggal);
CREATE INDEX IF NOT EXISTS idx_donasi_donatur ON donasi(donatur_id);
CREATE INDEX IF NOT EXISTS idx_donasi_jadwal ON donasi(jadwal_safari_id);
CREATE INDEX IF NOT EXISTS idx_komitmen_donatur ON komitmen(donatur_id);
CREATE INDEX IF NOT EXISTS idx_komitmen_status ON komitmen(status);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_jadwal_safari_updated_at ON jadwal_safari;
CREATE TRIGGER trigger_jadwal_safari_updated_at
  BEFORE UPDATE ON jadwal_safari
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_donatur_updated_at ON donatur;
CREATE TRIGGER trigger_donatur_updated_at
  BEFORE UPDATE ON donatur
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_komitmen_updated_at ON komitmen;
CREATE TRIGGER trigger_komitmen_updated_at
  BEFORE UPDATE ON komitmen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- =====================================================
ALTER TABLE jadwal_safari ENABLE ROW LEVEL SECURITY;
ALTER TABLE donatur ENABLE ROW LEVEL SECURITY;
ALTER TABLE donasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE komitmen ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON jadwal_safari;
CREATE POLICY "Enable all for authenticated users" ON jadwal_safari FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON donatur;
CREATE POLICY "Enable all for authenticated users" ON donatur FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON donasi;
CREATE POLICY "Enable all for authenticated users" ON donasi FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON komitmen;
CREATE POLICY "Enable all for authenticated users" ON komitmen FOR ALL USING (true);

-- =====================================================
-- SAMPLE DATA - Jadwal Safari Ramadhan Palu 2026/1447H
-- =====================================================
INSERT INTO jadwal_safari (tanggal, ramadhan_ke, waktu_sholat, nama_masjid, status) VALUES
  -- Ramadhan ke-10 (28 Feb 2026)
  ('2026-02-28', 10, 'subuh', 'Jami'' Kampung Baru', 'belum_dilaksanakan'),
  ('2026-02-28', 10, 'dzuhur', 'Sabiilul Muhtadin Samrat', 'belum_dilaksanakan'),
  ('2026-02-28', 10, 'isya', 'Al-Abrar UIN Datokarama', 'belum_dilaksanakan'),
  -- Ramadhan ke-11 (01 Mar 2026)
  ('2026-03-01', 11, 'subuh', 'Pakkarosi Al-Aqsa', 'belum_dilaksanakan'),
  ('2026-03-01', 11, 'dzuhur', 'Baiturrahman Mall Ponegoro', 'belum_dilaksanakan'),
  -- Ramadhan ke-12 (02 Mar 2026)
  ('2026-03-02', 12, 'subuh', 'Siraajul Khaerat Tondo', 'belum_dilaksanakan'),
  ('2026-03-02', 12, 'dzuhur', 'Nurul Iklas S.Parman', 'belum_dilaksanakan'),
  ('2026-03-02', 12, 'isya', 'Al-Khaerat Sis Aljufri', 'belum_dilaksanakan'),
  -- Ramadhan ke-13 (03 Mar 2026)
  ('2026-03-03', 13, 'subuh', 'Uswatun Hasanah Talise', 'belum_dilaksanakan'),
  ('2026-03-03', 13, 'dzuhur', 'Nurul Yaqin PLN Kartini', 'belum_dilaksanakan'),
  ('2026-03-03', 13, 'isya', 'Al-Istigfar Mosque Tondo', 'belum_dilaksanakan'),
  -- Ramadhan ke-14 (04 Mar 2026)
  ('2026-03-04', 14, 'subuh', 'Nurul Iman BTN. Baliase', 'belum_dilaksanakan'),
  ('2026-03-04', 14, 'dzuhur', 'Al-Munawwarah Kartini', 'belum_dilaksanakan'),
  ('2026-03-04', 14, 'isya', 'Nur Assa''Ada Sis Aljufri', 'belum_dilaksanakan'),
  -- Ramadhan ke-15 (05 Mar 2026)
  ('2026-03-05', 15, 'subuh', 'Al-Muttaqin BTN.Puskud', 'belum_dilaksanakan'),
  ('2026-03-05', 15, 'dzuhur', 'An-Naafi Bappeda', 'belum_dilaksanakan'),
  -- Ramadhan ke-16 (06 Mar 2026)
  ('2026-03-06', 16, 'subuh', 'Umar Bin Hattab Masomba', 'belum_dilaksanakan'),
  ('2026-03-06', 16, 'dzuhur', 'Agung Baiturrahim Lolu', 'belum_dilaksanakan'),
  -- Ramadhan ke-17 (07 Mar 2026)
  ('2026-03-07', 17, 'subuh', 'Jami'' Tombolotutu Talise', 'belum_dilaksanakan'),
  ('2026-03-07', 17, 'isya', 'Al-Muttaqin Bulu Masomba', 'belum_dilaksanakan'),
  -- Ramadhan ke-18 (08 Mar 2026)
  ('2026-03-08', 18, 'subuh', 'Nurul Huda, Jamur Impres', 'belum_dilaksanakan');

INSERT INTO donatur (nama, no_hp, alamat, jenis_donatur) VALUES
  ('H. Budi Santoso', '081234567890', 'Jl. Kebon Jeruk No. 5, Palu', 'komitmen'),
  ('Ibu Aminah', '081298765432', 'Jl. Cempaka No. 12, Palu', 'sekali'),
  ('Pak Hendra Wijaya', '085612345678', 'Jl. Raya Darmo No. 33, Palu', 'komitmen'),
  ('Dr. Siti Rahayu', '087654321098', 'Jl. Veteran No. 7, Palu', 'sekali'),
  ('H. Muhammad Rizki', '089876543210', 'Jl. Pahlawan No. 15, Palu', 'komitmen');
