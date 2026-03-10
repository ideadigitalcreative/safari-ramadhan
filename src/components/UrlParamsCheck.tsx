'use client';

import { useEffect } from 'react';

/**
 * Validasi parameter URL (typeId, itemId) untuk kompatibilitas dengan skrip autofill.
 * Jika parameter tidak ada, hanya log peringatan agar tidak memicu error.
 */
export default function UrlParamsCheck() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const urlParams = new URLSearchParams(window.location.search);
        const typeId = urlParams.get('typeId');
        const itemId = urlParams.get('itemId');
        if (!typeId || !itemId) {
            console.warn(
                '[App] typeId atau itemId tidak ditemukan di URL. Untuk fitur autofill, gunakan contoh: ?typeId=1&itemId=10'
            );
        }
        // Expose ke global agar skrip eksternal (autofill) bisa mengonsumsi tanpa error
        (window as unknown as { __urlParams?: { typeId: string | null; itemId: string | null } }).__urlParams = {
            typeId: typeId ?? null,
            itemId: itemId ?? null,
        };
    }, []);

    return null;
}
