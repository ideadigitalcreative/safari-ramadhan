import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/database';

/**
 * GET /api/keepalive
 * Dipanggil secara berkala (cron atau client) agar:
 * - Vercel: instance tetap hangat, mengurangi cold start
 * - Supabase: project tidak di-pause karena inactivity (free tier)
 *
 * Pemanggilan:
 * 1. Client: KeepAliveTrigger memanggil setiap 10 menit saat app terbuka
 * 2. Vercel Cron (Pro): vercel.json crons setiap 14 menit
 * 3. Free tier tanpa cron: gunakan layanan eksternal (UptimeRobot, cron-job.org)
 *    GET https://<app-url>/api/keepalive tiap 10–15 menit
 */
export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        return NextResponse.json({ ok: false, error: 'Missing Supabase env' }, { status: 500 });
    }

    try {
        const supabase = createClient<Database>(url, key);
        // Query ringan ke tabel yang pasti ada agar koneksi Supabase tetap aktif
        const { error } = await supabase.from('donatur').select('id').limit(1).maybeSingle();
        if (error) {
            console.warn('[keepalive] Supabase ping error:', error.message);
            return NextResponse.json({ ok: false, supabase: error.message }, { status: 502 });
        }
        return NextResponse.json({ ok: true, at: new Date().toISOString() });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.warn('[keepalive] Error:', message);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
