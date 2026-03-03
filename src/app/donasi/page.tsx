'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatShortDate, calculateProgress, getKomitmenStatus, formatNumber, formatInputNumber } from '@/lib/utils';
import { Donatur, JadwalSafari, DonasiWithRelations } from '@/types/database';
import {
    Heart,
    Plus,
    Search,
    Filter,
    Trash2,
    MapPin,
    CreditCard,
    Banknote,
    Upload,
    Eye,
    Handshake,
    UserCheck,
    Phone,
    Pencil,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function DonasiPage() {
    const [donasiList, setDonasiList] = useState<DonasiWithRelations[]>([]);
    const [donaturList, setDonaturList] = useState<Donatur[]>([]);
    const [jadwalList, setJadwalList] = useState<JadwalSafari[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMetode, setFilterMetode] = useState('semua');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        donatur_id: '',
        nama_donatur: '', // Added for manual input
        no_hp_donatur: '', // New field
        jenis_donatur: 'sekali' as 'sekali' | 'komitmen', // New field
        total_komitmen: '', // New field for commitment
        target_pelunasan: '', // New field for commitment
        nominal: '',
        metode_pembayaran: 'cash' as 'cash' | 'transfer',
        jadwal_safari_id: '',
        bukti_transfer: '',
        keterangan: '',
    });

    const [activeKomitmen, setActiveKomitmen] = useState<any | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch donasi with related data
            const { data: donasiData } = await supabase
                .from('donasi')
                .select('*')
                .order('tanggal', { ascending: false });

            // Fetch donatur
            const { data: donaturData } = await supabase
                .from('donatur')
                .select('*')
                .order('nama');

            // Fetch jadwal
            const { data: jadwalData } = await supabase
                .from('jadwal_safari')
                .select('*')
                .order('tanggal', { ascending: true });

            // Map relations
            const donaturMap = new Map((donaturData as Donatur[] | null)?.map((d) => [d.id, d]) || []);
            const jadwalMap = new Map((jadwalData as JadwalSafari[] | null)?.map((j) => [j.id, j]) || []);

            const donasiWithRelations: DonasiWithRelations[] = (donasiData as any[] || []).map((d: any) => ({
                ...d,
                donatur: donaturMap.get(d.donatur_id),
                jadwal_safari: jadwalMap.get(d.jadwal_safari_id),
            }));

            setDonasiList(donasiWithRelations);
            setDonaturList(donaturData || []);

            // Sort jadwalList by date and then time score
            const SHOLAT_TIME_SCORES: Record<string, string> = {
                subuh: '05:00',
                dzuhur: '12:00',
                ashar: '15:30',
                isya: '19:30',
                lainnya: '23:59'
            };

            const getTimeScore = (item: JadwalSafari) => {
                return item.jam || SHOLAT_TIME_SCORES[item.waktu_sholat] || '23:59';
            };

            const sortedJadwal = (jadwalData as JadwalSafari[] || []).sort((a, b) => {
                if (a.tanggal !== b.tanggal) {
                    return a.tanggal.localeCompare(b.tanggal);
                }
                return getTimeScore(a).localeCompare(getTimeScore(b));
            });

            setJadwalList(sortedJadwal);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const fetchActiveKomitmen = async () => {
            if (formData.donatur_id && formData.jenis_donatur === 'komitmen') {
                const { data } = await supabase
                    .from('komitmen')
                    .select('*')
                    .eq('donatur_id', formData.donatur_id)
                    .neq('status', 'lunas')
                    .maybeSingle();

                setActiveKomitmen(data);
                if (data && !editingId) { // Only auto-fill if not editing an existing donation (to avoid overwriting)
                    const k = data as any;
                    setFormData(prev => ({
                        ...prev,
                        total_komitmen: k.total_komitmen.toString(),
                        target_pelunasan: k.target_pelunasan
                    }));
                } else if (data && editingId) {
                    // If editing, we still want to show the current commitment progress
                    const k = data as any;
                    setFormData(prev => ({
                        ...prev,
                        total_komitmen: prev.total_komitmen || k.total_komitmen.toString(),
                        target_pelunasan: prev.target_pelunasan || k.target_pelunasan
                    }));
                }
            } else {
                setActiveKomitmen(null);
            }
        };
        fetchActiveKomitmen();
    }, [formData.donatur_id, formData.jenis_donatur, editingId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let donaturId = formData.donatur_id;

            // If donatur_id is empty but nama_donatur is present, find or create donatur
            if (!donaturId && formData.nama_donatur) {
                // Check if name already exists in our local list (fetched in fetchData)
                const existing = donaturList.find(d => d.nama.toLowerCase() === formData.nama_donatur.toLowerCase());

                if (existing) {
                    donaturId = existing.id;
                    // Update existing donatur if info changed
                    if (existing.no_hp !== formData.no_hp_donatur || existing.jenis_donatur !== formData.jenis_donatur) {
                        await (supabase.from('donatur') as any).update({
                            no_hp: formData.no_hp_donatur,
                            jenis_donatur: formData.jenis_donatur
                        }).eq('id', existing.id);
                    }
                } else {
                    // Create new donatur
                    const { data: newDonatur, error: dError } = await (supabase.from('donatur') as any)
                        .insert({
                            nama: formData.nama_donatur,
                            no_hp: formData.no_hp_donatur,
                            alamat: '',
                            jenis_donatur: formData.jenis_donatur
                        })
                        .select()
                        .single();

                    if (dError) throw dError;
                    donaturId = newDonatur.id;
                }
            }

            if (!donaturId) throw new Error('Donatur harus diisi');

            const nominal = parseFloat(formData.nominal) || 0;

            // 1. If it's a commitment, handle the komitmen record first
            if (formData.jenis_donatur === 'komitmen') {
                const totalKomitmen = parseFloat(formData.total_komitmen) || 0;

                if (activeKomitmen) {
                    // Update existing
                    const newTotalPaid = Number(activeKomitmen.total_terbayar) + nominal;
                    const newStatus = newTotalPaid >= Number(activeKomitmen.total_komitmen) ? 'lunas' : 'aktif';

                    const { error: kError } = await (supabase.from('komitmen') as any)
                        .update({
                            total_terbayar: newTotalPaid,
                            status: newStatus,
                            target_pelunasan: formData.target_pelunasan || activeKomitmen.target_pelunasan
                        })
                        .eq('id', activeKomitmen.id);
                    if (kError) throw kError;
                } else if (totalKomitmen > 0) {
                    // Create new
                    const newStatus = nominal >= totalKomitmen ? 'lunas' : 'aktif';
                    const { error: kError } = await (supabase.from('komitmen') as any)
                        .insert({
                            donatur_id: donaturId,
                            total_komitmen: totalKomitmen,
                            total_terbayar: nominal,
                            target_pelunasan: formData.target_pelunasan || new Date().toISOString().split('T')[0],
                            status: newStatus
                        });
                    if (kError) throw kError;
                }
            }

            // 2. Insert or Update donasi table ONLY if nominal > 0
            if (nominal > 0) {
                if (editingId) {
                    const { error } = await (supabase.from('donasi') as any).update({
                        tanggal: formData.tanggal,
                        donatur_id: donaturId,
                        nominal: nominal,
                        metode_pembayaran: formData.metode_pembayaran,
                        jadwal_safari_id: formData.jadwal_safari_id,
                        bukti_transfer: formData.bukti_transfer || null,
                        keterangan: formData.keterangan || null,
                    }).eq('id', editingId);
                    if (error) throw error;
                } else {
                    const { error } = await (supabase.from('donasi') as any).insert({
                        tanggal: formData.tanggal,
                        donatur_id: donaturId,
                        nominal: nominal,
                        metode_pembayaran: formData.metode_pembayaran,
                        jadwal_safari_id: formData.jadwal_safari_id,
                        bukti_transfer: formData.bukti_transfer || null,
                        keterangan: formData.keterangan || null,
                    });
                    if (error) throw error;
                }
            }

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Donasi telah berhasil dicatat.',
                timer: 2000,
                showConfirmButton: false,
            });
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            console.error('Error saving donasi:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Gagal menyimpan donasi: ' + error.message,
            });
        }
    };

    const handleEdit = (item: DonasiWithRelations) => {
        setEditingId(item.id);
        setFormData({
            tanggal: item.tanggal,
            donatur_id: item.donatur_id,
            nama_donatur: item.donatur?.nama || '',
            no_hp_donatur: item.donatur?.no_hp || '',
            jenis_donatur: item.donatur?.jenis_donatur || 'sekali',
            total_komitmen: '',
            target_pelunasan: '',
            nominal: item.nominal.toString(),
            metode_pembayaran: item.metode_pembayaran,
            jadwal_safari_id: item.jadwal_safari_id,
            bukti_transfer: item.bukti_transfer || '',
            keterangan: item.keterangan || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Hapus Donasi?',
            text: "Data donasi ini akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('donasi').delete().eq('id', id);
                if (error) throw error;

                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus!',
                    text: 'Data donasi telah dihapus.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData();
            } catch (error: any) {
                console.error('Error deleting donasi:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!',
                    text: 'Gagal menghapus donasi.',
                });
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 2MB for base64 storage efficiency)
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'File terlalu besar',
                text: 'Maksimal ukuran file adalah 2MB agar sistem tetap ringan.',
            });
            return;
        }

        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData({ ...formData, bukti_transfer: base64String });

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Bukti transfer berhasil diproses.',
                    timer: 1500,
                    showConfirmButton: false
                });
            };
            reader.onerror = () => {
                throw new Error('Gagal membaca file');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error processing file:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Terjadi kesalahan saat memproses gambar.',
            });
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            donatur_id: '',
            nama_donatur: '',
            no_hp_donatur: '',
            jenis_donatur: 'sekali',
            total_komitmen: '',
            target_pelunasan: '',
            nominal: '',
            metode_pembayaran: 'cash',
            jadwal_safari_id: '',
            bukti_transfer: '',
            keterangan: '',
        });
        setActiveKomitmen(null);
    };

    const filteredList = donasiList.filter((item) => {
        const query = searchQuery.toLowerCase();
        const matchSearch =
            item.donatur?.nama.toLowerCase().includes(query) ||
            item.jadwal_safari?.nama_masjid.toLowerCase().includes(query);
        const matchMetode = filterMetode === 'semua' || item.metode_pembayaran === filterMetode;
        return matchSearch && matchMetode;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    const totalFiltered = filteredList.reduce((sum, d) => sum + Number(d.nominal), 0);

    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 lg:ml-[280px] pt-16 lg:pt-0">
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-1">
                                Pencatatan <span className="gradient-text">Donasi</span>
                            </h1>
                            <p className="text-dark-500 text-sm">Input dan kelola donasi masuk dari donatur</p>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Catat Donasi
                        </button>
                    </div>

                    <div className="glass-card-static p-5 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                                    <Heart className="w-6 h-6 text-primary-500" />
                                </div>
                                {loading ? (
                                    <div className="h-8 w-32 bg-primary-100 animate-pulse rounded-lg" />
                                ) : (
                                    <div>
                                        <p className="text-xs text-dark-500 font-medium uppercase tracking-wider">Total Ditampilkan</p>
                                        <p className="text-2xl font-bold text-dark-900">{formatCurrency(totalFiltered)}</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-dark-500">{formatNumber(filteredList.length)} transaksi</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="glass-card-static p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama donatur atau masjid..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input pl-11 shadow-sm border-dark-100"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-dark-400" />
                                <select
                                    value={filterMetode}
                                    onChange={(e) => setFilterMetode(e.target.value)}
                                    className="form-select min-w-[160px]"
                                >
                                    <option value="semua">Semua Metode</option>
                                    <option value="cash">Cash</option>
                                    <option value="transfer">Transfer</option>
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
                                icon={<Heart className="w-10 h-10 text-dark-600" />}
                                title="Belum Ada Donasi"
                                description="Belum ada donasi yang dicatat. Mulai catat donasi baru dengan klik tombol di atas."
                                action={
                                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
                                        <Plus className="w-4 h-4" /> Catat Donasi
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block glass-card-static overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-dark-100">
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Tanggal</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Donatur</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Masjid</th>
                                                <th className="text-right py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Nominal</th>
                                                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Metode</th>
                                                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Bukti</th>
                                                <th className="text-right py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredList.map((item) => (
                                                <tr key={item.id} className="table-row">
                                                    <td className="py-4 px-6 text-sm text-dark-600">{formatShortDate(item.tanggal)}</td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-sm font-semibold text-dark-900">{item.donatur?.nama || '-'}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-sm text-dark-600 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-dark-400" />
                                                            {item.jadwal_safari?.nama_masjid || '-'}
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="text-sm font-bold text-primary-600">{formatCurrency(Number(item.nominal))}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`badge text-xs ${item.metode_pembayaran === 'cash'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-blue-50 text-blue-600 border-blue-100'
                                                            }`}>
                                                            {item.metode_pembayaran === 'cash' ? (
                                                                <Banknote className="w-3 h-3 mr-1" />
                                                            ) : (
                                                                <CreditCard className="w-3 h-3 mr-1" />
                                                            )}
                                                            {item.metode_pembayaran === 'cash' ? 'Cash' : 'Transfer'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        {item.bukti_transfer ? (
                                                            <button
                                                                onClick={() => setPreviewImage(item.bukti_transfer)}
                                                                className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors mx-auto"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-dark-600">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600 hover:bg-primary-500/20 transition-colors"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {filteredList.map((item) => (
                                    <div key={item.id} className="glass-card p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-dark-900">{item.donatur?.nama || '-'}</p>
                                                <p className="text-xs text-dark-500 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3" /> {item.jadwal_safari?.nama_masjid || '-'}
                                                </p>
                                            </div>
                                            <p className="text-lg font-bold text-primary-600">{formatCurrency(Number(item.nominal))}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-dark-500">{formatShortDate(item.tanggal)}</span>
                                                <span className={`badge text-xs ${item.metode_pembayaran === 'cash'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {item.metode_pembayaran === 'cash' ? 'Cash' : 'Transfer'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? "Edit Donasi" : "Catat Donasi Baru"} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="form-label">Tanggal</label>
                        <input
                            type="date"
                            required
                            value={formData.tanggal}
                            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className="form-label">Nominal (Rp)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-semibold text-sm">Rp</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                placeholder="0"
                                value={formatInputNumber(formData.nominal)}
                                onChange={(e) => setFormData({ ...formData, nominal: e.target.value.replace(/[^0-9]/g, '') })}
                                className="form-input pl-11"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Nama Donatur</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                placeholder="Masukkan nama donatur..."
                                list="donatur-list"
                                value={formData.nama_donatur}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const found = donaturList.find(d => d.nama === val);
                                    setFormData({
                                        ...formData,
                                        nama_donatur: val,
                                        donatur_id: found ? found.id : '',
                                        no_hp_donatur: found ? found.no_hp : formData.no_hp_donatur,
                                        jenis_donatur: found ? found.jenis_donatur : formData.jenis_donatur as any
                                    });
                                }}
                                className="form-input"
                            />
                            <datalist id="donatur-list">
                                {donaturList.map(d => (
                                    <option key={d.id} value={d.nama} />
                                ))}
                            </datalist>
                            {formData.donatur_id && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 text-[10px] font-bold border border-primary-100">
                                    <UserCheck className="w-3 h-3" /> TERDAFTAR
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Nomor WhatsApp/HP</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                                <Phone className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="08..."
                                value={formData.no_hp_donatur}
                                onChange={(e) => setFormData({ ...formData, no_hp_donatur: e.target.value.replace(/[^0-9]/g, '') })}
                                className="form-input pl-11"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Jenis Donasi</label>
                        <select
                            value={formData.jenis_donatur}
                            onChange={(e) => setFormData({ ...formData, jenis_donatur: e.target.value as any })}
                            className="form-select"
                        >
                            <option value="sekali">Sekali Donasi</option>
                            <option value="komitmen">Komitmen</option>
                        </select>
                    </div>

                    {formData.jenis_donatur === 'komitmen' && (
                        <div className="p-4 rounded-2xl bg-accent-50/50 border border-accent-100 space-y-4">
                            <div className="flex items-center justify-between text-accent-700 font-bold text-sm">
                                <div className="flex items-center gap-2">
                                    <Handshake className="w-4 h-4" /> Informasi Komitmen
                                </div>
                                {activeKomitmen && (
                                    <span className={`badge text-[10px] ${getKomitmenStatus(activeKomitmen.total_terbayar, activeKomitmen.total_komitmen, activeKomitmen.status).color}`}>
                                        {getKomitmenStatus(activeKomitmen.total_terbayar, activeKomitmen.total_komitmen, activeKomitmen.status).label}
                                    </span>
                                )}
                            </div>

                            {activeKomitmen && (
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className="p-3 rounded-xl bg-white border border-accent-100">
                                        <p className="text-[10px] text-dark-500 uppercase font-black mb-1">Sudah Dibayar</p>
                                        <p className="text-sm font-bold text-dark-900">{formatCurrency(Number(activeKomitmen.total_terbayar))}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-accent-100">
                                        <p className="text-[10px] text-dark-500 uppercase font-black mb-1">Sisa Komitmen</p>
                                        <p className="text-sm font-bold text-red-600">{formatCurrency(Number(activeKomitmen.total_komitmen) - Number(activeKomitmen.total_terbayar))}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-bold text-dark-500">PROGRES PELUNASAN</span>
                                            <span className="text-[10px] font-black text-accent-700">{calculateProgress(activeKomitmen.total_terbayar, activeKomitmen.total_komitmen)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-accent-100">
                                            <div
                                                className="h-full bg-accent-500 rounded-full transition-all duration-500"
                                                style={{ width: `${calculateProgress(activeKomitmen.total_terbayar, activeKomitmen.total_komitmen)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="form-label text-accent-700">Total Komitmen (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-400 font-semibold text-sm">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            required={formData.jenis_donatur === 'komitmen'}
                                            placeholder="Contoh: 2000000"
                                            value={formatInputNumber(formData.total_komitmen)}
                                            onChange={(e) => setFormData({ ...formData, total_komitmen: e.target.value.replace(/[^0-9]/g, '') })}
                                            className="form-input pl-11 border-accent-100 focus:border-accent-500"
                                        />
                                    </div>
                                    {activeKomitmen && <p className="text-[9px] text-accent-600 mt-1">* Mengubah ini akan memperbarui total komitmen</p>}
                                </div>
                                <div>
                                    <label className="form-label text-accent-700">Target Pelunasan</label>
                                    <input
                                        type="date"
                                        required={formData.jenis_donatur === 'komitmen'}
                                        value={formData.target_pelunasan}
                                        onChange={(e) => setFormData({ ...formData, target_pelunasan: e.target.value })}
                                        className="form-input border-accent-100 focus:border-accent-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="form-label">Lokasi Masjid</label>
                        <select
                            required
                            value={formData.jadwal_safari_id}
                            onChange={(e) => setFormData({ ...formData, jadwal_safari_id: e.target.value })}
                            className="form-select"
                        >
                            <option value="">Pilih Masjid</option>
                            {jadwalList.map((j) => (
                                <option key={j.id} value={j.id}>
                                    {j.nama_masjid} — {j.jam ? `[${j.jam}] ` : ''}{(j as any).waktu_sholat?.charAt(0).toUpperCase() + (j as any).waktu_sholat?.slice(1)} ({formatShortDate(j.tanggal)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Metode Pembayaran</label>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, metode_pembayaran: 'cash' })}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.metode_pembayaran === 'cash'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-dark-100 bg-white hover:border-primary-200'
                                    }`}
                            >
                                <Banknote className={`w-5 h-5 ${formData.metode_pembayaran === 'cash' ? 'text-primary-600' : 'text-dark-400'}`} />
                                <span className={`font-semibold text-sm ${formData.metode_pembayaran === 'cash' ? 'text-primary-700' : 'text-dark-500'}`}>Cash</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, metode_pembayaran: 'transfer' })}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.metode_pembayaran === 'transfer'
                                    ? 'border-accent-500 bg-accent-50'
                                    : 'border-dark-100 bg-white hover:border-accent-200'
                                    }`}
                            >
                                <CreditCard className={`w-5 h-5 ${formData.metode_pembayaran === 'transfer' ? 'text-accent-600' : 'text-dark-400'}`} />
                                <span className={`font-semibold text-sm ${formData.metode_pembayaran === 'transfer' ? 'text-accent-700' : 'text-dark-500'}`}>Transfer</span>
                            </button>
                        </div>
                    </div>
                    {formData.metode_pembayaran === 'transfer' && (
                        <div>
                            <label className="form-label">Bukti Transfer (Opsional)</label>
                            {formData.bukti_transfer ? (
                                <div className="space-y-3">
                                    <div className="relative group rounded-xl overflow-hidden border border-dark-200">
                                        <img
                                            src={formData.bukti_transfer}
                                            alt="Preview"
                                            className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setPreviewImage(formData.bukti_transfer)}
                                        />
                                        <div className="absolute inset-0 bg-dark-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewImage(formData.bukti_transfer)}
                                                className="p-2 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, bukti_transfer: '' })}
                                                className="p-2 rounded-lg bg-red-500/80 backdrop-blur-md text-white hover:bg-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-px bg-dark-100"></div>
                                        <span className="text-[10px] font-bold text-dark-400 uppercase">Atau Ganti Gambar</span>
                                        <div className="flex-1 h-px bg-dark-100"></div>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="w-full text-sm text-dark-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                                    />
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-dark-100 rounded-xl p-6 text-center hover:border-primary-200 transition-colors relative">
                                    <Upload className="w-8 h-8 text-dark-400 mx-auto mb-2" />
                                    <p className="text-sm text-dark-500 mb-2">Klik untuk upload bukti</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <div>
                        <label className="form-label">Keterangan (Opsional)</label>
                        <textarea
                            placeholder="Catatan tambahan..."
                            value={formData.keterangan}
                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                            className="form-input min-h-[80px] resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" className="btn-primary flex-1 justify-center">
                            <Heart className="w-4 h-4" /> Simpan Donasi
                        </button>
                        <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
                            Batal
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Image Preview */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-dark-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="max-w-lg w-full">
                        <img src={previewImage} alt="Bukti Transfer" className="w-full rounded-2xl" />
                        <p className="text-center text-dark-400 text-sm mt-4">Klik di mana saja untuk menutup</p>
                    </div>
                </div>
            )}
        </div>
    );
}
