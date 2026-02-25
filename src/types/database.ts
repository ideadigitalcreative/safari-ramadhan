export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            jadwal_safari: {
                Row: {
                    id: string;
                    tanggal: string;
                    ramadhan_ke: number;
                    waktu_sholat: 'subuh' | 'dzuhur' | 'ashar' | 'isya' | 'lainnya';
                    waktu_lainnya: string | null;
                    nama_masjid: string;
                    alamat: string | null;
                    no_pengurus: string | null;
                    status: 'belum_dilaksanakan' | 'sudah_dilaksanakan';
                    keterangan: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tanggal: string;
                    ramadhan_ke: number;
                    waktu_sholat: 'subuh' | 'dzuhur' | 'ashar' | 'isya' | 'lainnya';
                    waktu_lainnya?: string | null;
                    nama_masjid: string;
                    alamat?: string | null;
                    no_pengurus?: string | null;
                    status?: 'belum_dilaksanakan' | 'sudah_dilaksanakan';
                    keterangan?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tanggal?: string;
                    ramadhan_ke?: number;
                    waktu_sholat?: 'subuh' | 'dzuhur' | 'ashar' | 'isya' | 'lainnya';
                    waktu_lainnya?: string | null;
                    nama_masjid?: string;
                    alamat?: string | null;
                    no_pengurus?: string | null;
                    status?: 'belum_dilaksanakan' | 'sudah_dilaksanakan';
                    keterangan?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            donatur: {
                Row: {
                    id: string;
                    nama: string;
                    no_hp: string;
                    alamat: string;
                    jenis_donatur: 'sekali' | 'komitmen';
                    jadwal_safari_id: string | null;
                    catatan: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    nama: string;
                    no_hp: string;
                    alamat: string;
                    jenis_donatur?: 'sekali' | 'komitmen';
                    jadwal_safari_id?: string | null;
                    catatan?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    nama?: string;
                    no_hp?: string;
                    alamat?: string;
                    jenis_donatur?: 'sekali' | 'komitmen';
                    jadwal_safari_id?: string | null;
                    catatan?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            donasi: {
                Row: {
                    id: string;
                    tanggal: string;
                    donatur_id: string;
                    nominal: number;
                    metode_pembayaran: 'cash' | 'transfer';
                    jadwal_safari_id: string;
                    bukti_transfer: string | null;
                    keterangan: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    tanggal: string;
                    donatur_id: string;
                    nominal: number;
                    metode_pembayaran: 'cash' | 'transfer';
                    jadwal_safari_id: string;
                    bukti_transfer?: string | null;
                    keterangan?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    tanggal?: string;
                    donatur_id?: string;
                    nominal?: number;
                    metode_pembayaran?: 'cash' | 'transfer';
                    jadwal_safari_id?: string;
                    bukti_transfer?: string | null;
                    keterangan?: string | null;
                    created_at?: string;
                };
            };
            komitmen: {
                Row: {
                    id: string;
                    donatur_id: string;
                    total_komitmen: number;
                    total_terbayar: number;
                    target_pelunasan: string;
                    status: 'aktif' | 'lunas' | 'menunggak';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    donatur_id: string;
                    total_komitmen: number;
                    total_terbayar?: number;
                    target_pelunasan: string;
                    status?: 'aktif' | 'lunas' | 'menunggak';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    donatur_id?: string;
                    total_komitmen?: number;
                    total_terbayar?: number;
                    target_pelunasan?: string;
                    status?: 'aktif' | 'lunas' | 'menunggak';
                    created_at?: string;
                    updated_at?: string;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    email: string | null;
                    role: 'admin' | 'superadmin' | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email?: string | null;
                    role?: 'admin' | 'superadmin' | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string | null;
                    role?: 'admin' | 'superadmin' | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}

// Convenience types
export type JadwalSafari = Database['public']['Tables']['jadwal_safari']['Row'];
export type JadwalSafariInsert = Database['public']['Tables']['jadwal_safari']['Insert'];
export type JadwalSafariUpdate = Database['public']['Tables']['jadwal_safari']['Update'];

export type Donatur = Database['public']['Tables']['donatur']['Row'];
export type DonaturInsert = Database['public']['Tables']['donatur']['Insert'];
export type DonaturUpdate = Database['public']['Tables']['donatur']['Update'];

export type Donasi = Database['public']['Tables']['donasi']['Row'];
export type DonasiInsert = Database['public']['Tables']['donasi']['Insert'];
export type DonasiUpdate = Database['public']['Tables']['donasi']['Update'];

export type Komitmen = Database['public']['Tables']['komitmen']['Row'];
export type KomitmenInsert = Database['public']['Tables']['komitmen']['Insert'];
export type KomitmenUpdate = Database['public']['Tables']['komitmen']['Update'];

// Extended types with relations
export interface DonasiWithRelations extends Donasi {
    donatur?: Donatur;
    jadwal_safari?: JadwalSafari;
}

export interface KomitmenWithDonatur extends Komitmen {
    donatur?: Donatur;
}

export interface DonaturWithDonasi extends Donatur {
    donasi?: Donasi[];
    komitmen?: Komitmen[];
}
