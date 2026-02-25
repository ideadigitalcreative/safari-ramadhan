'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { StatSkeleton } from '@/components/LoadingSkeleton';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatShortDate, getStatusColor, getStatusLabel, formatNumber } from '@/lib/utils';
import {
    Heart,
    Handshake,
    Users,
    Calendar,
    TrendingUp,
    MapPin,
    ArrowRight,
    Landmark,
    MoreVertical,
    Sunrise,
    Sun,
    Moon,
} from 'lucide-react';
import Link from 'next/link';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

interface DashboardData {
    totalDonasi: number;
    totalKomitmenAktif: number;
    jumlahDonatur: number;
    jadwalTerdekat: {
        id: string;
        tanggal: string;
        ramadhan_ke: number;
        waktu_sholat: string;
        waktu_lainnya: string | null;
        nama_masjid: string;
        status: string;
    }[];
    donasiPerMasjid: {
        nama_masjid: string;
        total: number;
    }[];
    recentDonasi: {
        id: string;
        tanggal: string;
        nominal: number;
        nama_donatur: string;
        nama_masjid: string;
        metode: string;
    }[];
    donasiByMetode: {
        name: string;
        value: number;
    }[];
    komitmenProgress: {
        name: string;
        value: number;
    }[];
}

const CHART_COLORS = ['#7c3aed', '#f97316', '#3b82f6', '#10b981', '#f43f5e', '#06b6d4', '#ec4899'];

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Run all network requests in parallel to drastically improve loading speed
            const [
                { data: donasiData },
                { count: donaturCount },
                { data: komitmenDataAll },
                { data: jadwalData },
                { data: allJadwal },
                { data: allDonatur },
                { data: recentDonasiRaw }
            ] = await Promise.all([
                supabase.from('donasi').select('nominal, tanggal, metode_pembayaran, donatur_id, jadwal_safari_id'),
                supabase.from('donatur').select('*', { count: 'exact', head: true }),
                supabase.from('komitmen').select('total_komitmen, total_terbayar, status'),
                supabase.from('jadwal_safari').select('*').gte('tanggal', today).order('tanggal', { ascending: true }).limit(5),
                supabase.from('jadwal_safari').select('id, nama_masjid'),
                supabase.from('donatur').select('id, nama'),
                supabase.from('donasi').select('*').order('created_at', { ascending: false }).limit(5)
            ]) as [
                    { data: any[] | null },
                    { count: number | null },
                    { data: any[] | null },
                    { data: any[] | null },
                    { data: any[] | null },
                    { data: any[] | null },
                    { data: any[] | null },
                ];

            // Calculate total donasi
            const totalDonasi = donasiData?.reduce((sum, d) => sum + Number(d.nominal), 0) || 0;

            // Calculate active komitmen total (remaining)
            const totalKomitmenAktif = komitmenDataAll?.filter(k => k.status === 'aktif').reduce(
                (sum, k) => sum + (Number(k.total_komitmen) - Number(k.total_terbayar)),
                0
            ) || 0;

            // Calculate overall commitment progress
            const totalK_Amount = komitmenDataAll?.reduce((sum, k) => sum + Number(k.total_komitmen), 0) || 0;
            const totalK_Paid = komitmenDataAll?.reduce((sum, k) => sum + Number(k.total_terbayar), 0) || 0;
            const totalK_Remaining = Math.max(0, totalK_Amount - totalK_Paid);

            // Calculate donasi per masjid
            const masjidMap = new Map<string, number>();
            const jadwalMap = new Map(allJadwal?.map((j) => [j.id, j.nama_masjid]) || []);
            const donaturMap = new Map(allDonatur?.map((d) => [d.id, d.nama]) || []);

            donasiData?.forEach((d: any) => {
                const masjidName = jadwalMap.get(d.jadwal_safari_id) || 'Unknown';
                masjidMap.set(masjidName, (masjidMap.get(masjidName) || 0) + Number(d.nominal));
            });

            const donasiPerMasjid = Array.from(masjidMap.entries())
                .map(([nama_masjid, total]) => ({ nama_masjid, total }))
                .sort((a, b) => b.total - a.total);

            // Calculate donasi by metode
            const cashTotal = donasiData?.filter((d) => d.metode_pembayaran === 'cash').reduce((s, d) => s + Number(d.nominal), 0) || 0;
            const transferTotal = donasiData?.filter((d) => d.metode_pembayaran === 'transfer').reduce((s, d) => s + Number(d.nominal), 0) || 0;

            const recentDonasi = recentDonasiRaw?.map((d: any) => ({
                id: d.id,
                tanggal: d.tanggal,
                nominal: Number(d.nominal),
                nama_donatur: donaturMap.get(d.donatur_id) || 'Unknown',
                nama_masjid: jadwalMap.get(d.jadwal_safari_id) || 'Unknown',
                metode: d.metode_pembayaran,
            })) || [];

            setData({
                totalDonasi,
                totalKomitmenAktif,
                jumlahDonatur: donaturCount || 0,
                jadwalTerdekat: jadwalData || [],
                donasiPerMasjid,
                recentDonasi,
                donasiByMetode: [
                    { name: 'Cash', value: cashTotal },
                    { name: 'Transfer', value: transferTotal },
                ],
                komitmenProgress: [
                    { name: 'Terbayar', value: totalK_Paid },
                    { name: 'Sisa Komitmen', value: totalK_Remaining },
                ]
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 lg:ml-[280px] pt-16 lg:pt-0">
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-2">
                            Dashboard <span className="gradient-text">Admin</span>
                        </h1>
                        <p className="text-dark-500 text-sm">
                            Ringkasan data Safari Ramadhan — {new Date().toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>

                    {/* Stat Cards */}
                    {loading ? (
                        <StatSkeleton />
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                            <StatCard
                                title="Total Donasi Terkumpul"
                                value={formatCurrency(data?.totalDonasi || 0)}
                                icon={Heart}
                                color="purple"
                            />
                            <StatCard
                                title="Komitmen Aktif"
                                value={formatCurrency(data?.totalKomitmenAktif || 0)}
                                subtitle="Sisa tagihan belum lunas"
                                icon={Handshake}
                                color="gold"
                            />
                            <StatCard
                                title="Jumlah Donatur"
                                value={formatNumber(data?.jumlahDonatur || 0)}
                                subtitle="Total donatur terdaftar"
                                icon={Users}
                                color="blue"
                            />
                            <StatCard
                                title="Jadwal Mendatang"
                                value={formatNumber(data?.jadwalTerdekat?.length || 0)}
                                subtitle="Safari belum dilaksanakan"
                                icon={Calendar}
                                color="green"
                            />
                        </div>
                    )}

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Bar Chart - Donasi Per Masjid */}
                        <div className="lg:col-span-2 glass-card-static p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary-500" />
                                        Donasi Per Masjid
                                    </h2>
                                    <p className="text-xs text-dark-500 mt-1">Total pemasukan per lokasi safari</p>
                                </div>
                                <Link href="/laporan" className="text-primary-600 text-xs font-semibold hover:text-primary-500 flex items-center gap-1">
                                    Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            {data?.donasiPerMasjid && data.donasiPerMasjid.length > 0 ? (
                                <div className="w-full overflow-x-auto pb-2">
                                    <div className="min-w-[500px]">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={data.donasiPerMasjid} barSize={24}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    dataKey="nama_masjid"
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    axisLine={{ stroke: '#e2e8f0' }}
                                                    tickLine={false}
                                                    interval={0}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                                    axisLine={{ stroke: '#e2e8f0' }}
                                                    tickLine={false}
                                                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: '#ffffff',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        color: '#0f172a',
                                                    }}
                                                    formatter={(value: any) => [formatCurrency(Number(value)), 'Total Donasi']}
                                                />
                                                <Bar dataKey="total" fill="url(#colorGradient)" radius={[20, 20, 20, 20]}>
                                                    {data.donasiPerMasjid.map((_, index) => (
                                                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[280px] flex items-center justify-center text-dark-500 text-sm">
                                    Belum ada data donasi
                                </div>
                            )}
                        </div>

                        {/* Pie Chart - Progress Komitmen */}
                        <div className="glass-card-static p-6">
                            <h2 className="text-lg font-bold text-dark-900 mb-1">Progress Pelunasan Komitmen</h2>
                            <p className="text-xs text-dark-500 mb-6">Total Terbayar vs Sisa</p>
                            {data?.komitmenProgress && (data.komitmenProgress[0].value > 0 || data.komitmenProgress[1].value > 0) ? (
                                <>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={data.komitmenProgress}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                dataKey="value"
                                                stroke="none"
                                                paddingAngle={4}
                                            >
                                                <Cell fill="#10b981" />
                                                <Cell fill="#f43f5e" />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    color: '#0f172a',
                                                }}
                                                formatter={(value: any) => formatCurrency(Number(value))}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-3 mt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                                <span className="text-sm text-dark-600 font-medium">Terbayar</span>
                                            </div>
                                            <span className="text-sm font-bold text-dark-900">{formatCurrency(data.komitmenProgress[0].value)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                                <span className="text-sm text-dark-600 font-medium">Sisa Tagihan</span>
                                            </div>
                                            <span className="text-sm font-bold text-dark-900">{formatCurrency(data.komitmenProgress[1].value)}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-[280px] flex items-center justify-center text-dark-500 text-sm">
                                    Belum ada data komitmen
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upcoming Schedule */}
                        <div className="glass-card-static p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary-500" />
                                    Jadwal Safari Terdekat
                                </h2>
                                <Link href="/jadwal" className="text-primary-600 text-xs font-semibold hover:text-primary-500 flex items-center gap-1">
                                    Semua <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            {data?.jadwalTerdekat && data.jadwalTerdekat.length > 0 ? (
                                <div className="space-y-3">
                                    {data.jadwalTerdekat.map((jadwal, index) => {
                                        const waktuConfig: Record<string, { label: string; Icon: typeof Sunrise; color: string; bg: string }> = {
                                            subuh: { label: 'Subuh', Icon: Sunrise, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            dzuhur: { label: 'Dzuhur', Icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50' },
                                            ashar: { label: 'Ashar', Icon: Sun, color: 'text-orange-600', bg: 'bg-orange-50' },
                                            isya: { label: 'Isya', Icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                            lainnya: { label: 'Lainnya', Icon: MoreVertical, color: 'text-slate-600', bg: 'bg-slate-50' },
                                        };
                                        const wk = waktuConfig[jadwal.waktu_sholat] || waktuConfig.subuh;
                                        return (
                                            <div
                                                key={jadwal.id}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-all border border-dark-100/50"
                                                style={{ animation: `slideInLeft 0.3s ease ${index * 0.1}s both` }}
                                            >
                                                <div className="w-12 h-14 rounded-xl bg-primary-50 border border-primary-100 flex flex-col items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">
                                                        {new Date(jadwal.tanggal).toLocaleDateString('id-ID', { month: 'short' })}
                                                    </span>
                                                    <span className="text-xl font-bold text-dark-900 leading-none mt-0.5">
                                                        {new Date(jadwal.tanggal).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-dark-900 text-sm truncate">{jadwal.nama_masjid}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${wk.color}`}>
                                                            <wk.Icon className="w-3 h-3" /> {jadwal.waktu_sholat === 'lainnya' && (jadwal as any).waktu_lainnya ? (jadwal as any).waktu_lainnya : wk.label}
                                                        </span>
                                                        <span className="text-[10px] text-dark-400">•</span>
                                                        <span className="text-[10px] text-dark-500">Ke-{jadwal.ramadhan_ke}</span>
                                                    </div>
                                                </div>
                                                <span className={`badge text-[10px] ${getStatusColor(jadwal.status)}`}>
                                                    {getStatusLabel(jadwal.status)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-dark-500 text-sm">
                                    Tidak ada jadwal mendatang
                                </div>
                            )}
                        </div>

                        {/* Recent Donations */}
                        <div className="glass-card-static p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-accent-500" />
                                    Donasi Terbaru
                                </h2>
                                <Link href="/donasi" className="text-primary-600 text-xs font-semibold hover:text-primary-500 flex items-center gap-1">
                                    Semua <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            {data?.recentDonasi && data.recentDonasi.length > 0 ? (
                                <div className="space-y-3">
                                    {data.recentDonasi.map((donasi, index) => (
                                        <div
                                            key={donasi.id}
                                            className="flex items-center gap-4 p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-all border border-dark-100/50"
                                            style={{ animation: `slideInLeft 0.3s ease ${index * 0.1}s both` }}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
                                                <Heart className="w-5 h-5 text-accent-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-dark-900 text-sm truncate">{donasi.nama_donatur}</p>
                                                <p className="text-xs text-dark-500 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3" />
                                                    {donasi.nama_masjid}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-primary-600">{formatCurrency(donasi.nominal)}</p>
                                                <p className="text-xs text-dark-500">{formatShortDate(donasi.tanggal)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-dark-500 text-sm">
                                    Belum ada donasi tercatat
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/jadwal" className="glass-card p-5 group border border-dark-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                    <Calendar className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-dark-900 text-sm">Kelola Jadwal</p>
                                    <p className="text-xs text-dark-500">Tambah & edit jadwal safari</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-dark-400 ml-auto group-hover:text-dark-900 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                        <Link href="/donasi" className="glass-card p-5 group border border-dark-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center group-hover:bg-accent-100 transition-colors">
                                    <Heart className="w-5 h-5 text-accent-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-dark-900 text-sm">Catat Donasi</p>
                                    <p className="text-xs text-dark-500">Input donasi baru</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-dark-400 ml-auto group-hover:text-dark-900 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                        <Link href="/laporan" className="glass-card p-5 group border border-dark-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <Landmark className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-dark-900 text-sm">Laporan</p>
                                    <p className="text-xs text-dark-500">Lihat laporan donasi</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-dark-400 ml-auto group-hover:text-dark-900 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
