'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { supabase } from '@/lib/supabase';
import { formatDate, getStatusColor, getStatusLabel, formatNumber } from '@/lib/utils';
import { JadwalSafari } from '@/types/database';
import {
    Calendar as CalendarIcon,
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    MapPin,
    CheckCircle2,
    Clock,
    Sunrise,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
    Phone,
} from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

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
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
            } else {
                const { error } = await (supabase.from('jadwal_safari') as any)
                    .insert(payload);
                if (error) throw error;
            }
            setShowModal(false);
            setEditItem(null);
            resetForm();
            fetchJadwal();
        } catch (error) {
            console.error('Error saving jadwal:', error);
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
        try {
            const { error } = await supabase.from('jadwal_safari').delete().eq('id', id);
            if (error) throw error;
            setDeleteConfirm(null);
            fetchJadwal();
        } catch (error) {
            console.error('Error deleting jadwal:', error);
        }
    };

    const toggleStatus = async (item: JadwalSafari) => {
        const newStatus = item.status === 'belum_dilaksanakan' ? 'sudah_dilaksanakan' : 'belum_dilaksanakan';
        try {
            const { error } = await (supabase.from('jadwal_safari') as any)
                .update({ status: newStatus })
                .eq('id', item.id);
            if (error) throw error;
            fetchJadwal();
        } catch (error) {
            console.error('Error updating status:', error);
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

    const filteredList = jadwalList.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
            item.nama_masjid.toLowerCase().includes(query) ||
            (item.alamat && item.alamat.toLowerCase().includes(query))
        );
    });

    // Group jadwal by date (ramadhan_ke)
    const groupedJadwal = filteredList.reduce((acc, item) => {
        const key = item.tanggal;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, JadwalSafari[]>);

    const getDayName = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long' });
    };

    const getFormattedDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    // Calendar logic
    const feb2026 = new Date(2026, 1, 1);
    const mar2026 = new Date(2026, 2, 1);

    const getCalendarDays = (monthDate: Date) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: startDate, end: endDate });
    };

    const getDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const daySchedules = jadwalList.filter(item => item.tanggal === dateStr);
        if (daySchedules.length === 0) return 'none';

        const allCompleted = daySchedules.every(item => item.status === 'sudah_dilaksanakan');
        return allCompleted ? 'completed' : 'pending';
    };

    const scrollToDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        setSelectedDate(date);
        const element = document.getElementById(`date-${dateStr}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-primary-500', 'ring-offset-2');
            setTimeout(() => {
                element.classList.remove('ring-4', 'ring-primary-500', 'ring-offset-2');
            }, 3000);
        }
    };

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
                            <p className="text-dark-500 text-sm">Palu 2026 / 1447H — Kelola jadwal safari per waktu sholat</p>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setEditItem(null);
                                setShowModal(true);
                            }}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Jadwal
                        </button>
                    </div>

                    {/* Full Width Calendar Section */}
                    <div className="space-y-6">
                        <div className="glass-card-static p-0 overflow-hidden shadow-xl border-none">
                            <div className="p-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                                        <CalendarIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">Eksplorasi Jadwal Safari</h2>
                                        <p className="text-white/80 text-xs font-medium uppercase tracking-widest mt-0.5">Februari — Maret 2026M</p>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                                    <span className="text-xs font-bold uppercase tracking-widest">Ramadhan 1447H</span>
                                </div>
                            </div>

                            <div className="p-8 bg-white space-y-10">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-10 items-start">
                                    {[feb2026, mar2026].map((monthDate, mIdx) => {
                                        const monthStart = startOfMonth(monthDate);
                                        const calendarDays = getCalendarDays(monthDate);

                                        return (
                                            <div key={mIdx} className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-lg font-black text-primary-700 uppercase tracking-widest bg-primary-50 px-4 py-1 rounded-lg border border-primary-100">
                                                        {format(monthDate, 'MMMM yyyy', { locale: localeId })}
                                                    </h3>
                                                    <div className="flex-1 h-px bg-gradient-to-r from-primary-100 to-transparent" />
                                                </div>

                                                {/* Weekdays */}
                                                <div className="grid grid-cols-7 mb-4">
                                                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                                                        <div key={day} className="text-center text-[10px] font-black text-dark-400 uppercase tracking-widest pb-2">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Calendar Dynamic Grid */}
                                                <div className="grid grid-cols-7 gap-2 md:gap-3">
                                                    {calendarDays.map((day, idx) => {
                                                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                                                        const isToday = isSameDay(day, new Date());
                                                        const status = getDayStatus(day);
                                                        const isInMonth = isSameMonth(day, monthStart);

                                                        // Style classes based on status and selection
                                                        let dayClasses = "relative aspect-[4/3] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group ";

                                                        if (!isInMonth) {
                                                            dayClasses += "bg-dark-50/20 opacity-10 cursor-default";
                                                        } else if (isSelected) {
                                                            dayClasses += "bg-primary-600 text-white shadow-xl shadow-primary-200 scale-105 z-10 ring-4 ring-primary-50";
                                                        } else if (status === 'completed') {
                                                            dayClasses += "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/80 hover:scale-[1.02]";
                                                        } else if (status === 'pending') {
                                                            dayClasses += "bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100/80 hover:scale-[1.02]";
                                                        } else {
                                                            dayClasses += "bg-white text-dark-900 border border-dark-50 hover:border-primary-200 hover:bg-primary-50/30";
                                                        }

                                                        return (
                                                            <button
                                                                key={idx}
                                                                disabled={!isInMonth}
                                                                onClick={() => isInMonth && router.push(`/jadwal/${format(day, 'yyyy-MM-dd')}`)}
                                                                className={dayClasses}
                                                            >
                                                                <div className="flex flex-col items-center">
                                                                    <span className={`text-lg md:text-xl font-black relative ${isToday && !isSelected ? 'text-primary-600' : ''}`}>
                                                                        {format(day, 'd')}
                                                                        {isInMonth && (
                                                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[1.5px] rounded-full ${isSelected ? 'bg-white/40' :
                                                                                status === 'completed' ? 'bg-emerald-400/40' :
                                                                                    status === 'pending' ? 'bg-amber-400/40' :
                                                                                        'bg-dark-200/40'
                                                                                }`} />
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <div className="absolute top-2 right-2">
                                                                    {status === 'completed' && (
                                                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-sm border border-white" />
                                                                    )}
                                                                    {status === 'pending' && (
                                                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 shadow-sm border border-white" />
                                                                    )}
                                                                </div>

                                                                {isInMonth && status !== 'none' && (
                                                                    <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-tight mt-1 px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20' :
                                                                        status === 'completed' ? 'bg-emerald-100/50' : 'bg-amber-100/50'
                                                                        }`}>
                                                                        {status === 'completed' ? 'Done' : 'Info'}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Recommendation: Legend and Today Quick Stats */}
                                <div className="mt-10 pt-8 border-t border-dark-50 flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                                            <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                                            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Jadwal Mendatang (Orange)</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Sudah Selesai (Hijau)</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-dark-50 px-4 py-2 rounded-xl border border-dark-100">
                                            <div className="w-3.5 h-3.5 rounded-full bg-dark-200" />
                                            <span className="text-xs font-bold text-dark-600 uppercase tracking-wider">Kosong</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-dark-400 italic">
                                        * Klik pada tanggal untuk melihat detail lengkap safari hari tersebut.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* List Section Below Calendar */}
                        <div className="pt-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">
                                    <Filter className="w-4 h-4" />
                                </div>
                                <h3 className="text-lg font-bold text-dark-900">Daftar Jadwal Lengkap</h3>
                            </div>
                            <div className="glass-card-static p-4 mb-6">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari masjid..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="form-input pl-11 shadow-sm border-dark-100"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-dark-500" />
                                        <select
                                            value={filterWaktu}
                                            onChange={(e) => setFilterWaktu(e.target.value)}
                                            className="form-select min-w-[140px]"
                                        >
                                            <option value="semua">Semua Waktu</option>
                                            <option value="subuh">Subuh</option>
                                            <option value="dzuhur">Dzuhur</option>
                                            <option value="isya">Isya</option>
                                        </select>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="form-select min-w-[180px]"
                                        >
                                            <option value="semua">Semua Status</option>
                                            <option value="belum_dilaksanakan">Belum Dilaksanakan</option>
                                            <option value="sudah_dilaksanakan">Sudah Dilaksanakan</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <LoadingSkeleton rows={6} />
                            ) : filteredList.length === 0 ? (
                                <div className="glass-card-static">
                                    <EmptyState
                                        icon={<CalendarIcon className="w-10 h-10 text-dark-600" />}
                                        title="Belum Ada Jadwal"
                                        description="Belum ada jadwal safari yang ditambahkan. Klik tombol 'Tambah Jadwal' untuk menambahkan jadwal baru."
                                        action={
                                            <button
                                                onClick={() => {
                                                    resetForm();
                                                    setEditItem(null);
                                                    setShowModal(true);
                                                }}
                                                className="btn-primary"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Tambah Jadwal
                                            </button>
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(groupedJadwal).map(([date, items]) => {
                                        const ramadhanKe = items[0].ramadhan_ke;
                                        return (
                                            <div key={date} id={`date-${date}`} className="glass-card-static overflow-hidden transition-all duration-500 border-2 border-transparent target:border-primary-500">
                                                {/* Day Header */}
                                                <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-14 rounded-xl bg-primary-50 border border-primary-100 flex flex-col items-center justify-center">
                                                            <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">
                                                                {new Date(date).toLocaleDateString('id-ID', { month: 'short' })}
                                                            </span>
                                                            <span className="text-xl font-bold text-dark-900 leading-none mt-0.5">
                                                                {new Date(date).getDate()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-dark-900">{getDayName(date)}, {getFormattedDate(date)}</p>
                                                            <p className="text-xs text-primary-600 font-semibold mt-0.5">Ramadhan ke-{ramadhanKe}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-dark-500 font-medium bg-dark-50 px-3 py-1 rounded-full">
                                                        {formatNumber(items.length)} jadwal
                                                    </span>
                                                </div>

                                                {/* Schedule Items */}
                                                <div className="divide-y divide-dark-50">
                                                    {items.map((item) => {
                                                        const waktu = WAKTU_LABELS[item.waktu_sholat] || WAKTU_LABELS.subuh;
                                                        const WaktuIcon = waktu.icon;
                                                        return (
                                                            <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-dark-50/50 transition-colors">
                                                                {/* Waktu Sholat Badge */}
                                                                <div className={`w-20 flex flex-col items-center gap-1 flex-shrink-0`}>
                                                                    <div className={`w-9 h-9 rounded-xl ${waktu.bgColor} flex items-center justify-center`}>
                                                                        <WaktuIcon className={`w-4 h-4 ${waktu.color}`} />
                                                                    </div>
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${waktu.color}`}>
                                                                        {waktu.label}
                                                                    </span>
                                                                </div>

                                                                {/* Masjid Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-dark-900 text-sm truncate">{item.nama_masjid}</p>
                                                                    {item.alamat && (
                                                                        <p className="text-xs text-dark-500 flex items-center gap-1 mt-0.5">
                                                                            <MapPin className="w-3 h-3 flex-shrink-0" /> {item.alamat}
                                                                        </p>
                                                                    )}
                                                                    {item.keterangan && (
                                                                        <p className="text-xs text-dark-400 mt-0.5 italic">{item.keterangan}</p>
                                                                    )}
                                                                </div>

                                                                {/* Status Badge */}
                                                                <button
                                                                    onClick={() => toggleStatus(item)}
                                                                    className={`badge cursor-pointer hover:opacity-80 transition-opacity text-xs hidden sm:inline-flex ${getStatusColor(item.status)}`}
                                                                >
                                                                    {item.status === 'sudah_dilaksanakan' ? (
                                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    ) : (
                                                                        <Clock className="w-3 h-3 mr-1" />
                                                                    )}
                                                                    {getStatusLabel(item.status)}
                                                                </button>

                                                                {/* Actions */}
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => toggleStatus(item)}
                                                                        className={`sm:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.status === 'sudah_dilaksanakan'
                                                                            ? 'bg-emerald-50 text-emerald-600'
                                                                            : 'bg-amber-50 text-amber-600'
                                                                            }`}
                                                                    >
                                                                        {item.status === 'sudah_dilaksanakan' ? (
                                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                                        ) : (
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEdit(item)}
                                                                        className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteConfirm(item.id)}
                                                                        className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditItem(null);
                        resetForm();
                    }}
                    title={editItem ? 'Edit Jadwal Safari' : 'Tambah Jadwal Safari'}
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
                                <label className="form-label">Ramadhan Ke</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    placeholder="10"
                                    value={formData.ramadhan_ke}
                                    onChange={(e) => setFormData({ ...formData, ramadhan_ke: e.target.value.replace(/[^0-9]/g, '') })}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Waktu Sholat</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['subuh', 'dzuhur', 'isya'] as const).map((waktu) => {
                                    const config = WAKTU_LABELS[waktu];
                                    const WIcon = config.icon;
                                    const isSelected = formData.waktu_sholat === waktu;
                                    return (
                                        <button
                                            key={waktu}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, waktu_sholat: waktu })}
                                            className={`p-3 rounded-xl border-2 transition-all text-center ${isSelected
                                                ? `border-primary-500 ${config.bgColor}`
                                                : 'border-dark-100 bg-white hover:border-primary-200'
                                                }`}
                                        >
                                            <WIcon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? config.color : 'text-dark-400'}`} />
                                            <span className={`font-semibold text-xs ${isSelected ? config.color : 'text-dark-500'}`}>{config.label}</span>
                                        </button>
                                    );
                                })}
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
                                placeholder="Alamat lengkap masjid"
                                value={formData.alamat}
                                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">No. Pengurus (Opsional)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                                        <Phone className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0812..."
                                        value={formData.no_pengurus}
                                        onChange={(e) => setFormData({ ...formData, no_pengurus: e.target.value.replace(/[^0-9]/g, '') })}
                                        className="form-input pl-11"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Status</label>
                                <select
                                    required
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
                                className="form-input min-h-[80px]"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="btn-primary flex-1 justify-center">
                                {editItem ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setEditItem(null);
                                    resetForm();
                                }}
                                className="btn-secondary flex-1 justify-center"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    title="Hapus Jadwal"
                    size="sm"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-dark-900 font-medium mb-6">
                            Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                                className="btn-danger flex-1 justify-center"
                            >
                                Ya, Hapus
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn-secondary flex-1 justify-center"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
}
