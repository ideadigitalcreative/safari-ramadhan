-- Alter table donatur to add new columns and make existing ones optional
ALTER TABLE donatur 
ADD COLUMN IF NOT EXISTS jadwal_safari_id UUID REFERENCES jadwal_safari(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS catatan TEXT;

-- Make no_hp and alamat optional for manual entry flexibility
ALTER TABLE donatur ALTER COLUMN no_hp DROP NOT NULL;
ALTER TABLE donatur ALTER COLUMN alamat DROP NOT NULL;
