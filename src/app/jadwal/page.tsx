'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { supabase } from '@/lib/supabase';
import { getStatusColor, getStatusLabel, formatShortDate } from '@/lib/utils';
import { JadwalSafari } from '@/types/database';
import {
    Calendar as CalendarIcon,
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    MapPin,
    Clock,
    CheckCircle2,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Sunrise,
    Sun,
    Moon,
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

const WAKTU_LABELS: Record<string, { label: string; icon: typeof Sunrise; color: string; bgColor: string }> = {
    subuh: { label: 'Subuh', icon: Sunrise, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    dzuhur: { label: 'Dzuhur', icon: Sun, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    isya: { label: 'Isya', icon: Moon, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
};

export default function JadwalPage() {
    const [jadwalList, setJadwalList] = useState<JadwalSafari[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<JadwalSafari | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [filterWaktu, setFilterWaktu] = useState('semua');

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1)); // Start at Feb 2026 for Ramadan
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState({
        tanggal: '',
        ramadhan_ke: '',
        waktu_sholat: 'subuh' as 'subuh' | 'dzuhur' | 'isya',
        nama_masjid: '',
        alamat: '',
        no_pengurus: '',
        keterangan: '',
        status: 'belum_dilaksanakan' as 'belum_dilaksanakan' | 'sudah_dilaksanakan',
    });

    const fetchJadwal = useCallback(async () => {
        setLoading(true);
        try {
            let query = (supabase.from('jadwal_safari') as any).select('*').order('tanggal', { ascending: true }).order('ramadhan_ke', { ascending: true });

            if (filterStatus !== 'semua') {
                query = query.eq('status', filterStatus);
            }
            if (filterWaktu !== 'semua') {
                query = query.eq('waktu_sholat', filterWaktu);
            }

            const { data, error } = await query;
            if (error) throw error;
            setJadwalList(data || []);
        } catch (error) {
            console.error('Error fetching jadwal:', error);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterWaktu]);

    useEffect(() => {
        fetchJadwal();
    }, [fetchJadwal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                tanggal: formData.tanggal,
                ramadhan_ke: Number(formData.ramadhan_ke),
                waktu_sholat: formData.waktu_sholat,
                nama_masjid: formData.nama_masjid,
                alamat: formData.alamat || null,
                no_pengurus: formData.no_pengurus || null,
                keterangan: formData.keterangan || null,
                status: formData.status,
            };

            if (editItem) {
                const { error } = await (supabase.from('jadwal_safari') as any)
                    .update(payload)
                    .eq('id', editItem.id);
                if (error) throw error;

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Jadwal safari telah diperbarui.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                const { error } = await (supabase.from('jadwal_safari') as any)
                    .insert(payload);
                if (error) throw error;

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Jadwal safari baru telah ditambahkan.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
            setShowModal(false);
            setEditItem(null);
            resetForm();
            fetchJadwal();
        } catch (error: any) {
            console.error('Error saving jadwal:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Terjadi kesalahan: ' + error.message,
            });
        }
    };

    const handleEdit = (item: JadwalSafari) => {
        setEditItem(item);
        setFormData({
            tanggal: item.tanggal,
            ramadhan_ke: String(item.ramadhan_ke),
            waktu_sholat: item.waktu_sholat,
            nama_masjid: item.nama_masjid,
            alamat: item.alamat || '',
            no_pengurus: item.no_pengurus || '',
            keterangan: item.keterangan || '',
            status: item.status,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Hapus Jadwal?',
            text: "Tindakan ini tidak dapat dibatalkan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('jadwal_safari').delete().eq('id', id);
                if (error) throw error;

                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus!',
                    text: 'Jadwal telah berhasil dihapus.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchJadwal();
            } catch (error: any) {
                console.error('Error deleting jadwal:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!',
                    text: 'Gagal menghapus jadwal: ' + error.message,
                });
            }
        }
    };

    const toggleStatus = async (item: JadwalSafari) => {
        const newStatus = item.status === 'belum_dilaksanakan' ? 'sudah_dilaksanakan' : 'belum_dilaksanakan';
        try {
            const { error } = await (supabase.from('jadwal_safari') as any)
                .update({ status: newStatus })
                .eq('id', item.id);
            if (error) throw error;

            Swal.fire({
                icon: 'success',
                title: 'Status Diperbarui',
                text: `Jadwal sekarang ${newStatus === 'sudah_dilaksanakan' ? 'Terlaksana' : 'Belum Dilaksanakan'}.`,
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
            fetchJadwal();
        } catch (error: any) {
            console.error('Error updating status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Gagal mengubah status: ' + error.message,
            });
        }
    };

    const resetForm = () => {
        setFormData({
            tanggal: '',
            ramadhan_ke: '',
            waktu_sholat: 'subuh',
            nama_masjid: '',
            alamat: '',
            no_pengurus: '',
            keterangan: '',
            status: 'belum_dilaksanakan',
        });
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const getCalendarDays = (monthDate: Date) => {
        const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    };

    const getDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const tasks = jadwalList.filter((j) => j.tanggal === dateStr);
        if (tasks.length === 0) return 'none';
        const allDone = tasks.every((t) => t.status === 'sudah_dilaksanakan');
        return allDone ? 'completed' : 'pending';
    };

    const scrollToDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const element = document.getElementById(`date-group-${dateStr}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setSelectedDate(date);
        }
    };

    // Filter and Grouping
    const filteredList = jadwalList.filter((item) => {
        const query = searchQuery.toLowerCase();
        return item.nama_masjid.toLowerCase().includes(query) ||
            item.alamat?.toLowerCase().includes(query) ||
            item.keterangan?.toLowerCase().includes(query);
    });

    const groupedJadwal = filteredList.reduce((acc, item) => {
        if (!acc[item.tanggal]) acc[item.tanggal] = [];
        acc[item.tanggal].push(item);
        return acc;
    }, {} as Record<string, JadwalSafari[]>);

    const getDayName = (dateStr: string) => {
        return format(new Date(dateStr), 'EEEE', { locale: localeId });
    };

    const getFormattedDate = (dateStr: string) => {
        return format(new Date(dateStr), 'dd MMMM yyyy', { locale: localeId });
    };

    const feb2026 = new Date(2026, 1, 1);
    const mar2026 = new Date(2026, 2, 1);

    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 lg:ml-[280px] pt-16 lg:pt-0">
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-1">
                                Jadwal <span className="gradient-text">Safari Ramadhan</span>
                            </h1>
                            <p className="text-dark-500 text-sm">Kelola agenda kegiatan safari ramadhan 1447H</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setEditItem(null); setShowModal(true); }}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" /> Tambah Jadwal
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Left: Calendar & Filters */}
                        <div className="xl:col-span-4 space-y-6">
                            {/* Multi-month Mini Calendar */}
                            <div className="glass-card-static p-5 overflow-hidden">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-bold text-dark-900 flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-primary-500" />
                                        Agenda Kalender
                                    </h2>
                                    <div className="flex gap-1">
                                        <button onClick={prevMonth} className="p-1.5 hover:bg-dark-50 rounded-lg text-dark-400">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={nextMonth} className="p-1.5 hover:bg-dark-50 rounded-lg text-dark-400">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {[feb2026, mar2026].map((month) => (
                                        <div key={month.getMonth()}>
                                            <p className="text-center font-black text-xs text-dark-400 uppercase tracking-widest mb-4">
                                                {format(month, 'MMMM yyyy', { locale: localeId })}
                                            </p>
                                            <div className="grid grid-cols-7 gap-1">
                                                {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
                                                    <div key={i} className="text-[10px] font-black text-dark-300 text-center py-1">
                                                        {d}
                                                    </div>
                                                ))}
                                                {getCalendarDays(month).map((day, idx) => {
                                                    const status = getDayStatus(day);
                                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                                    return (
                                                        <button
                                                            key={idx}
                                                            disabled={!isSameMonth(day, month)}
                                                            onClick={() => isSameMonth(day, month) && scrollToDate(day)}
                                                            className={`
                                                                relative aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center
                                                                ${!isSameMonth(day, month) ? 'opacity-0 pointer-events-none' : ''}
                                                                ${isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110 z-10' : 'text-dark-600 hover:bg-primary-50 hover:text-primary-600'}
                                                            `}
                                                        >
                                                            {format(day, 'd')}
                                                            {status !== 'none' && !isSelected && (
                                                                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${status === 'completed' ? 'bg-emerald-500' : 'bg-primary-500'}`} />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Filters */}
                            <div className="glass-card-static p-5 overflow-hidden">
                                <h3 className="font-bold text-dark-900 mb-4 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-primary-500" /> Filter Cepat
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-dark-400 uppercase tracking-wider mb-2 block">Cari Masjid</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" />
                                            <input
                                                type="text"
                                                placeholder="Nama masjid..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="form-input text-sm pl-9 h-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-dark-400 uppercase tracking-wider mb-2 block">Waktu</label>
                                            <select
                                                value={filterWaktu}
                                                onChange={(e) => setFilterWaktu(e.target.value)}
                                                className="form-select text-sm h-10"
                                            >
                                                <option value="semua">Semua</option>
                                                <option value="subuh">Subuh</option>
                                                <option value="dzuhur">Dzuhur</option>
                                                <option value="isya">Isya</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-dark-400 uppercase tracking-wider mb-2 block">Status</label>
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="form-select text-sm h-10"
                                            >
                                                <option value="semua">Semua</option>
                                                <option value="belum_dilaksanakan">Mendatang</option>
                                                <option value="sudah_dilaksanakan">Selesai</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Agenda List */}
                        <div className="xl:col-span-8 space-y-8">
                            {loading ? (
                                <LoadingSkeleton rows={6} />
                            ) : Object.keys(groupedJadwal).length === 0 ? (
                                <div className="glass-card-static">
                                    <EmptyState
                                        icon={<CalendarIcon className="w-10 h-10 text-dark-600" />}
                                        title="Hasil Tidak Ditemukan"
                                        description="Tidak ada jadwal yang sesuai dengan filter atau pencarian Anda."
                                        action={
                                            <button onClick={() => { resetForm(); setEditItem(null); setShowModal(true); }} className="btn-primary">
                                                <Plus className="w-4 h-4" /> Tambah Jadwal
                                            </button>
                                        }
                                    />
                                </div>
                            ) : (
                                Object.entries(groupedJadwal).map(([date, items]) => (
                                    <div key={date} id={`date-group-${date}`} className="scroll-mt-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-dark-100 shadow-sm flex flex-col items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-black text-primary-600 uppercase leading-none mb-0.5">{getDayName(date).slice(0, 3)}</span>
                                                <span className="text-lg font-black text-dark-900 leading-none">{date.split('-')[2]}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-dark-900 text-lg leading-tight uppercase tracking-tight">{getFormattedDate(date)}</h3>
                                                <p className="text-xs text-dark-400 font-bold uppercase tracking-widest">Ramadhan ke-{items[0].ramadhan_ke}</p>
                                            </div>
                                            <div className="h-px bg-dark-100 flex-1 ml-4" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {items.map((item) => {
                                                const waktu = WAKTU_LABELS[item.waktu_sholat] || WAKTU_LABELS.subuh;
                                                const WaktuIcon = waktu.icon;
                                                return (
                                                    <div key={item.id} className="glass-card p-5 group hover:border-primary-100">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl ${waktu.bgColor} flex items-center justify-center`}>
                                                                    <WaktuIcon className={`w-5 h-5 ${waktu.color}`} />
                                                                </div>
                                                                <div>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${waktu.color}`}>
                                                                        {waktu.label}
                                                                    </span>
                                                                    <h4 className="font-bold text-dark-900 leading-tight">{item.nama_masjid}</h4>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {item.alamat && (
                                                            <p className="text-xs text-dark-500 flex items-center gap-1.5 mb-4 line-clamp-1">
                                                                <MapPin className="w-3.5 h-3.5 text-dark-300" /> {item.alamat}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center justify-between pt-4 border-t border-dark-50">
                                                            <button
                                                                onClick={() => toggleStatus(item)}
                                                                className={`badge text-[10px] transition-all ${getStatusColor(item.status)}`}
                                                            >
                                                                {getStatusLabel(item.status)}
                                                            </button>
                                                            <button
                                                                onClick={() => router.push(`/jadwal/${item.tanggal}`)}
                                                                className="text-[10px] font-black text-dark-400 hover:text-primary-600 uppercase tracking-widest"
                                                            >
                                                                Lihat Detail
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Form Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditItem(null); resetForm(); }}
                title={editItem ? 'Edit Jadwal Safari' : 'Tambah Jadwal Safari'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                            <label className="form-label">Ramadhan Ke-</label>
                            <input
                                type="number"
                                required
                                placeholder="1-30"
                                value={formData.ramadhan_ke}
                                onChange={(e) => setFormData({ ...formData, ramadhan_ke: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Waktu Sholat</label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(WAKTU_LABELS).map(([key, value]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, waktu_sholat: key as any })}
                                    className={`p-3 rounded-xl border-2 transition-all text-center ${formData.waktu_sholat === key
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-dark-100 bg-white hover:border-primary-100'
                                        }`}
                                >
                                    <span className={`text-xs font-bold ${formData.waktu_sholat === key ? 'text-primary-600' : 'text-dark-500'}`}>
                                        {value.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Nama Masjid</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Masjid Agung Palu"
                            value={formData.nama_masjid}
                            onChange={(e) => setFormData({ ...formData, nama_masjid: e.target.value })}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className="form-label">Alamat (Opsional)</label>
                        <input
                            type="text"
                            placeholder="Jl. Balaikota..."
                            value={formData.alamat}
                            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                            className="form-input"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">No. Pengurus (Opsional)</label>
                            <input
                                type="text"
                                placeholder="08..."
                                value={formData.no_pengurus}
                                onChange={(e) => setFormData({ ...formData, no_pengurus: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="form-select"
                            >
                                <option value="belum_dilaksanakan">Belum Dilaksanakan</option>
                                <option value="sudah_dilaksanakan">Sudah Dilaksanakan</option>
                            </select>
                        </div>
                    </div>
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
                            {editItem ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                        </button>
                        <button type="button" onClick={() => { setShowModal(false); setEditItem(null); resetForm(); }} className="btn-secondary">
                            Batal
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
