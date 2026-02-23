'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatShortDate, formatNumber } from '@/lib/utils';
import {
    Landmark,
    Calendar,
    TrendingUp,
    Filter,
    Download,
    MapPin,
    Heart,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
} from 'recharts';

interface MasjidReport {
    nama_masjid: string;
    alamat: string | null;
    total_donasi: number;
    jumlah_donasi: number;
    tanggal: string;
}

interface DailyReport {
    tanggal: string;
    total: number;
}

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function LaporanPage() {
    const [masjidReports, setMasjidReports] = useState<MasjidReport[]>([]);
    const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
    const [totalKeseluruhan, setTotalKeseluruhan] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterPeriode, setFilterPeriode] = useState('semua');
    const [filterMasjid, setFilterMasjid] = useState('semua');
    const [masjidNames, setMasjidNames] = useState<string[]>([]);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all donasi
            const { data: donasiData } = await (supabase
                .from('donasi')
                .select('*')
                .order('tanggal', { ascending: true }) as any);

            // Fetch jadwal for masjid names
            const { data: jadwalData } = await (supabase
                .from('jadwal_safari')
                .select('*') as any);

            const jadwalMap = new Map((jadwalData as any[] || []).map((j: any) => [j.id, j]));
            const uniqueMasjids = [...new Set((jadwalData as any[] || []).map((j: any) => j.nama_masjid))];
            setMasjidNames(uniqueMasjids);

            // Filter by period
            let filteredDonasi = donasiData || [];
            if (filterPeriode === 'minggu_ini') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                filteredDonasi = filteredDonasi.filter((d: any) => new Date(d.tanggal) >= weekAgo);
            } else if (filterPeriode === 'bulan_ini') {
                const now = new Date();
                filteredDonasi = filteredDonasi.filter((d: any) => {
                    const date = new Date(d.tanggal);
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                });
            }

            // Filter by masjid
            if (filterMasjid !== 'semua') {
                filteredDonasi = filteredDonasi.filter((d: any) => {
                    const jadwal = jadwalMap.get(d.jadwal_safari_id);
                    return (jadwal as any)?.nama_masjid === filterMasjid;
                });
            }

            // Calculate per-masjid totals
            const masjidTotals = new Map<string, MasjidReport>();
            (filteredDonasi as any[]).forEach((d: any) => {
                const jadwal = jadwalMap.get(d.jadwal_safari_id);
                if (!jadwal) return;
                const key = (jadwal as any).nama_masjid;
                const existing = masjidTotals.get(key) || {
                    nama_masjid: (jadwal as any).nama_masjid,
                    alamat: (jadwal as any).alamat,
                    total_donasi: 0,
                    jumlah_donasi: 0,
                    tanggal: (jadwal as any).tanggal,
                };
                existing.total_donasi += Number(d.nominal);
                existing.jumlah_donasi += 1;
                masjidTotals.set(key, existing);
            });

            const reports = Array.from(masjidTotals.values()).sort((a, b) => b.total_donasi - a.total_donasi);
            setMasjidReports(reports);

            // Calculate daily totals
            const dailyMap = new Map<string, number>();
            (filteredDonasi as any[]).forEach((d: any) => {
                dailyMap.set(d.tanggal, (dailyMap.get(d.tanggal) || 0) + Number(d.nominal));
            });
            const daily = Array.from(dailyMap.entries())
                .map(([tanggal, total]) => ({ tanggal, total }))
                .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
            setDailyReports(daily);

            // Total
            setTotalKeseluruhan((filteredDonasi as any[]).reduce((sum: number, d: any) => sum + Number(d.nominal), 0));
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    }, [filterPeriode, filterMasjid]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const exportCSV = () => {
        const headers = ['Masjid', 'Alamat', 'Total Donasi', 'Jumlah Transaksi'];
        const rows = masjidReports.map((r) => [
            r.nama_masjid,
            r.alamat || '-',
            r.total_donasi.toString(),
            r.jumlah_donasi.toString(),
        ]);
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-donasi-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
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
                                Laporan <span className="gradient-text">Donasi Per Masjid</span>
                            </h1>
                            <p className="text-dark-500 text-sm">Total donasi per lokasi dan periode waktu</p>
                        </div>
                        <button onClick={exportCSV} className="btn-secondary">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="glass-card-static p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-2 flex-1">
                                <Calendar className="w-4 h-4 text-dark-500" />
                                <select
                                    value={filterPeriode}
                                    onChange={(e) => setFilterPeriode(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="semua">Semua Periode</option>
                                    <option value="minggu_ini">Minggu Ini</option>
                                    <option value="bulan_ini">Bulan Ini</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <Filter className="w-4 h-4 text-dark-500" />
                                <select
                                    value={filterMasjid}
                                    onChange={(e) => setFilterMasjid(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="semua">Semua Masjid</option>
                                    {masjidNames.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card-static p-6 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                                    <TrendingUp className="w-7 h-7 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-dark-500 font-medium uppercase tracking-wider">Total Donasi Keseluruhan</p>
                                    <p className="text-3xl font-bold gradient-text">{formatCurrency(totalKeseluruhan)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-dark-500">{formatNumber(masjidReports.length)} masjid</p>
                                <p className="text-sm text-dark-500">{formatNumber(masjidReports.reduce((s, r) => s + r.jumlah_donasi, 0))} transaksi</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingSkeleton rows={5} />
                    ) : (
                        <>
                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Bar Chart */}
                                <div className="glass-card-static p-6">
                                    <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
                                        <Landmark className="w-5 h-5 text-accent-500" />
                                        Total Per Masjid
                                    </h2>
                                    {masjidReports.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={masjidReports} layout="vertical" barSize={20}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    type="number"
                                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                                    axisLine={{ stroke: '#e2e8f0' }}
                                                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="nama_masjid"
                                                    tick={{ fill: '#475569', fontSize: 11 }}
                                                    axisLine={{ stroke: '#e2e8f0' }}
                                                    width={120}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: '#ffffff',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        color: '#0f172a',
                                                    }}
                                                    formatter={(value: any) => [formatCurrency(Number(value)), 'Total']}
                                                />
                                                <Bar dataKey="total_donasi" radius={[0, 8, 8, 0]}>
                                                    {masjidReports.map((_, index) => (
                                                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-dark-500 text-sm">
                                            Tidak ada data
                                        </div>
                                    )}
                                </div>

                                {/* Line Chart - Daily */}
                                <div className="glass-card-static p-6">
                                    <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary-500" />
                                        Tren Donasi Harian
                                    </h2>
                                    {dailyReports.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={dailyReports}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    dataKey="tanggal"
                                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                                    axisLine={{ stroke: '#e2e8f0' }}
                                                    tickFormatter={(v) => {
                                                        const d = new Date(v);
                                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                                    }}
                                                />
                                                <YAxis
                                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                                    axisLine={{ stroke: '#e2e8f0' }}
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
                                                    formatter={(value: any) => [formatCurrency(Number(value)), 'Total']}
                                                    labelFormatter={(label: any) => formatShortDate(label)}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="total"
                                                    stroke="#7c3aed"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-dark-500 text-sm">
                                            Tidak ada data
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detail Table */}
                            <div className="glass-card-static overflow-hidden">
                                <div className="p-6 pb-4 border-b border-dark-700/50">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Landmark className="w-5 h-5 text-amber-400" />
                                        Detail Per Masjid
                                    </h2>
                                </div>
                                {masjidReports.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-dark-700/50">
                                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">#</th>
                                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Masjid</th>
                                                    <th className="text-center py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Transaksi</th>
                                                    <th className="text-right py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Total Donasi</th>
                                                    <th className="text-right py-4 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Persentase</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {masjidReports.map((report, index) => (
                                                    <tr key={report.nama_masjid} className="table-row">
                                                        <td className="py-4 px-6">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                                                style={{ background: `${CHART_COLORS[index % CHART_COLORS.length]}20`, color: CHART_COLORS[index % CHART_COLORS.length] }}>
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <p className="text-sm font-semibold text-dark-900">{report.nama_masjid}</p>
                                                            {report.alamat && (
                                                                <p className="text-xs text-dark-500 flex items-center gap-1 mt-0.5">
                                                                    <MapPin className="w-3 h-3" /> {report.alamat}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className="text-sm font-semibold text-dark-600">{formatNumber(report.jumlah_donasi)}x</span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span className="text-sm font-bold text-primary-600">{formatCurrency(report.total_donasi)}</span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center gap-2 justify-end">
                                                                <div className="w-16 h-2 rounded-full bg-dark-50 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${totalKeseluruhan > 0 ? (report.total_donasi / totalKeseluruhan) * 100 : 0}%`,
                                                                            background: CHART_COLORS[index % CHART_COLORS.length],
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-dark-500 w-10 text-right">
                                                                    {totalKeseluruhan > 0 ? ((report.total_donasi / totalKeseluruhan) * 100).toFixed(1) : 0}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-dark-100">
                                                    <td colSpan={2} className="py-4 px-6 text-sm font-bold text-dark-900">Total Keseluruhan</td>
                                                    <td className="py-4 px-6 text-center text-sm font-bold text-dark-600">
                                                        {formatNumber(masjidReports.reduce((s, r) => s + r.jumlah_donasi, 0))}x
                                                    </td>
                                                    <td className="py-4 px-6 text-right text-sm font-bold text-primary-600">
                                                        {formatCurrency(totalKeseluruhan)}
                                                    </td>
                                                    <td className="py-4 px-6 text-right text-sm text-dark-400">100%</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-dark-500 text-sm">
                                        <Heart className="w-12 h-12 text-dark-700 mx-auto mb-3" />
                                        <p>Belum ada data donasi untuk ditampilkan</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
