'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getStatusColor, getStatusLabel, formatNumber } from '@/lib/utils';
import { JadwalSafari } from '@/types/database';
import {
  Calendar as CalendarIcon,
  MapPin,
  CheckCircle2,
  Clock,
  Sunrise,
  Sun,
  Moon,
  ArrowRight,
  MoreVertical,
  Search,
  Filter,
  Star,
  LogIn,
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
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const WAKTU_LABELS: Record<string, { label: string; icon: typeof Sunrise; color: string; bgColor: string }> = {
  subuh: { label: 'Subuh', icon: Sunrise, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  dzuhur: { label: 'Dzuhur', icon: Sun, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  ashar: { label: 'Ashar', icon: Sun, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  isya: { label: 'Isya', icon: Moon, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  lainnya: { label: 'Lainnya', icon: MoreVertical, color: 'text-slate-600', bgColor: 'bg-slate-50' },
};

const WAKTU_ORDER: Record<string, number> = {
  subuh: 1,
  dzuhur: 2,
  ashar: 3,
  isya: 4,
  lainnya: 5
};

export default function LandingPage() {
  const [jadwalList, setJadwalList] = useState<JadwalSafari[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWaktu, setFilterWaktu] = useState('semua');

  // Calendar state
  const feb2026 = new Date(2026, 1, 1);
  const mar2026 = new Date(2026, 2, 1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const router = useRouter();

  const fetchJadwal = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jadwal_safari')
        .select('*')
        .order('tanggal', { ascending: true })
        .order('ramadhan_ke', { ascending: true });

      if (error) throw error;
      setJadwalList(data || []);
    } catch (error) {
      console.error('Error fetching jadwal:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  const filteredList = jadwalList.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchSearch = item.nama_masjid.toLowerCase().includes(query) || (item.alamat && item.alamat.toLowerCase().includes(query));
    const matchWaktu = filterWaktu === 'semua' || item.waktu_sholat === filterWaktu;
    return matchSearch && matchWaktu;
  });

  const groupedJadwal = filteredList.reduce((acc, item) => {
    const key = item.tanggal;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    // Sort items within each date based on WAKTU_ORDER
    acc[key].sort((a, b) => (WAKTU_ORDER[a.waktu_sholat] || 99) - (WAKTU_ORDER[b.waktu_sholat] || 99));
    return acc;
  }, {} as Record<string, JadwalSafari[]>);

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

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-dark-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-200">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text leading-tight">Safari Ramadhan</h1>
              <p className="text-[10px] text-dark-500 uppercase tracking-widest font-black">1447H / 2026M</p>
            </div>
          </div>
          <Link href="/login" className="btn-secondary py-2 px-4 md:px-5 text-sm rounded-xl flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            <span className="hidden md:inline">Masuk Admin</span>
            <span className="md:hidden">Login</span>
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-black uppercase tracking-widest mb-4 border border-primary-100">
            Jadwal Safari Ramadhan 2026 Satu Hati Palestina
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-dark-900 mb-6 leading-tight">
            Eksplorasi Perjalanan <br />
            <span className="gradient-text">Dakwah & Safari</span>
          </h2>
          <p className="text-dark-500 max-w-2xl mx-auto text-lg">
            Ikuti perjalanan safari ramadhan di berbagai masjid.
            Temukan jadwal tausiyah, subuh berjamaah, dan kegiatan lainnya selama bulan suci.
          </p>
        </div>

        {/* Calendar Desktop Section */}
        <div className="glass-card-static p-0 overflow-hidden shadow-2xl border-none mb-12">
          <div className="p-8 bg-white border-b border-dark-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm">
                  <CalendarIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-dark-900 tracking-tight">Kalender Safari</h3>
                  <p className="text-dark-500 text-xs font-bold uppercase tracking-widest">Februari — Maret 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-accent-50 px-5 py-2.5 rounded-2xl border border-accent-100">
                <div className="text-center px-4 border-r border-accent-200">
                  <p className="text-[9px] uppercase font-black text-accent-600">Total Masjid</p>
                  <p className="text-lg font-black text-dark-900">28</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-[9px] uppercase font-black text-accent-600">Waktu Sholat</p>
                  <p className="text-lg font-black text-dark-900">3</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 divide-y xl:divide-y-0 xl:divide-x divide-dark-100">
              {[feb2026, mar2026].map((monthDate, mIdx) => {
                const monthStart = startOfMonth(monthDate);
                const calendarDays = getCalendarDays(monthDate);

                return (
                  <div key={mIdx} className={`space-y-6 ${mIdx === 0 ? 'pb-10 xl:pb-0 xl:pr-12' : 'pt-10 xl:pt-0 xl:pl-12'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black text-dark-900 capitalize">
                        {format(monthDate, 'MMMM yyyy', { locale: localeId })}
                      </h4>
                      <div className="flex-1 h-px bg-dark-50 mx-6 hidden md:block" />
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                        <div key={day} className="text-center text-[10px] font-black text-dark-400 uppercase tracking-widest pb-4">
                          {day}
                        </div>
                      ))}
                      {calendarDays.map((day, idx) => {
                        const isInMonth = isSameMonth(day, monthStart);
                        const status = getDayStatus(day);
                        const isToday = isSameDay(day, new Date());

                        let dayClasses = "relative aspect-square md:aspect-[4/3] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group ";

                        if (!isInMonth) {
                          dayClasses += "opacity-0 pointer-events-none";
                        } else if (status === 'completed') {
                          dayClasses += "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:scale-105";
                        } else if (status === 'pending') {
                          dayClasses += "bg-amber-50 text-amber-700 border border-amber-100 hover:scale-105 shadow-md shadow-amber-100/50";
                        } else {
                          dayClasses += "bg-white text-dark-400 border border-dark-50 hover:border-primary-200 hover:bg-primary-50/30";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (status !== 'none') {
                                const el = document.getElementById(`date-${format(day, 'yyyy-MM-dd')}`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className={dayClasses}
                            disabled={status === 'none'}
                          >
                            <span className={`text-base md:text-xl font-black ${isToday ? 'text-primary-600 underline decoration-4 underline-offset-4' : ''}`}>
                              {format(day, 'd')}
                            </span>
                            {status !== 'none' && (
                              <div className={`mt-1 h-1 w-4 rounded-full ${status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 pt-8 border-t border-dark-50 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-dark-600 uppercase tracking-wider">Jadwal Mendatang</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-dark-600 uppercase tracking-wider">Terlaksana</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="sticky top-20 z-40 bg-dark-50/80 backdrop-blur-md py-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Cari nama masjid atau alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-12 h-14 bg-white shadow-xl shadow-dark-200/50 border-white"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative min-w-[160px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <select
                  value={filterWaktu}
                  onChange={(e) => setFilterWaktu(e.target.value)}
                  className="form-select pl-11 h-14 bg-white shadow-xl shadow-dark-200/50 border-white font-bold"
                >
                  <option value="semua">Semua Waktu</option>
                  <option value="subuh">Subuh</option>
                  <option value="dzuhur">Dzuhur</option>
                  <option value="ashar">Ashar</option>
                  <option value="isya">Isya</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-3xl bg-dark-100 animate-pulse" />)}
          </div>
        ) : Object.keys(groupedJadwal).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dark-100 shadow-xl">
            <div className="w-20 h-20 bg-dark-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-dark-300" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-2">Jadwal Tidak Ditemukan</h3>
            <p className="text-dark-500">Coba ubah kata kunci pencarian atau filter Anda.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedJadwal).map(([date, items]) => (
              <div key={date} id={`date-${date}`} className="scroll-mt-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6 group">
                  <div className="flex flex-col items-center justify-center w-16 h-20 bg-white rounded-2xl shadow-xl shadow-primary-200/20 border border-dark-100 group-hover:bg-primary-600 transition-colors duration-300">
                    <span className="text-[9px] font-black uppercase tracking-widest text-dark-400 group-hover:text-white/60 mb-0.5">
                      {format(new Date(date), 'MMM', { locale: localeId })}
                    </span>
                    <span className="text-2xl font-black text-dark-900 group-hover:text-white leading-none">
                      {format(new Date(date), 'd')}
                    </span>
                    <span className="text-[9px] font-black text-primary-600 group-hover:text-white/80 mt-0.5 uppercase">
                      {format(new Date(date), 'eee', { locale: localeId })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-dark-900 mb-0.5">
                      {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: localeId })}
                    </h3>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                      Ramadhan Ke-{items[0].ramadhan_ke}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => {
                    const config = WAKTU_LABELS[item.waktu_sholat] || WAKTU_LABELS.subuh;
                    const Icon = config.icon;
                    return (
                      <div key={item.id} className="glass-card p-5 border-l-4 hover:shadow-xl hover:scale-[1.02]" style={{ borderLeftColor: `var(--${config.color.split('-')[1]}-500)` }}>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <span className={`badge py-0.5 px-2 text-[10px] ${getStatusColor(item.status)}`}>
                            {item.status === 'sudah_dilaksanakan' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-dark-900 mb-2 leading-tight">{item.nama_masjid}</h4>
                        {item.alamat && (
                          <p className="text-xs text-dark-500 flex items-start gap-1.5 mb-4 italic">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary-500 shrink-0" />
                            {item.alamat}
                          </p>
                        )}
                        <div className="pt-3 border-t border-dark-50 flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>Waktu {item.waktu_sholat === 'lainnya' && item.waktu_lainnya ? item.waktu_lainnya : config.label}</span>
                          <Link href={`#`} className="text-primary-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-1.5 transition-all">
                            Detail <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Section */}
        <div className="mt-32 text-center p-12 bg-white rounded-[40px] shadow-2xl shadow-primary-200/20 border border-dark-50 overflow-hidden relative group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-100/50 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-1000" />
          <h3 className="text-3xl font-black text-dark-900 mb-4">Mari Berbagi di Bulan Suci</h3>
          <p className="text-dark-500 mb-8 max-w-xl mx-auto">
            Salurkan kepedulian Anda melalui program Safari Ramadhan untuk mendukung dakwah dan kenyamanan beribadah di berbagai masjid.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-primary px-10 h-14 rounded-2xl">
              Catat Donasi Sekarang
            </Link>
            <button className="btn-secondary px-10 h-14 rounded-2xl">
              Pelajari Selengkapnya
            </button>
          </div>
        </div>

        <p className="text-center mt-20 text-dark-400 text-xs font-medium">
          &copy; 2026 Panitia Safari Ramadhan SR. <br />
          Palu, Sulawesi Tengah, Indonesia.
        </p>
      </main>
    </div>
  );
}
