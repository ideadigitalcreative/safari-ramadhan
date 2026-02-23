-- Clear existing jadwal if needed (Optional: Remove comment if you want to replace all data)
-- DELETE FROM jadwal_safari;

-- Insert Jadwal Safari Ramadhan Palu 2026 / 1447H
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

-- Optional: Add sample donatur data for testing
-- INSERT INTO donatur (nama, no_hp, alamat, jenis_donatur) VALUES
--   ('H. Budi Santoso', '081234567890', 'Jl. Kebon Jeruk No. 5, Palu', 'komitmen'),
--   ('Ibu Aminah', '081298765432', 'Jl. Cempaka No. 12, Palu', 'sekali');
