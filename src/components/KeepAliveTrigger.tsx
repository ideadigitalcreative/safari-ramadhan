'use client';

import { useEffect, useRef } from 'react';

const INTERVAL_MS = 10 * 60 * 1000; // 10 menit

/**
 * Saat aplikasi terbuka, panggil /api/keepalive secara berkala
 * agar Vercel dan Supabase tidak dianggap idle (cold start / pause project).
 */
export default function KeepAliveTrigger() {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const ping = () => {
            fetch('/api/keepalive', { method: 'GET', cache: 'no-store' }).catch(() => {
                // Abaikan error (offline / belum deploy)
            });
        };

        ping(); // sekali saat mount
        intervalRef.current = setInterval(ping, INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return null;
}
