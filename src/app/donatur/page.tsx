'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatShortDate, formatNumber } from '@/lib/utils';
import { Donatur, Donasi, JadwalSafari } from '@/types/database';
import {
    Users,
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    Phone,
    MapPin,
    Eye,
    Heart,
    Handshake,
    UserCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface DonaturWithHistory extends Donatur {
    total_donasi: number;
    jumlah_donasi: number;
    jadwal_safari?: JadwalSafari;
}

export default function DonaturPage() {
    const [donaturList, setDonaturList] = useState<DonaturWithHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<Donatur | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJenis, setFilterJenis] = useState('semua');
    const [detailDonatur, setDetailDonatur] = useState<string | null>(null);
    const [donaturDonasi, setDonaturDonasi] = useState<(Donasi & { jadwal_safari?: JadwalSafari })[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [formData, setFormData] = useState({
        nama: '',
        no_hp: '',
        alamat: '',
        jenis_donatur: 'sekali' as 'sekali' | 'komitmen',
        jadwal_safari_id: '',
        catatan: '',
    });
    const [jadwalList, setJadwalList] = useState<JadwalSafari[]>([]);

    const fetchDonatur = useCallback(async () => {
        setLoading(true);
        try {
            const { data: donaturData } = await supabase
                .from('donatur')
                .select('*')
                .order('nama') as { data: any[] | null };

            const { data: donasiData } = await supabase
                .from('donasi')
                .select('donatur_id, nominal') as { data: any[] | null };

            // Calculate totals per donatur
            const donasiMap = new Map<string, { total: number; count: number }>();
            donasiData?.forEach((d: any) => {
                const existing = donasiMap.get(d.donatur_id) || { total: 0, count: 0 };
                donasiMap.set(d.donatur_id, {
                    total: existing.total + Number(d.nominal),
                    count: existing.count + 1,
                });
            });

            const { data: jadwalData } = await supabase
                .from('jadwal_safari')
                .select('*')
                .order('tanggal', { ascending: false }) as { data: any[] | null };
            setJadwalList(jadwalData || []);

            const jadwalMap = new Map((jadwalData || []).map((j: any) => [j.id, j]));

            const donaturWithHistory: DonaturWithHistory[] = (donaturData || []).map((d: any) => ({
                ...d,
                total_donasi: donasiMap.get(d.id)?.total || 0,
                jumlah_donasi: donasiMap.get(d.id)?.count || 0,
                jadwal_safari: d.jadwal_safari_id ? jadwalMap.get(d.jadwal_safari_id) : undefined,
            }));

            setDonaturList(donaturWithHistory);
        } catch (error) {
            console.error('Error fetching donatur:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDonatur();
    }, [fetchDonatur]);

    const fetchDonaturDetail = async (donaturId: string) => {
        setLoadingDetail(true);
        try {
            const { data: donasiData } = await supabase
                .from('donasi')
                .select('*')
                .eq('donatur_id', donaturId)
                .order('tanggal', { ascending: false }) as { data: any[] | null };

            const { data: jadwalData } = await supabase
                .from('jadwal_safari')
                .select('*') as { data: any[] | null };

            const jadwalMap = new Map((jadwalData || []).map((j: any) => [j.id, j]));

            setDonaturDonasi(
                (donasiData || []).map((d: any) => ({
                    ...d,
                    jadwal_safari: jadwalMap.get(d.jadwal_safari_id),
                }))
            );
        } catch (error) {
            console.error('Error fetching detail:', error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editItem) {
                const { error } = await (supabase.from('donatur') as any)
                    .update(formData)
                    .eq('id', editItem.id);
                if (error) throw error;

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Data donatur telah diperbarui.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                const { error } = await (supabase.from('donatur') as any)
                    .insert(formData);
                if (error) throw error;

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Donatur baru telah ditambahkan.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
            setShowModal(false);
            setEditItem(null);
            resetForm();
            fetchDonatur();
        } catch (error: any) {
            console.error('Error saving donatur:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Terjadi kesalahan: ' + error.message,
            });
        }
    };

    const handleEdit = (item: Donatur) => {
        setEditItem(item);
        setFormData({
            nama: item.nama,
            no_hp: item.no_hp,
            alamat: item.alamat,
            jenis_donatur: item.jenis_donatur,
            jadwal_safari_id: item.jadwal_safari_id || '',
            catatan: item.catatan || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Hapus Donatur?',
            text: "Seluruh riwayat donasi terkait juga akan terhapus!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('donatur').delete().eq('id', id);
                if (error) throw error;

                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus!',
                    text: 'Data donatur telah dihapus.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchDonatur();
            } catch (error: any) {
                console.error('Error deleting donatur:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!',
                    text: 'Gagal menghapus donatur.',
                });
            }
        }
    };

    const handleViewDetail = (donaturId: string) => {
        setDetailDonatur(donaturId);
        fetchDonaturDetail(donaturId);
    };

    const resetForm = () => {
        setFormData({
            nama: '',
            no_hp: '',
            alamat: '',
            jenis_donatur: 'sekali',
            jadwal_safari_id: '',
            catatan: '',
        });
    };

    const filteredList = donaturList.filter((item) => {
        const query = searchQuery.toLowerCase();
        const matchSearch =
            item.nama.toLowerCase().includes(query) ||
            item.no_hp.includes(query) ||
            item.alamat.toLowerCase().includes(query);
        const matchJenis = filterJenis === 'semua' || item.jenis_donatur === filterJenis;
        return matchSearch && matchJenis;
    });

    const selectedDonatur = donaturList.find((d) => d.id === detailDonatur);

    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 lg:ml-[280px] pt-16 lg:pt-0">
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-1">
                                Manajemen <span className="gradient-text">Donatur</span>
                            </h1>
                            <p className="text-dark-500 text-sm">Kelola data donatur dan riwayat donasi</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setEditItem(null); setShowModal(true); }}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" /> Tambah Donatur
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="glass-card-static p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-dark-900">{formatNumber(donaturList.length)}</p>
                                <p className="text-xs text-dark-500">Total Donatur</p>
                            </div>
                        </div>
                        <div className="glass-card-static p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-dark-900">{formatNumber(donaturList.filter(d => d.jenis_donatur === 'sekali').length)}</p>
                                <p className="text-xs text-dark-500">Donatur Sekali</p>
                            </div>
                        </div>
                        <div className="glass-card-static p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                                <Handshake className="w-5 h-5 text-accent-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-dark-900">{formatNumber(donaturList.filter(d => d.jenis_donatur === 'komitmen').length)}</p>
                                <p className="text-xs text-dark-500">Donatur Komitmen</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="glass-card-static p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, nomor HP, atau alamat..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input pl-11 shadow-sm border-dark-100"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-dark-500" />
                                <select
                                    value={filterJenis}
                                    onChange={(e) => setFilterJenis(e.target.value)}
                                    className="form-select min-w-[180px]"
                                >
                                    <option value="semua">Semua Jenis</option>
                                    <option value="sekali">Sekali Donasi</option>
                                    <option value="komitmen">Komitmen</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    {loading ? (
                        <LoadingSkeleton rows={6} />
                    ) : filteredList.length === 0 ? (
                        <div className="glass-card-static">
                            <EmptyState
                                icon={<Users className="w-10 h-10 text-dark-600" />}
                                title="Belum Ada Donatur"
                                description="Belum ada donatur terdaftar. Tambahkan donatur baru untuk mulai mencatat donasi."
                                action={
                                    <button onClick={() => { resetForm(); setEditItem(null); setShowModal(true); }} className="btn-primary">
                                        <Plus className="w-4 h-4" /> Tambah Donatur
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredList.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="glass-card p-5"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center">
                                                <span className="text-lg font-bold text-primary-600">
                                                    {item.nama.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-dark-900">{item.nama}</p>
                                                <span className={`badge text-xs mt-1 ${item.jenis_donatur === 'komitmen'
                                                    ? 'bg-accent-50 text-accent-600 border-accent-100'
                                                    : 'bg-primary-50 text-primary-600 border-primary-100'
                                                    }`}>
                                                    {item.jenis_donatur === 'komitmen' ? 'Komitmen' : 'Sekali Donasi'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-xs text-dark-500 flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-dark-400" /> {item.no_hp || '-'}
                                        </p>
                                        <p className="text-xs text-dark-500 flex items-center gap-2">
                                            <MapPin className="w-3 h-3 text-dark-400" /> {item.alamat || '-'}
                                        </p>
                                        {item.jadwal_safari && (
                                            <p className="text-xs text-primary-600 flex items-center gap-2 font-medium">
                                                <Handshake className="w-3 h-3" /> Rekrutmen: {item.jadwal_safari.nama_masjid}
                                            </p>
                                        )}
                                        {item.catatan && (
                                            <div className="mt-2 p-2 rounded-lg bg-orange-50/50 border border-orange-100/50">
                                                <p className="text-[10px] text-orange-700 leading-relaxed italic">
                                                    "{item.catatan}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-dark-50 mb-4 border border-dark-100">
                                        <div>
                                            <p className="text-xs text-dark-500">Total Donasi</p>
                                            <p className="text-sm font-bold text-primary-600">{formatCurrency(item.total_donasi)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-dark-500">Transaksi</p>
                                            <p className="text-sm font-bold text-dark-900">{formatNumber(item.jumlah_donasi)}x</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewDetail(item.id)}
                                            className="flex-1 py-2 rounded-xl bg-primary-50 text-primary-600 text-xs font-semibold hover:bg-primary-100 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Detail
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditItem(null); resetForm(); }}
                title={editItem ? 'Edit Donatur' : 'Tambah Donatur'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="form-label">Nama Lengkap</label>
                        <input type="text" required placeholder="Nama donatur" value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            className="form-input" />
                    </div>
                    <div>
                        <label className="form-label">Nomor HP</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                                <Phone className="w-4 h-4" />
                            </span>
                            <input type="text" inputMode="numeric" required placeholder="08xxxxxxxxxx" value={formData.no_hp}
                                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value.replace(/[^0-9]/g, '') })}
                                className="form-input pl-11" />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Alamat</label>
                        <textarea required placeholder="Alamat lengkap" value={formData.alamat}
                            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                            className="form-input min-h-[80px] resize-none" />
                    </div>
                    <div>
                        <label className="form-label">Jenis Donatur</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, jenis_donatur: 'sekali' })}
                                className={`p-4 rounded-xl border-2 transition-all text-center ${formData.jenis_donatur === 'sekali'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-dark-100 bg-white hover:border-primary-200'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 mx-auto mb-1 ${formData.jenis_donatur === 'sekali' ? 'text-primary-600' : 'text-dark-400'}`} />
                                <span className={`font-semibold text-sm ${formData.jenis_donatur === 'sekali' ? 'text-primary-700' : 'text-dark-500'}`}>Sekali Donasi</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, jenis_donatur: 'komitmen' })}
                                className={`p-4 rounded-xl border-2 transition-all text-center ${formData.jenis_donatur === 'komitmen'
                                    ? 'border-accent-500 bg-accent-50'
                                    : 'border-dark-100 bg-white hover:border-accent-200'
                                    }`}
                            >
                                <Handshake className={`w-5 h-5 mx-auto mb-1 ${formData.jenis_donatur === 'komitmen' ? 'text-accent-600' : 'text-dark-400'}`} />
                                <span className={`font-semibold text-sm ${formData.jenis_donatur === 'komitmen' ? 'text-accent-700' : 'text-dark-500'}`}>Komitmen</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Terdaftar Melalui Masjid</label>
                        <select
                            value={formData.jadwal_safari_id}
                            onChange={(e) => setFormData({ ...formData, jadwal_safari_id: e.target.value })}
                            className="form-select"
                        >
                            <option value="">Pilih Masjid (Opsional)</option>
                            {jadwalList.map((j) => (
                                <option key={j.id} value={j.id}>
                                    {j.nama_masjid} — {formatShortDate(j.tanggal)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Catatan</label>
                        <textarea
                            placeholder="Catatan tambahan tentang donatur..."
                            value={formData.catatan}
                            onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                            className="form-input min-h-[80px] resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" className="btn-primary flex-1 justify-center">
                            {editItem ? 'Simpan Perubahan' : 'Tambah Donatur'}
                        </button>
                        <button type="button" onClick={() => { setShowModal(false); setEditItem(null); resetForm(); }} className="btn-secondary">
                            Batal
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={!!detailDonatur}
                onClose={() => setDetailDonatur(null)}
                title={`Riwayat Donasi - ${selectedDonatur?.nama || ''}`}
                size="lg"
            >
                {loadingDetail ? (
                    <LoadingSkeleton rows={4} />
                ) : donaturDonasi.length === 0 ? (
                    <div className="text-center py-8">
                        <Heart className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                        <p className="text-dark-400">Belum ada riwayat donasi</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {donaturDonasi.map((d) => (
                            <div key={d.id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-50 border border-dark-100/50">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                                    <Heart className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-dark-900">{d.jadwal_safari?.nama_masjid || '-'}</p>
                                    <p className="text-xs text-dark-500">{formatShortDate(d.tanggal)} • {d.metode_pembayaran === 'cash' ? 'Cash' : 'Transfer'}</p>
                                </div>
                                <p className="text-sm font-bold text-primary-600">{formatCurrency(Number(d.nominal))}</p>
                            </div>
                        ))}
                        <div className="border-t border-dark-100 pt-3 mt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-dark-500">Total</span>
                                <span className="text-lg font-bold text-dark-900">
                                    {formatCurrency(donaturDonasi.reduce((s, d) => s + Number(d.nominal), 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
