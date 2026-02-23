'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatShortDate, getStatusColor, getStatusLabel, calculateProgress, getKomitmenStatus, formatInputNumber } from '@/lib/utils';
import { Donatur, KomitmenWithDonatur } from '@/types/database';
import {
    Handshake,
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
} from 'lucide-react';

export default function KomitmenPage() {
    const [komitmenList, setKomitmenList] = useState<KomitmenWithDonatur[]>([]);
    const [donaturList, setDonaturList] = useState<Donatur[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<KomitmenWithDonatur | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        donatur_id: '',
        total_komitmen: '',
        target_pelunasan: '',
        status: 'aktif' as 'aktif' | 'lunas' | 'menunggak',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch komitmen with donatur data
            const { data: komitmenData } = await supabase
                .from('komitmen')
                .select(`
          *,
          donatur:donatur_id(*)
        `)
                .order('created_at', { ascending: false }) as { data: any[] | null };

            // Fetch donatur (only those with type 'komitmen')
            const { data: donaturData } = await supabase
                .from('donatur')
                .select('*')
                .eq('jenis_donatur', 'komitmen')
                .order('nama') as { data: any[] | null };

            setKomitmenList(komitmenData as KomitmenWithDonatur[] || []);
            setDonaturList(donaturData as Donatur[] || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = {
                donatur_id: formData.donatur_id,
                total_komitmen: parseFloat(formData.total_komitmen),
                target_pelunasan: formData.target_pelunasan,
                status: formData.status,
            };

            if (editItem) {
                const { error } = await (supabase.from('komitmen') as any)
                    .update(dataToSave)
                    .eq('id', editItem.id);
                if (error) throw error;
            } else {
                const { error } = await (supabase.from('komitmen') as any)
                    .insert({
                        ...dataToSave,
                        total_terbayar: 0,
                    });
                if (error) throw error;
            }

            setShowModal(false);
            setEditItem(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving komitmen:', error);
        }
    };

    const handleEdit = (item: KomitmenWithDonatur) => {
        setEditItem(item);
        setFormData({
            donatur_id: item.donatur_id,
            total_komitmen: item.total_komitmen.toString(),
            target_pelunasan: item.target_pelunasan,
            status: item.status,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('komitmen').delete().eq('id', id);
            if (error) throw error;
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting komitmen:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            donatur_id: '',
            total_komitmen: '',
            target_pelunasan: '',
            status: 'aktif',
        });
    };

    const filteredList = komitmenList.filter((item) => {
        const query = searchQuery.toLowerCase();
        const matchSearch = item.donatur?.nama.toLowerCase().includes(query);
        const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 lg:ml-[280px] pt-16 lg:pt-0">
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-1">
                                Donasi <span className="gradient-text">Komitmen</span>
                            </h1>
                            <p className="text-dark-500 text-sm">Monitoring komitmen donasi dan progres cicilan</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setEditItem(null); setShowModal(true); }}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" /> Tambah Komitmen
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="glass-card-static p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama donatur..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input pl-11 shadow-sm border-dark-100"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-dark-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="form-select min-w-[160px]"
                                >
                                    <option value="semua">Semua Status</option>
                                    <option value="aktif">Aktif</option>
                                    <option value="lunas">Lunas</option>
                                    <option value="menunggak">Menunggak</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Grid List */}
                    {loading ? (
                        <LoadingSkeleton rows={6} />
                    ) : filteredList.length === 0 ? (
                        <div className="glass-card-static">
                            <EmptyState
                                icon={<Handshake className="w-10 h-10 text-dark-600" />}
                                title="Tidak Ada Komitmen"
                                description="Belum ada data komitmen donasi. Pastikan donatur sudah terdaftar dengan jenis 'Komitmen' sebelum menambah data di sini."
                                action={
                                    <button onClick={() => { resetForm(); setEditItem(null); setShowModal(true); }} className="btn-primary">
                                        <Plus className="w-4 h-4" /> Tambah Komitmen
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredList.map((item, index) => {
                                const progress = calculateProgress(item.total_terbayar, item.total_komitmen);
                                const sisa = Number(item.total_komitmen) - Number(item.total_terbayar);
                                const isLate = new Date(item.target_pelunasan) < new Date() && item.status !== 'lunas';

                                return (
                                    <div
                                        key={item.id}
                                        className="glass-card p-6 flex flex-col h-full"
                                        style={{ animation: `slideInLeft 0.3s ease ${index * 0.1}s both` }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-accent-50 flex items-center justify-center">
                                                    <Handshake className="w-6 h-6 text-accent-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-dark-900">{item.donatur?.nama}</p>
                                                    <p className="text-xs text-dark-500 flex items-center gap-1 mt-0.5">
                                                        <Calendar className="w-3 h-3" /> Target: {formatShortDate(item.target_pelunasan)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`badge text-xs ${getKomitmenStatus(item.total_terbayar, item.total_komitmen, item.status).color}`}>
                                                {getKomitmenStatus(item.total_terbayar, item.total_komitmen, item.status).label}
                                            </span>
                                        </div>

                                        <div className="space-y-4 flex-1">
                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 rounded-xl bg-dark-50 border border-dark-100">
                                                    <p className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold mb-1">Total Komitmen</p>
                                                    <p className="text-sm font-bold text-dark-900">{formatCurrency(Number(item.total_komitmen))}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-dark-50 border border-dark-100">
                                                    <p className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold mb-1">Sudah Bayar</p>
                                                    <p className="text-sm font-bold text-primary-600">{formatCurrency(Number(item.total_terbayar))}</p>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-semibold text-dark-500">Progres Pelunasan</p>
                                                    <p className="text-xs font-bold text-dark-900">{progress}%</p>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className={`progress-bar-fill ${progress >= 100 ? 'bg-primary-500' : 'bg-accent-500'
                                                            }`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Remaining & Warning */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`pulse-dot ${item.status === 'lunas' ? 'bg-primary-500' : item.status === 'menunggak' ? 'bg-red-500' : 'bg-accent-500'
                                                        }`} />
                                                    <p className="text-xs text-dark-500">
                                                        Sisa: <span className="font-bold text-dark-900">{formatCurrency(sisa)}</span>
                                                    </p>
                                                </div>
                                                {isLate && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase">
                                                        <AlertCircle className="w-3 h-3" /> Melewati Target
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(item.id)}
                                                className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditItem(null); resetForm(); }}
                title={editItem ? 'Edit Komitmen' : 'Tambah Komitmen Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="form-label">Pilih Donatur</label>
                        <select
                            required
                            disabled={!!editItem}
                            value={formData.donatur_id}
                            onChange={(e) => setFormData({ ...formData, donatur_id: e.target.value })}
                            className="form-select"
                        >
                            <option value="">-- Pilih Donatur Tipe Komitmen --</option>
                            {donaturList.map((d) => (
                                <option key={d.id} value={d.id}>{d.nama}</option>
                            ))}
                        </select>
                        {!editItem && (
                            <p className="text-[10px] text-dark-500 mt-1">Hanya menampilkan donatur dengan jenis 'komitmen'</p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Total Komitmen (Rp)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-500 font-semibold text-sm">Rp</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    placeholder="Contoh: 2000000"
                                    value={formatInputNumber(formData.total_komitmen)}
                                    onChange={(e) => setFormData({ ...formData, total_komitmen: e.target.value.replace(/[^0-9]/g, '') })}
                                    className="form-input pl-11"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Target Pelunasan</label>
                            <input
                                type="date"
                                required
                                value={formData.target_pelunasan}
                                onChange={(e) => setFormData({ ...formData, target_pelunasan: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'aktif' })}
                                className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${formData.status === 'aktif'
                                    ? 'border-accent-500 bg-accent-50 text-accent-600'
                                    : 'border-dark-100 bg-white text-dark-500'
                                    }`}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'lunas' })}
                                className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${formData.status === 'lunas'
                                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                                    : 'border-dark-100 bg-white text-dark-500'
                                    }`}
                            >
                                Lunas
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'menunggak' })}
                                className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${formData.status === 'menunggak'
                                    ? 'border-red-500 bg-red-50 text-red-600'
                                    : 'border-dark-100 bg-white text-dark-500'
                                    }`}
                            >
                                Menunggak
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="submit" className="btn-primary flex-1 justify-center">
                            {editItem ? 'Simpan Perubahan' : 'Mulai Komitmen'}
                        </button>
                        <button type="button" onClick={() => { setShowModal(false); setEditItem(null); resetForm(); }} className="btn-secondary">
                            Batal
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Komitmen" size="sm">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-dark-900 font-medium mb-6">Hapus data komitmen ini? Riwayat donasi tetap akan tersimpan di catatan donasi.</p>
                    <div className="flex gap-3">
                        <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger flex-1 justify-center">
                            Ya, Hapus
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">
                            Batal
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
