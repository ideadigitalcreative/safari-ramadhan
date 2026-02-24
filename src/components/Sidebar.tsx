'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Heart,
    Users,
    Landmark,
    Handshake,
    Menu,
    X,
    Moon,
    Star,
    LogOut,
} from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/jadwal', label: 'Jadwal Safari', icon: Calendar },
    { href: '/donasi', label: 'Pencatatan Donasi', icon: Heart },
    { href: '/donatur', label: 'Manajemen Donatur', icon: Users },
    { href: '/laporan', label: 'Laporan Per Masjid', icon: Landmark },
    { href: '/komitmen', label: 'Donasi Komitmen', icon: Handshake },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const profile = data as { role: string | null } | null;
                setUserRole(profile?.role || 'admin');
            }
        };

        fetchUserData();
    }, []);

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card-static px-4 py-3 flex items-center justify-between"
                style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white fill-white" />
                    </div>
                    <span className="font-bold text-sm gradient-text">Safari Ramadhan</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-10 h-10 rounded-xl bg-dark-100 flex items-center justify-center text-dark-500 hover:text-dark-900 transition-colors"
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 bottom-0 z-50
          w-[280px] glass-card-static
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
                style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}
            >
                {/* Logo */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Heart className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg gradient-text leading-tight">Safari Ramadhan</h1>
                            <p className="text-xs text-dark-500">Manajemen Donasi</p>
                        </div>
                    </div>
                </div>

                {/* Decorative Separator */}
                <div className="mx-6 mb-4">
                    <div className="h-px bg-dark-100" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <p className="text-xs font-semibold text-dark-600 uppercase tracking-widest px-3 mb-3">Menu Utama</p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 space-y-3">
                    {/* User Profile Info */}
                    <div className="px-4 py-3 rounded-2xl bg-dark-50 border border-dark-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-200 to-dark-300 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-dark-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider mb-0.5">Akun Aktif</p>
                            <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-xs font-bold text-dark-900 truncate">
                                    {user?.email?.split('@')[0]}
                                </p>
                                {userRole === 'superadmin' && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        <span className="text-[8px] font-black uppercase">Super</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-dark-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="font-semibold text-sm">Keluar Akun</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
