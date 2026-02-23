-- =====================================================
-- MIGRATION: Update jadwal_safari to new format
-- Run this ONLY if you already have the old table
-- =====================================================

-- Add new columns
ALTER TABLE jadwal_safari ADD COLUMN IF NOT EXISTS ramadhan_ke INTEGER;
ALTER TABLE jadwal_safari ADD COLUMN IF NOT EXISTS waktu_sholat VARCHAR(10);
ALTER TABLE jadwal_safari ADD COLUMN IF NOT EXISTS no_pengurus VARCHAR(20);
ALTER TABLE jadwal_safari ADD COLUMN IF NOT EXISTS keterangan TEXT;

-- Make alamat nullable
ALTER TABLE jadwal_safari ALTER COLUMN alamat DROP NOT NULL;

-- Drop nama_penceramah column
ALTER TABLE jadwal_safari DROP COLUMN IF EXISTS nama_penceramah;

-- Set default values for existing rows
UPDATE jadwal_safari SET ramadhan_ke = 1, waktu_sholat = 'subuh' WHERE ramadhan_ke IS NULL;

-- Now make the new columns NOT NULL
ALTER TABLE jadwal_safari ALTER COLUMN ramadhan_ke SET NOT NULL;
ALTER TABLE jadwal_safari ALTER COLUMN waktu_sholat SET NOT NULL;

-- Add constraint for waktu_sholat
ALTER TABLE jadwal_safari ADD CONSTRAINT check_waktu_sholat CHECK (waktu_sholat IN ('subuh', 'dzuhur', 'isya'));

-- Add index for ramadhan_ke
CREATE INDEX IF NOT EXISTS idx_jadwal_ramadhan_ke ON jadwal_safari(ramadhan_ke);
