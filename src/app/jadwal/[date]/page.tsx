'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Sidebar from '@/components/Sidebar';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { supabase } from '@/lib/supabase';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { JadwalSafari } from '@/types/database';
import {
    ChevronLeft,
    MapPin,
    CheckCircle2,
    Clock,
    Sunrise,
    Sun,
    Moon,
    ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

const WAKTU_LABELS: Record<string, { label: string; icon: typeof Sunrise; color: string; bgColor: string }> = {
    subuh: { label: 'Subuh', icon: Sunrise, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    dzuhur: { label: 'Dzuhur', icon: Sun, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    isya: { label: 'Isya', icon: Moon, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
};

export default function JadwalDetailPage({ params }: { params: Promise<{ date: string }> }) {
    const { date } = use(params);
    const [jadwalList, setJadwalList] = useState<JadwalSafari[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJadwal = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase
                .from('jadwal_safari')
                .select('*')
                .eq('tanggal', date)
                .order('waktu_sholat', { ascending: true }) as any);
            if (error) throw error;
            setJadwalList(data || []);
        } catch (error) {
            console.error('Error fetching detail jadwal:', error);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        fetchJadwal();
    }, [fetchJadwal]);

    const getDayName = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long' });
    };

    const getFormattedDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 lg:ml-[280px] pt-16 lg:pt-0">
                <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/jadwal" className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-600 font-semibold text-sm transition-colors mb-4 group">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Kembali ke Jadwal
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <p className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-2">Detail Jadwal Safari</p>
                                <h1 className="text-3xl font-black text-dark-900 leading-none">
                                    {getDayName(date)}, <span className="gradient-text">{getFormattedDate(date)}</span>
                                </h1>
                                {jadwalList.length > 0 && (
                                    <p className="text-dark-500 mt-2 font-medium">Ramadhan ke-{jadwalList[0].ramadhan_ke}</p>
                                )}
                            </div>
                            <div className="bg-white px-4 py-2 rounded-2xl border border-dark-100 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-dark-400 uppercase font-bold">Total Sesi</p>
                                    <p className="text-sm font-bold text-dark-900">{jadwalList.length} Waktu Sholat</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingSkeleton rows={3} />
                    ) : jadwalList.length === 0 ? (
                        <div className="glass-card-static p-12 text-center">
                            <p className="text-dark-500">Tidak ada jadwal untuk tanggal ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {jadwalList.map((item) => {
                                const waktu = WAKTU_LABELS[item.waktu_sholat] || WAKTU_LABELS.subuh;
                                const WaktuIcon = waktu.icon;
                                return (
                                    <div key={item.id} className="glass-card-static overflow-hidden hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: `var(--${waktu.color.split('-')[1]}-500)` }}>
                                        <div className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl ${waktu.bgColor} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                                                        <WaktuIcon className={`w-7 h-7 ${waktu.color}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${waktu.bgColor} ${waktu.color}`}>
                                                                {waktu.label}
                                                            </span>
                                                            <span className={`badge text-[10px] ${getStatusColor(item.status)}`}>
                                                                {getStatusLabel(item.status)}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-dark-900 mb-1">{item.nama_masjid}</h3>
                                                        {item.alamat && (
                                                            <p className="text-sm text-dark-500 flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4 text-primary-500" /> {item.alamat}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 md:min-w-[200px]">
                                                    {item.no_pengurus && (
                                                        <div className="p-3 bg-dark-50 rounded-xl border border-dark-100">
                                                            <p className="text-[10px] text-dark-400 font-bold uppercase mb-1">No. Pengurus</p>
                                                            <p className="text-sm font-semibold text-dark-900">{item.no_pengurus}</p>
                                                        </div>
                                                    )}
                                                    {item.keterangan && (
                                                        <div className="p-3 bg-ambar-50/30 rounded-xl border border-amber-100/50">
                                                            <p className="text-[10px] text-amber-600 font-bold uppercase mb-1">Keterangan</p>
                                                            <p className="text-sm text-dark-700 leading-relaxed italic">"{item.keterangan}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-6 py-3 bg-dark-50/50 border-t border-dark-100 flex items-center justify-between">
                                            <span className="text-xs text-dark-400 font-medium">Safari Ramadhan 1447H</span>
                                            <div className="flex items-center gap-2">
                                                {item.status === 'sudah_dilaksanakan' ? (
                                                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                                        <CheckCircle2 className="w-4 h-4" /> Terlaksana
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                                                        <Clock className="w-4 h-4" /> Mendatang
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
